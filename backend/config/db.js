import pg from 'pg';
import sqlite3 from 'sqlite3';
import dns from 'dns';
import fs from 'fs';
import path from 'path';

// Ensure IPv4 first on Windows to avoid IPv6 Supabase connection timeout
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let isPostgres = !!databaseUrl;
let pool = null;
let sqliteDb = null;
let isConnected = false;
let reconnectTimer = null;

if (isPostgres) {
  const { Pool } = pg;
  
  function createPool() {
    const isCloudHost = databaseUrl && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1');
    const cleanUrl = databaseUrl ? databaseUrl.replace(/[?&]sslmode=[^&]+/g, '') : databaseUrl;

    const newPool = new Pool({
      connectionString: cleanUrl,
      ssl: isCloudHost || process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    newPool.on('error', (err) => {
      console.error('[SUPABASE DB ERROR] Unexpected pool client error:', err.message);
      isConnected = false;
      scheduleReconnect();
    });

    newPool.on('connect', () => {
      isConnected = true;
    });

    return newPool;
  }

  pool = createPool();

  function scheduleReconnect() {
    if (reconnectTimer) return;
    console.log('[SUPABASE DB] Scheduling automatic Supabase reconnect...');
    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null;
      try {
        if (pool) {
          await pool.end().catch(() => {});
        }
        pool = createPool();
        await checkConnection(3, 2000);
        console.log('[SUPABASE DB] Successfully re-established Supabase connection.');
      } catch (e) {
        console.warn('[SUPABASE DB] Reconnect attempt failed, will retry:', e.message);
        scheduleReconnect();
      }
    }, 5000);
  }
} else {
  // SQLite Fallback
  console.log('[DB INFO] No DATABASE_URL provided. Falling back to local SQLite database.');
  const dbPath = process.env.DATABASE_PATH || './data/gita_neurosync.sqlite';
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('[SQLITE FATAL] Error opening SQLite database:', err.message);
    } else {
      console.log(`  ✓ SQLite Local Database Connected: ${dbPath}`);
      isConnected = true;
    }
  });
}

/**
 * Health check & re-monitoring for Supabase or SQLite
 */
export async function checkConnection(maxRetries = 5, delayMs = 2000) {
  if (!isPostgres) {
    let attempt = 0;
    while (attempt < maxRetries) {
      if (isConnected) return true;
      attempt++;
      await new Promise(r => setTimeout(r, delayMs));
    }
    throw new Error("SQLite connection timed out.");
  }

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      const client = await pool.connect();
      const res = await client.query('SELECT NOW() as server_time, current_database() as db');
      client.release();
      isConnected = true;
      console.log(`  ✓ Supabase PostgreSQL Connected: ${res.rows[0].db} (Time: ${res.rows[0].server_time})`);
      return true;
    } catch (err) {
      console.warn(`  [SUPABASE DB] Connection attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw new Error(`Failed to connect to Supabase PostgreSQL after ${maxRetries} attempts.`);
}

/**
 * Universal Database Query Adapter
 * Translates ? placeholders to PostgreSQL $1, $2 and handles transient retries.
 * For SQLite, uses ? directly.
 */
export async function query(text, params = []) {
  if (!isPostgres) {
    return new Promise((resolve, reject) => {
      // Basic check for read vs write operation to use appropriate SQLite method
      const isSelect = text.trim().toUpperCase().startsWith('SELECT');
      
      if (isSelect) {
          sqliteDb.all(text, params, (err, rows) => {
              if (err) reject(err);
              else resolve({ rows: rows || [], rowCount: rows?.length || 0 });
          });
      } else {
          sqliteDb.run(text, params, function(err) {
             if (err) reject(err);
             else resolve({ rows: [], rowCount: this.changes || 0 });
          });
      }
    });
  }

  let paramIndex = 1;
  const pgText = text.replace(/\?/g, () => `$${paramIndex++}`);

  let retries = 2;
  while (retries >= 0) {
    try {
      const res = await pool.query(pgText, params);
      return {
        rows: res?.rows || [],
        rowCount: res?.rowCount || 0,
      };
    } catch (err) {
      const isConnError =
        err.code === '57P01' ||
        err.code === 'ECONNRESET' ||
        err.code === 'EPIPE' ||
        err.message?.includes('Connection terminated') ||
        err.message?.includes('timeout');

      if (isConnError && retries > 0) {
        console.warn(`[SUPABASE DB] Transient connection error (${err.message}). Retrying query...`);
        retries--;
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }
}

export const isPostgresMode = () => isPostgres;
export default { query, checkConnection, isPostgresMode };
