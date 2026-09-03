import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

console.log('\n========================================');
console.log(' Starting Gita-NeuroSync Services...');
console.log(' Connecting to Supabase Cloud PostgreSQL');
console.log('========================================\n');

// Clean up any stale processes from previous runs on ports 5000 and 5173
if (process.platform === 'win32') {
  try {
    execSync('powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"', { stdio: 'ignore' });
  } catch {}
}

function waitForBackend(port = 5000, timeoutMs = 20000) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - startTime > timeoutMs) {
          resolve(false);
        } else {
          setTimeout(check, 250);
        }
      });
      req.setTimeout(1000, () => {
        req.destroy();
      });
    };
    check();
  });
}

// Backend: run server.js directly with node
const backendProcess = spawn('node', ['server.js'], {
  cwd: backendDir,
  stdio: 'inherit',
});

backendProcess.on('error', (err) => {
  console.error('[BACKEND ERROR] Failed to start backend process:', err.message);
});

backendProcess.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`[BACKEND EXIT] Backend process exited with code ${code}`);
  }
});

// Wait for backend to be listening before launching Vite
await waitForBackend(5000, 20000);

// Frontend: run vite's JS entry point directly with node (cross-platform, no shell needed)
const viteEntry = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');
const frontendProcess = spawn('node', [viteEntry, '--host'], {
  cwd: frontendDir,
  stdio: 'inherit',
});

frontendProcess.on('error', (err) => {
  console.error('[FRONTEND ERROR] Failed to start frontend process:', err.message);
});

frontendProcess.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`[FRONTEND EXIT] Frontend process exited with code ${code}`);
  }
});

process.on('SIGINT', () => {
  console.log('\nShutting down Gita-NeuroSync services...');
  try { backendProcess.kill('SIGINT'); } catch {}
  try { frontendProcess.kill('SIGINT'); } catch {}
  process.exit();
});
