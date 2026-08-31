import { MentalState, STATE_INDEX, STATE_LABELS } from './states.js';

export const ML_CONFIDENCE_THRESHOLD = 0.65;

// ── Pure EEG Rule-Based Classifier ──────────────────────────────────────────
export function classifyRuleBased(signals) {
  const { eegAttention = 50, eegMeditation = 50, alphaPower = 15, betaPower = 10, thetaPower = 10, betaAlphaRatio = 0.67 } = signals;

  if (betaAlphaRatio > 1.8 || (betaPower > 22 && eegMeditation < 30)) {
    return MentalState.ANXIETY;
  }
  if (thetaPower > 20 && alphaPower < 12 && eegAttention < 35) {
    return MentalState.DEPRESSION;
  }
  if (eegMeditation < 35 && betaAlphaRatio > 1.2) {
    return MentalState.STRESS;
  }
  return MentalState.EQUILIBRIUM;
}

// ── Pure EEG Gaussian Naive Bayes ML Classifier ──────────────────────────────
// Feature order: [att, med, alpha, beta, theta, ba_ratio, feedback]
const CLASS_PARAMS = {
  [MentalState.ANXIETY]: {
    mean: [80, 18, 9, 28, 7, 3.0, 4.5],
    std: [10, 8, 3, 6, 3, 0.6, 0.5],
    count: 60,
  },
  [MentalState.DEPRESSION]: {
    mean: [28, 24, 10, 10, 28, 0.5, 4.0],
    std: [10, 8, 4, 4, 6, 0.3, 0.7],
    count: 60,
  },
  [MentalState.STRESS]: {
    mean: [70, 20, 14, 24, 12, 1.8, 3.8],
    std: [12, 8, 4, 5, 4, 0.4, 0.6],
    count: 60,
  },
  [MentalState.EQUILIBRIUM]: {
    mean: [52, 72, 24, 12, 14, 0.5, 1.5],
    std: [12, 10, 5, 4, 5, 0.2, 0.5],
    count: 60,
  },
};

function gaussianLogPdf(x, mean, std) {
  const variance = std * std + 1e-9;
  return -0.5 * Math.log(2 * Math.PI * variance) - ((x - mean) ** 2) / (2 * variance);
}

export function classifyML(signals, feedbackScore = 3.0) {
  const features = [
    signals.eegAttention ?? 50,
    signals.eegMeditation ?? 50,
    signals.alphaPower ?? 15,
    signals.betaPower ?? 10,
    signals.thetaPower ?? 10,
    signals.betaAlphaRatio ?? (signals.alphaPower > 0 ? signals.betaPower / signals.alphaPower : 1.0),
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

  let bestState = states[0];
  let bestProb = 0;
  for (const state of states) {
    if (proba[state] > bestProb) {
      bestProb = proba[state];
      bestState = state;
    }
  }

  const probaArray = STATE_LABELS.map((s) => proba[s] || 0);

  return {
    state: bestState,
    confidence: bestProb,
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

export function onlineUpdate(signals, trueState, feedbackScore) {
  const params = CLASS_PARAMS[trueState];
  if (!params) return;

  const features = [
    signals.eegAttention ?? 50,
    signals.eegMeditation ?? 50,
    signals.alphaPower ?? 15,
    signals.betaPower ?? 10,
    signals.thetaPower ?? 10,
    signals.betaAlphaRatio ?? (signals.alphaPower > 0 ? signals.betaPower / signals.alphaPower : 1.0),
    feedbackScore,
  ];

  params.count += 1;
  const n = params.count;

  for (let i = 0; i < features.length; i++) {
    const oldMean = params.mean[i];
    const delta = features[i] - oldMean;
    params.mean[i] = oldMean + delta / n;
    params.std[i] = Math.max(0.1, params.std[i] * 0.99 + Math.abs(delta) * 0.01);
  }
}

export function computeScores(signals) {
  const med = signals.eegMeditation ?? 50;
  const ba = signals.betaAlphaRatio ?? 1.0;

  const stressIdx = Math.max(0, Math.min(100, (ba * 25) + (100 - med) * 0.5));
  const calmScore = Math.max(0, Math.min(100, med * 0.7 + (100 - Math.min(100, ba * 30)) * 0.3));
  return { stressIdx, calmScore };
}
