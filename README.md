# Gita-NeuroSync — Biosignal Telemetry & Cognitive Wellness Platform

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4.18+-000000?style=flat-square&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/WebSocket-Realtime-4EAA25?style=flat-square" alt="WebSocket">
  <img src="https://img.shields.io/badge/AI-Google_Gemini_LLM-4285F4?style=flat-square&logo=google&logoColor=white" alt="Gemini">
  <img src="https://img.shields.io/badge/Database-PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Hardware-ESP32_%7C_Arduino-00979D?style=flat-square&logo=arduino&logoColor=white" alt="ESP32">
  <img src="https://img.shields.io/badge/Status-Prototype_Exploration-F59E0B?style=flat-square" alt="Prototype">
  <img src="https://img.shields.io/badge/License-MIT-gray?style=flat-square" alt="License">
</p>

---

## Executive Overview

**Gita-NeuroSync** is a multi-tier IoT and intelligent web platform designed to explore the intersection of real-time biosignal telemetry, state classification, and AI-assisted cognitive reappraisal. The system connects physical or simulated biometrics (ESP32/BioAmp pulse, EEG frequency bands, skin conductance) with an interactive web dashboard, offering:

1. **Hardware-in-the-Loop Telemetry:** Streaming continuous sensor readings from ESP32/microcontroller firmware via serial bridge and WebSockets.
2. **Mental State Classification:** Evaluating telemetry variance and spectral bands to classify states into heuristic baseline clusters (**Focus**, **Stress**, **Relaxed**, **Agitated**).
3. **AI Cognitive Reappraisal:** Integrating **Google Gemini LLM** to generate contextual, philosophically grounded cognitive reframing prompts (drawing upon Vedantic resilience paradigms from the *Bhagavad Gita*).
4. **Relational Persistence:** Robust persistence layer using **Cloud PostgreSQL** (Supabase / Neon) for user account management, session tracking, and historical assessment records.

> [!WARNING]
> **Mandatory Non-Clinical Disclaimer:** Gita-NeuroSync is an undergraduate engineering and educational research prototype. It is **not** a certified medical device, diagnostic instrument, or clinical therapy application. It must not be used as a substitute for professional mental health care, psychological counseling, or clinical medical diagnosis.

---

## Hardware-to-Cloud System Architecture

The diagram below illustrates the end-to-end data pipeline from physical/simulated sensors to AI cognitive reasoning:

```mermaid
flowchart TD
    subgraph Hardware_Tier["Hardware & Ingestion Tier"]
        ESP["ESP32 / Arduino Microcontroller"] -->|"UART / Serial"| RB["Serial Bridge (reader.py)"]
        RB -->|"HTTP POST / WebSocket"| SVR["Express.js Server (Port 5000)"]
    end

    subgraph Backend_Tier["Backend Application Tier (Node.js & Express)"]
        SVR --> WS["WebSocket Broadcaster (services/websocket.js)"]
        SVR --> MC["State Classifier (models/classifier.js)"]
        SVR --> AR["Auth & OTP Engine (routes/auth.js)"]
        SVR --> LLM["Gemini LLM Orchestrator (services/llm.js)"]
    end

    subgraph Storage_Tier["Persistence Tier"]
        SVR --> PG[("PostgreSQL Database (Neon / Supabase)")]
    end

    subgraph Client_Tier["Presentation Tier (React Client & Vite)"]
        WS <-->|"Realtime Biometrics Stream"| RC["React Dashboard (Port 5173)"]
        RC <-->|"RESTful JSON APIs"| SVR
    end

    LLM <-->|"Secure HTTPS API"| GEMINI["Google Gemini Generative AI"]
```

---

## Verified REST API & WebSocket Reference

### 1. REST Endpoints
| Router | Method | Route | Description | Auth Required |
|---|---|---|---|:---:|
| **Auth** | `POST` | `/api/auth/register` | User signup with email OTP initiation | No |
| **Auth** | `POST` | `/api/auth/login` | Email/password login with JWT token issuance | No |
| **Auth** | `POST` | `/api/auth/verify-otp` | Verify 6-digit email OTP (or dev test codes) | No |
| **Auth** | `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (`Bearer`) |
| **Telemetry** | `POST` | `/api/esp32` | Ingest biosignal frame from hardware bridge | No |
| **Telemetry** | `GET` | `/api/esp32/latest` | Retrieve most recent biometric telemetry sample | No |
| **Telemetry** | `GET` | `/api/esp32/history`| Fetch sliding-window historical biometrics | Yes |
| **Classification**| `POST` | `/api/classify` | Compute cognitive state from metric vector | No |
| **LLM Reasoning**| `POST` | `/api/llm/questions`| Generate contextual reflection queries | No |
| **LLM Reasoning**| `POST` | `/api/llm/analyze` | Perform Gemini-powered philosophical cognitive reframing | No |
| **Sessions** | `POST` | `/api/sessions` | Record completed wellness assessment session | Yes |
| **Sessions** | `GET` | `/api/sessions` | Retrieve past session timeline & metrics | Yes |

### 2. WebSocket Channel
* **URL:** `ws://localhost:5000`
* **Protocol:** Streams real-time JSON packets: `{ timestamp, heartRate, gsr, focusIndex, state }` to all connected browser clients.

