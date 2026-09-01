import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { checkConnection } from './config/db.js';
import { createTables } from './services/schema.js';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import feedbackRoutes from './routes/feedback.js';
import classifyRoutes from './routes/classify.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000');

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'x-requested-with', 'Accept'],
}));
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/classify', classifyRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '4.0.0',
    engine: 'Node.js/Express',
    database: 'Supabase PostgreSQL Cloud',
  });
});

async function start() {
<<<<<<< HEAD
  try {
    console.log('\n  [INFO] Checking and monitoring Supabase PostgreSQL connection...');
=======
  // 1. Immediately bind and listen on PORT so frontend proxy never receives 502 Bad Gateway
  app.listen(PORT, () => {
    console.log(`\n  ✓ Gita-NeuroSync API running on http://localhost:${PORT}`);
    console.log(`  ✓ Health check: http://localhost:${PORT}/api/health`);
    console.log(`  ✓ Monitoring Supabase Cloud PostgreSQL on startup & reconnect...\n`);
  });

  // 2. Perform Supabase connection check and table synchronization asynchronously
  try {
    console.log('  [INFO] Checking and monitoring Supabase PostgreSQL connection...');
>>>>>>> origin/main
    await checkConnection(5, 2000);

    console.log('  [INFO] Synchronizing Supabase database tables & RLS security policies...');
    await createTables();
<<<<<<< HEAD

    app.listen(PORT, () => {
      console.log(`\n  ✓ Gita-NeuroSync API running on http://localhost:${PORT}`);
      console.log(`  ✓ Health check: http://localhost:${PORT}/api/health`);
      console.log(`  ✓ Supabase Cloud PostgreSQL Active & Monitored\n`);
    });
  } catch (e) {
    console.error('  [FAIL] Server startup failed:', e.message);
    process.exit(1);
=======
    console.log('  ✓ Supabase Cloud PostgreSQL Schema & RLS Synchronized.\n');
  } catch (e) {
    console.warn('  [WARN] Initial Supabase connection notice:', e.message);
    console.log('  [INFO] Background reconnect monitor is active and will retry connection.\n');
>>>>>>> origin/main
  }
}

start();
