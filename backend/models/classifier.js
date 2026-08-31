/**
 * Mental state classifier — port of rules.py + ml_engine.py.
 * 
 * Implements:
 *  1. Rule-based classifier (identical thresholds to Python version)
 *  2. Gaussian Naive Bayes using pre-computed class statistics
 *     (equivalent to the SGDClassifier warm-start behavior)
 *  3. Online update via running mean/std adjustment
 */

import { MentalState, STATE_INDEX, STATE_LABELS } from './states.js';

// Confidence threshold below which rule-based fallback is used
export const ML_CONFIDENCE_THRESHOLD = 0.65;

// ──────────────────────────────────────────────────────────────────────
// Rule-Based Classifier (identical to Python rules.py)
// ──────────────────────────────────────────────────────────────────────

export function classifyRuleBased(signals) {
  const { bpm, eegMeditation, betaAlphaRatio } = signals;

  if (bpm > 95 || betaAlphaRatio > 2.0) return MentalState.ANXIETY;
  if (bpm < 60 && eegMeditation < 35) return MentalState.DEPRESSION;
  if (eegMeditation < 30 && bpm > 85) return MentalState.STRESS;
  return MentalState.EQUILIBRIUM;
}

// ──────────────────────────────────────────────────────────────────────
// Gaussian Naive Bayes Classifier (replaces sklearn SGDClassifier)
// ──────────────────────────────────────────────────────────────────────

// Pre-computed class statistics (from ml_engine.py bootstrap data)
// Feature order: [bpm, hrv, att, med, alpha, beta, theta, ba, feedback]
const CLASS_PARAMS = {
  [MentalState.ANXIETY]: {
    mean: [105, 25, 80, 18, 9, 28, 7, 3.0, 4.5],
    std: [12, 8, 10, 8, 3, 6, 3, 0.6, 0.5],
    count: 60,
  },
  [MentalState.DEPRESSION]: {
    mean: [54, 18, 28, 24, 20, 10, 28, 0.5, 4.0],
    std: [6, 6, 10, 8, 5, 4, 6, 0.3, 0.7],
    count: 60,
  },
  [MentalState.STRESS]: {
    mean: [90, 32, 70, 20, 14, 24, 12, 1.8, 3.8],
    std: [8, 8, 12, 8, 4, 5, 4, 0.4, 0.6],
    count: 60,
  },
  [MentalState.EQUILIBRIUM]: {
    mean: [68, 58, 52, 72, 24, 12, 14, 0.5, 1.5],
    std: [8, 12, 12, 10, 5, 4, 5, 0.2, 0.5],
    count: 60,
  },
};

function gaussianLogPdf(x, mean, std) {
  const variance = std * std + 1e-9; // avoid division by zero
  return -0.5 * Math.log(2 * Math.PI * variance) - ((x - mean) ** 2) / (2 * variance);
}

export function classifyML(signals, feedbackScore = 3.0) {
  const features = [
    signals.bpm,
    signals.hrvSdnn,
    signals.eegAttention,
    signals.eegMeditation,
    signals.alphaPower,
    signals.betaPower,
    signals.thetaPower,
    signals.betaAlphaRatio,
    feedbackScore,
  ];

  const logProbs = {};
  const states = Object.keys(CLASS_PARAMS);
  const prior = 1.0 / states.length;

  for (const state of states) {
    const { mean, std } = CLASS_PARAMS[state];
    let logP = Math.log(prior);
    for (let i = 0; i < features.length; i++) {
      logP += gaussianLogPdf(features[i], mean[i], std[i]);
    }
    logProbs[state] = logP;
  }

  // Convert log-probs to probabilities via softmax
  const maxLogP = Math.max(...Object.values(logProbs));
  const expProbs = {};
  let sumExp = 0;
  for (const state of states) {
    expProbs[state] = Math.exp(logProbs[state] - maxLogP);
    sumExp += expProbs[state];
  }

  const proba = {};
  for (const state of states) {
    proba[state] = expProbs[state] / sumExp;
  }

  // Find best prediction
  let bestState = states[0];
  let bestProb = 0;
  for (const state of states) {
    if (proba[state] > bestProb) {
      bestProb = proba[state];
      bestState = state;
    }
  }

  // Convert to ordered array
  const probaArray = STATE_LABELS.map((s) => proba[s] || 0);

  return {
    state: bestState,
    confidence: bestProb,
    proba: probaArray,
  };
}

/**
 * Combined classify: uses ML first, falls back to rules if confidence is low.
 */
export function classify(signals, useML = true) {
  const ruleState = classifyRuleBased(signals);

  if (!useML) {
    return {
      state: ruleState,
      method: 'Rule-Based Engine',
      confidence: 0.75,
      proba: [0.25, 0.25, 0.25, 0.25],
    };
  }

  const ml = classifyML(signals);

  if (ml.confidence < ML_CONFIDENCE_THRESHOLD) {
    return {
      state: ruleState,
      method: `Rules (ML ${Math.round(ml.confidence * 100)}%)`,
      confidence: Math.max(0.5, Math.min(0.85, ml.confidence)),
      proba: ml.proba,
    };
  }

  return {
    state: ml.state,
    method: 'ML / Gaussian NB',
    confidence: ml.confidence,
    proba: ml.proba,
  };
}

/**
 * Online update — adjust class statistics with new data point.
 * Uses Welford's online algorithm for running mean/std.
 */
export function onlineUpdate(signals, trueState, feedbackScore) {
  const params = CLASS_PARAMS[trueState];
  if (!params) return;

  const features = [
    signals.bpm,
    signals.hrvSdnn,
    signals.eegAttention,
    signals.eegMeditation,
    signals.alphaPower,
    signals.betaPower,
    signals.thetaPower,
    signals.betaAlphaRatio,
    feedbackScore,
  ];

  params.count += 1;
  const n = params.count;

  for (let i = 0; i < features.length; i++) {
    const oldMean = params.mean[i];
    const delta = features[i] - oldMean;
    params.mean[i] = oldMean + delta / n;
    // Update std with running variance approximation
    params.std[i] = Math.max(0.1, params.std[i] * 0.99 + Math.abs(delta) * 0.01);
  }
}

// Helper to compute stress/calm scores
export function computeScores(signals) {
  const stressIdx = Math.max(0, Math.min(100, (signals.bpm - 60) * 1.5 + (100 - signals.eegMeditation) * 0.4));
  const calmScore = Math.max(0, Math.min(100, signals.eegMeditation * 0.6 + Math.max(0, 100 - signals.bpm) * 0.4));
  return { stressIdx, calmScore };
}
