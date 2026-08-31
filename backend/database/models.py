"""Data access layer -- CRUD operations for all tables."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from backend.database.connection import get_cursor
from backend.database.security import hash_password, verify_password


# ==============================================================================
#  USERS
# ==============================================================================

def register_user(
    username: str,
    email: str,
    password: str,
) -> Optional[Dict[str, Any]]:
    """Create a new user (unverified). Returns user row or None if duplicate."""
    pw_hash = hash_password(password)
    try:
        with get_cursor() as cur:
            cur.execute(
                "INSERT INTO users (username, email, password_hash, email_verified) "
                "VALUES (%s, %s, %s, FALSE) "
                "RETURNING id, username, email, email_verified, created_at",
                (username, email, pw_hash),
            )
            return dict(cur.fetchone())
    except Exception:
        return None


def authenticate_user(
    username: str,
    password: str,
) -> Optional[Dict[str, Any]]:
    """Verify credentials. Returns user row or None."""
    with get_cursor(commit=False) as cur:
        cur.execute(
            "SELECT id, username, email, password_hash, email_verified, created_at "
            "FROM users WHERE username = %s",
            (username,),
        )
        row = cur.fetchone()
    if row is None:
        return None
    if not verify_password(password, row["password_hash"]):
        return None
    return {
        "id": row["id"], "username": row["username"],
        "email": row["email"], "email_verified": row["email_verified"],
        "created_at": row["created_at"],
    }


def mark_email_verified(user_id: UUID) -> None:
    """Set email_verified = TRUE for the given user."""
    with get_cursor() as cur:
        cur.execute(
            "UPDATE users SET email_verified = TRUE, updated_at = NOW() "
            "WHERE id = %s",
            (str(user_id),),
        )


def list_all_users() -> List[Dict[str, Any]]:
    """Fetch summary list of all registered users."""
    try:
        with get_cursor(commit=False) as cur:
            cur.execute(
                "SELECT id, username, email, email_verified, created_at "
                "FROM users ORDER BY created_at DESC"
            )
            return [dict(r) for r in cur.fetchall()]
    except Exception:
        return []


def delete_user_by_username(username: str) -> bool:
    """Delete a user and all their cascaded records. Returns True if deleted."""
    try:
        with get_cursor() as cur:
            cur.execute("DELETE FROM users WHERE username = %s", (username,))
            return cur.rowcount > 0
    except Exception:
        return False


def truncate_all_users() -> bool:
    """Delete all users and cascade to all session records."""
    try:
        with get_cursor() as cur:
            cur.execute("TRUNCATE users CASCADE;")
            return True
    except Exception:
        return False


# ==============================================================================
#  OTP CODES
# ==============================================================================

def store_otp(user_id: UUID, code: str, ttl_minutes: int = 10) -> None:
    """Store a new OTP code. Invalidates previous unused codes."""
    with get_cursor() as cur:
        cur.execute(
            "UPDATE otp_codes SET used = TRUE "
            "WHERE user_id = %s AND used = FALSE",
            (str(user_id),),
        )
        expires = datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes)
        cur.execute(
            "INSERT INTO otp_codes (user_id, code, expires_at) "
            "VALUES (%s, %s, %s)",
            (str(user_id), code, expires),
        )


def verify_otp(user_id: UUID, code: str) -> bool:
    """Check if the OTP is valid and not expired. Marks as used if valid."""
    with get_cursor() as cur:
        cur.execute(
            "SELECT id FROM otp_codes "
            "WHERE user_id = %s AND code = %s AND used = FALSE "
            "AND expires_at > NOW() "
            "ORDER BY created_at DESC LIMIT 1",
            (str(user_id), code),
        )
        row = cur.fetchone()
        if row is None:
            return False
        cur.execute(
            "UPDATE otp_codes SET used = TRUE WHERE id = %s",
            (row["id"],),
        )
        return True


# ==============================================================================
#  SESSIONS
# ==============================================================================

def save_session(
    user_id: UUID,
    bpm: float, hrv: float, attention: float, meditation: float,
    alpha: float, beta: float, theta: float, ba_ratio: float,
    state: str, method: str, confidence: float,
) -> UUID:
    """Insert a biosignal reading session. Returns session UUID."""
    with get_cursor() as cur:
        cur.execute(
            "INSERT INTO sessions "
            "(user_id, bpm, hrv_sdnn, eeg_attention, eeg_meditation, "
            " alpha_power, beta_power, theta_power, beta_alpha_ratio, "
            " detected_state, classifier_method, confidence) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (str(user_id), bpm, hrv, attention, meditation,
             alpha, beta, theta, ba_ratio, state, method, confidence),
        )
        return cur.fetchone()["id"]


def get_user_sessions(
    user_id: UUID,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """Fetch recent sessions for a user."""
    with get_cursor(commit=False) as cur:
        cur.execute(
            "SELECT * FROM sessions WHERE user_id = %s "
            "ORDER BY created_at DESC LIMIT %s",
            (str(user_id), limit),
        )
        return [dict(r) for r in cur.fetchall()]


def get_user_stats(user_id: UUID) -> Dict[str, Any]:
    """Fetch aggregated activity stats for a user's profile page."""
    stats: Dict[str, Any] = {
        "total_sessions": 0,
        "last_session_at": None,
        "most_frequent_state": "N/A",
        "avg_bpm": 0.0,
        "avg_meditation": 0.0,
        "avg_confidence": 0.0,
        "total_feedback": 0,
    }
    try:
        with get_cursor(commit=False) as cur:
            # Core session stats
            cur.execute(
                "SELECT COUNT(*) AS cnt, "
                "MAX(created_at) AS last_at, "
                "AVG(bpm) AS avg_bpm, "
                "AVG(eeg_meditation) AS avg_med, "
                "AVG(confidence) AS avg_conf "
                "FROM sessions WHERE user_id = %s",
                (str(user_id),),
            )
            row = cur.fetchone()
            if row and row["cnt"]:
                stats["total_sessions"] = row["cnt"]
                stats["last_session_at"] = row["last_at"]
                stats["avg_bpm"] = float(row["avg_bpm"] or 0)
                stats["avg_meditation"] = float(row["avg_med"] or 0)
                stats["avg_confidence"] = float(row["avg_conf"] or 0)

            # Most frequent detected state
            cur.execute(
                "SELECT detected_state, COUNT(*) AS cnt "
                "FROM sessions WHERE user_id = %s "
                "GROUP BY detected_state ORDER BY cnt DESC LIMIT 1",
                (str(user_id),),
            )
            state_row = cur.fetchone()
            if state_row:
                stats["most_frequent_state"] = state_row["detected_state"]

            # Total feedback count
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM feedback WHERE user_id = %s",
                (str(user_id),),
            )
            fb_row = cur.fetchone()
            if fb_row:
                stats["total_feedback"] = fb_row["cnt"]
    except Exception:
        pass
    return stats

# ==============================================================================
#  PROBLEMS
# ==============================================================================

def save_problem(
    user_id: UUID,
    session_id: UUID,
    description: str,
    symptoms: List[str],
    discomfort_level: int,
) -> UUID:
    """Save a user-reported problem. Returns problem UUID."""
    with get_cursor() as cur:
        cur.execute(
            "INSERT INTO problems "
            "(user_id, session_id, description, symptoms, discomfort_level) "
            "VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (str(user_id), str(session_id), description, symptoms,
             discomfort_level),
        )
        return cur.fetchone()["id"]


# ==============================================================================
#  FEEDBACK
# ==============================================================================

def save_feedback(
    user_id: UUID,
    session_id: UUID,
    confirmed_state: str,
    discomfort_level: int,
    notes: str = "",
) -> UUID:
    """Save an ML check-in confirmation. Returns feedback UUID."""
    with get_cursor() as cur:
        cur.execute(
            "INSERT INTO feedback "
            "(user_id, session_id, confirmed_state, discomfort_level, notes) "
            "VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (str(user_id), str(session_id), confirmed_state,
             discomfort_level, notes),
        )
        return cur.fetchone()["id"]
