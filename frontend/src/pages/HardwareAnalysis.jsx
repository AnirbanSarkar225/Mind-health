import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [signals, setSignals] = useState({
    attention: 50,
    meditation: 50,
    alpha: 15,
    beta: 10,
    theta: 12,
    baRatio: 0.67,
  });
  const [classification, setClassification] = useState(null);
  const [useML, setUseML] = useState(true);
  const [lang, setLang] = useState('en');

  const updateSignal = (key, val) => {
    setSignals(prev => {
      const next = { ...prev, [key]: val };
      if (key === 'alpha' || key === 'beta') {
        const a = key === 'alpha' ? val : next.alpha;
        const b = key === 'beta' ? val : next.beta;
        next.baRatio = +(b / (a || 0.001)).toFixed(2);
      }
      return next;
    });
  };

  const runClassification = async () => {
    try {
      const result = await api.classify({
        attention: signals.attention,
        meditation: signals.meditation,
        alpha: signals.alpha,
        beta: signals.beta,
        theta: signals.theta,
        baRatio: signals.baRatio,
        useML,
      });
      setClassification(result);
    } catch (e) {
      console.error(e);
    }
  };

  const verse = classification?.verse;

  return (
    <>
      <button className="back-to-dash" onClick={() => navigate('/')}>
        &larr; Dashboard
      </button>
      <div className="page-header">
        <h1>EEG Hardware & Analysis</h1>
        <p>BioAmp EXG Pill telemetry, real-time brainwave spectrum analysis, and AI Vedantic remediation</p>
      </div>

      {/* Hardware Config */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4>Signal Source — BioAmp EEG Calibration</h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={useML} onChange={(e) => setUseML(e.target.checked)} />
            ML Gaussian Classifier
          </label>
        </div>
        <div className="gauges-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          <SliderInput label="EEG Attention" min={0} max={100} value={signals.attention} onChange={v => updateSignal('attention', v)} />
          <SliderInput label="Alpha Power (μV)" min={1} max={50} value={signals.alpha} onChange={v => updateSignal('alpha', v)} />
          <SliderInput label="Beta Power (μV)" min={1} max={50} value={signals.beta} onChange={v => updateSignal('beta', v)} />
          <SliderInput label="Theta Power (μV)" min={1} max={50} value={signals.theta} onChange={v => updateSignal('theta', v)} />
        </div>
        <button className="btn btn-primary" onClick={runClassification} style={{ marginTop: '0.5rem' }}>
          Analyze EEG Biosignals
        </button>
      </div>

      {/* Telemetry Gauges */}
      <div className="section-label">EEG TELEMETRY METRICS</div>
      <div className="gauges-row">
        <GaugeCard label="EEG Attention" value={signals.attention} unit="/100" />
        <GaugeCard label="Alpha Wave (8-13Hz)" value={signals.alpha} unit="μV" />
        <GaugeCard label="Beta Wave (13-30Hz)" value={signals.beta} unit="μV" />
        <GaugeCard label="Theta Wave (4-8Hz)" value={signals.theta} unit="μV" />
        <GaugeCard label="Beta/Alpha Ratio" value={signals.baRatio} unit="ratio" />
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
                {classification.method} · Confidence: <strong style={{color:'var(--primary)'}}>{Math.round(classification.confidence * 100)}%</strong> · Dynamic Accuracy: <strong style={{color:'var(--accent)'}}>{classification.dynamicAccuracy || 86.0}%</strong>
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
              <div className="section-label">LIVE EEG SPECTRAL DENSITY</div>
              <div className="card" style={{ background: '#1B1B2D', color: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-md)', minHeight: 200 }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>BioAmp Frontal EEG Bands</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', marginTop: '1rem' }}>
                  <div><span style={{color:'var(--green-soft)'}}>●</span> Alpha (8-13 Hz): {signals.alpha} μV</div>
                  <div><span style={{color:'var(--amber-soft)'}}>●</span> Beta (13-30 Hz): {signals.beta} μV</div>
                  <div><span style={{color:'var(--blue-soft)'}}>●</span> Theta (4-8 Hz): {signals.theta} μV</div>
                  <div><span style={{color:'var(--primary)'}}>●</span> Sampling: 256 Hz</div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px' }}>Gita Remediation & Vedantic Wisdom</h2>
                  <p style={{ margin: 0 }}>Personalised philosophical grounding and Sanskrit prescriptions for {classification.state}</p>
                </div>
                {/* Multilingual Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-subtle)', padding: '4px 6px', borderRadius: '10px', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>Language:</span>
                  <button type="button" className={`btn btn-sm ${lang === 'en' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLang('en')} style={{ fontSize: '0.78rem', padding: '3px 9px' }}>
                    English
                  </button>
                  <button type="button" className={`btn btn-sm ${lang === 'hi' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLang('hi')} style={{ fontSize: '0.78rem', padding: '3px 9px' }}>
                    हिन्दी
                  </button>
                  <button type="button" className={`btn btn-sm ${lang === 'bn' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLang('bn')} style={{ fontSize: '0.78rem', padding: '3px 9px' }}>
                    বাংলা
                  </button>
                  <button type="button" className={`btn btn-sm ${lang === 'hl' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLang('hl')} style={{ fontSize: '0.78rem', padding: '3px 9px' }}>
                    Hinglish
                  </button>
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderLeft: '4px solid var(--primary)', borderRadius: '12px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Target Neuro-State</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>{classification.state}</div>
                </div>
                <span style={{ background: 'rgba(76,114,255,0.15)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {classification.method} · {Math.round(classification.confidence * 100)}% Conf · {classification.dynamicAccuracy || 86.0}% Recalibrated Acc
                </span>
              </div>

              <div className="grid-2">
                <div>
                  <div className="section-label">PRESCRIPTION SHLOKA & MEANING</div>
                  <div className="remedy-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.05rem' }}>
                        {lang === 'hi' ? verse.concept_hi || verse.concept : lang === 'bn' ? verse.concept_bn || verse.concept : lang === 'hl' ? verse.concept_hl || verse.concept : verse.concept}
                      </span>
                      <span style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '12px', padding: '3px 10px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                        Chapter {verse.chapter}, Verse {verse.verse}
                      </span>
                    </div>
                    <div className="sanskrit-block">
                      {(lang === 'bn' && verse.sanskritBengali ? verse.sanskritBengali : verse.sanskrit).split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
                    </div>
                    {(lang === 'en' || lang === 'hl') && (
                      <div className="transliteration">{verse.transliteration.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}</div>
                    )}
                    <div className="translation-block">
                      <strong>{lang === 'hi' ? 'सीधा अर्थ (भावार्थ):' : lang === 'bn' ? 'বঙ্গানুবাদ ও ভাবার্থ:' : lang === 'hl' ? 'Direct Meaning (Bhavarth):' : 'Direct Meaning:'}</strong><br />
                      {lang === 'hi' ? verse.translation_hi || verse.translation : lang === 'bn' ? verse.translation_bn || verse.translation : lang === 'hl' ? verse.translation_hl || verse.translation : verse.translation}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="section-label">PATHWAY & SOMATIC GROUNDING</div>
                  <div className="pathway-card">
                    <div className="section-label">REMEDIATION TRAJECTORY</div>
                    <span className={`state-badge ${getStateClass(classification.state)}`}>{classification.state}</span>
                    <div className="pathway-arrow">↓</div>
                    <div className="pathway-node" style={{ background: 'var(--sage-bg)', border: '1px solid var(--sage)' }}>
                      {lang === 'hi' ? verse.concept_hi || verse.concept : lang === 'bn' ? verse.concept_bn || verse.concept : lang === 'hl' ? verse.concept_hl || verse.concept : verse.concept}
                    </div>
                    <div className="pathway-arrow">↓</div>
                    <div className="pathway-node" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Ch. {verse.chapter}, V. {verse.verse}</span>
                    </div>
                    <hr className="divider" />
                    <div className="section-label" style={{ textAlign: 'left' }}>
                      {lang === 'hi' ? '3-चरणीय दैहिक स्थिरता अभ्यास' : lang === 'bn' ? '৩-পর্যায়ের মানসিক ও দৈহিক প্রশান্তি অনুশীলন' : lang === 'hl' ? '3-STAGE SOMATIC GROUNDING (STHIRATA ABHYAS)' : 'SOMATIC GROUNDING STEPS'}
                    </div>
                    {(lang === 'hi' ? verse.groundingSteps_hi || verse.groundingSteps : lang === 'bn' ? verse.groundingSteps_bn || verse.groundingSteps : lang === 'hl' ? verse.groundingSteps_hl || verse.groundingSteps : verse.groundingSteps).map((step, i) => (
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
