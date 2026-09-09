import { Router } from 'express';
import { broadcast, getClientCount } from '../services/websocket.js';
import { classify, computeScores } from '../models/classifier.js';

const router = Router();
const MAX_BUFFER = 100;
const buffer = [];

router.post('/', (req, res) => {
  const attention = typeof req.body.attention === 'number' ? req.body.attention : 0;
  const meditation = typeof req.body.meditation === 'number' ? req.body.meditation : 0;
  const alpha = typeof req.body.alpha === 'number' ? req.body.alpha : 0;
  const beta = typeof req.body.beta === 'number' ? req.body.beta : 0;
  const theta = typeof req.body.theta === 'number' ? req.body.theta : 0;
  const ba_ratio = typeof req.body.ba_ratio === 'number' ? req.body.ba_ratio : (alpha > 0 ? +(beta / alpha).toFixed(2) : 0);

  const heartRate = typeof req.body.bpm === 'number' ? Math.round(req.body.bpm * 10) / 10 : 0;
  const bloodOxygen = typeof req.body.spo2 === 'number' ? Math.round(req.body.spo2 * 10) / 10 : 0;
  const hrvVal = typeof req.body.hrv_sdnn === 'number' ? Math.round(req.body.hrv_sdnn * 10) / 10 : (typeof req.body.hrv === 'number' ? Math.round(req.body.hrv * 10) / 10 : 0);
  const fingerStatus = typeof req.body.finger === 'number' ? req.body.finger : (heartRate > 0 ? 1 : 0);
  const measuringStatus = typeof req.body.measuring === 'number' ? req.body.measuring : 0;
  const readyStatus = typeof req.body.ready === 'number' ? req.body.ready : 0;

  const reading = {
    eegAttention: attention,
    eegMeditation: meditation,
    alphaPower: alpha,
    betaPower: beta,
    thetaPower: theta,
    betaAlphaRatio: ba_ratio,
    bpm: heartRate,
    spo2: bloodOxygen,
    hrv_sdnn: hrvVal,
    finger: fingerStatus,
    measuring: measuringStatus,
    ready: readyStatus,
    timestamp: Date.now()
  };
  
  const rawData = {
    attention,
    meditation,
    alpha,
    beta,
    theta,
    ba_ratio,
    bpm: heartRate,
    spo2: bloodOxygen,
    hrv_sdnn: hrvVal,
    finger: fingerStatus,
    measuring: measuringStatus,
    ready: readyStatus,
    timestamp: reading.timestamp
  };

  buffer.push(rawData);
  if (buffer.length > MAX_BUFFER) {
    buffer.shift();
  }

  const hasSignals = attention > 0 || meditation > 0 || alpha > 0 || beta > 0 || theta > 0 || heartRate > 0;
  const classification = hasSignals ? classify(reading) : null;
  const scores = hasSignals ? computeScores(reading) : null;

  broadcast('esp32_data', {
    signals: rawData,
    timestamp: reading.timestamp,
    classification: classification ? { ...classification, ...scores } : null,
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
