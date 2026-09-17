import { ledgerPool, pool } from '../db/index.js';
import { getEconomySettings, getUserWallet, enforceTransactionLimit } from './wallet.js';
import { io } from '../config/socket.js';
import { logSecurityAlert } from './notifications.js';


/**
 * Language-aware token estimator.
 * Arabic/Hebrew/CJK characters tokenize at ~1.5 tokens/char.
 * Latin/ASCII characters tokenize at ~0.25 tokens/char (4 chars per token).
 * Mixed text is split and each group calculated separately.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const multibyteChars = (text.match(/[\u0590-\u06FF\u4E00-\u9FFF\u3400-\u4DBF]/g) || []).length;
  const asciiChars = text.length - multibyteChars;
  return Math.ceil(multibyteChars * 1.5 + asciiChars * 0.25);
}


/**
 * Calculates dynamic token usage points cost for a specific tool and token counts.
 * Centralized pricing function based on tool's orchestrator configuration.
 */
export async function calculateTokenPointsCost(toolId: string, inputTokens: number, outputTokens: number): Promise<number> {
  return 0;
}

/** Converts points to USD based on the centralized points_per_dollar setting. */
export async function convertPointsToUsd(points: number): Promise<number> {
  try {
    const settings = await getEconomySettings();
    return points / (parseFloat(settings.points_per_dollar || '1000'));
  } catch (err) {
    console.error('[Billing] convertPointsToUsd failed:', err);
    return points / 1000;
  }
}

/** Determines if a user can afford the estimated cost from their wallet. */
export async function checkUserAffordability(userId: string | number, toolId: string, estimatedInputTokens = 0) {
  const userIdNum      = typeof userId === 'number' ? userId : parseInt(userId, 10);
  const wallet         = await getUserWallet(userIdNum);
  const settings       = await getEconomySettings();
  const pointsPerDollar = parseFloat(settings.points_per_dollar || '1000');
  const requiredPoints  = await calculateTokenPointsCost(toolId, estimatedInputTokens, 0);
  const availablePoints = Number(wallet.points  || 0);
  const availableBalanceUSD = Number(wallet.balance || 0);

  return {
    allowed: availablePoints + (availableBalanceUSD * pointsPerDollar) >= requiredPoints,
    requiredPoints,
    availablePoints,
    availableBalanceUSD,
    pointsPerDollar,
  };
}


