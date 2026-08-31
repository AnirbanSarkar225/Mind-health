"""DDL -- table creation and migration."""

from __future__ import annotations

from backend.database.connection import get_cursor

_TABLES_SQL = """
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50)  UNIQUE NOT NULL,
    email           VARCHAR(120) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    email_verified  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ  DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code            VARCHAR(10) NOT NULL,
    purpose         VARCHAR(30) DEFAULT 'email_verify',
    expires_at      TIMESTAMPTZ NOT NULL,
    used            BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bpm                 REAL NOT NULL,
    hrv_sdnn            REAL NOT NULL,
    eeg_attention       REAL NOT NULL,
    eeg_meditation      REAL NOT NULL,
    alpha_power         REAL,
    beta_power          REAL,
    theta_power         REAL,
    beta_alpha_ratio    REAL NOT NULL,
    detected_state      VARCHAR(100) NOT NULL,
    classifier_method   VARCHAR(60)  NOT NULL,
    confidence          REAL NOT NULL,
    created_at          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS problems (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description         TEXT,
    symptoms            TEXT[],
    discomfort_level    INT NOT NULL CHECK (discomfort_level BETWEEN 1 AND 5),
    created_at          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    confirmed_state     VARCHAR(100) NOT NULL,
    discomfort_level    INT NOT NULL CHECK (discomfort_level BETWEEN 1 AND 5),
    notes               TEXT,
    created_at          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_problems_user    ON problems(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user    ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_otp_user         ON otp_codes(user_id);
"""


def create_tables() -> None:
    """Run the DDL to create all tables (idempotent)."""
    with get_cursor() as cur:
        cur.execute(_TABLES_SQL)