---

## Repository Layout

```
Mind-health/
├── README.md                          # Master project documentation
├── package.json                       # Root workspace scripts (npm run install-all, npm start)
├── test_suite.js                      # Root end-to-end test suite
├── benchmark.js                       # Performance benchmarking script
├── docs/                              # Technical documentation
│   └── INTERVIEW_PREP.md              # 15 technical interview questions & answers
├── backend/                           # Node.js Express backend
│   ├── server.js                      # Express server entrypoint & WebSocket mount
│   ├── package.json                   # Backend dependencies
│   ├── .env.example                   # Environment configuration template
│   ├── config/                        # Database configuration
│   │   ├── db.js                      # PostgreSQL connection pool
│   │   └── memoryDb.js                # In-memory test persistence
│   ├── hardware/                      # Microcontroller & serial bridge
│   │   └── reader.py                  # Python serial port reading script
│   ├── middleware/                    # Security & authentication
│   │   └── auth.js                    # JWT token extraction & verification
│   ├── models/                        # State machines & classifiers
│   │   ├── classifier.js              # State heuristics & threshold classification
│   │   └── states.js                  # Emotional & cognitive state definitions
│   ├── routes/                        # REST API routing modules
│   │   ├── auth.js                    # Authentication & OTP routes
│   │   ├── classify.js                # Classification API routes
│   │   ├── esp32.js                   # Hardware ingestion routes
│   │   ├── feedback.js                # User reflection routes
│   │   ├── llmRoutes.js               # Google Gemini LLM API routes
│   │   └── sessions.js                # Wellness session tracking routes
│   └── services/                      # Core business services
│       ├── llm.js                     # Google Gemini AI SDK client
│       ├── schema.js                  # Automated SQL table generation
│       └── websocket.js               # WebSocket client connection manager
└── frontend/                          # React client application (Vite)
    ├── package.json                   # Frontend dependencies (React, Lucide, Tailwind)
    ├── vite.config.js                 # Vite bundler configuration
    ├── index.html                     # HTML5 entrypoint
    └── src/                           # React source code
        ├── App.jsx                    # Main UI routing & layout
        ├── main.jsx                   # React DOM root
        ├── api/                       # REST client utilities (client.js)
        └── components/                # Modular UI widgets & telemetry views
```

---

## Installation & Execution Guide

### Prerequisites
* **Node.js 18+** and `npm`
* **PostgreSQL 14+** (Local or Cloud instance e.g. Neon / Supabase)
* Python 3.10+ (if running physical hardware serial bridge)

### 1. Install Dependencies
Run from project root to install all dependencies for both backend and frontend:
```bash
npm run install-all
```

### 2. Environment Configuration
Create a `.env` file inside `backend/`:
```bash
cp backend/.env.example backend/.env
```
Key variables:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
DATABASE_URL=postgresql://user:password@host:5432/gita_neurosync?sslmode=require

# Optional: Google Gemini API Key for AI Cognitive Reappraisal
GEMINI_API_KEY=your_gemini_api_key_here
LLM_ENABLED=true
```

### 3. Launch Development Stack
Run both backend (`http://localhost:5000`) and React frontend (`http://localhost:5173`) simultaneously:
```bash
npm start
```

### 4. Run Automated Test Suite
```bash
npm test
```

---

## Security, Privacy & Data Handling

1. **Authentication:** User authentication relies on JSON Web Tokens (`jsonwebtoken`) signed with a server secret. Passwords are never stored in plaintext.
2. **PostgreSQL Relational Safety:** Queries use parameterized SQL prepared statements to prevent injection attacks.
3. **Zero-Trace Health Telemetry:** Biosignal time-series data is treated as ephemeral stream data. Raw hardware waveforms are not permanently stored; only aggregate session summaries (mean heart rate, session duration, user reflection tags) are retained.

---

## Technical Interview Preparation

For deep-dive architectural trade-offs, hardware-to-cloud telemetry pipelines, and 15 source-code grounded technical interview questions, see [docs/INTERVIEW_PREP.md](docs/INTERVIEW_PREP.md).
