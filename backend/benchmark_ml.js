/**
 * ==============================================================================
 *  GITA-NEUROSYNC — EXTREME "STRESS-TO-FAILURE" ML BENCHMARK
 *  Pushes the classifier through 5 brutal corruption tiers until failure.
 *  Run: node benchmark.js (or npm run benchmark)
 * ==============================================================================
 */

import { classifyML, classifyRuleBased, classify, onlineUpdate } from './models/classifier.js';
import { MentalState, STATE_LABELS } from './models/states.js';

function randomGaussian(mean = 0, std = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * std;
}

const BASE_DISTRIBUTIONS = {
  [MentalState.ANXIETY]: {
    att: { mean: 80, std: 10 },
    med: { mean: 18, std: 8 },
    alpha: { mean: 9, std: 3 },
    beta: { mean: 28, std: 6 },
    theta: { mean: 7, std: 3 },
    feedback: { mean: 4.5, std: 0.5 },
  },
  [MentalState.DEPRESSION]: {
    att: { mean: 28, std: 10 },
    med: { mean: 24, std: 8 },
    alpha: { mean: 10, std: 4 },
    beta: { mean: 10, std: 4 },
    theta: { mean: 28, std: 6 },
    feedback: { mean: 4.0, std: 0.7 },
  },
  [MentalState.STRESS]: {
    att: { mean: 70, std: 12 },
    med: { mean: 20, std: 8 },
    alpha: { mean: 14, std: 4 },
    beta: { mean: 24, std: 5 },
    theta: { mean: 12, std: 4 },
    feedback: { mean: 3.8, std: 0.6 },
  },
  [MentalState.EQUILIBRIUM]: {
    att: { mean: 52, std: 12 },
    med: { mean: 72, std: 10 },
    alpha: { mean: 24, std: 5 },
    beta: { mean: 12, std: 4 },
    theta: { mean: 14, std: 5 },
    feedback: { mean: 1.5, std: 0.5 },
  },
};

function generateSampleWithCorruptions(state, tier = 1) {
  const p = BASE_DISTRIBUTIONS[state];
  let noiseMult = 1.0;
  let emgSpike = 0;
  let mainsNoise = 0;
  let dropoutProb = 0;
  let boundaryBlend = 0;

  if (tier === 1) {
    // Normal baseline sensor noise
    noiseMult = 1.0;
  } else if (tier === 2) {
    // Heavy Sensor Noise + 50Hz mains hum
    noiseMult = 2.2;
    mainsNoise = (Math.random() - 0.5) * 8.0;
  } else if (tier === 3) {
    // Severe EMG Muscle Artifacts (Jaw clenching + eye blinks)
    noiseMult = 3.5;
    emgSpike = Math.random() > 0.4 ? (Math.random() * 25.0) : 0;
  } else if (tier === 4) {
    // Mixed Psychiatric Comorbidity (Cross-state spectral bleeding)
    noiseMult = 4.0;
    boundaryBlend = 0.45; // 45% blend with an opposing emotional state
  } else if (tier === 5) {
    // Catastrophic Hardware Failure (High-impedance dropouts, rail clamping, missing channels)
    noiseMult = 6.0;
    dropoutProb = 0.50; // 50% chance feature is wiped to 0 or clamped to extreme 100
  }

  let att = randomGaussian(p.att.mean, p.att.std * noiseMult);
  let med = randomGaussian(p.med.mean, p.med.std * noiseMult);
  let alpha = randomGaussian(p.alpha.mean, p.alpha.std * noiseMult) + mainsNoise;
  let beta = randomGaussian(p.beta.mean, p.beta.std * noiseMult) + emgSpike;
  let theta = randomGaussian(p.theta.mean, p.theta.std * noiseMult) + emgSpike * 0.5;
  let fb = randomGaussian(p.feedback.mean, p.feedback.std * noiseMult);

  // Mixed Comorbidity Blend
  if (boundaryBlend > 0) {
    const opposingState = state === MentalState.EQUILIBRIUM ? MentalState.ANXIETY : MentalState.EQUILIBRIUM;
    const op = BASE_DISTRIBUTIONS[opposingState];
    att = (1 - boundaryBlend) * att + boundaryBlend * op.att.mean;
    med = (1 - boundaryBlend) * med + boundaryBlend * op.med.mean;
    alpha = (1 - boundaryBlend) * alpha + boundaryBlend * op.alpha.mean;
    beta = (1 - boundaryBlend) * beta + boundaryBlend * op.beta.mean;
    theta = (1 - boundaryBlend) * theta + boundaryBlend * op.theta.mean;
  }

  // Hardware Dropouts (Tier 5)
  if (dropoutProb > 0) {
    if (Math.random() < dropoutProb) alpha = Math.random() > 0.5 ? 0.1 : 95.0;
    if (Math.random() < dropoutProb) beta = Math.random() > 0.5 ? 0.1 : 95.0;
    if (Math.random() < dropoutProb) att = Math.random() > 0.5 ? 0 : 100;
  }

  att = Math.max(0, Math.min(100, att));
  med = Math.max(0, Math.min(100, med));
  alpha = Math.max(0.1, alpha);
  beta = Math.max(0.1, beta);
  theta = Math.max(0.1, theta);
  const ba = beta / alpha;

  return {
    signals: {
      eegAttention: att,
      eegMeditation: med,
      alphaPower: alpha,
      betaPower: beta,
      thetaPower: theta,
      betaAlphaRatio: ba,
    },
    trueState: state,
  };
}

