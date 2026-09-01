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

app.use(cors({ origin: true, credentials: true }));
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
  try {
    console.log('\n  [INFO] Checking and monitoring Supabase PostgreSQL connection...');
    await checkConnection(5, 2000);

    console.log('  [INFO] Synchronizing Supabase database tables & RLS security policies...');
    await createTables();

    app.listen(PORT, () => {
      console.log(`\n  ✓ Gita-NeuroSync API running on http://localhost:${PORT}`);
      console.log(`  ✓ Health check: http://localhost:${PORT}/api/health`);
      console.log(`  ✓ Supabase Cloud PostgreSQL Active & Monitored\n`);
    });
  } catch (e) {
    console.error('  [FAIL] Server startup failed:', e.message);
    process.exit(1);
  }
}

start();
