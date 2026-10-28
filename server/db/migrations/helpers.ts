import type { Pool as PgPool, PoolClient as PgPoolClient } from 'pg';
import { pool } from '../index.js';
import type { QueryClient } from './types.js';

export function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_$]*$/.test(name) && name.length <= 63;
}

export function isValidDataType(type: string): boolean {
  const baseType = type.split('(')[0].trim().toUpperCase();
  const validTypes = [
    'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'DECIMAL', 'NUMERIC',
    'VARCHAR', 'CHAR', 'TEXT', 'JSONB', 'JSON', 'BOOLEAN',
    'TIMESTAMP', 'TIMESTAMPTZ', 'TIMESTAMP WITH TIME ZONE', 'DATE', 'TIME', 'UUID', 'SERIAL', 'BIGSERIAL',
    'INT[]', 'INTEGER[]', 'TEXT[]', 'VARCHAR[]', 'JSONB[]',
    'REAL', 'DOUBLE PRECISION', 'FLOAT', 'MONEY', 'BYTEA'
  ];
  return validTypes.some(vt => baseType === vt || baseType.startsWith(vt + '('));
}

export function sanitizeForLogging(data: any): any {
  const sensitiveKeys = ['password', 'secret', 'token', 'key', 'hash', 'credit', 'iban', 'swift', 'connection_string'];
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(sanitizeForLogging);
  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeForLogging(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  if (typeof data === 'string' && sensitiveKeys.some(k => data.toLowerCase().includes(k))) {
    return '[REDACTED]';
  }
  return data;
}

export async function tableExists(poolObj: QueryClient, tableName: string): Promise<boolean> {
  try {
    const result = await poolObj.query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = $1 AND table_schema = 'public'`,
      [tableName]
    );
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

export async function columnExists(poolObj: QueryClient, tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await poolObj.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2 AND table_schema = 'public'`,
      [tableName, columnName]
    );
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

export async function ensureColumnsBulk(
  poolObj: QueryClient,
  tableName: string,
  columns: Record<string, { type: string; default?: string | number | boolean | null }>
) {
  if (!isValidIdentifier(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }
  const isClient = 'release' in poolObj && typeof poolObj.release === 'function';
  const client = isClient ? (poolObj as PgPoolClient) : await (poolObj as PgPool).connect();
  try {
    if (!isClient) await client.query('BEGIN');
    const tableCheck = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = $1 AND table_schema = 'public'`,
      [tableName]
    );
    if (tableCheck.rows.length === 0) {
      console.warn(`[Database] Table "${tableName}" does not exist on target database for ensureColumnsBulk. Skipping.`);
      if (!isClient) await client.query('COMMIT');
      return;
    }
    const existing = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'`,
      [tableName]
    );
    const existingSet = new Set(existing.rows.map(r => r.column_name));
    const missing = Object.entries(columns)
      .filter(([col]) => !existingSet.has(col))
      .filter(([col]) => isValidIdentifier(col));
    if (missing.length === 0) {
      if (!isClient) await client.query('COMMIT');
      return;
    }
    const alterParts: string[] = [];
    for (const [col, config] of missing) {
      if (!isValidDataType(config.type)) {
        throw new Error(`Invalid data type for column ${col}: ${config.type}`);
      }
      let part = `ADD COLUMN "${col}" ${config.type}`;
      if (config.default !== undefined && config.default !== null) {
        let defaultStr = '';
        if (typeof config.default === 'boolean') {
          defaultStr = config.default ? 'true' : 'false';
        } else if (typeof config.default === 'number') {
          defaultStr = String(config.default);
        } else if (typeof config.default === 'string') {
          const trimmed = config.default.trim();
          const upper = trimmed.toUpperCase();
          const isSqlKeywordOrExpr = 
            upper === 'CURRENT_TIMESTAMP' ||
            upper === 'CURRENT_DATE' ||
            upper === 'CURRENT_TIME' ||
            upper === 'TRUE' ||
            upper === 'FALSE' ||
            upper === 'NULL' ||
            upper.startsWith('GEN_RANDOM_UUID()') ||
            upper.startsWith('NOW()');
          
          if (isSqlKeywordOrExpr) {
            defaultStr = upper;
          } else if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith("$$") && trimmed.endsWith("$$"))) {
            defaultStr = trimmed;
          } else {
            const escaped = trimmed.replace(/'/g, "''");
            defaultStr = `'${escaped}'`;
          }
        } else {
          defaultStr = String(config.default);
        }

        if (!/^[a-zA-Z0-9_()\-:.',"\s\[\]{}\$\u0600-\u06FF]+$/i.test(defaultStr)) {
          throw new Error(`Invalid default value expression: ${defaultStr}`);
        }
        part += ` DEFAULT ${defaultStr}`;
      }
      alterParts.push(part);
    }
    await client.query(`ALTER TABLE "${tableName}" ${alterParts.join(', ')}`);
    console.log(`[Database] Added columns ${missing.map(([col]) => col).join(', ')} to ${tableName}`);
    if (!isClient) await client.query('COMMIT');
  } catch (error) {
    if (!isClient) await client.query('ROLLBACK');
    const err = error as Error & { code?: string };
    console.error(`[Database] ERROR in ensureColumnsBulk (${tableName}):`, err.message);
    try {
      if (pool) {
        await pool.query(`
          INSERT INTO migration_security_audit (migration_name, status, error_message, sql_state, details)
          VALUES ($1, 'conflict', $2, $3, $4)
        `, [
          `ensureColumnsBulk_${tableName}`,
          err.message || 'Unknown error',
          err.code || null,
          JSON.stringify(sanitizeForLogging({ tableName, columns: Object.keys(columns) }))
        ]);
      }
    } catch {
      // Ignore secondary audit failure
    }
    throw error;
  } finally {
    if (!isClient) (client as PgPoolClient).release();
  }
}

export async function ensureForeignKey(
  poolObj: QueryClient,
  tableName: string,
  constraintName: string,
  columnName: string,
  referencedTable: string,
  referencedColumn: string = 'id',
  onDelete: string = 'CASCADE'
) {
  if (!isValidIdentifier(tableName) || !isValidIdentifier(constraintName) || !isValidIdentifier(columnName) || !isValidIdentifier(referencedTable) || !isValidIdentifier(referencedColumn)) {
    console.error(`[Schema] Invalid identifiers for foreign key ${constraintName}`);
    return;
  }

  // Enforce sovereign database segregation: bypass physical foreign key constraints between Media DB and Core DB tables
  const isCrossDb = (
    (tableName === 'media_assets' && referencedTable === 'users') ||
    (referencedTable === 'media_assets' && tableName === 'users')
  );
  if (isCrossDb) {
    console.log(`[Schema] Enforcing sovereign database segregation: Skipping physical cross-database foreign key ${constraintName} between ${tableName} and ${referencedTable}.`);
    return;
  }

  const validOnDelete = ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT'];
  const safeOnDelete = validOnDelete.includes(onDelete.toUpperCase()) ? onDelete.toUpperCase() : 'CASCADE';
  const expectedDelCode = safeOnDelete === 'CASCADE' ? 'c' : safeOnDelete === 'SET NULL' ? 'n' : safeOnDelete === 'RESTRICT' ? 'r' : safeOnDelete === 'SET DEFAULT' ? 'd' : 'a';
  try {
    const existsRes = await poolObj.query(
      `SELECT confdeltype FROM pg_constraint WHERE conname = $1 AND conrelid = $2::regclass`,
      [constraintName, `"${tableName}"`]
    ).catch(() => ({ rows: [] }));
    if (existsRes.rows.length > 0) {
      if (existsRes.rows[0].confdeltype === expectedDelCode) return;
      await poolObj.query(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}"`);
    }
    const tableExistsResult = await tableExists(poolObj, referencedTable);
    if (!tableExistsResult) {
      console.warn(`[Schema] Skipping foreign key ${constraintName}: referenced table ${referencedTable} doesn't exist`);
      return;
    }
    const columnExistsResult = await columnExists(poolObj, tableName, columnName);
    if (!columnExistsResult) {
      console.warn(`[Schema] Skipping foreign key ${constraintName}: column ${tableName}.${columnName} doesn't exist`);
      return;
    }
    const violations = await poolObj.query(
      `SELECT COUNT(*) FROM "${tableName}" t 
        LEFT JOIN "${referencedTable}" r ON r."${referencedColumn}" = t."${columnName}"
       WHERE t."${columnName}" IS NOT NULL AND r."${referencedColumn}" IS NULL`
    );
    const violationCount = parseInt(violations.rows[0].count, 10);
    if (violationCount > 0) {
      console.warn(`[Schema Constraint Warning] ${violationCount} row violations found for foreign key ${constraintName} on ${tableName}.${columnName} -> ${referencedTable}.${referencedColumn}. Cleaning invalid references.`);
      if (safeOnDelete === 'CASCADE') {
        await poolObj.query(
          `DELETE FROM "${tableName}" 
            WHERE "${columnName}" IS NOT NULL 
            AND "${columnName}" NOT IN (SELECT "${referencedColumn}" FROM "${referencedTable}")`
        );
      } else {
        await poolObj.query(
          `UPDATE "${tableName}" SET "${columnName}" = NULL 
            WHERE "${columnName}" IS NOT NULL 
            AND "${columnName}" NOT IN (SELECT "${referencedColumn}" FROM "${referencedTable}")`
        ).catch(async () => {
          await poolObj.query(
            `DELETE FROM "${tableName}" 
              WHERE "${columnName}" IS NOT NULL 
              AND "${columnName}" NOT IN (SELECT "${referencedColumn}" FROM "${referencedTable}")`
          );
        });
      }
    }
    await poolObj.query(
      `ALTER TABLE "${tableName}" 
        ADD CONSTRAINT "${constraintName}" 
        FOREIGN KEY ("${columnName}") 
        REFERENCES "${referencedTable}"("${referencedColumn}") 
        ON DELETE ${safeOnDelete}`
    );
    console.log(`[Schema] Added foreign key ${constraintName} (ON DELETE ${safeOnDelete})`);
  } catch (error) {
    console.error(`[Schema] Failed to add foreign key ${constraintName}:`, error instanceof Error ? error.message : 'Unknown error');
  }
}

export function assertNoDropInProduction(sql: string) {
  if (process.env.NODE_ENV === 'production' && /DROP\s+TABLE/i.test(sql)) {
    throw new Error('[Migrations] DROP TABLE is FORBIDDEN in production migrations');
  }
}

export async function safeQueryClient(
  targetClient: PgPoolClient | null | any,
  fallbackClient: PgPoolClient | any,
  queryStr: string,
  params?: unknown[]
): Promise<any> {
  assertNoDropInProduction(queryStr);
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
}
