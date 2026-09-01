import { Router } from 'express';
import { classify, onlineUpdate, computeScores, getDynamicAccuracy } from '../models/classifier.js';
import { GITA_VERSES } from '../models/verses.js';

const router = Router();

let mlUpdates = 0;

router.post('/', (req, res) => {
  try {
    const {
      attention = 0, meditation = 0,
      alpha = 0, beta = 0, theta = 0, baRatio = 0,
      useML = true,
    } = req.body;

    const signals = {
      eegAttention: attention,
      eegMeditation: meditation,
      alphaPower: alpha,
      betaPower: beta,
      thetaPower: theta,
      betaAlphaRatio: baRatio || (alpha > 0 ? beta / alpha : 1.0),
    };

    const isIdle = attention === 0 && meditation === 0 && alpha === 0 && beta === 0;

    if (isIdle) {
      const verse = GITA_VERSES['EQUILIBRIUM (Sattva)'];
      return res.json({
        state: 'EQUILIBRIUM (Sattva)',
        method: 'ML Baseline (Idle)',
        confidence: 0.50,
        proba: [0.25, 0.25, 0.25, 0.25],
        stressIdx: 0,
        calmScore: 0,
        dynamicAccuracy: getDynamicAccuracy(),
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
      dynamicAccuracy: getDynamicAccuracy(),
      verse,
      mlUpdates,
    });
  } catch (e) {
    console.error('Classify error:', e);
    res.status(500).json({ error: 'Classification failed.' });
  }
});

router.post('/update', (req, res) => {
  try {
    const {
      attention = 50, meditation = 50,
      alpha = 15, beta = 10, theta = 10, baRatio = 0.67,
      trueState, feedbackScore = 3.0,
    } = req.body;

    const signals = {
      eegAttention: attention,
      eegMeditation: meditation,
      alphaPower: alpha,
      betaPower: beta,
      thetaPower: theta,
      betaAlphaRatio: baRatio || (alpha > 0 ? beta / alpha : 1.0),
    };

    onlineUpdate(signals, trueState, feedbackScore);
    mlUpdates++;

    const verse = GITA_VERSES[trueState] || GITA_VERSES['EQUILIBRIUM (Sattva)'];
    res.json({ updated: true, mlUpdates, dynamicAccuracy: getDynamicAccuracy(), verse });
  } catch (e) {
    console.error('Update error:', e);
    res.status(500).json({ error: 'Update failed.' });
  }
});

export default router;
