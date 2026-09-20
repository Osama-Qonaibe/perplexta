import { pool, mediaPool } from '../db/index.js';

async function runMediaAssetsMigration() {
  const targetMediaPool = mediaPool || pool;
  if (!targetMediaPool) {
    console.error('[Migration: media_assets] Media database pool is not initialized.');
    process.exit(1);
  }

  console.log('[Migration: media_assets] Starting media_assets schema migration...');

  try {
    await targetMediaPool.query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stored_path TEXT NOT NULL UNIQUE,
        original_filename TEXT NOT NULL,
        context TEXT NOT NULL DEFAULT 'general',
        format TEXT NOT NULL DEFAULT 'webp',
        width INT NOT NULL DEFAULT 0,
        height INT NOT NULL DEFAULT 0,
        size_bytes INT NOT NULL DEFAULT 0,
        sha256_hash TEXT NOT NULL UNIQUE,
        is_public BOOLEAN DEFAULT FALSE,
        user_id INTEGER,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        file_data BYTEA
      )
    `);
    console.log('[Migration: media_assets] media_assets table ensured.');

    await targetMediaPool.query(`
      ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS chk_media_assets_context;
      ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS media_assets_context_check;
    `).catch(() => {});

    await targetMediaPool.query(`ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS user_id INTEGER`);
    await targetMediaPool.query(`ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`);
    await targetMediaPool.query(`ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS file_data BYTEA`);

    if (pool) {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_asset_id UUID`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_avatar_asset_id ON users(avatar_asset_id)`);
      console.log('[Migration: media_assets] Core DB columns ensured.');
    }

    await targetMediaPool.query(`CREATE INDEX IF NOT EXISTS idx_media_assets_context ON media_assets(context)`);
    await targetMediaPool.query(`CREATE INDEX IF NOT EXISTS idx_media_assets_hash ON media_assets(sha256_hash)`);
    await targetMediaPool.query(`CREATE INDEX IF NOT EXISTS idx_media_assets_stored_path ON media_assets(stored_path)`);
    await targetMediaPool.query(`CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id)`);
    console.log('[Migration: media_assets] Indexes created.');

    console.log('[Migration: media_assets] All media_assets migration steps completed successfully.');
    process.exit(0);
  } catch (error: any) {
    console.error('[Migration: media_assets] Migration failed:', error.message);
    process.exit(1);
  }
}

runMediaAssetsMigration();
