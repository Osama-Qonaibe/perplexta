import { pool } from '../db/index.js';

/**
 * Database Initializer Service
 * Ensures essential database tables (such as studio_workspaces and studio_snapshots)
 * are created before any database queries occur during startup.
 */
export async function ensureDatabaseTables(): Promise<void> {
  try {
    const targetPool = pool;
    if (!targetPool) {
      console.warn('[DatabaseInitializer] Database pool not available for table initialization.');
      return;
    }

    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS studio_workspaces (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        framework_mode VARCHAR(50) DEFAULT 'html',
        files JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS studio_snapshots (
        id SERIAL PRIMARY KEY,
        workspace_id VARCHAR(255) REFERENCES studio_workspaces(id) ON DELETE CASCADE,
        version_name VARCHAR(255) NOT NULL,
        files JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[DatabaseInitializer] Successfully ensured studio_workspaces and studio_snapshots tables.');
  } catch (err: any) {
    console.error('[DatabaseInitializer] Failed to ensure core tables:', err?.message || err);
    throw err;
  }
}
