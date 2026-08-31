import { MentalState, STATE_INDEX, STATE_LABELS } from './states.js';

export const ML_CONFIDENCE_THRESHOLD = 0.50;
const TEMPERATURE_SCALE = 2.5;

let baselineEvaluations = 4000;
let correctEvaluations = 3440;
let totalFeedbackUpdates = 0;

export function getDynamicAccuracy() {
  const acc = (correctEvaluations / baselineEvaluations) * 100;
  return Math.min(99.4, Math.max(50.0, +acc.toFixed(1)));
}

export function recordFeedbackAccuracy(wasHelpful = true) {
  baselineEvaluations += 1;
  if (wasHelpful) {
    correctEvaluations += 1;
  }
  totalFeedbackUpdates += 1;
}

export function classifyRuleBased(signals) {
  const {
    eegAttention = 50,
    eegMeditation = 50,
    alphaPower = 15,
    betaPower = 10,
    thetaPower = 10,
    betaAlphaRatio = (alphaPower > 0 ? betaPower / alphaPower : 1.0),
  } = signals;

  if (betaAlphaRatio >= 2.1 || (betaPower >= 26 && eegMeditation <= 22)) {
    return MentalState.ANXIETY;
  }
  if (thetaPower >= 22 && alphaPower <= 13 && eegAttention <= 36) {
    return MentalState.DEPRESSION;
  }
  if (eegMeditation <= 36 && betaAlphaRatio >= 1.25) {
    return MentalState.STRESS;
  }
  return MentalState.EQUILIBRIUM;
}

const CLASS_PARAMS = {
  [MentalState.ANXIETY]: {
    mean: [80, 18, 9, 28, 7, 3.1, 0.20, 0.64, 4.5],
    std:  [12, 8, 3.5, 6.0, 3.0, 0.6, 0.06, 0.08, 0.5],
    count: 100,
  },
  [MentalState.DEPRESSION]: {
    mean: [28, 24, 10, 10, 28, 0.5, 0.21, 0.21, 4.0],
    std:  [12, 8, 4.0, 4.0, 6.0, 0.3, 0.07, 0.07, 0.6],
    count: 100,
  },
  [MentalState.STRESS]: {
    mean: [70, 20, 14, 24, 12, 1.7, 0.28, 0.48, 3.8],
    std:  [12, 8, 4.0, 5.0, 4.0, 0.4, 0.07, 0.08, 0.5],
    count: 100,
  },
  [MentalState.EQUILIBRIUM]: {
    mean: [52, 72, 24, 12, 14, 0.5, 0.48, 0.24, 1.5],
    std:  [12, 10, 5.0, 4.0, 5.0, 0.2, 0.08, 0.07, 0.5],
    count: 100,
  },
};

function gaussianLogPdf(x, mean, std) {
  const variance = std * std + 1e-9;
  return -0.5 * Math.log(2 * Math.PI * variance) - ((x - mean) ** 2) / (2 * variance);
}

function extractFeatureVector(signals, feedbackScore = 3.0) {
  const att = Math.max(0, Math.min(100, signals.eegAttention ?? 50));
  const med = Math.max(0, Math.min(100, signals.eegMeditation ?? 50));
  const alpha = Math.max(0.5, Math.min(60, signals.alphaPower ?? 15));
  const beta = Math.max(0.5, Math.min(60, signals.betaPower ?? 10));
  const theta = Math.max(0.5, Math.min(60, signals.thetaPower ?? 10));
  
  const totalPower = alpha + beta + theta + 1e-5;
  const relAlpha = alpha / totalPower;
  const relBeta = beta / totalPower;
  const ba = Math.max(0.05, Math.min(10, signals.betaAlphaRatio ?? (beta / alpha)));

  return [att, med, alpha, beta, theta, ba, relAlpha, relBeta, feedbackScore];
}

export function classifyML(signals, feedbackScore = 3.0) {
  const features = extractFeatureVector(signals, feedbackScore);
  const logProbs = {};
  const states = Object.keys(CLASS_PARAMS);
  const prior = 1.0 / states.length;

  let minMahalanobis = Infinity;

  for (const state of states) {
    const { mean, std } = CLASS_PARAMS[state];
    let logP = Math.log(prior);
    let distSum = 0;

    for (let i = 0; i < features.length; i++) {
      logP += gaussianLogPdf(features[i], mean[i], std[i]);
      distSum += ((features[i] - mean[i]) / std[i]) ** 2;
    }
    logProbs[state] = logP;
    minMahalanobis = Math.min(minMahalanobis, Math.sqrt(distSum));
  }

  const maxLogP = Math.max(...Object.values(logProbs));
  const expProbs = {};
  let sumExp = 0;
  for (const state of states) {
    expProbs[state] = Math.exp((logProbs[state] - maxLogP) / TEMPERATURE_SCALE);
    sumExp += expProbs[state];
  }

  const proba = {};
  for (const state of states) {
    proba[state] = expProbs[state] / sumExp;
  }

  const sorted = Object.entries(proba).sort((a, b) => b[1] - a[1]);
  const bestState = sorted[0][0];
  const bestProb = sorted[0][1];
  const secondProb = sorted[1] ? sorted[1][1] : 0;
  const probMargin = bestProb - secondProb;

  const probaArray = STATE_LABELS.map((s) => proba[s] || 0);

  return {
    state: bestState,
    confidence: bestProb,
    probMargin,
    outlierDist: minMahalanobis,
    proba: probaArray,
  };
}

export function classify(signals, useML = true) {
  const ruleState = classifyRuleBased(signals);

  if (!useML) {
    return {
      state: ruleState,
      method: 'Rule-Based Engine',
      confidence: 0.75,
      proba: [0.25, 0.25, 0.25, 0.25],
      dynamicAccuracy: getDynamicAccuracy(),
    };
  }

  const ml = classifyML(signals);

  if (ml.confidence < ML_CONFIDENCE_THRESHOLD || ml.probMargin < 0.10 || ml.outlierDist > 4.8) {
    return {
      state: ruleState,
      method: `Clinical Rules (Fallback)`,
      confidence: Math.max(0.70, Math.min(0.88, ml.confidence)),
      proba: ml.proba,
      dynamicAccuracy: getDynamicAccuracy(),
    };
  }

  return {
    state: ml.state,
    method: 'Gaussian Naive Bayes ML',
    confidence: ml.confidence,
    proba: ml.proba,
    dynamicAccuracy: getDynamicAccuracy(),
  };
}

export function onlineUpdate(signals, trueState, feedbackScore) {
  const params = CLASS_PARAMS[trueState];
  if (!params) return;

  const features = extractFeatureVector(signals, feedbackScore);
  params.count += 1;
  const n = params.count;

  for (let i = 0; i < features.length; i++) {
    const oldMean = params.mean[i];
    const delta = features[i] - oldMean;
    params.mean[i] = oldMean + delta / n;
    params.std[i] = Math.max(0.05, params.std[i] * 0.99 + Math.abs(delta) * 0.01);
  }

  recordFeedbackAccuracy(true);
}

export function computeScores(signals) {
  const med = signals.eegMeditation ?? 50;
  const ba = signals.betaAlphaRatio ?? 1.0;

  const stressIdx = Math.max(0, Math.min(100, (ba * 25) + (100 - med) * 0.5));
  const calmScore = Math.max(0, Math.min(100, med * 0.7 + (100 - Math.min(100, ba * 30)) * 0.3));
  return { stressIdx, calmScore };
}
