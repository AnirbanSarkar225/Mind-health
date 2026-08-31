/**
 * start.js — Single-command Launcher for Gita-NeuroSync React + Node.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

console.log('====================================================');
console.log('  GITA-NEUROSYNC — STARTING SERVICES');
console.log('====================================================\n');

// 1. Start Backend Express API (port 5000)
const backendProcess = spawn('npm', ['run', 'dev'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});

// 2. Start Frontend Vite App (port 5173 — opens browser once via vite.config.js)
const frontendProcess = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down Gita-NeuroSync services...');
  backendProcess.kill('SIGINT');
  frontendProcess.kill('SIGINT');
  process.exit();
});
