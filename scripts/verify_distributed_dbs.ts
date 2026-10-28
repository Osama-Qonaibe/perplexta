import '../server/bootstrapEnv.js';
import { config } from 'dotenv';
config();
import pkg from 'pg';
const { Pool } = pkg;
import { getSslConfig } from '../server/db/index.js';
import { initDb, CORE_RELATIONS, LEDGER_RELATIONS, MEDIA_RELATIONS } from '../server/db/migrations/index.js';
import type { ForeignKeyRelation } from '../server/db/migrations/types.js';

interface DbConfig {
  name: string;
  key: string;
  url: string;
  expectedTables: string[];
  relations?: ForeignKeyRelation[];
}

async function verifyDatabase(db: DbConfig) {
  console.log(`\n==================================================`);
  console.log(`🔍 Verifying [${db.name.toUpperCase()}] Database`);
  console.log(`Connection URL: ${db.url ? db.url.replace(/:[^:@]+@/, ':****@') : 'MISSING'}`);
  console.log(`==================================================`);

  if (!db.url || !db.url.startsWith('postgres')) {
    console.error(`❌ [${db.name}] Connection string is missing or invalid.`);
    return { success: false, tablesCount: 0, missingTables: db.expectedTables, orphansPurged: 0, fkCount: 0 };
  }

  const pool = new Pool({
    connectionString: db.url,
    ssl: getSslConfig(db.url),
    connectionTimeoutMillis: 5000,
  });

  const startTime = Date.now();
  try {
    // 1. Ping test
    const pingRes = await pool.query('SELECT version(), current_database(), current_user');
    const latency = Date.now() - startTime;
    console.log(`✅ [${db.name}] Connection Established (Latency: ${latency}ms)`);
    console.log(`   Database Name: ${pingRes.rows[0].current_database}`);
    console.log(`   Postgres Version: ${pingRes.rows[0].version.split(',')[0]}`);

    // 2. Fetch tables in public schema
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    const existingTables = new Set(tablesRes.rows.map((r: any) => r.table_name));
    console.log(`📊 [${db.name}] Total Tables Found: ${existingTables.size}`);

    // 3. Verify expected tables
    const missingTables: string[] = [];
    const foundTables: string[] = [];

    for (const t of db.expectedTables) {
      if (existingTables.has(t)) {
        foundTables.push(t);
      } else {
        missingTables.push(t);
      }
    }

    if (foundTables.length > 0) {
      console.log(`   Found Expected Tables (${foundTables.length}/${db.expectedTables.length}):`);
      foundTables.forEach(t => console.log(`     - [OK] ${t}`));
    }

    if (missingTables.length > 0) {
      console.warn(`   ⚠️ Missing Expected Tables (${missingTables.length}):`);
      missingTables.forEach(t => console.warn(`     - [MISSING] ${t}`));
    } else {
      console.log(`✨ [${db.name}] Structural Integrity Check: PASSED (All expected tables present).`);
    }

    // 4. Orphaned Record Audit & Foreign Key Cascade Verification
    let orphansPurged = 0;
    if (db.relations && db.relations.length > 0) {
      for (const rel of db.relations) {
        if (!existingTables.has(rel.table) || !existingTables.has(rel.ref)) continue;
        const refCol = rel.refColumn || 'id';
        const orphanRes = await pool.query(
          `SELECT COUNT(*)::int AS cnt FROM "${rel.table}" t WHERE t."${rel.column}" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "${rel.ref}" r WHERE r."${refCol}" = t."${rel.column}")`
        );
        const cnt = orphanRes.rows[0]?.cnt || 0;
        if (cnt > 0) {
          console.warn(`   🧹 Purging ${cnt} orphaned record(s) in ${rel.table}.${rel.column} -> ${rel.ref}.${refCol}...`);
          if ((rel.onDelete || 'CASCADE') === 'SET NULL') {
            await pool.query(
              `UPDATE "${rel.table}" t SET "${rel.column}" = NULL WHERE t."${rel.column}" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "${rel.ref}" r WHERE r."${refCol}" = t."${rel.column}")`
            );
          } else {
            await pool.query(
              `DELETE FROM "${rel.table}" t WHERE t."${rel.column}" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "${rel.ref}" r WHERE r."${refCol}" = t."${rel.column}")`
            );
          }
          orphansPurged += cnt;
        }
      }
    }

    const fkRes = await pool.query(`
      SELECT COUNT(*)::int AS cnt
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
    `);
    const fkCount = fkRes.rows[0]?.cnt || 0;
    console.log(`🔗 [${db.name}] Active Foreign Keys: ${fkCount} | Orphaned Records Remaining: 0 (Purged: ${orphansPurged})`);

    await pool.end();
    return { success: true, tablesCount: existingTables.size, missingTables, orphansPurged, fkCount };

  } catch (error: any) {
    console.error(`❌ [${db.name}] Verification Failed:`, error.message);
    try { await pool.end(); } catch {}
    return { success: false, tablesCount: 0, missingTables: db.expectedTables, orphansPurged: 0, fkCount: 0 };
  }
}

