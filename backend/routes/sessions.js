import { Router } from 'express';
import { query } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/sessions — save an EEG session
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      bpm = 0, hrv = 0,
      attention = 50, meditation = 50,
      alpha = 15, beta = 10, theta = 10,
      baRatio = 0.67,
      state, method, confidence,
    } = req.body;
    
    const sessId = uuidv4();
    await query(
      `INSERT INTO sessions 
       (id, user_id, bpm, hrv_sdnn, eeg_attention, eeg_meditation, alpha_power, beta_power, theta_power, beta_alpha_ratio, detected_state, classifier_method, confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sessId, req.user.id, bpm, hrv, attention, meditation, alpha, beta, theta, baRatio, state, method, confidence]
    );

    res.status(201).json({ id: sessId, message: 'Session saved.' });
  } catch (e) {
    console.error('Save session error:', e);
    res.status(500).json({ error: 'Failed to save session.' });
  }
});

// GET /api/sessions — list user sessions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50');
    const result = await query(
      `SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [req.user.id, limit]
    );
    res.json({ sessions: result.rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

// GET /api/sessions/stats — get dashboard stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const sessRes = await query(
      `SELECT eeg_attention, eeg_meditation, alpha_power, beta_power, beta_alpha_ratio, confidence, detected_state, created_at 
       FROM sessions WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );

    const feedbackRes = await query(
      `SELECT COUNT(*) as count FROM feedback WHERE user_id = ?`,
      [req.user.id]
    );

    const rows = sessRes.rows;
    let totalSessions = rows.length;
    let lastSessionAt = totalSessions > 0 ? rows[0].created_at : null;
    let avgAttention = 0;
    let avgMeditation = 0;
    let avgConfidence = 0;
    let avgAlpha = 0;
    let mostFrequentState = 'N/A';

    if (totalSessions > 0) {
      let stateCounts = {};
      let maxCount = 0;

      rows.forEach(r => {
        avgAttention += (r.eeg_attention || 0);
        avgMeditation += (r.eeg_meditation || 0);
        avgAlpha += (r.alpha_power || 0);
        avgConfidence += (r.confidence || 0);
        
        stateCounts[r.detected_state] = (stateCounts[r.detected_state] || 0) + 1;
        if (stateCounts[r.detected_state] > maxCount) {
          maxCount = stateCounts[r.detected_state];
          mostFrequentState = r.detected_state;
        }
      });

      avgAttention /= totalSessions;
      avgMeditation /= totalSessions;
      avgAlpha /= totalSessions;
      avgConfidence /= totalSessions;
    }

    res.json({
      stats: {
        totalSessions,
        lastSessionAt,
        avgAttention,
        avgMeditation,
        avgAlpha,
        avgConfidence,
        mostFrequentState,
        totalFeedback: feedbackRes.rows[0].count,
      }
    });
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

export default router;