/** Deducts points upfront to secure execution authorization (hold). */
export async function applyUpfrontHold(userId: string | number, toolId: string, prompt: string) {
  if (!ledgerPool) throw new Error('Ledger database not available');
  const userIdNum = typeof userId === 'number' ? userId : parseInt(userId, 10);
  const client    = await ledgerPool.connect();

  try {
    await client.query('BEGIN');
    const wallet = await getUserWallet(userIdNum, client);

    const settings        = await getEconomySettings();
    const pointsPerDollar = parseFloat(settings.points_per_dollar || '1000');
    const estimatedTokens = estimateTokens(prompt);
    const requiredPoints  = await calculateTokenPointsCost(toolId, estimatedTokens, 0);
    const availablePoints = Number(wallet.points  || 0);
    const availableBalanceUSD = Number(wallet.balance || 0);
    const totalPointsAvailable = availablePoints + (availableBalanceUSD * pointsPerDollar);

    console.log(`[Billing - Hold] User ${userIdNum}: Required=${requiredPoints} pts | Available=${totalPointsAvailable} pts (${availablePoints} pts + $${availableBalanceUSD})`);

    if (totalPointsAvailable < requiredPoints) {
      console.warn(`[Billing - Hold] User ${userIdNum} INSUFFICIENT_FUNDS: need ${requiredPoints}, has ${totalPointsAvailable}`);
      throw new Error('INSUFFICIENT_FUNDS');
    }

    let pointsToDeduct    = 0;
    let balanceToDeductUSD = 0;

    if (availablePoints >= requiredPoints) {
      pointsToDeduct = requiredPoints;
      await client.query('UPDATE wallets SET points = points - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [requiredPoints, wallet.id]);
      console.log(`[Billing - Hold] User ${userIdNum}: Deducted ${requiredPoints} pts from Points bucket.`);
    } else {
      pointsToDeduct     = availablePoints;
      balanceToDeductUSD = (requiredPoints - pointsToDeduct) / pointsPerDollar;
      await client.query('UPDATE wallets SET points = 0, balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [balanceToDeductUSD, wallet.id]);
      console.log(`[Billing - Hold] User ${userIdNum}: Split-purse — ${pointsToDeduct} pts + $${balanceToDeductUSD.toFixed(4)} USD.`);
    }

    await client.query(
      `INSERT INTO ledger_transactions (user_id, wallet_id, amount, points, transaction_type, status, description)
       VALUES ($1,$2,$3,$4,'tool_usage_hold','pending',$5)`,
      [userIdNum, wallet.id, -balanceToDeductUSD, -pointsToDeduct,
       `Upfront hold of ${requiredPoints} pts for tool ${toolId}.`]
    );
    await enforceTransactionLimit(userIdNum, client);
    await client.query('COMMIT');

    console.log(`[Billing - Hold] Committed for User ${userIdNum}. Held: ${requiredPoints} pts.`);
    return { heldPoints: requiredPoints, totalPointsAvailable: totalPointsAvailable - requiredPoints };

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[Billing - Hold] Rollback for User ${userIdNum}:`, err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Reconciles the upfront hold against actual token usage.
 * Refunds over-charged or surcharges under-charged amounts.
 */
export async function reconcileHold(
  userId: string | number, toolId: string,
  heldPoints: number, inputTokens: number, outputTokens: number
): Promise<{ actualPointsCost: number; refundPoints: number }> {
  if (!ledgerPool) return { actualPointsCost: 0, refundPoints: 0 };
  const userIdNum = typeof userId === 'number' ? userId : parseInt(userId, 10);
  const client    = await ledgerPool.connect();

  try {
    await client.query('BEGIN');
    const wallet = await getUserWallet(userIdNum, client);

    const settings        = await getEconomySettings();
    const pointsPerDollar = parseFloat(settings.points_per_dollar || '1000');
    const actualPointsCost = await calculateTokenPointsCost(toolId, inputTokens, outputTokens);
    const refundPoints     = heldPoints - actualPointsCost;

    console.log(`[Billing - Reconcile] User ${userIdNum}: Held=${heldPoints} | Actual=${actualPointsCost} | Adjustment=${refundPoints} pts`);

    await client.query(
      `UPDATE ledger_transactions SET status='success' WHERE user_id=$1 AND transaction_type='tool_usage_hold' AND status='pending'`,
      [userIdNum]
    );

    if (refundPoints > 0) {
      await client.query('UPDATE wallets SET points = points + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [refundPoints, wallet.id]);
      await client.query(
        `INSERT INTO ledger_transactions (user_id, wallet_id, amount, points, transaction_type, status, description)
         VALUES ($1,$2,0,$3,'tool_usage_reconcile','success',$4)`,
        [userIdNum, wallet.id, refundPoints,
         `Reconciled ${toolId}. Actual: ${actualPointsCost} pts. Refunded: ${refundPoints} pts.`]
      );
      console.log(`[Billing - Reconcile] User ${userIdNum}: Refunded ${refundPoints} pts.`);

    } else if (refundPoints < 0) {
      const extraPoints = Math.abs(refundPoints);
      let extraPointsDeducted = 0;
      let extraUSDToDeduct    = 0;

      if (Number(wallet.points) >= extraPoints) {
        extraPointsDeducted = extraPoints;
        await client.query('UPDATE wallets SET points = points - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [extraPoints, wallet.id]);
        console.log(`[Billing - Reconcile] User ${userIdNum}: Surcharged ${extraPoints} pts from Points bucket.`);
      } else {
        extraPointsDeducted = Number(wallet.points);
        extraUSDToDeduct    = (extraPoints - extraPointsDeducted) / pointsPerDollar;
        await client.query('UPDATE wallets SET points = 0, balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [extraUSDToDeduct, wallet.id]);
        console.log(`[Billing - Reconcile] User ${userIdNum}: Split-purse surcharge — ${extraPointsDeducted} pts + $${extraUSDToDeduct.toFixed(4)}.`);
      }
      await client.query(
        `INSERT INTO ledger_transactions (user_id, wallet_id, amount, points, transaction_type, status, description)
         VALUES ($1,$2,$3,$4,'tool_usage_reconcile','success',$5)`,
        [userIdNum, wallet.id, -extraUSDToDeduct, -extraPointsDeducted,
         `Reconciled ${toolId}. Surcharge: ${extraPoints} pts. Actual: ${actualPointsCost} pts.`]
      );

    } else {
      await client.query(
        `INSERT INTO ledger_transactions (user_id, wallet_id, amount, points, transaction_type, status, description)
         VALUES ($1,$2,0,0,'tool_usage_reconcile','success',$3)`,
        [userIdNum, wallet.id, `Reconciled ${toolId}. Perfect match: ${actualPointsCost} pts.`]
      );
      console.log(`[Billing - Reconcile] User ${userIdNum}: Perfect match.`);
    }

    await enforceTransactionLimit(userIdNum, client);
    await client.query('COMMIT');
    return { actualPointsCost, refundPoints };

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[Billing - Reconcile] Rollback for User ${userIdNum}:`, err);
    throw err;
  } finally {
    client.release();
  }
}

/** Fully refunds a held transaction on execution failure. */
export async function refundExecutionHold(userId: string | number, toolId: string, heldPoints: number) {
  if (!ledgerPool) return;
  const userIdNum = typeof userId === 'number' ? userId : parseInt(userId, 10);
  const client    = await ledgerPool.connect();
  try {
    await client.query('BEGIN');
    const wallet = await getUserWallet(userIdNum, client);
    await client.query('UPDATE wallets SET points = points + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [heldPoints, wallet.id]);
    await client.query(
      `INSERT INTO ledger_transactions (user_id, wallet_id, amount, points, transaction_type, description, status)
       VALUES ($1,$2,0,$3,'tool_usage_refund',$4,'success')`,
      [userIdNum, wallet.id, heldPoints, `Refunded hold of ${heldPoints} pts for failed ${toolId}.`]
    );
    await enforceTransactionLimit(userIdNum, client);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Billing] refundExecutionHold failed:', err);
  } finally {
    client.release();
  }
}


/**
 * Wraps a tool call with full billing lifecycle:
 * Bypassed in the new Subscription-Only Model. Executes the block directly.
 */
export async function executeWithBillingMiddleware(
  userId: string | number,
  toolId: string,
  initialPrompt: string,
  quotaCheck: { allowed: boolean; period?: string; limit?: number; currentUsage?: number },
  executeBlock: (
    updateCostProgress: (chunkText: string) => void,
    onSuccess: (generatedText: string) => Promise<void>,
    walletCharged: any
  ) => Promise<any>
) {
  const updateCostProgress = (chunkText: string) => {
    // No points monitoring or budget halting. Pure silent pass-through.
  };

  try {
    let finalGeneratedText = '';
    const result = await executeBlock(
      updateCostProgress,
      async (text) => { finalGeneratedText = text; },
      false // walletCharged is always false
    );
    return result;
  } catch (err: any) {
    throw err;
  }
}
