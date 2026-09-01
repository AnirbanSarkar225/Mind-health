import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isPostgres = Boolean(databaseUrl || process.env.PGHOST);

let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
  const isCloudHost = databaseUrl && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1');
  const cleanUrl = databaseUrl ? databaseUrl.replace(/[?&]sslmode=[^&]+/g, '') : databaseUrl;

  pgPool = new Pool({
    connectionString: cleanUrl,
    ssl: isCloudHost || process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pgPool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
  });

  console.log('[DB OK] Initialized Universal Cloud PostgreSQL connection pool.');
} else {
  const dbDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const legacyDbPath = path.join(__dirname, '..', 'gita_neurosync.sqlite');
  const defaultDbPath = path.join(dbDir, 'gita_neurosync.sqlite');
  const dbPath = process.env.DATABASE_PATH || defaultDbPath;

  if (!fs.existsSync(dbPath) && fs.existsSync(legacyDbPath)) {
    try {
      fs.copyFileSync(legacyDbPath, dbPath);
    } catch (e) {
      console.warn('DB migration notice:', e.message);
    }
  }

  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to connect to SQLite database:', err.message);
    } else {
      console.log(`[DB OK] Connected to persistent SQLite database at: ${dbPath}`);
    }
  });

  sqliteDb.serialize(() => {
    sqliteDb.run('PRAGMA journal_mode = WAL;');
    sqliteDb.run('PRAGMA synchronous = NORMAL;');
    sqliteDb.run('PRAGMA busy_timeout = 5000;');
    sqliteDb.run('PRAGMA foreign_keys = ON;');
  });
}

/**
 * Universal Query Adapter
 * Supports both PostgreSQL ($1, $2, ...) and SQLite (?) transparently.
 */
export function query(text, params = []) {
  if (isPostgres) {
    let paramIndex = 1;
    const pgText = text.replace(/\?/g, () => `$${paramIndex++}`);

    return new Promise((resolve, reject) => {
      pgPool.query(pgText, params, (err, res) => {
        if (err) return reject(err);
        resolve({
          rows: res?.rows || [],
          rowCount: res?.rowCount || 0,
        });
      });
    });
  }

  const sqliteText = text.replace(/\$\d+/g, '?');

  return new Promise((resolve, reject) => {
    const trimmed = sqliteText.trim().toUpperCase();
    const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA');
    const isReturning = trimmed.includes('RETURNING');

    if (isSelect || isReturning) {
      sqliteDb.all(sqliteText, params, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows: rows || [], rowCount: (rows || []).length });
      });
    } else {
      sqliteDb.run(sqliteText, params, function (err) {
        if (err) return reject(err);
        resolve({ rowCount: this.changes, lastID: this.lastID, rows: [] });
      });
    }
  });
}

export const isPostgresMode = () => isPostgres;
export default { query, isPostgresMode };
