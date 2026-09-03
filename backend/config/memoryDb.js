/**
 * Gita-NeuroSync — In-Memory Database Adapter
 * 
 * Provides an in-memory SQL-compatible query engine so the entire platform
 * (registration, OTP email verification, login, sessions, feedback, and stats)
 * runs out of the box on localhost without requiring PostgreSQL or any external setup.
 */

const store = {
  users: [],
  otp_codes: [],
  sessions: [],
  problems: [],
  feedback: []
};

export function getStore() {
  return store;
}

export function resetStore() {
  store.users = [];
  store.otp_codes = [];
  store.sessions = [];
  store.problems = [];
  store.feedback = [];
}

/**
 * Filter rows for a given table based on WHERE expressions and parameter values
 */
function evaluateWhere(table, row, whereStr, params) {
  if (!whereStr) return true;
  const where = whereStr.trim();

  // Pattern: LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
  if (/LOWER\(username\)\s*=\s*LOWER\(\?\)\s*OR\s*LOWER\(email\)\s*=\s*LOWER\(\?\)/i.test(where)) {
    const p0 = String(params[0] || '').toLowerCase();
    const p1 = String(params[1] || '').toLowerCase();
    const u = String(row.username || '').toLowerCase();
    const e = String(row.email || '').toLowerCase();
    return u === p0 || e === p1;
  }

  // Pattern: LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)
  if (/LOWER\(email\)\s*=\s*LOWER\(\?\)\s*OR\s*LOWER\(username\)\s*=\s*LOWER\(\?\)/i.test(where)) {
    const p0 = String(params[0] || '').toLowerCase();
    const p1 = String(params[1] || '').toLowerCase();
    const u = String(row.username || '').toLowerCase();
    const e = String(row.email || '').toLowerCase();
    return e === p0 || u === p1;
  }

  // Pattern: user_id = ? AND code = ?
  if (/\buser_id\s*=\s*\?\s*AND\s*code\s*=\s*\?/i.test(where)) {
    return row.user_id === params[0] && String(row.code) === String(params[1]);
  }

  // Pattern: user_id = ? OR s.user_id = ?
  if (/(?:\bs\.)?\buser_id\s*=\s*\?/i.test(where)) {
    return row.user_id === params[0];
  }

  // Pattern: id = ?
  if (/\bid\s*=\s*\?/i.test(where)) {
    return row.id === params[0];
  }

  return true;
}

/**
 * Universal Database Query Adapter for In-Memory Execution
 */
