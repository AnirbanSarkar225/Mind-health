/**
 * DDL — SQLite Table creation
 */

import { query } from '../config/db.js';

const TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    username        TEXT UNIQUE NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    email_verified  INTEGER DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_codes (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    code            TEXT NOT NULL,
    purpose         TEXT DEFAULT 'email_verify',
    expires_at      DATETIME NOT NULL,
    used            INTEGER DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT NOT NULL,
    bpm                 REAL NOT NULL,
    hrv_sdnn            REAL NOT NULL,
    eeg_attention       REAL NOT NULL,
    eeg_meditation      REAL NOT NULL,
    alpha_power         REAL,
    beta_power          REAL,
    theta_power         REAL,
    beta_alpha_ratio    REAL NOT NULL,
    detected_state      TEXT NOT NULL,
    classifier_method   TEXT NOT NULL,
    confidence          REAL NOT NULL,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS problems (
    id                  TEXT PRIMARY KEY,
    session_id          TEXT,
    user_id             TEXT NOT NULL,
    description         TEXT,
    symptoms            TEXT,
    discomfort_level    INTEGER NOT NULL CHECK (discomfort_level BETWEEN 1 AND 5),
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
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
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_problems_user    ON problems(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user    ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_otp_user         ON otp_codes(user_id);
`;

export async function createTables() {
  // Split statements for SQLite which doesn't support multiple statements in run()
  const statements = TABLES_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    await query(stmt);
  }
  console.log('  [OK] SQLite Database and tables ready');
}
