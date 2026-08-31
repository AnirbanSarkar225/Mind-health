"""
================================================================
  GITA-NEUROSYNC -- ONE-CLICK PROJECT LAUNCHER
  python start.py
================================================================

This script:
  1. Checks Python version
  2. Installs all pip dependencies from requirements.txt
  3. Verifies PostgreSQL is running
  4. Creates the 'gita_neurosync' database if it doesn't exist
  5. Creates all tables (idempotent)
  6. Launches the Streamlit dashboard
"""

import subprocess
import sys
import os
import shutil
import urllib.request
import zipfile
import time
import socket

# -- Project root = directory where this script lives -------------------------
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

# -- PostgreSQL config (must match database/connection.py) --------------------
PG_USER     = "postgres"
PG_PASSWORD = "Anirban@42"
PG_HOST     = "localhost"
PG_PORT     = "5432"
PG_DBNAME   = "gita_neurosync"


def header(msg: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {msg}")
    print(f"{'=' * 60}")


def run(cmd: list[str], check: bool = True, **kwargs) -> subprocess.CompletedProcess:
    """Run a subprocess with visible output."""
    return subprocess.run(cmd, check=check, **kwargs)


# ==============================================================================
#  STEP 1 — Python version check
# ==============================================================================

header("STEP 1/5 — Checking Python version")
v = sys.version_info
print(f"  Python {v.major}.{v.minor}.{v.micro}")
if v < (3, 9):
    print("  [FAIL] Python 3.9+ is required.")
    sys.exit(1)
print("  [OK] OK")


# ==============================================================================
#  STEP 2 — Install dependencies
# ==============================================================================

header("STEP 2/5 — Installing dependencies")
req_file = os.path.join(ROOT, "requirements.txt")
if not os.path.exists(req_file):
    print(f"  [FAIL] requirements.txt not found at {req_file}")
    sys.exit(1)

run([sys.executable, "-m", "pip", "install", "-r", req_file, "--quiet"])
print("  [OK] All dependencies installed")


# ==============================================================================
#  STEP 3 & 4 — Check PostgreSQL & Create Database
# ==============================================================================

header("STEP 3 & 4 — PostgreSQL Setup")

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("  [FAIL] psycopg2 not installed. Did step 2 fail?")
    sys.exit(1)

def is_postgres_running():
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT,
            connect_timeout=2
        )
        conn.close()
        return True
    except Exception:
        return False

def setup_and_start_portable_postgres():
    pg_dir = os.path.join(ROOT, "pgsql")
    pg_bin_dir = os.path.join(pg_dir, "bin")
    pg_ctl = os.path.join(pg_bin_dir, "pg_ctl.exe")
    initdb = os.path.join(pg_bin_dir, "initdb.exe")
    pg_data = os.path.join(ROOT, "pg_data")
    
    if not os.path.exists(pg_ctl):
        print("  [WARN] PostgreSQL not found/running locally. Setting up portable instance...")
        zip_path = os.path.join(ROOT, "pg.zip")
        url = "https://get.enterprisedb.com/postgresql/postgresql-16.2-1-windows-x64-binaries.zip"
        if not os.path.exists(zip_path):
            print("  [INFO] Downloading portable PostgreSQL (approx 350MB, please wait)...")
            urllib.request.urlretrieve(url, zip_path)
            print("  [INFO] Download complete.")
        
        print("  [INFO] Extracting PostgreSQL...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(ROOT)
        
        if not os.path.exists(pg_data):
            print("  [INFO] Initializing database cluster...")
            pw_file = os.path.join(ROOT, "pg_pw.txt")
            with open(pw_file, "w") as f:
                f.write(PG_PASSWORD)
            
            subprocess.run([initdb, "-D", pg_data, "-U", PG_USER, "--pwfile=" + pw_file, "--auth=md5"])
            os.remove(pw_file)
            
    print("  [INFO] Starting portable PostgreSQL server...")
    log_file = os.path.join(ROOT, "pg_log.txt")
    subprocess.run([pg_ctl, "-D", pg_data, "-l", log_file, "start"], check=False)
    
    # Wait for startup
    print("  [INFO] Waiting for PostgreSQL to be ready...")
    for _ in range(15):
        if is_postgres_running():
            return
        time.sleep(1)
    
    print("  [FAIL] Could not start portable PostgreSQL. Check pg_log.txt")
    sys.exit(1)

if not is_postgres_running():
    setup_and_start_portable_postgres()
else:
    print(f"  [OK] PostgreSQL accepting connections at {PG_HOST}:{PG_PORT}")

print("  [INFO] Checking 'gita_neurosync' database...")
try:
    conn = psycopg2.connect(
        dbname="postgres",
        user=PG_USER,
        password=PG_PASSWORD,
        host=PG_HOST,
        port=PG_PORT,
    )
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute(
        "SELECT 1 FROM pg_database WHERE datname = %s",
        (PG_DBNAME,),
    )
    exists = cur.fetchone()

    if exists:
        print(f"  [OK] Database '{PG_DBNAME}' already exists")
    else:
        cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(PG_DBNAME)))
        print(f"  [OK] Database '{PG_DBNAME}' created")

    cur.close()
    conn.close()
except Exception as e:
    print(f"  [FAIL] Failed to setup database '{PG_DBNAME}': {e}")
    sys.exit(1)


# ==============================================================================
#  STEP 5 — Create tables
# ==============================================================================

header("STEP 5/5 — Creating tables")

try:
    # Add project root to path so our modules can be imported
    sys.path.insert(0, ROOT)
    from backend.database.schema import create_tables
    create_tables()
    print("  [OK] All tables ready (users, sessions, problems, feedback)")
except Exception as e:
    print(f"  [FAIL] Table creation failed: {e}")
    sys.exit(1)


# ==============================================================================
#  LAUNCH
# ==============================================================================

header("LAUNCHING GITA-NEUROSYNC")

# Find a free port starting from 8501
def find_free_port(start: int = 8501, end: int = 8520) -> int:
    for port in range(start, end):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("localhost", port)) != 0:
                return port
    return start  # fallback

port = find_free_port()
print(f"  Starting Streamlit server...")
print(f"  Dashboard will open at: http://localhost:{port}")
print(f"  Press Ctrl+C to stop\n")

try:
    import pathlib
    streamlit_dir = pathlib.Path.home() / ".streamlit"
    streamlit_dir.mkdir(parents=True, exist_ok=True)
    cred_file = streamlit_dir / "credentials.toml"
    if not cred_file.exists():
        cred_file.write_text('[general]\nemail = ""\n')
except Exception as e:
    pass

try:
    subprocess.run([
        sys.executable, "-m", "streamlit", "run", "frontend/app.py",
        "--server.port", str(port),
        "--browser.gatherUsageStats", "false",
    ])
except KeyboardInterrupt:
    print("\n  Server stopped. Goodbye.")
