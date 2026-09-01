import pg from 'pg';
import dns from 'dns';

// Ensure IPv4 first on Windows to avoid IPv6 Supabase connection timeout
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('[DB FATAL] DATABASE_URL is not defined in backend/.env!');
}

let pool = null;
let isConnected = false;
let reconnectTimer = null;

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

/**
 * Health check & re-monitoring for Supabase
 */
export async function checkConnection(maxRetries = 5, delayMs = 2000) {
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
 * Universal PostgreSQL Query Adapter
 * Translates ? placeholders to PostgreSQL $1, $2 and handles transient retries.
 */
export async function query(text, params = []) {
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

export const isPostgresMode = () => true;
export default { query, checkConnection, isPostgresMode };
