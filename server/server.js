/**
 * Gita-NeuroSync — Express API Server
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { createTables } from './services/schema.js';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import feedbackRoutes from './routes/feedback.js';
import classifyRoutes from './routes/classify.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000');

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/classify', classifyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '4.0.0', engine: 'Node.js/Express' });
});

// Start
async function start() {
  try {
    console.log('\n  [INFO] Creating database tables...');
    await createTables();

    app.listen(PORT, () => {
      console.log(`\n  ✓ Gita-NeuroSync API running on http://localhost:${PORT}`);
      console.log(`  ✓ Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (e) {
    console.error('  [FAIL] Server startup failed:', e.message);
    process.exit(1);
  }
}

start();
