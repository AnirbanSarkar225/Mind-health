import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent database directory
const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Support custom DATABASE_PATH, default to backend/data/gita_neurosync.sqlite
const legacyDbPath = path.join(__dirname, '..', 'gita_neurosync.sqlite');
const defaultDbPath = path.join(dbDir, 'gita_neurosync.sqlite');
const dbPath = process.env.DATABASE_PATH || defaultDbPath;

// Auto-migrate legacy DB file from backend root into data/ directory if present
if (!fs.existsSync(dbPath) && fs.existsSync(legacyDbPath)) {
  try {
    fs.copyFileSync(legacyDbPath, dbPath);
    console.log('  [DB] Successfully migrated database to persistent data directory.');
  } catch (e) {
    console.warn('  [DB] Legacy DB migration notice:', e.message);
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('  [DB ERROR] Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`  [DB OK] Connected to persistent SQLite database at: ${dbPath}`);
  }
});

// Configure SQLite for high concurrency, durability, and referential integrity
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA synchronous = NORMAL;');
  db.run('PRAGMA busy_timeout = 5000;');
  db.run('PRAGMA foreign_keys = ON;');
});

export function query(text, params = []) {
  // Convert Postgres $1, $2 to SQLite ?, ?
  const sqliteText = text.replace(/\$\d+/g, '?');

  return new Promise((resolve, reject) => {
    const trimmed = sqliteText.trim().toUpperCase();
    const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA');
    const isReturning = trimmed.includes('RETURNING');

    if (isSelect || isReturning) {
      db.all(sqliteText, params, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows: rows || [], rowCount: (rows || []).length });
      });
    } else {
      db.run(sqliteText, params, function (err) {
        if (err) return reject(err);
        resolve({ rowCount: this.changes, lastID: this.lastID, rows: [] });
      });
    }
  });
}

export default { query };