export async function query(text, params = []) {
  const trimmed = text.trim();
  const upper = trimmed.toUpperCase();

  // 1. DDL, migration, and policy commands (No-Op in Memory mode)
  if (
    upper.startsWith('CREATE ') ||
    upper.startsWith('ALTER ') ||
    upper.startsWith('DROP ') ||
    upper.startsWith('DO ') ||
    upper.startsWith('GRANT ') ||
    upper.startsWith('REVOKE ')
  ) {
    return { rows: [], rowCount: 0 };
  }

  // 2. Health check connection query
  if (upper.includes('SELECT NOW()') || upper.includes('CURRENT_DATABASE()')) {
    return {
      rows: [{ server_time: new Date().toISOString(), db: 'in-memory-local' }],
      rowCount: 1,
    };
  }

  // 3. INSERT INTO <table> (<cols>) VALUES (<vals>)
  const insertMatch = trimmed.match(/^INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (insertMatch) {
    const tableName = insertMatch[1].toLowerCase();
    const colNames = insertMatch[2].split(',').map(c => c.trim());
    const valPlaceholders = insertMatch[3].split(',').map(v => v.trim());

    if (!store[tableName]) {
      store[tableName] = [];
    }

    const row = {};
    let pIdx = 0;

    for (let i = 0; i < colNames.length; i++) {
      const col = colNames[i];
      const ph = valPlaceholders[i];

      if (ph === '?') {
        row[col] = params[pIdx++];
      } else if (!isNaN(Number(ph))) {
        row[col] = Number(ph);
      } else if (/^['"].*['"]$/.test(ph)) {
        row[col] = ph.slice(1, -1);
      } else if (ph.toUpperCase() === 'NULL') {
        row[col] = null;
      } else {
        row[col] = ph;
      }
    }

    // Default timestamps
    if (!row.created_at) row.created_at = new Date().toISOString();
    if (!row.updated_at) row.updated_at = new Date().toISOString();

    // Unique constraint validation for users
    if (tableName === 'users') {
      const isDuplicate = store.users.some(u =>
        (u.username && row.username && u.username.toLowerCase() === row.username.toLowerCase()) ||
        (u.email && row.email && u.email.toLowerCase() === row.email.toLowerCase())
      );
      if (isDuplicate) {
        const err = new Error('duplicate key value violates unique constraint "users_email_key"');
        err.code = '23505';
        throw err;
      }
    }

    store[tableName].push(row);
    return { rows: [row], rowCount: 1 };
  }

  // 4. UPDATE <table> SET <assignments> WHERE <conditions>
  const updateMatch = trimmed.match(/^UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)$/i);
  if (updateMatch) {
    const tableName = updateMatch[1].toLowerCase();
    const setClause = updateMatch[2];
    const whereClause = updateMatch[3];

    if (!store[tableName]) store[tableName] = [];

    const assignments = setClause.split(',').map(s => s.trim());
    let updatedCount = 0;

    for (const row of store[tableName]) {
      if (evaluateWhere(tableName, row, whereClause, params)) {
        for (const assign of assignments) {
          const [col, val] = assign.split('=').map(s => s.trim());
          if (val.toUpperCase() === 'CURRENT_TIMESTAMP') {
            row[col] = new Date().toISOString();
          } else if (!isNaN(Number(val))) {
            row[col] = Number(val);
          } else if (/^['"].*['"]$/.test(val)) {
            row[col] = val.slice(1, -1);
          } else {
            row[col] = val;
          }
        }
        updatedCount++;
      }
    }

    return { rows: [], rowCount: updatedCount };
  }

  // 5. COUNT(*) queries (e.g. SELECT COUNT(*) as count FROM feedback WHERE user_id = ?)
  if (upper.includes('SELECT COUNT(*)')) {
    const countMatch = trimmed.match(/FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
    if (countMatch) {
      const tableName = countMatch[1].toLowerCase();
      const whereClause = countMatch[2] || '';
      const rows = (store[tableName] || []).filter(r => evaluateWhere(tableName, r, whereClause, params));
      return { rows: [{ count: String(rows.length) }], rowCount: 1 };
    }
  }

  // 6. Complex JOIN query for Session history
  if (upper.includes('FROM SESSIONS S') && upper.includes('LEFT JOIN PROBLEMS')) {
    const userId = params[0];
    const limit = Number(params[1]) || 100;

    let userSessions = (store.sessions || []).filter(s => s.user_id === userId);
    userSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    userSessions = userSessions.slice(0, limit);

    const joined = userSessions.map(s => {
      const p = (store.problems || []).find(prob => prob.session_id === s.id);
      const f = (store.feedback || []).find(fb => fb.session_id === s.id);
      return {
        ...s,
        problem_description: p?.description || null,
        problem_symptoms: p?.symptoms || null,
        problem_discomfort: p?.discomfort_level || null,
        feedback_notes: f?.notes || null
      };
    });

    return { rows: joined, rowCount: joined.length };
  }

  // 7. General SELECT queries
  const selectMatch = trimmed.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER BY\s+(.+?))?(?:\s+LIMIT\s+(\S+))?$/i);
  if (selectMatch) {
    const selectCols = selectMatch[1].trim();
    const tableName = selectMatch[2].toLowerCase();
    const whereClause = selectMatch[3] ? selectMatch[3].trim() : '';
    const orderByClause = selectMatch[4] ? selectMatch[4].trim() : '';
    const limitVal = selectMatch[5] ? selectMatch[5].trim() : '';

    let rows = (store[tableName] || []).filter(r => evaluateWhere(tableName, r, whereClause, params));

    if (orderByClause) {
      if (/created_at\s+DESC/i.test(orderByClause)) {
        rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (/created_at\s+ASC/i.test(orderByClause)) {
        rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
    }

    if (limitVal) {
      let l = limitVal === '?' ? Number(params[params.length - 1]) : Number(limitVal);
      if (!isNaN(l) && l > 0) {
        rows = rows.slice(0, l);
      }
    }

    // Return deep cloned objects so callers don't accidentally mutate in-memory store
    const resultRows = rows.map(r => ({ ...r }));
    return { rows: resultRows, rowCount: resultRows.length };
  }

  // Fallback for unrecognized queries
  return { rows: [], rowCount: 0 };
}

export async function checkConnection(maxRetries = 1, delayMs = 0) {
  return true;
}

export const isPostgresMode = () => false;

export default { query, checkConnection, isPostgresMode };
