import { Router } from 'express';
import {
  isLLMAvailable,
  generateQuestions,
  analyzeSession,
  calibrateClassification
} from '../services/llm.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/status', (req, res) => {
  try {
    res.json({
      available: isLLMAvailable(),
      provider: 'Google Gemini',
      model: 'gemini-2.0-flash'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/questions', authMiddleware, async (req, res) => {
  try {
    const { description, symptoms, eegData } = req.body;
    if (!isLLMAvailable()) {
      return res.json({ fallback: true });
    }
    const questions = await generateQuestions(description, symptoms, eegData);
    if (!questions) {
      return res.json({ fallback: true });
    }
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { signals, answers, state, description } = req.body;
    if (!isLLMAvailable()) {
      return res.status(503).json({ error: 'LLM not available' });
    }
    const analysis = await analyzeSession(signals, answers, state, description);
    if (!analysis) {
      return res.status(500).json({ error: 'Failed to generate analysis' });
    }
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/calibrate', authMiddleware, async (req, res) => {
  try {
    const { signals, ruleState, mlState, confidence } = req.body;
    if (!isLLMAvailable()) {
      return res.status(503).json({ error: 'LLM not available' });
    }
    const calibration = await calibrateClassification(signals, ruleState, mlState, confidence);
    if (!calibration) {
      return res.status(500).json({ error: 'Failed to calibrate' });
    }
    res.json(calibration);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
