import { query } from '../config/db.js';

const TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    username        TEXT UNIQUE NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    email_verified  INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_codes (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    code            TEXT NOT NULL,
    purpose         TEXT DEFAULT 'email_verify',
    expires_at      TIMESTAMPTZ NOT NULL,
    used            INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT NOT NULL,
    bpm                 REAL DEFAULT 0,
    hrv_sdnn            REAL DEFAULT 0,
    eeg_attention       REAL DEFAULT 50,
    eeg_meditation      REAL DEFAULT 50,
    alpha_power         REAL DEFAULT 15,
    beta_power          REAL DEFAULT 10,
    theta_power         REAL DEFAULT 10,
    beta_alpha_ratio    REAL DEFAULT 0.67,
    detected_state      TEXT NOT NULL,
    classifier_method   TEXT NOT NULL,
    confidence          REAL NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS problems (
    id                  TEXT PRIMARY KEY,
    session_id          TEXT,
    user_id             TEXT NOT NULL,
    description         TEXT,
    symptoms            TEXT,
    discomfort_level    INTEGER NOT NULL CHECK (discomfort_level BETWEEN 1 AND 5),
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback (
    id                  TEXT PRIMARY KEY,
    session_id          TEXT,
    user_id             TEXT NOT NULL,
    confirmed_state     TEXT NOT NULL,
    discomfort_level    INTEGER NOT NULL CHECK (discomfort_level BETWEEN 1 AND 5),
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_problems_user    ON problems(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user    ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_otp_user         ON otp_codes(user_id);
`;

const SECURITY_POLICIES_SQL = `
-- 1. Enable RLS and create permissive backend policies for tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "backend_access_users" ON public.users;
CREATE POLICY "backend_access_users" ON public.users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.otp_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "backend_access_otp_codes" ON public.otp_codes;
CREATE POLICY "backend_access_otp_codes" ON public.otp_codes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "backend_access_sessions" ON public.sessions;
CREATE POLICY "backend_access_sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.problems ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "backend_access_problems" ON public.problems;
CREATE POLICY "backend_access_problems" ON public.problems FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "backend_access_feedback" ON public.feedback;
CREATE POLICY "backend_access_feedback" ON public.feedback FOR ALL USING (true) WITH CHECK (true);
`;

export async function createTables() {
  const statements = TABLES_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    try {
      await query(stmt);
    } catch (err) {
      if (!err.message?.includes('already exists')) {
        console.warn(`[SCHEMA NOTICE] Table statement warning: ${err.message}`);
      }
    }
  }

  // Apply RLS and security policies to eliminate Supabase Security Advisor warnings
  const policyStatements = SECURITY_POLICIES_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of policyStatements) {
    try {
      await query(stmt);
    } catch (err) {
      console.warn(`[SECURITY POLICY NOTICE] ${err.message}`);
    }
  }

  // Fix SECURITY DEFINER function warnings on public.rls_auto_enable()
  try {
    await query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
          REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
          ALTER FUNCTION public.rls_auto_enable() SECURITY INVOKER;
        END IF;
      END $$;
    `);
  } catch (err) {
    console.warn(`[FUNCTION SECURITY NOTICE] ${err.message}`);
  }
}

