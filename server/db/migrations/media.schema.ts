import type { QueryClient, ForeignKeyRelation } from './types.js';
import { ensureColumnsBulk, ensureForeignKey } from './helpers.js';

export const MEDIA_SCHEMA_TABLES: { name: string; query: string }[] = [
  {
    name: 'media_assets',
    query: `
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
    `
  },
  {
    name: 'canvas_sessions',
    query: `
      CREATE TABLE IF NOT EXISTS canvas_sessions (
        id UUID PRIMARY KEY,
        user_id INTEGER,
        session_name VARCHAR(255) NOT NULL,
        dimensions JSONB DEFAULT '{"width": 800, "height": 600}',
        state JSONB DEFAULT '{}',
        thumbnail_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'canvas_history',
    query: `
      CREATE TABLE IF NOT EXISTS canvas_history (
        id SERIAL PRIMARY KEY,
        session_id UUID NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        undo_state JSONB DEFAULT '{}',
        redo_state JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  }
];

export async function applyMediaColumnEnforcements(targetMediaPool: QueryClient) {
  if (!targetMediaPool) return;

  // Drop restrictive context check constraints so that all media contexts (images, video, audio, document, pwa_asset, brand, etc.) are supported without rejection
  try {
    await targetMediaPool.query(`
      ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS chk_media_assets_context;
      ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS media_assets_context_check;
    `);
  } catch (err: any) {
    // Ignore if constraints do not exist
  }

  await ensureColumnsBulk(targetMediaPool, 'media_assets', {
    id: { type: 'UUID' },
    stored_path: { type: 'TEXT' },
    original_filename: { type: 'TEXT' },
    context: { type: 'TEXT', default: "'general'" },
    format: { type: 'TEXT', default: "'webp'" },
    width: { type: 'INT', default: 0 },
    height: { type: 'INT', default: 0 },
    size_bytes: { type: 'INT', default: 0 },
    sha256_hash: { type: 'TEXT' },
    is_public: { type: 'BOOLEAN', default: false },
    user_id: { type: 'INTEGER' },
    metadata: { type: 'JSONB', default: "'{}'" },
    file_data: { type: 'BYTEA' },
    created_at: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
  });

  await ensureColumnsBulk(targetMediaPool, 'canvas_sessions', {
    user_id: { type: 'INTEGER' },
    session_name: { type: 'VARCHAR(255)' },
    dimensions: { type: 'JSONB', default: '\'{"width": 800, "height": 600}\'' },
    state: { type: 'JSONB', default: "'{}'" },
    thumbnail_url: { type: 'TEXT' },
    is_active: { type: 'BOOLEAN', default: true },
    created_at: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
  });

  await ensureColumnsBulk(targetMediaPool, 'canvas_history', {
    session_id: { type: 'UUID' },
    action_type: { type: 'VARCHAR(100)' },
    undo_state: { type: 'JSONB', default: "'{}'" },
    redo_state: { type: 'JSONB', default: "'{}'" },
    created_at: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
  });
}

export const MEDIA_INDEXES: string[] = [
  `CREATE UNIQUE INDEX IF NOT EXISTS media_assets_pkey ON media_assets(id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS media_assets_stored_path_key ON media_assets(stored_path)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS media_assets_sha256_hash_key ON media_assets(sha256_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_media_assets_context ON media_assets(context)`,
  `CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS canvas_sessions_pkey ON canvas_sessions(id)`,
  `CREATE INDEX IF NOT EXISTS idx_canvas_sessions_user_id ON canvas_sessions(user_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS canvas_history_pkey ON canvas_history(id)`,
  `CREATE INDEX IF NOT EXISTS idx_canvas_history_session_id ON canvas_history(session_id)`
];

export const MEDIA_RELATIONS: ForeignKeyRelation[] = [
  { table: 'canvas_history', constraint: 'fk_canvas_history_session_id', column: 'session_id', ref: 'canvas_sessions', onDelete: 'CASCADE' }
];

export async function applyMediaRelations(targetMediaPool: QueryClient) {
  if (!targetMediaPool) return;
  for (const rel of MEDIA_RELATIONS) {
    await ensureForeignKey(targetMediaPool, rel.table, rel.constraint, rel.column, rel.ref, rel.refColumn || 'id', rel.onDelete || 'CASCADE');
  }
}
