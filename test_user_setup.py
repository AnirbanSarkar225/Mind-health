#!/usr/bin/env python3
"""Setup test user for development/testing."""

import sys
import bcrypt
from backend.database.connection import get_cursor

# Test user details
TEST_USERNAME = "testuser"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpass123"

# Hash the password
password_hash = bcrypt.hashpw(TEST_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# Insert into database
try:
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO users (username, email, password_hash, email_verified)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (username) DO UPDATE SET 
                email_verified = EXCLUDED.email_verified,
                password_hash = EXCLUDED.password_hash
            RETURNING id, username, email, email_verified;
        """, (TEST_USERNAME, TEST_EMAIL, password_hash, True))
        result = cur.fetchone()
        if result:
            print(f"[OK] Test user created/updated:")
            print(f"  ID: {result['id']}")
            print(f"  Username: {result['username']}")
            print(f"  Email: {result['email']}")
            print(f"  Email Verified: {result['email_verified']}")
            print(f"\nYou can now log in with:")
            print(f"  Username: {TEST_USERNAME}")
            print(f"  Password: {TEST_PASSWORD}")
        else:
            print("[FAIL] No result returned from query")
            sys.exit(1)
except Exception as e:
    print(f"[FAIL] Error creating test user: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
