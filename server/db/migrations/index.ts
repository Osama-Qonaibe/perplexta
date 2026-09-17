import { pool, ledgerPool, externalPool, securityPool, mediaPool } from '../index.js';
import type { DatabasePoolKey, SchemaTable, ForeignKeyRelation, QueryClient, MigrationMetrics } from './types.js';
import { TABLE_POOL_REGISTRY, hashStringToAdvisoryLockKey } from './types.js';
import { ensureColumnsBulk, ensureForeignKey, tableExists, columnExists, sanitizeForLogging, isValidIdentifier } from './helpers.js';

import {
  CORE_SCHEMA_TABLES,
  applyCoreColumnEnforcements,
  CORE_INDEXES,
  CORE_RELATIONS,
  applyCoreRelations,
  seedCoreDatabase
} from './core.schema.js';

import {
  LEDGER_SCHEMA_TABLES,
  applyLedgerColumnEnforcements,
  LEDGER_INDEXES,
  LEDGER_RELATIONS,
  applyLedgerRelations,
  seedLedgerDatabase
} from './ledger.schema.js';

import {
  EXTERNAL_SCHEMA_TABLES,
  applyExternalColumnEnforcements,
  EXTERNAL_INDEXES
} from './external.schema.js';

import {
  SECURITY_SCHEMA_TABLES,
  applySecurityColumnEnforcements,
  SECURITY_INDEXES
} from './security.schema.js';

import {
  MEDIA_SCHEMA_TABLES,
  applyMediaColumnEnforcements,
  MEDIA_INDEXES,
  applyMediaRelations
} from './media.schema.js';

import { runVersionedMigrations } from './versioned.js';
import { verifySchemaIntegrity, queryColumns, monitorDatabases } from './integrity.js';
import { setIo, getIo, runSystemMaintenance } from './maintenance.js';

// Re-export everything for consumers
export * from './types.js';
export * from './helpers.js';
export * from './core.schema.js';
export * from './ledger.schema.js';
export * from './external.schema.js';
export * from './security.schema.js';
export * from './media.schema.js';
export * from './versioned.js';
export * from './integrity.js';
export * from './maintenance.js';

/**
 * Checks if two pool objects connect to the same physical database.
 */
function isSameDb(poolA: any, poolB: any): boolean {
  if (!poolA || !poolB) return false;
  if (poolA === poolB) return true;
  const configA = poolA.options || {};
  const configB = poolB.options || {};
  if (configA.connectionString && configB.connectionString) {
    return configA.connectionString === configB.connectionString;
  }
  return (
    configA.host === configB.host &&
    configA.port === configB.port &&
    configA.database === configB.database
  );
}

/**
 * Initializes the database tables, columns, indexes, and relations across all 4 pools.
 */