function evaluateTier(tierNumber, tierName, sampleCount = 2000) {
  const states = Object.values(MentalState);
  let correct = 0;
  let total = 0;
  let mlCount = 0;
  let rulesCount = 0;
  let avgConf = 0;

  for (let i = 0; i < sampleCount; i++) {
    const trueState = states[i % states.length];
    const sample = generateSampleWithCorruptions(trueState, tierNumber);
    const pred = classify(sample.signals, true);

    total++;
    avgConf += pred.confidence;
    if (pred.method.includes('Rules') || pred.method.includes('Fallback')) {
      rulesCount++;
    } else {
      mlCount++;
    }

    if (pred.state === trueState) correct++;
  }

  const accuracy = (correct / total) * 100;
  avgConf = (avgConf / total) * 100;

  return {
    tier: tierNumber,
    name: tierName,
    accuracy,
    avgConf,
    mlUsage: (mlCount / total) * 100,
    rulesFallback: (rulesCount / total) * 100,
  };
}

function runStressToFailure() {
  console.log('================================================================================');
  console.log('       GITA-NEUROSYNC — "STRESS-TO-FAILURE" DEEP ML BENCHMARK (5 TIERS)         ');
  console.log('================================================================================\n');

  const TIERS = [
    { num: 1, name: 'Tier 1: Clinical Baseline Noise (Standard Sensor Calibration)' },
    { num: 2, name: 'Tier 2: High Impedance + 50Hz Mains AC Hum Distortion' },
    { num: 3, name: 'Tier 3: Severe EMG Muscle Artifacts (Jaw Clenching / Blinks)' },
    { num: 4, name: 'Tier 4: Mixed Psychiatric Comorbidity (Anxious Depression Bleed)' },
    { num: 5, name: 'Tier 5: Catastrophic Hardware Failure (50% Dropout & Clamping)' },
  ];

  const results = [];

  for (const t of TIERS) {
    console.log(`[Running] ${t.name}...`);
    const res = evaluateTier(t.num, t.name, 2000);
    results.push(res);
  }

  console.log('\n--------------------------------------------------------------------------------');
  console.log('                      TIER-BY-TIER DEGRADATION MATRIX                           ');
  console.log('--------------------------------------------------------------------------------');
  console.log('Stress Tier               | Accuracy | Confidence | ML Direct | Rules Fallback | Health');
  console.log('--------------------------+----------+------------+-----------+----------------+-------');

  for (const r of results) {
    let health = 'OPTIMAL';
    if (r.accuracy < 50) health = 'COLLAPSE';
    else if (r.accuracy < 70) health = 'DEGRADED';
    else if (r.accuracy < 85) health = 'STRESSED';

    console.log(
      `Tier ${r.tier}: ${r.name.slice(8, 28).padEnd(20, ' ')} | ` +
      `${r.accuracy.toFixed(2).padStart(7, ' ')}% | ` +
      `${r.avgConf.toFixed(2).padStart(9, ' ')}% | ` +
      `${r.mlUsage.toFixed(1).padStart(8, ' ')}% | ` +
      `${r.rulesFallback.toFixed(1).padStart(13, ' ')}% | ` +
      `${health}`
    );
  }
  console.log('--------------------------------------------------------------------------------\n');

  // ── Finding Model Breaking Threshold ───────────────────────────────────────
  console.log('================================================================================');
  console.log('                          FAILURE BOUNDARY ANALYSIS                             ');
  console.log('================================================================================');
  console.log(`  Tier 1 Baseline Accuracy   : ${results[0].accuracy.toFixed(2)}% (Peak operational range)`);
  console.log(`  Tier 3 Artifact Resistance : ${results[2].accuracy.toFixed(2)}% (Tolerates heavy physical movement)`);
  console.log(`  Tier 4 Comorbidity Stress  : ${results[3].accuracy.toFixed(2)}% (Subjective overlap confusion boundary)`);
  console.log(`  Tier 5 Catastrophic Limit  : ${results[4].accuracy.toFixed(2)}% (Theoretical noise floor / failure point)`);
  console.log('================================================================================\n');
}

runStressToFailure();
