import { pool } from '../db/index.js';
import { tools } from '../config/constants.js';
import { encrypt } from '../utils/crypto.js';
import { syncProviderModelsInternal } from './ai.js';
import { invalidateApiKeysVaultCache, invalidateOrchestratorConfigCache } from '../db/queries.js';

/**
 * Database Initializer Service
 * Ensures essential database tables (such as studio_workspaces, studio_snapshots, tool_orchestrator, and api_keys_vault)
 * are initialized and synchronized before incoming requests arrive.
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

    // Ensure all tool definitions exist in tool_orchestrator
    for (const t of tools) {
      await targetPool.query(`
        INSERT INTO tool_orchestrator (tool_id, primary_provider, primary_model, is_active, task_description, task_description_ar)
        VALUES ($1, '', '', true, $2, $3)
        ON CONFLICT (tool_id) DO UPDATE SET
          is_active = true,
          task_description = EXCLUDED.task_description,
          task_description_ar = EXCLUDED.task_description_ar
      `, [t.id, t.desc, t.descAr]).catch(() => {});
    }

    // Auto-sync Google API Key from environment into api_keys_vault and sync models dynamically
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        await targetPool.query(`
          INSERT INTO api_keys_vault (provider, encrypted_key, is_active, models, model_list, updated_at)
          VALUES ('google', $1, true, '[]', '[]', CURRENT_TIMESTAMP)
          ON CONFLICT (provider) DO UPDATE
          SET encrypted_key = EXCLUDED.encrypted_key, is_active = true, updated_at = CURRENT_TIMESTAMP
        `, [encrypt(geminiKey)]);
        invalidateApiKeysVaultCache();

        // Perform dynamic model discovery and tool auto-routing
        await syncProviderModelsInternal('google', geminiKey).catch((syncErr: any) => {
          console.warn('[DatabaseInitializer] Dynamic Google model sync warning:', syncErr?.message || syncErr);
        });
        invalidateOrchestratorConfigCache();
        console.log('[DatabaseInitializer] Successfully synchronized Google provider and tool orchestrator routes.');
      } catch (keyErr: any) {
        console.warn('[DatabaseInitializer] Google key sync notice:', keyErr?.message || keyErr);
      }
    }
  } catch (err: any) {
    console.error('[DatabaseInitializer] Failed to ensure core tables:', err?.message || err);
    throw err;
  }
}

