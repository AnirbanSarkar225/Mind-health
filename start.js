/**
 * start.js — Launcher script for Gita-NeuroSync React (Frontend) + Node.js (Backend)
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

console.log('Starting Gita-NeuroSync...\n');

// Start backend (Express API on port 5000)
const backendProcess = spawn('npm', ['run', 'dev'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});

// Start frontend (Vite React on port 5173)
const frontendProcess = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
});

// Handle termination
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  backendProcess.kill('SIGINT');
  frontendProcess.kill('SIGINT');
  process.exit();
});
