import { Router } from 'express';
import { broadcast, getClientCount } from '../services/websocket.js';
import { classify, computeScores } from '../models/classifier.js';

const router = Router();
const MAX_BUFFER = 100;
const buffer = [];

router.post('/', (req, res) => {
  const { attention, meditation, alpha, beta, theta, ba_ratio } = req.body;
  
  if (
    typeof attention !== 'number' ||
    typeof meditation !== 'number' ||
    typeof alpha !== 'number' ||
    typeof beta !== 'number' ||
    typeof theta !== 'number' ||
    typeof ba_ratio !== 'number'
  ) {
    return res.status(400).json({ error: 'All fields must be numbers' });
  }

  const reading = {
    eegAttention: attention,
    eegMeditation: meditation,
    alphaPower: alpha,
    betaPower: beta,
    thetaPower: theta,
    betaAlphaRatio: ba_ratio,
    timestamp: Date.now()
  };
  
  const rawData = { attention, meditation, alpha, beta, theta, ba_ratio, timestamp: reading.timestamp };

  buffer.push(rawData);
  if (buffer.length > MAX_BUFFER) {
    buffer.shift();
  }

  const classification = classify(reading);
  const scores = computeScores(reading);

  broadcast('esp32_data', {
    signals: rawData,
    timestamp: reading.timestamp,
    classification: { ...classification, ...scores },
  });

  res.json({ received: true });
});

router.get('/latest', (req, res) => {
  const latest = buffer.length > 0 ? buffer[buffer.length - 1] : null;
  res.json({ reading: latest });
});

router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const readings = buffer.slice(-limit);
  res.json({ readings });
});

router.get('/status', (req, res) => {
  const latest = buffer.length > 0 ? buffer[buffer.length - 1] : null;
  res.json({
    connected: latest ? (Date.now() - (latest.timestamp || 0) < 5000) : false,
    lastReading: latest?.timestamp || null,
    bufferSize: buffer.length,
    clientCount: getClientCount(),
  });
});

export default router;
