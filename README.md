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

## 📁 Architecture Overview
- **`backend/`**: Express API server, SQLite persistent database (`backend/data/`), ML classifier models, authentication (bcrypt + JWT), and OTP email service.
- **`frontend/`**: React 19 + Vite dashboard, live BioAmp sensor telemetry analysis, cognitive self-assessment, session history inspector, and PDF clinical report exporter.
- **`hardware/`**: Arduino sketch for BioAmp EXG sensor streaming.
- **`requirements.txt`**: Complete dependency manifest for backend and frontend.
