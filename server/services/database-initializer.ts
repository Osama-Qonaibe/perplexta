import { pool, mediaPool } from '../db/index.js';
import { tools } from '../config/constants.js';
import { ensureMapProvidersTable } from './mapProvidersService.js';
import { ensureLocationCacheTable } from './locationCache.js';
import { MEDIA_SCHEMA_TABLES, applyMediaColumnEnforcements, MEDIA_INDEXES } from '../db/migrations/media.schema.js';
import { CORE_SCHEMA_TABLES } from '../db/migrations/core.schema.js';

/**
 * Ensures the media_assets table exists on the media database (or core pool)
 * by delegating to the canonical MEDIA_SCHEMA_TABLES and column enforcements.
 */
export async function ensureMediaAssetsTable(): Promise<void> {
  const targetMediaPool = mediaPool || pool;
  if (!targetMediaPool) return;

  try {
    const mediaTable = MEDIA_SCHEMA_TABLES.find((t) => t.name === 'media_assets');
    if (mediaTable) {
      await targetMediaPool.query(mediaTable.query);
    }
    await applyMediaColumnEnforcements(targetMediaPool).catch(() => {});
    for (const idx of MEDIA_INDEXES.filter((q) => q.includes('media_assets'))) {
      await targetMediaPool.query(idx).catch(() => {});
    }
    console.log('[DatabaseInitializer] Successfully ensured media_assets table and indexes in Media Database.');
  } catch (err: any) {
    console.warn('[DatabaseInitializer] Warning ensuring media_assets table:', err?.message || err);
  }
}

/**
 * Database Initializer Service
 * Ensures essential database tables and synchronizes tool_orchestrator definitions
 * using a single batched UNNEST query instead of per-row loop queries.
 */
export async function ensureDatabaseTables(): Promise<void> {
  try {
    const targetPool = pool;
    if (!targetPool) {
      console.warn('[DatabaseInitializer] Database pool not available for table initialization.');
      return;
    }

    await ensureMapProvidersTable().catch(err => console.warn('[DatabaseInitializer] Map providers table notice:', err?.message));
    await ensureLocationCacheTable().catch(err => console.warn('[DatabaseInitializer] Location cache table notice:', err?.message));
    await ensureMediaAssetsTable().catch(err => console.warn('[DatabaseInitializer] Media assets table notice:', err?.message));

    for (const tableName of ['studio_workspaces', 'studio_snapshots']) {
      const schemaEntry = CORE_SCHEMA_TABLES.find((t) => t.name === tableName);
      if (schemaEntry) {
        await targetPool.query(schemaEntry.query);
      }
    }
    console.log('[DatabaseInitializer] Successfully ensured studio_workspaces and studio_snapshots tables.');

    // Batch upsert all tool definitions in a single query instead of a loop
    if (tools.length > 0) {
      const ids = tools.map((t) => t.id);
      const descs = tools.map((t) => t.desc);
      const descsAr = tools.map((t) => t.descAr);
      await targetPool.query(
        `INSERT INTO tool_orchestrator (tool_id, primary_provider, primary_model, is_active, task_description, task_description_ar)
         SELECT u.tool_id, '', '', true, u.desc_en, u.desc_ar
         FROM UNNEST($1::varchar[], $2::text[], $3::text[]) AS u(tool_id, desc_en, desc_ar)
         ON CONFLICT (tool_id) DO UPDATE SET
           is_active = true,
           task_description = EXCLUDED.task_description,
           task_description_ar = EXCLUDED.task_description_ar`,
        [ids, descs, descsAr]
      ).catch(() => {});
    }
  } catch (err: any) {
    console.error('[DatabaseInitializer] Failed to ensure core tables:', err?.message || err);
    throw err;
  }
}


