# Gita-NeuroSync

AI Mental Health Remediation Platform using BioAmp EEG spectral telemetry, Gaussian Naive Bayes classification, and Vedantic grounding.

## 🚀 Quick Start

### 1. Install All Dependencies
To install all required packages for both backend and frontend beforehand:
```bash
npm run install-all
```
*(Or install individually with `cd backend && npm install` and `cd frontend && npm install`)*

### 2. Start Application
To run both backend API (`http://localhost:5000`) and frontend Vite client (`http://localhost:5173`) in one command:
```bash
npm start
```

### 3. Run Automated Validation Test Suite
To run the full end-to-end test suite (44 tests covering classifiers, scoring mathematics, database persistence, and build validation):
```bash
npm test
```

## 🌐 Universal Cloud Database Configuration (.env)

To ensure that user accounts, registrations, session history, and clinical assessments are **permanently preserved** across GitHub ZIP downloads, teammate machines, and `ngrok` tunnels, configure a **Universal Cloud PostgreSQL Database** (such as a free instant serverless database from [Neon.tech](https://neon.tech), [Supabase](https://supabase.com), or [Render](https://render.com)).

### Environment Variables Template (`backend/.env.example`)

Copy `backend/.env.example` to `backend/.env` (or project root `.env`):

```env
# ==============================================================================
# Gita-NeuroSync Environment Configuration Template
# Copy this file to .env in backend/ (or root) and fill in your values
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. DATABASE CONFIGURATION (Universal Cloud PostgreSQL vs Local SQLite)
# ------------------------------------------------------------------------------
# Paste your free cloud PostgreSQL connection URL below.
# (When provided, all collaborators and ngrok tunnels share the exact same persistent data)
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-example-123456.us-east-2.aws.neon.tech/gita_neurosync?sslmode=require

# (Optional: If DATABASE_URL is left empty, the server automatically falls back
#  to local SQLite at backend/data/gita_neurosync.sqlite for offline work)
# DATABASE_PATH=./data/gita_neurosync.sqlite

# ------------------------------------------------------------------------------
# 2. SERVER & SECURITY
# ------------------------------------------------------------------------------
PORT=5000
JWT_SECRET=neurosync_super_secret_jwt_key_2026_change_in_production

# ------------------------------------------------------------------------------
# 3. EMAIL OTP SERVICE (Optional - for sending live verification emails)
# ------------------------------------------------------------------------------
# If omitted or unconfigured, default bypass OTPs ('000000' or '999999') will work.
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Gita-NeuroSync Clinical Portal" <your-email@gmail.com>
```

---

## 📁 Architecture Overview
- **`backend/`**: Express API server, Universal Cloud PostgreSQL Pool (with automatic SQLite fallback), ML classifier models, authentication (bcrypt + JWT), and OTP email service.
- **`frontend/`**: React 19 + Vite dashboard, live BioAmp sensor telemetry analysis, cognitive self-assessment, session history inspector, and PDF clinical report exporter.
- **`hardware/`**: Arduino sketch for BioAmp EXG sensor streaming.
- **`requirements.txt`**: Complete dependency manifest for backend and frontend.

