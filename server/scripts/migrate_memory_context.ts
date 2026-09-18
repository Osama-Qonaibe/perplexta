import { pool, initializePerplextaPools, synchronizePerplextaPoolsFromRegistry } from '../db/index.js';
import { runMemoryContextMigration } from '../services/memoryMigrationService.js';

// Command-Line Interface Execution Entry Point
async function main() {
  console.log('[Script] Initializing database pools...');
  await initializePerplextaPools(
    process.env.DATABASE_URL || '',
    process.env.LEDGER_DATABASE_URL || '',
    process.env.EXTERNAL_DATABASE_URL || '',
    process.env.SECURITY_DATABASE_URL || '',
    process.env.MEDIA_DATABASE_URL || ''
  );
  await synchronizePerplextaPoolsFromRegistry().catch((e) => {
    console.warn('[Script] Registry sync warning:', e.message || e);
  });

  if (!pool) {
    console.error('[Script] ⚠️ Database pool is not active.');
    process.exit(1);
  }

  const migrationResult = await runMemoryContextMigration();
  console.log('[Script] Migration Finished Successfully:', JSON.stringify(migrationResult, null, 2));
  process.exit(0);
}

// Only execute directly if invoked via CLI/tsx
const isDirectRun = () => {
  try {
    // Check for CommonJS direct run
    if (typeof require !== 'undefined' && require.main === module) return true;
    
    // Check for ESM direct run (tsx)
    const scriptPath = process.argv[1];
    if (scriptPath && (scriptPath.endsWith('migrate_memory_context.ts') || scriptPath.endsWith('migrate_memory_context.js'))) {
      return true;
    }
  } catch (e) {
    // Fallback to false if any error occurs during check
  }
  return false;
};

if (isDirectRun()) {
  main().catch((err) => {
    console.error('[Script] ❌ Unhandled error during memory context migration:', err);
    process.exit(1);
  });
}
