"""PostgreSQL connection pool via psycopg2 with Cloud & Local support."""

from __future__ import annotations

import os
import psycopg2
from psycopg2 import pool, extras
from contextlib import contextmanager
from typing import Generator, Any

# Local fallback parameters
_LOCAL_DB_CONFIG = {
    "dbname":   "gita_neurosync",
    "user":     "postgres",
    "password": "Anirban@42",
    "host":     "localhost",
    "port":     5432,
}

_pool: pool.SimpleConnectionPool | None = None


def get_pool() -> pool.SimpleConnectionPool:
    """
    Lazy-init and return the connection pool (1–10 connections).
    Supports:
      1. DATABASE_URL environment variable (Render, Supabase, Neon, Railway)
      2. Individual PG* environment variables
      3. Local default parameters
    """
    global _pool
    if _pool is None or _pool.closed:
        db_url = os.getenv("DATABASE_URL")
        if db_url:
            # Handle SQLAlchemy-style prefix if present
            if db_url.startswith("postgres://"):
                db_url = db_url.replace("postgres://", "postgresql://", 1)
            
            # Cloud providers (Render, Neon, Supabase) require SSL
            sslmode = os.getenv("PGSSLMODE", "require")
            _pool = pool.SimpleConnectionPool(1, 10, dsn=db_url, sslmode=sslmode)
        else:
            config = {
                "dbname":   os.getenv("PGDATABASE", _LOCAL_DB_CONFIG["dbname"]),
                "user":     os.getenv("PGUSER",     _LOCAL_DB_CONFIG["user"]),
                "password": os.getenv("PGPASSWORD", _LOCAL_DB_CONFIG["password"]),
                "host":     os.getenv("PGHOST",     _LOCAL_DB_CONFIG["host"]),
                "port":     int(os.getenv("PGPORT", _LOCAL_DB_CONFIG["port"])),
            }
            _pool = pool.SimpleConnectionPool(1, 10, **config)
    return _pool


@contextmanager
def get_cursor(
    commit: bool = True,
) -> Generator[extras.RealDictCursor, None, None]:
    """Context manager that yields a RealDictCursor."""
    p = get_pool()
    conn = p.getconn()
    try:
        with conn.cursor(cursor_factory=extras.RealDictCursor) as cur:
            yield cur
            if commit:
                conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        p.putconn(conn)
