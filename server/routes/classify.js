/**
 * Classification route — accept biosignal readings, return state + verse.
 */

import { Router } from 'express';
import { classify, onlineUpdate, computeScores } from '../models/classifier.js';
import { GITA_VERSES } from '../models/verses.js';

const router = Router();

// Track ML update count per-process (resets on restart)
let mlUpdates = 0;

// POST /api/classify — classify biosignal readings
router.post('/', (req, res) => {
  try {
    const {
      bpm = 0, hrv = 0, attention = 0, meditation = 0,
      alpha = 0, beta = 0, theta = 0, baRatio = 0,
      useML = true,
    } = req.body;

    const signals = {
      bpm, hrvSdnn: hrv,
      eegAttention: attention, eegMeditation: meditation,
      alphaPower: alpha, betaPower: beta, thetaPower: theta,
      betaAlphaRatio: baRatio,
    };

    const isIdle = bpm === 0 && hrv === 0 && attention === 0 && meditation === 0;

    if (isIdle) {
      const verse = GITA_VERSES['EQUILIBRIUM (Sattva)'];
      return res.json({
        state: 'EQUILIBRIUM (Sattva)',
        method: 'ML Baseline (Idle)',
        confidence: 0.50,
        proba: [0.25, 0.25, 0.25, 0.25],
        stressIdx: 0,
        calmScore: 0,
        verse,
        mlUpdates,
      });
    }

    const result = classify(signals, useML);
    const scores = computeScores(signals);
    const verse = GITA_VERSES[result.state];

    res.json({
      ...result,
      ...scores,
      verse,
      mlUpdates,
    });
  } catch (e) {
    console.error('Classify error:', e);
    res.status(500).json({ error: 'Classification failed.' });
  }
});

// POST /api/classify/update — online ML update from user feedback
router.post('/update', (req, res) => {
  try {
    const {
      bpm = 0, hrv = 0, attention = 0, meditation = 0,
      alpha = 0, beta = 0, theta = 0, baRatio = 0,
      trueState, feedbackScore = 3.0,
    } = req.body;

    const signals = {
      bpm, hrvSdnn: hrv,
      eegAttention: attention, eegMeditation: meditation,
      alphaPower: alpha, betaPower: beta, thetaPower: theta,
      betaAlphaRatio: baRatio,
    };

    onlineUpdate(signals, trueState, feedbackScore);
    mlUpdates++;

    res.json({ updated: true, mlUpdates });
  } catch (e) {
    console.error('Update error:', e);
    res.status(500).json({ error: 'Update failed.' });
  }
});

export default router;
