import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'gita_neurosync.sqlite');
const db = new sqlite3.Database(dbPath);

export function query(text, params = []) {
  // Convert Postgres $1, $2 to SQLite ?, ?
  const sqliteText = text.replace(/\$\d+/g, '?');

  return new Promise((resolve, reject) => {
    const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');
    const isReturning = sqliteText.toUpperCase().includes('RETURNING');

    if (isSelect || isReturning) {
      db.all(sqliteText, params, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows, rowCount: rows.length });
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
