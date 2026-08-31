/**
 * start.js — Launcher script for Gita-NeuroSync React + Node.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverDir = path.join(__dirname, 'server');
const clientDir = path.join(__dirname, 'client');

console.log('🚀 Starting Gita-NeuroSync...\n');

// Start backend
const serverProcess = spawn('npm', ['run', 'dev'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true,
});

// Start frontend
const clientProcess = spawn('npm', ['run', 'dev'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: true,
});

// Handle termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  serverProcess.kill('SIGINT');
  clientProcess.kill('SIGINT');
  process.exit();
});
