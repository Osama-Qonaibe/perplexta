import { pool } from '../db/index.js';

export async function logFinancialAudit(
  userId: number,
  action: 'deposit' | 'withdrawal' | 'transfer' | 'purchase',
  amount: number,
  metadata: Record<string, any> = {}
) {
  try {
    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, details, metadata, created_at)
       VALUES (NULL, $1, $2, $3, NOW())`,
      [
        `financial:${action}`,
        `User ${userId} ${action}d ${amount}`,
        JSON.stringify({ userId, action, amount, ...metadata })
      ]
    );
  } catch (err) {
    console.error('[FinancialAudit] Failed to log audit event:', err);
  }
}
