import type { QueryClient } from './types.js';

export const MEDIA_SCHEMA_TABLES: { name: string; query: string }[] = [
  {
    name: 'media_assets',
    query: `
      CREATE TABLE IF NOT EXISTS media_assets (
        id UUID PRIMARY KEY,
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
  try {
    for (const table of MEDIA_SCHEMA_TABLES) {
      await targetMediaPool.query(table.query).catch(() => {});
    }
  } catch {
    // Ignore errors on disconnected pool
  }
}

export const MEDIA_INDEXES: string[] = [
  `CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_canvas_sessions_user_id ON canvas_sessions(user_id)`
];
