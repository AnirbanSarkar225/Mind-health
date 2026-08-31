"""Password hashing and verification via bcrypt."""

from __future__ import annotations

import bcrypt

_ROUNDS = 10  # Optimized work factor for responsive cloud deployments


def hash_password(plain: str) -> str:
    """Return a bcrypt hash string for the given plaintext password."""
    salt = bcrypt.gensalt(rounds=_ROUNDS)
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Check a plaintext password against a stored bcrypt hash."""
    return bcrypt.checkpw(
        plain.encode("utf-8"),
        hashed.encode("utf-8"),
    )
