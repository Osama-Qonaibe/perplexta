import type { QueryClient } from './types.js';

export const EXTERNAL_SCHEMA_TABLES: { name: string; query: string }[] = [
  {
    name: 'external_articles',
    query: `
      CREATE TABLE IF NOT EXISTS external_articles (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT,
        summary TEXT,
        source VARCHAR(100),
        url TEXT,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'external_categories',
    query: `
      CREATE TABLE IF NOT EXISTS external_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'external_sync_logs',
    query: `
      CREATE TABLE IF NOT EXISTS external_sync_logs (
        id SERIAL PRIMARY KEY,
        source_name VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'success',
        records_imported INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  }
];

export async function applyExternalColumnEnforcements(targetExternalPool: QueryClient) {
  if (!targetExternalPool) return;
  try {
    for (const table of EXTERNAL_SCHEMA_TABLES) {
      await targetExternalPool.query(table.query).catch(() => {});
    }
  } catch {
    // Ignore errors on disconnected pool
  }
}

export const EXTERNAL_INDEXES: string[] = [];

