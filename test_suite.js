import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testProc = spawn('node', ['test_suite.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
});

testProc.on('close', (code) => {
  process.exit(code || 0);
});