export async function initDb(
  mode: 'additive' | 'full' | 'scratch' = 'additive',
  targetPoolParam?: any,
  targetLedgerPoolParam?: any,
  targetExternalPoolParam?: any,
  targetSecurityPoolParam?: any,
  targetMediaPoolParam?: any
) {
  const targetPool = targetPoolParam || pool;
  const targetLedgerPool = targetLedgerPoolParam || ledgerPool || targetPool;
  const targetExternalPool = targetExternalPoolParam || externalPool || targetPool;
  const targetSecurityPool = targetSecurityPoolParam || securityPool || targetPool;
  const targetMediaPool = targetMediaPoolParam || mediaPool || targetPool;

  if (!targetPool) {
    console.warn('[initDb] Skipping: No database pool provided or active.');
    return;
  }

  // 1. Core Schema Tables (base tables first, then dependent tables in parallel)
  const baseTableNames = new Set(['users', 'plans', 'gpu_providers', 'chats', 'bulletin_pages', 'bulletin_ads', 'support_tickets']);
  const baseTables = CORE_SCHEMA_TABLES.filter(t => baseTableNames.has(t.name));
  const dependentTables = CORE_SCHEMA_TABLES.filter(t => !baseTableNames.has(t.name));

  for (const table of baseTables) {
    try {
      await targetPool.query(table.query);
    } catch (tblErr: any) {
      console.warn(`[initDb Core Base Table ${table.name}] Notice:`, tblErr?.message || tblErr);
    }
  }

  await Promise.all(
    dependentTables.map(table =>
      targetPool.query(table.query).catch((tblErr: any) => {
        console.warn(`[initDb Core Table ${table.name}] Notice:`, tblErr?.message || tblErr);
      })
    )
  );

  // 2. Ledger Schema Tables
  const ledgerBaseTableNames = new Set(['wallets', 'economy_settings']);
  const ledgerBaseTables = LEDGER_SCHEMA_TABLES.filter(t => ledgerBaseTableNames.has(t.name));
  const ledgerDependentTables = LEDGER_SCHEMA_TABLES.filter(t => !ledgerBaseTableNames.has(t.name));

  for (const table of ledgerBaseTables) {
    try {
      await targetLedgerPool.query(table.query);
    } catch (tblErr: any) {
      console.warn(`[initDb Ledger Base Table ${table.name}] Notice:`, tblErr?.message || tblErr);
    }
  }

  await Promise.all(
    ledgerDependentTables.map(table =>
      targetLedgerPool.query(table.query).catch((tblErr: any) => {
        console.warn(`[initDb Ledger Table ${table.name}] Notice:`, tblErr?.message || tblErr);
      })
    )
  );

  // 3. External Schema Tables
  await Promise.all(
    EXTERNAL_SCHEMA_TABLES.map(table =>
      targetExternalPool.query(table.query).catch((tblErr: any) => {
        console.warn(`[initDb External Table ${table.name}] Notice:`, tblErr?.message || tblErr);
      })
    )
  );

  // 4. Security Schema Tables
  await Promise.all(
    SECURITY_SCHEMA_TABLES.map(table =>
      targetSecurityPool.query(table.query).catch((tblErr: any) => {
        console.warn(`[initDb Security Table ${table.name}] Notice:`, tblErr?.message || tblErr);
      })
    )
  );

  // 4b. Media Schema Tables
  await Promise.all(
    MEDIA_SCHEMA_TABLES.map(table =>
      targetMediaPool.query(table.query).catch((tblErr: any) => {
        console.warn(`[initDb Media Table ${table.name}] Notice:`, tblErr?.message || tblErr);
      })
    )
  );

  // 5. Apply Column Enforcements across all pools (skip in scratch mode as tables were freshly created with complete schema)
  if (mode !== 'scratch') {
    await applyCoreColumnEnforcements(targetPool);
    await applyLedgerColumnEnforcements(targetLedgerPool);
    await applyExternalColumnEnforcements(targetExternalPool);
    await applySecurityColumnEnforcements(targetSecurityPool);
    await applyMediaColumnEnforcements(targetMediaPool);
  }

  // 6. Apply Seeds
  await seedCoreDatabase(targetPool, targetLedgerPool);
  await seedLedgerDatabase(targetLedgerPool);

  // 7. Apply Indexes across all pools (parallelized)
  await Promise.all([
    ...CORE_INDEXES.map(idxQuery =>
      targetPool.query(idxQuery).catch((idxErr: any) => {
        console.warn('[initDb Core Index] Notice:', idxErr?.message || idxErr);
      })
    ),
    ...LEDGER_INDEXES.map(idxQuery =>
      targetLedgerPool.query(idxQuery).catch((idxErr: any) => {
        console.warn('[initDb Ledger Index] Notice:', idxErr?.message || idxErr);
      })
    ),
    ...EXTERNAL_INDEXES.map(idxQuery =>
      targetExternalPool.query(idxQuery).catch((idxErr: any) => {
        console.warn('[initDb External Index] Notice:', idxErr?.message || idxErr);
      })
    ),
    ...SECURITY_INDEXES.map(idxQuery =>
      targetSecurityPool.query(idxQuery).catch((idxErr: any) => {
        console.warn('[initDb Security Index] Notice:', idxErr?.message || idxErr);
      })
    ),
    ...MEDIA_INDEXES.map(idxQuery =>
      targetMediaPool.query(idxQuery).catch((idxErr: any) => {
        console.warn('[initDb Media Index] Notice:', idxErr?.message || idxErr);
      })
    )
  ]);

  // 8. Apply Relations
  await applyCoreRelations(targetPool);
  await applyLedgerRelations(targetLedgerPool);
  await applyMediaRelations(targetMediaPool);
}

/**
 * Main Database Migration Runner with Advisory Locks, Versioned Migrations, and Integrity Audit.
 */