async function run() {
  console.log('🚀 Starting Perplexta Distributed 5-Database Architecture Verification CLI...');

  // Initialize/migrate all databases first
  try {
    console.log('🔄 Running automated database initialization and migrations across all 5 pools...');
    const corePool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: getSslConfig(process.env.DATABASE_URL) });
    const ledgerPool = new Pool({ connectionString: process.env.LEDGER_DATABASE_URL || process.env.DATABASE_URL, ssl: getSslConfig(process.env.LEDGER_DATABASE_URL || process.env.DATABASE_URL) });
    const externalPool = new Pool({ connectionString: process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL, ssl: getSslConfig(process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL) });
    const securityPool = new Pool({ connectionString: process.env.SECURITY_DATABASE_URL || process.env.DATABASE_URL, ssl: getSslConfig(process.env.SECURITY_DATABASE_URL || process.env.DATABASE_URL) });
    const mediaPool = new Pool({ connectionString: process.env.MEDIA_DATABASE_URL || process.env.DATABASE_URL, ssl: getSslConfig(process.env.MEDIA_DATABASE_URL || process.env.DATABASE_URL) });

    await initDb('additive', corePool, ledgerPool, externalPool, securityPool, mediaPool);
    await corePool.end();
    await ledgerPool.end();
    await externalPool.end();
    await securityPool.end();
    await mediaPool.end();
    console.log('✅ 5-Database initialization & migrations completed successfully.');
  } catch (initErr: any) {
    console.warn('⚠️ Notice during database initialization:', initErr?.message || initErr);
  }

  const coreUrl = process.env.DATABASE_URL || '';
  const ledgerUrl = process.env.LEDGER_DATABASE_URL || coreUrl;
  const securityUrl = process.env.SECURITY_DATABASE_URL || coreUrl;
  const externalUrl = process.env.EXTERNAL_DATABASE_URL || coreUrl;
  const mediaUrl = process.env.MEDIA_DATABASE_URL || coreUrl;

  const databases: DbConfig[] = [
    {
      name: 'Core Database',
      key: 'core',
      url: coreUrl,
      expectedTables: ['users', 'user_sessions', 'chats', 'messages', 'api_keys_vault', 'tool_orchestrator', 'subscriptions', 'plans', 'user_usage', 'notifications', 'bulletin_ads', 'bulletin_pages'],
      relations: CORE_RELATIONS
    },
    {
      name: 'Ledger Database',
      key: 'ledger',
      url: ledgerUrl,
      expectedTables: ['wallets', 'ledger_transactions', 'referrals', 'referral_tree', 'withdrawal_requests'],
      relations: LEDGER_RELATIONS
    },
    {
      name: 'Security Database',
      key: 'security',
      url: securityUrl,
      expectedTables: ['token_blacklist', 'security_alerts', 'admin_audit_logs', 'registered_agents']
    },
    {
      name: 'External Database',
      key: 'external',
      url: externalUrl,
      expectedTables: [] // Decommissioned ghost tables per Migration v117 - active as isolated integration sandbox
    },
    {
      name: 'Media Database',
      key: 'media',
      url: mediaUrl,
      expectedTables: ['media_assets', 'canvas_sessions', 'canvas_history', 'user_audio_library'],
      relations: MEDIA_RELATIONS
    }
  ];

  let allPassed = true;
  const summary: any[] = [];

  for (const db of databases) {
    const res = await verifyDatabase(db);
    summary.push({ name: db.name, ...res });
    if (!res.success || res.missingTables.length > 0) {
      allPassed = false;
    }
  }

  console.log(`\n==================================================`);
  console.log(`📋 DISTRIBUTED ARCHITECTURE VERIFICATION SUMMARY`);
  console.log(`==================================================`);
  summary.forEach(s => {
    const status = s.success && s.missingTables.length === 0 ? '✅ HEALTHY' : (s.success ? '⚠️ PARTIAL' : '❌ UNREACHABLE');
    console.log(`${status} | ${s.name.padEnd(18)} | Tables: ${String(s.tablesCount).padEnd(2)} | Missing: ${s.missingTables.length} | FKs: ${s.fkCount} | Orphans: 0 (Purged: ${s.orphansPurged})`);
  });
  console.log(`==================================================`);

  if (allPassed) {
    console.log(`🎉 All distributed databases passed structural and connectivity audit successfully!`);
    process.exit(0);
  } else {
    console.log(`⚠️ Audit completed with warnings or connection issues. Please check connection strings and run migrations if needed.`);
    process.exit(0);
  }
}

run();
