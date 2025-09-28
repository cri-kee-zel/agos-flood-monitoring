# AGOS Developer Guide

Purpose: Help you learn the codebase quickly, understand how the pieces fit together, run the project locally, and safely make changes for deployment.

Last updated: September 27, 2025

---

## 1. High-level architecture

- Server: `server.js` (Express + WebSocket). Provides HTTP API endpoints and a WebSocket server for real-time data.
- Frontend modules: `main/`, `module_1/` ... `module_4/` (client HTML/CSS/JS for UI components).
- Distribution: `public/` (build/copy output used for deployment; contains copies of the frontend folders).
- Dependencies: declared in `package.json` (Express, ws, helmet, cors, morgan, sqlite3, bcrypt, jsonwebtoken, nodemailer).
- Data storage: SQLite3 (local file) is included as a dependency; check `server.js` for the exact path used.
- Environment: `.env.example` contains runtime variables (PORT, DB settings, keys).

---

## 2. How the runtime flows

1. Start server: `npm start` runs `node server.js`.
2. Express serves static files from `public/` and also mounts `/main` and `/module_*` folders directly.
3. API endpoints (examples):
   - `GET /api/health` - health check
   - `GET /api/sensor-data` - current sensor readings
   - `GET /api/system-overview` - aggregated system stats
   - `GET /api/historical-data` - historical data
   - `GET /api/flood-events` - recent flood events
4. WebSocket: `server.js` creates an HTTP server and attaches `ws` WebSocket server. Clients connect and receive real-time sensor updates. The server also accepts messages for commands (e.g., emergency alerts or Arduino commands).
5. Arduino integration: the server accepts commands or data from an Arduino via a serial port (configurable via environment variable like `ARDUINO_PORT`). In many projects the Arduino either posts data to the server HTTP API or the server reads from a serial port and broadcasts via WebSocket. Look for code in `server.js` around serial or `handleArduinoCommand`.

---

## 3. Running locally (recommended minimal steps)

1. Verify Node:
   - `node -v` (>= 16)
   - `npm -v` (>= 8)
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Create `.env` from template and edit as needed:
   ```powershell
   Copy-Item .env.example .env -Force
   notepad .env
   ```
   - At minimum set `PORT` and any database or mail config you will use.
4. (Optional) Regenerate `public/` if you want a single distribution root. You already have `public/` in this repo; to refresh it run:
   ```powershell
   Remove-Item -Recurse -Force .\public\*
   Copy-Item -Recurse -Force .\main .\public\
   Copy-Item -Recurse -Force .\module_1 .\public\
   Copy-Item -Recurse -Force .\module_2 .\public\
   Copy-Item -Recurse -Force .\module_3 .\public\
   Copy-Item -Recurse -Force .\module_4 .\public\
   ```
5. Start server:
   ```powershell
   npm start
   ```
6. Open browser: http://localhost:3000 (or the `PORT` you set)
7. Health check:
   ```powershell
   Invoke-WebRequest http://localhost:3000/api/health -UseBasicParsing | Select-Object StatusCode, Content
   ```

---

## 4. Key files to study (read in this order)

1. `server.js` - main entry point. Look for:
   - Middleware setup (helmet, cors, morgan)
   - Static file serving lines and routing
   - API endpoints and helper functions (historical/flood events generators)
   - WebSocket `wss.on('connection', ...)` logic
   - `handleEmergencyAlert` and `handleArduinoCommand` helper functions
2. `main/main-script.js` - frontend logic for dashboard and WebSocket client usage
3. `public/` (or `main/` and `module_*`) - static HTML/JS/CSS for UI
4. `package.json` - scripts and dependencies
5. `PROJECT_CLEANUP_DOCUMENTATION.md` - explanation of the cleanup steps you performed

---

## 5. How real-time (WebSocket) communication works — quick walkthrough

- Server side (`server.js`):

  - A WebSocket server (`ws`) is created and attached to the HTTP server.
  - On a new connection the server might:
    - send initial snapshot data to the client
    - register message handlers to process commands from clients
    - broadcast periodic updates (sensor readings) to all connected clients
  - To broadcast: the server iterates over `wss.clients` and calls `client.send(JSON.stringify(payload))` for active clients.

- Client side (`main/main-script.js`):
  - Connect to ws: `const ws = new WebSocket(wsUrl)`
  - On message: `ws.onmessage = (evt) => { const data = JSON.parse(evt.data); updateUI(data); }`
  - The client may also send commands to the server over ws (e.g., acknowledge alerts or request historical data).

Why WebSocket? It's low-latency and keeps an open connection for frequent updates (sensors often update many times a minute).

---

## 6. Arduino integration patterns — where to look and how to emulate

Pattern A: Arduino pushes to server (HTTP)

- Arduino (or an ESP board) can send HTTP POST requests with JSON sensor data to `/api/sensor-data` (or a custom endpoint). The server receives, stores, and broadcasts via WebSocket.

Pattern B: Server reads serial port

- Server opens a serial port (e.g., `/dev/ttyUSB0` or `COM3`) and reads incoming lines. Each line is parsed and processed similarly to POSTed data. If you don't see serial code in `server.js`, the project may expect Arduino to POST data instead.

How to emulate Arduino locally

- Use `curl` or a small Python/Node script to POST JSON data to `/api/sensor-data`.
- Example (PowerShell):
  ```powershell
  $json = '{"sensorId":"S1","waterLevel":42.1}'
  Invoke-RestMethod -Uri http://localhost:3000/api/sensor-data -Method Post -Body $json -ContentType 'application/json'
  ```

---

## 7. Debugging tips

- Logs: `morgan` logs to stdout. Start server in terminal and watch logs.
- Inspect WebSocket traffic: open browser DevTools > Network > WS to view messages.
- Use Postman or `Invoke-RestMethod` to test endpoints.
- If native modules fail during `npm install` (e.g., `sqlite3` or `bcrypt`) on Windows, consider using WSL or installing build tools: `windows-build-tools` or use prebuilt binary packages.
- File permission errors (SQLite): ensure the directory is writable and not read-only.

---

## 8. Safe ways to experiment

- Create a new branch in Git before making large changes.
- Add console logs rather than removing code immediately.
- Run `npm run dev` (nodemon) to auto-restart on changes.
- Write small unit tests for API endpoints and functions before refactors.

---

## 9. Suggested learning path (step-by-step exercises)

1. Start the app and hit `/api/health` (confirm server runs).
2. Open `main/main-script.js` and find the WebSocket connection code; add a `console.log` to see messages.
3. Emulate sensor POSTs (see "How to emulate Arduino") and watch the UI update.
4. Read `server.js` WebSocket `connection` handler and add a new simple command type (e.g., `ping`) and respond with `pong`.
5. Add a new endpoint `/api/debug` that returns the number of connected WebSocket clients.
6. (Optional) Add a small test using a test framework (Jest) for the new endpoint.

---

## 10. If you'd like, I can (pick one or more):

- Add inline explanatory comments to `server.js` and `main/main-script.js`.
- Create a cross-platform `scripts/copy-assets.js` and add `npm run build` to `package.json`.
- Run the app here and show the `/api/health` output and initial logs.
- Implement the `ping` WebSocket command and add a small test endpoint for connected clients.

Tell me which you'd like me to do now and I will take the action and report back with results.