export async function runDatabaseMigrations(targetId?: string, type: 'additive' | 'scratch' = 'additive') {
  if (!pool) {
    console.warn('[Migrations] Skipping: No core database pool active.');
    return { success: false, reason: 'No pool' };
  }

  const migrationMetrics: MigrationMetrics = {
    total: 0,
    successful: 0,
    failed: 0,
    totalDuration: 0,
    perMigration: new Map()
  };

  const client = await pool.connect();
  let ledgerClient: any = null;
  let externalClient: any = null;
  let securityClient: any = null;

  const connectToPool = async (p: any, poolName: string) => {
    if (!p || p === pool || isSameDb(pool, p)) return null;
    try {
      const c = await p.connect();
      try {
        await c.query('SELECT 1');
        return c;
      } catch (testErr: any) {
        c.release();
        console.warn(`[Migrations] Optional ${poolName} DB pool test query failed: ${testErr.message}. Using Core pool fallback.`);
        return null;
      }
    } catch (err: any) {
      console.warn(`[Migrations] Optional ${poolName} DB pool unreachable: ${err.message}. Using Core pool fallback.`);
      return null;
    }
  };

  const safeQueryClient = async (targetClient: any, fallbackClient: any, queryStr: string, params?: unknown[]) => {
    const activeClient = targetClient || fallbackClient;
    try {
      return await activeClient.query(queryStr, params);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (/not queryable|connection error|closed|terminated/i.test(msg) && activeClient !== fallbackClient) {
        console.warn(`[Migrations] Target client encountered error (${msg}), falling back to core client.`);
        return fallbackClient.query(queryStr, params);
      }
      throw err;
    }
  };

  ledgerClient = await connectToPool(ledgerPool, 'Ledger');
  externalClient = await connectToPool(externalPool, 'External');
  securityClient = await connectToPool(securityPool, 'Security');

  try {
    // Acquire non-blocking advisory lock to prevent concurrent migration execution race conditions
    await client.query('SELECT pg_try_advisory_lock(74635291)').catch((err: any) => {
      console.warn('[Migrations] Advisory lock acquisition warning:', err.message);
    });

    await client.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS migration_security_audit (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        sql_state VARCHAR(20),
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_migration_security_audit_created_at ON migration_security_audit(created_at)`);

    try {
      await safeQueryClient(securityClient, client, `
        CREATE TABLE IF NOT EXISTS token_blacklist (
          id SERIAL PRIMARY KEY,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await safeQueryClient(securityClient, client, `
        CREATE TABLE IF NOT EXISTS security_alerts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          type VARCHAR(100) NOT NULL,
          severity VARCHAR(50) DEFAULT 'medium',
          description TEXT,
          metadata JSONB DEFAULT '{}',
          is_resolved BOOLEAN DEFAULT false,
          ip_address VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await safeQueryClient(securityClient, client, `
        CREATE TABLE IF NOT EXISTS admin_audit_logs (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER,
          admin_email VARCHAR(255),
          action VARCHAR(100) NOT NULL,
          target_resource VARCHAR(100),
          details JSONB DEFAULT '{}',
          ip_address VARCHAR(100),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await safeQueryClient(securityClient, client, `
        CREATE TABLE IF NOT EXISTS registered_agents (
          id SERIAL PRIMARY KEY,
          client_id VARCHAR(255) UNIQUE NOT NULL,
          client_secret VARCHAR(255),
          api_key_hash VARCHAR(255),
          client_name VARCHAR(255) NOT NULL,
          identity_type VARCHAR(50) DEFAULT 'agent',
          credential_type VARCHAR(50) DEFAULT 'client_credentials',
          redirect_uris TEXT[],
          jwks_uri VARCHAR(500),
          user_agent VARCHAR(500),
          signature_keys JSONB,
          permissions JSONB DEFAULT '[]',
          is_active BOOLEAN DEFAULT true,
          user_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      if (securityClient && securityClient !== client) {
        try {
          await client.query(`DROP TABLE IF EXISTS token_blacklist, security_alerts, admin_audit_logs, registered_agents CASCADE;`);
          console.log('[Migrations] Successfully cleaned up 4 legacy duplicate security tables from Core DB.');
        } catch (dropErr: any) {
          console.warn('[Migrations] Warning during Core DB duplicate table cleanup:', dropErr?.message || dropErr);
        }
      }
    } catch (error) {
      console.warn('[Migrations] Failed to inspect/initialize security database tables:', error instanceof Error ? error.message : 'Unknown error');
    }

    if (type === 'scratch') {
      console.warn(`[Migrations] RUNNING IN SCRATCH MODE FOR TARGET: ${targetId || 'ALL'}`);

      await client.query("SET lock_timeout = '5s'").catch(() => {});

      const coreTables = CORE_SCHEMA_TABLES.map(t => t.name);
      const ledgerTables = LEDGER_SCHEMA_TABLES.map(t => t.name);
      const externalTables = EXTERNAL_SCHEMA_TABLES.map(t => t.name);
      const securityTables = SECURITY_SCHEMA_TABLES.map(t => t.name);

      if (!targetId || targetId === 'all' || targetId === 'core') {
        if (coreTables.length > 0) {
          console.log('[Migrations] Scratch: Dropping Core tables...');
          const dropList = coreTables.map(t => `"${t}"`).join(', ');
          await safeQueryClient(client, client, `DROP TABLE IF EXISTS ${dropList} CASCADE`).catch((err: any) => {
            console.warn('[Migrations] Notice dropping Core tables:', err?.message || err);
          });
          console.log('[Migrations] Scratch: Core tables dropped.');
        }
      }
      if (!targetId || targetId === 'all' || targetId === 'ledger') {
        if (ledgerTables.length > 0) {
          console.log('[Migrations] Scratch: Dropping Ledger tables...');
          const dropList = ledgerTables.map(t => `"${t}"`).join(', ');
          await safeQueryClient(ledgerClient, client, `DROP TABLE IF EXISTS ${dropList} CASCADE`).catch((err: any) => {
            console.warn('[Migrations] Notice dropping Ledger tables:', err?.message || err);
          });
          console.log('[Migrations] Scratch: Ledger tables dropped.');
        }
      }
      if (!targetId || targetId === 'all' || targetId === 'external') {
        if (externalTables.length > 0) {
          console.log('[Migrations] Scratch: Dropping External tables...');
          const dropList = externalTables.map(t => `"${t}"`).join(', ');
          await safeQueryClient(externalClient, client, `DROP TABLE IF EXISTS ${dropList} CASCADE`).catch((err: any) => {
            console.warn('[Migrations] Notice dropping External tables:', err?.message || err);
          });
          console.log('[Migrations] Scratch: External tables dropped.');
        }
      }
      if (!targetId || targetId === 'all' || targetId === 'security') {
        if (securityTables.length > 0) {
          console.log('[Migrations] Scratch: Dropping Security tables...');
          const dropList = securityTables.map(t => `"${t}"`).join(', ');
          await safeQueryClient(securityClient, client, `DROP TABLE IF EXISTS ${dropList} CASCADE`).catch((err: any) => {
            console.warn('[Migrations] Notice dropping Security tables:', err?.message || err);
          });
          console.log('[Migrations] Scratch: Security tables dropped.');
        }
      }
      if (!targetId || targetId === 'all' || targetId === 'core') {
        await client.query('DELETE FROM migration_history').catch(() => {});
      } else if (targetId === 'ledger') {
        await client.query("DELETE FROM migration_history WHERE migration_name ~* 'ledger|wallet|kyc|economy|payout|coupon|stripe'").catch(() => {});
      } else if (targetId === 'external') {
        await client.query("DELETE FROM migration_history WHERE migration_name ~* 'blog|article'").catch(() => {});
      } else if (targetId === 'security') {
        await client.query("DELETE FROM migration_history WHERE migration_name ~* 'security|token_blacklist|audit|agent'").catch(() => {});
      }

      console.log('[Migrations] Scratch: Re-initializing schemas via initDb...');
      await initDb('scratch', pool, ledgerPool || pool, externalPool || pool, securityPool || pool);
      console.log('[Migrations] Scratch: Schema re-initialization completed.');
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS db_connections_registry (
        id VARCHAR(50) PRIMARY KEY,
        provider VARCHAR(50),
        type VARCHAR(20) DEFAULT 'postgres',
        host VARCHAR(255),
        port VARCHAR(10),
        db_name VARCHAR(100),
        username VARCHAR(100),
        password TEXT,
        connection_string TEXT,
        ssl_mode VARCHAR(20) DEFAULT 'disable',
        pool_size INTEGER DEFAULT 10,
        is_active BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'unknown',
        last_checked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (type !== 'scratch') {
      console.log('[Migrations] Running dynamic schema auto-repair...');
      await initDb('additive', pool, ledgerPool, externalPool, securityPool, mediaPool);
    }

    // Run all versioned migrations (v1 - v83)
    await runVersionedMigrations(
      client,
      externalClient,
      ledgerClient,
      securityClient,
      pool,
      ledgerPool || pool,
      externalPool || pool,
      securityPool || pool,
      migrationMetrics
    );

    if (migrationMetrics.total > 0) {
      const slowest = [...migrationMetrics.perMigration.entries()]
        .sort((a, b) => b[1].duration - a[1].duration)
        .slice(0, 5);
      console.log('[Migrations] 📊 Migration Metrics:', {
        total: migrationMetrics.total,
        successful: migrationMetrics.successful,
        failures: migrationMetrics.failed,
        totalDuration: `${(migrationMetrics.totalDuration / 1000).toFixed(2)}s`,
        averageDuration: `${(migrationMetrics.totalDuration / migrationMetrics.total / 1000).toFixed(2)}s`,
        slowest: slowest.map(([name, data]) => ({ name, duration: `${(data.duration / 1000).toFixed(2)}s` }))
      });
    }

    // Verify integrity across all pools
    await verifySchemaIntegrity();

    return {
      success: true,
      target: targetId || 'all',
      type,
      totalMigrations: migrationMetrics.total
    };
  } catch (error) {
    const err = error as Error;
    console.error('[CRITICAL] Database Migration failed:', err.message);
    if (process.env.NODE_ENV === 'production') throw err;
  } finally {
    await client.query('SELECT pg_advisory_unlock(74635291)').catch(() => {});
    client.release();
    if (ledgerClient) ledgerClient.release();
    if (externalClient) externalClient.release();
    if (securityClient) securityClient.release();
  }
}
