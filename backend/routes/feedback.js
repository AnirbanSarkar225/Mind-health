import { Router } from 'express';
import { query } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { sessionId, confirmedState, discomfortLevel, notes, description, symptoms } = req.body;
    
    const feedbackId = uuidv4();
    await query(
      `INSERT INTO feedback (id, session_id, user_id, confirmed_state, discomfort_level, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [feedbackId, sessionId || null, req.user.id, confirmedState, discomfortLevel, notes]
    );

    const probId = uuidv4();
    const symptomsStr = Array.isArray(symptoms) ? symptoms.join(',') : symptoms;
    
    await query(
      `INSERT INTO problems (id, session_id, user_id, description, symptoms, discomfort_level)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [probId, sessionId || null, req.user.id, description, symptomsStr, discomfortLevel]
    );

    res.status(201).json({ message: 'Feedback saved.' });
  } catch (e) {
    console.error('Feedback error:', e);
    res.status(500).json({ error: 'Failed to save feedback.' });
  }
});

export default router;
