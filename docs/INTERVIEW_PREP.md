# Gita-NeuroSync — Technical Interview Preparation Guide

This guide is prepared for technical interviewers, engineering hiring managers, and candidates to evaluate the full-stack architecture, IoT hardware integration, and AI engineering implemented in **Gita-NeuroSync**.

---

## 1. Architectural Summary & Scope

* **Primary Purpose:** Exploration platform connecting hardware biosignal telemetry (ESP32/sensors) with real-time mental state classification and AI-assisted cognitive reappraisal using Google Gemini.
* **Technology Stack:** React 18 (Vite), Node.js, Express, WebSockets (`ws`), PostgreSQL (`pg`) with automatic in-memory persistence fallback (`memoryDb.js`), Google Gemini Generative AI SDK, Python serial bridge (`reader.py`), ESP32 C++ firmware.
* **Critical System Boundary:** Prototype educational and wellness platform; strictly non-diagnostic and non-clinical.

---

## 2. 15 Technical Interview Questions & Grounded Answers

### Q1: How does the system handle real-time biosignal telemetry ingestion from hardware without blocking HTTP requests?
**Answer:** The architecture separates the continuous high-frequency telemetry stream from standard CRUD operations. Hardware sensor readings (from ESP32 over serial or WiFi) are ingested via dedicated lightweight endpoints (`POST /api/esp32`) and immediately broadcast to connected clients through a persistent WebSocket server (`ws://localhost:5000`). This avoids polling latency and isolates streaming telemetry from database I/O.

### Q2: How does the dual-mode database architecture (`db.js` vs `memoryDb.js`) work?
**Answer:** In `config/db.js`, the server checks whether `DATABASE_URL` is set in the environment and executes a validation probe via `checkConnection()`. If a PostgreSQL URL is detected and reachable, queries route through the `pg.Pool` client. If unconfigured or unreachable, `isPostgresMode()` returns false, and the application seamlessly switches to `memoryDb.js`, an in-memory dictionary-backed store supporting users, sessions, and OTP codes. This ensures that teammates or evaluators can run the repo instantly with zero setup.

### Q3: How is Google Gemini integrated into the cognitive reappraisal workflow?
**Answer:** In `services/llm.js` and `routes/llmRoutes.js`, when a user completes an assessment or when a stress state is detected, the backend constructs structured prompts containing the user's current physiological metrics (heart rate, focus index) and self-reported concerns. The prompt instructs the Gemini model to respond using cognitive reframing techniques inspired by Stoic and Vedantic philosophy (focusing on controllable actions versus external outcomes, equanimity under pressure).

### Q4: How does `models/classifier.js` determine the user's mental state?
**Answer:** The classification algorithm evaluates a composite vector consisting of normalized heart rate variability, skin conductance response (GSR), and band ratios. Threshold boundaries delineate four quadrant states:
* High arousal + high focus &rarr; **Focus / Flow**
* High arousal + low stability &rarr; **Stress / Acute Anxiety**
* Low arousal + high stability &rarr; **Relaxed / Meditative**
* Low arousal + erratic volatility &rarr; **Agitated / Fatigued**

### Q5: How do you handle hardware disconnects or serial transmission dropouts?
**Answer:** In `backend/hardware/reader.py`, the Python serial loop uses `try/except serial.SerialException` with auto-reconnection backoff logic. If the physical ESP32 is unplugged, the script logs the disconnect, enters a polling retry loop every 2 seconds, and transmits a synthetic baseline mock packet so the frontend dashboard does not enter an unrendered freeze state.

### Q6: What security measures protect user accounts and sensitive session history?
**Answer:**
1. Passwords are encrypted before storage.
2. User authentication issues signed JSON Web Tokens (JWT) with configurable expiration (`JWT_SECRET`).
3. Private routes (`/api/sessions`, `/api/auth/me`) require the `auth.js` middleware, which validates `req.headers.authorization`.
4. Sensitive biosignal streaming is kept ephemeral; only high-level summary metrics are persisted.

### Q7: Why is it crucial to clearly label this platform as "non-clinical"?
**Answer:** Software claiming to diagnose, monitor, or treat medical conditions (such as clinical depression or generalized anxiety disorder) falls under strict regulatory oversight (FDA SaMD in the US, CE-mark MDR in Europe, HIPAA privacy mandates). Gita-NeuroSync is an exploratory engineering prototype. Stating non-clinical boundaries upfront demonstrates regulatory awareness, professional engineering ethics, and intellectual honesty.

### Q8: How does the email OTP verification mechanism work during user registration?
**Answer:** During registration (`/api/auth/register`), a random 6-digit cryptographic OTP is generated with a 10-minute expiration timestamp and stored in the database. If SMTP credentials or Resend API keys are provided in `.env`, an email is dispatched. For local development environments, the OTP is printed directly to the backend terminal log, and universal testing bypass codes (`000000`, `123456`, `999999`) are supported to prevent blocked developer workflows.

### Q9: How is the React frontend organized to maintain high frame-rate chart rendering?
**Answer:** The React dashboard uses Vite for rapid bundling. The live telemetry chart isolates state updates to a dedicated canvas/SVG subcomponent. Instead of re-rendering the entire page on every incoming WebSocket packet, incoming telemetry points are pushed into a bounded ring buffer (retaining the last 60 seconds of data), keeping DOM operations decoupled from application-level state.

### Q10: How do you prevent Gemini LLM responses from taking too long and degrading the user experience?
**Answer:** Calls to `/api/llm/analyze` are asynchronous and non-blocking. The frontend renders immediate heuristic feedback and telemetry stats first while displaying a subtle shimmer/loading indicator for the AI analysis. The server sets a strict 8-second timeout on the LLM API call; if exceeded, it falls back to a curated library of static reflection passages.

### Q11: What is the purpose of `benchmark.js` in the repository?
**Answer:** `benchmark.js` measures the latency and throughput of the classification algorithms and in-memory persistence layer. It executes 1,000 synthetic biometric classifications in a loop to ensure that state calculation executes in under 2ms per frame, ensuring that the Node.js event loop remains responsive under continuous streaming.

### Q12: How are CORS headers configured across the backend?
**Answer:** `server.js` applies Express `cors` middleware, permitting both local development ports (`http://localhost:5173` for Vite, `http://localhost:3000`) and deployment origins. It permits standard `GET`, `POST`, `PUT`, `DELETE` methods and explicitly authorizes `Content-Type` and `Authorization` headers.

### Q13: If an attacker intercepts the WebSocket stream, what data is at risk?
**Answer:** The WebSocket connection transmits timestamped relative numerical values (heart rate integer, normalized galvanic skin resistance float, classification label string). It transmits no personally identifiable information (PII), no passwords, and no medical identity records, minimizing the impact of passive eavesdropping.

### Q14: How does `services/schema.js` ensure database table readiness?
**Answer:** When starting up with an external PostgreSQL database, `createTables()` executes idempotent DDL statements (`CREATE TABLE IF NOT EXISTS users ...`, `CREATE TABLE IF NOT EXISTS sessions ...`). This eliminates the need for manual SQL migrations when deploying to fresh cloud database instances like Neon or Supabase.

### Q15: What would be the next engineering milestone for this project?
**Answer:**
1. Upgrading WebSocket connections to authenticated WSS (WebSocket Secure) with token verification in the handshake.
2. Migrating from heuristic threshold classification to an embedded lightweight TensorFlow.js / ONNX model trained on open EEG datasets (e.g. DEAP or DREAMER).
3. Implementing BLE (Bluetooth Low Energy) Web Bluetooth API directly in the browser to eliminate the need for the intermediate Python serial bridge.
