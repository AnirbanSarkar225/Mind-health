import { useState, useCallback } from 'react';
import { api } from '../api/client';

const STATES = [
  'ACUTE ANXIETY (Visada)',
  'DEPRESSION / LETHARGY (Tamas)',
  'STRESS & AGITATION (Krodha)',
  'EQUILIBRIUM (Sattva)',
];

const BAR_COLORS = ['var(--red-soft)', 'var(--blue-soft)', 'var(--amber-soft)', 'var(--green-soft)'];
const BAR_LABELS = ['Anxiety', 'Depression', 'Stress', 'Equilibrium'];

export default function HardwareAnalysis() {
  const [signals, setSignals] = useState({ bpm: 0, hrv: 0, attention: 0, meditation: 0, baRatio: 0 });
  const [classification, setClassification] = useState(null);
  const [useML, setUseML] = useState(true);

  const updateSignal = (key, val) => {
    setSignals(prev => ({ ...prev, [key]: val }));
  };

  const deriveEEG = useCallback((att, med, ba) => {
    const alpha = Math.max(1, 30 * (med / 100) + (Math.random() - 0.5) * 3);
    const beta = Math.max(1, alpha * ba + (Math.random() - 0.5) * 2);
    const theta = Math.max(1, 20 * (1 - att / 100) + (Math.random() - 0.5) * 3);
    return { alpha: +alpha.toFixed(1), beta: +beta.toFixed(1), theta: +theta.toFixed(1) };
  }, []);

  const runClassification = async () => {
    const eeg = deriveEEG(signals.attention, signals.meditation, signals.baRatio);
    try {
      const result = await api.classify({
        bpm: signals.bpm, hrv: signals.hrv,
        attention: signals.attention, meditation: signals.meditation,
        alpha: eeg.alpha, beta: eeg.beta, theta: eeg.theta,
        baRatio: signals.baRatio, useML,
      });
      setClassification(result);
    } catch (e) {
      console.error(e);
    }
  };

  const verse = classification?.verse;

  return (
    <>
      <div className="page-header">
        <h1>Hardware & Analysis</h1>
        <p>Connect biosignal hardware, view live telemetry, and receive AI-powered Vedantic remediation</p>
      </div>

      {/* Hardware Config */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4>Signal Source — Manual Calibration</h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={useML} onChange={(e) => setUseML(e.target.checked)} />
            ML Classifier
          </label>
        </div>
        <div className="gauges-row" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
          <SliderInput label="Heart Rate (BPM)" min={0} max={150} value={signals.bpm} onChange={v => updateSignal('bpm', v)} />
          <SliderInput label="HRV SDNN (ms)" min={0} max={120} value={signals.hrv} onChange={v => updateSignal('hrv', v)} />
          <SliderInput label="EEG Attention" min={0} max={100} value={signals.attention} onChange={v => updateSignal('attention', v)} />
          <SliderInput label="EEG Meditation" min={0} max={100} value={signals.meditation} onChange={v => updateSignal('meditation', v)} />
          <SliderInput label="Beta/Alpha Ratio" min={0} max={4} step={0.1} value={signals.baRatio} onChange={v => updateSignal('baRatio', v)} />
        </div>
        <button className="btn btn-primary" onClick={runClassification} style={{ marginTop: '0.5rem' }}>
          Analyze Biosignals
        </button>
      </div>

      {/* Telemetry Gauges */}
      <div className="section-label">TELEMETRY METRICS</div>
      <div className="gauges-row">
        <GaugeCard label="Heart Rate" value={signals.bpm} unit="bpm" />
        <GaugeCard label="HRV SDNN" value={signals.hrv} unit="ms" />
        <GaugeCard label="EEG Attention" value={signals.attention} unit="" />
        <GaugeCard label="EEG Meditation" value={signals.meditation} unit="" />
        <GaugeCard label="Beta/Alpha" value={signals.baRatio} unit="" />
      </div>

      {/* Assessment + Waveform */}
      {classification && (
        <>
          <div className="section-label" style={{ marginTop: '1rem' }}>ASSESSMENT & CLASSIFICATION</div>
          <div className="grid-2">
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span className={`state-badge ${getStateClass(classification.state)}`}>{classification.state}</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {classification.method} · Confidence: <strong style={{color:'var(--primary)'}}>{Math.round(classification.confidence * 100)}%</strong>
              </div>
              <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="metric-card">
                  <div className="metric-label">Stress Index</div>
                  <div className="metric-value">{Math.round(classification.stressIdx)}/100</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Calm Score</div>
                  <div className="metric-value">{Math.round(classification.calmScore)}/100</div>
                </div>
              </div>
              <div className="section-label">ML CLASS PROBABILITIES</div>
              {classification.proba.map((p, i) => (
                <div className="confidence-bar-item" key={i}>
                  <div className="confidence-bar-header">
                    <span>{BAR_LABELS[i]}</span>
                    <span style={{fontWeight:700,color:'var(--text-primary)'}}>{(p*100).toFixed(1)}%</span>
                  </div>
                  <div className="confidence-bar-track">
                    <div className="confidence-bar-fill" style={{ width: `${p*100}%`, background: BAR_COLORS[i] }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="section-label">LIVE TELEMETRY STREAM</div>
              <div className="card" style={{ background: '#1B1B2D', color: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-md)', minHeight: 200 }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>Cardio & EEG Telemetry</div>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
                  <div><span style={{color:'var(--red-soft)'}}>●</span> BPM: {signals.bpm}</div>
                  <div><span style={{color:'var(--primary)'}}>●</span> Att: {signals.attention}</div>
                  <div><span style={{color:'var(--sage)'}}>●</span> Med: {signals.meditation}</div>
                </div>
                <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', opacity: 0.7 }}>Beta/Alpha Spectral Ratio</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{signals.baRatio.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Gita Remediation */}
          {verse && (
            <>
              <hr className="divider" />
              <h2 style={{ marginBottom: '4px' }}>Gita Remediation & Vedantic Wisdom</h2>
              <p style={{ marginBottom: '1.5rem' }}>Personalised philosophical grounding and Sanskrit prescriptions for {classification.state}</p>

              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderLeft: '4px solid var(--primary)', borderRadius: '12px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Target Neuro-State</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>{classification.state}</div>
                </div>
                <span style={{ background: 'rgba(76,114,255,0.15)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {classification.method} · {Math.round(classification.confidence * 100)}% Confidence
                </span>
              </div>

              <div className="grid-2">
                <div>
                  <div className="section-label">PRESCRIPTION SHLOKA & MEANING</div>
                  <div className="remedy-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.05rem' }}>{verse.concept} ({verse.conceptSanskrit})</span>
                      <span style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '12px', padding: '3px 10px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                        Chapter {verse.chapter}, Verse {verse.verse}
                      </span>
                    </div>
                    <div className="sanskrit-block">{verse.sanskrit.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}</div>
                    <div className="transliteration">{verse.transliteration.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}</div>
                    <div className="translation-block"><strong>Direct Meaning:</strong><br />{verse.translation}</div>
                  </div>
                </div>
                <div>
                  <div className="section-label">PATHWAY & SOMATIC GROUNDING</div>
                  <div className="pathway-card">
                    <div className="section-label">REMEDIATION TRAJECTORY</div>
                    <span className={`state-badge ${getStateClass(classification.state)}`}>{classification.state}</span>
                    <div className="pathway-arrow">↓</div>
                    <div className="pathway-node" style={{ background: 'var(--sage-bg)', border: '1px solid var(--sage)' }}>
                      {verse.concept} <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>({verse.conceptSanskrit})</span>
                    </div>
                    <div className="pathway-arrow">↓</div>
                    <div className="pathway-node" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Ch. {verse.chapter}, V. {verse.verse}</span>
                    </div>
                    <hr className="divider" />
                    <div className="section-label" style={{ textAlign: 'left' }}>SOMATIC GROUNDING STEPS</div>
                    {verse.groundingSteps.map((step, i) => (
                      <div className="grounding-step" key={i}>
                        <span className="step-marker">Step {i + 1}:</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

function SliderInput({ label, min, max, step = 1, value, onChange }) {
  return (
    <div className="slider-group">
      <label><span>{label}</span><span style={{ color: 'var(--primary)', fontWeight: 800 }}>{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}</span></label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

function GaugeCard({ label, value, unit }) {
  return (
    <div className="gauge-card">
      <div className="gauge-value">{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}</div>
      <div className="gauge-unit">{unit}</div>
      <div className="gauge-label">{label}</div>
    </div>
  );
}

function getStateClass(state) {
  if (!state) return '';
  const s = state.toLowerCase();
  if (s.includes('anxiety')) return 'anxiety';
  if (s.includes('depression')) return 'depression';
  if (s.includes('stress')) return 'stress';
  return 'equilibrium';
}
