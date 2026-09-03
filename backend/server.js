import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { checkConnection, isPostgresMode } from './config/db.js';
import { createTables } from './services/schema.js';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import feedbackRoutes from './routes/feedback.js';
import classifyRoutes from './routes/classify.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000');
let databaseReady = false;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'x-requested-with', 'Accept'],
}));
app.use(express.json({ limit: '5mb' }));

app.use('/api', (req, res, next) => {
  if (req.path === '/health' || databaseReady) {
    return next();
  }

  return res.status(503).json({
    error: 'Database is still initializing. Please try again in a moment.',
    code: 'DATABASE_NOT_READY',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/classify', classifyRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: databaseReady ? 'ok' : 'starting',
    version: '4.0.0',
    engine: 'Node.js/Express',
    database: isPostgresMode() ? 'Supabase PostgreSQL Cloud' : 'Local In-Memory Store',
    databaseReady,
  });
});

async function start() {
  // 1. Immediately bind and listen on PORT so frontend proxy never receives 502 Bad Gateway
  const server = app.listen(PORT, () => {
    console.log(`\n  ✓ Gita-NeuroSync API running on http://localhost:${PORT}`);
    console.log(`  ✓ Health check: http://localhost:${PORT}/api/health`);
    if (isPostgresMode()) {
      console.log(`  ✓ Monitoring Supabase Cloud PostgreSQL on startup & reconnect...\n`);
    } else {
      console.log(`  ✓ Mode: Local In-Memory Store (No external DB required)\n`);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ [PORT ERROR] Port ${PORT} is already in use by another process.`);
    } else {
      console.error('Server error:', err);
    }
  });

  // 2. Perform connection check and table synchronization asynchronously
  try {
    if (isPostgresMode()) {
      console.log('  [INFO] Checking and monitoring Supabase PostgreSQL connection...');
      await checkConnection(5, 2000);

      console.log('  [INFO] Synchronizing Supabase database tables & RLS security policies...');
      await createTables();
      databaseReady = true;
      console.log('  ✓ Supabase Cloud PostgreSQL Schema & RLS Synchronized.\n');
    } else {
      await checkConnection();
      await createTables();
      databaseReady = true;
      console.log('  ✓ Local In-Memory Store Ready.\n');
    }
  } catch (e) {
    if (isPostgresMode()) {
      console.warn('  [WARN] Initial Supabase connection notice:', e.message);
      console.log('  [INFO] Background reconnect monitor is active and will retry connection.\n');
    } else {
      console.error('  [ERROR] In-Memory initialization error:', e.message);
    }
  }
}

start();
