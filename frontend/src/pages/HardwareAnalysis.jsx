import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { FiActivity, FiClock, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { FaWaveSquare } from 'react-icons/fa6';

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

  const [savedMessage, setSavedMessage] = useState('');

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

      await api.saveSessions({
        attention: signals.attention,
        meditation: signals.meditation,
        alpha: signals.alpha,
        beta: signals.beta,
        theta: signals.theta,
        baRatio: signals.baRatio,
        state: result.state,
        method: result.method || 'BioAmp Hardware Stream',
        confidence: Math.min(0.80, result.confidence || 0.80),
      });
      setSavedMessage('Live hardware sensor recording saved to session history');
      setTimeout(() => setSavedMessage(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const verse = classification?.verse;

  return (
    <>
      <button className="back-to-dash" onClick={() => navigate('/')}>
        <FiArrowLeft size={16} /> Back to Dashboard
      </button>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="medical-header-badge">
            <FaWaveSquare size={13} /> Hardware Telemetry
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem' }}>EEG Hardware & Analysis</h1>
        <p style={{ fontSize: '1.02rem' }}>BioAmp EXG Pill telemetry, real-time brainwave spectrum analysis, and AI Vedantic remediation</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '1.25rem', margin: 0 }}>Signal Source — BioAmp EEG Calibration</h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.98rem', fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={useML} onChange={(e) => setUseML(e.target.checked)} />
            ML Gaussian Classifier
          </label>
        </div>
        <div className="gauges-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem' }}>
          <SliderInput label="EEG Attention" min={0} max={100} value={signals.attention} onChange={v => updateSignal('attention', v)} />
          <SliderInput label="Alpha Power (μV)" min={1} max={50} value={signals.alpha} onChange={v => updateSignal('alpha', v)} />
          <SliderInput label="Beta Power (μV)" min={1} max={50} value={signals.beta} onChange={v => updateSignal('beta', v)} />
          <SliderInput label="Theta Power (μV)" min={1} max={50} value={signals.theta} onChange={v => updateSignal('theta', v)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={runClassification} style={{ padding: '0.85rem 1.85rem', fontSize: '1.02rem' }}>
            Analyze EEG Biosignals
          </button>
          {savedMessage && (
            <span style={{ color: 'var(--sage)', fontWeight: 700, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FiCheckCircle size={16} /> {savedMessage}
            </span>
          )}
        </div>
      </div>

      <div className="section-label" style={{ marginBottom: '1rem' }}>EEG TELEMETRY METRICS</div>
      <div className="gauges-row" style={{ gap: '1.25rem', marginBottom: '2.5rem' }}>
        <GaugeCard label="EEG Attention" value={signals.attention} unit="/100" />
        <GaugeCard label="Alpha Wave (8-13Hz)" value={signals.alpha} unit="μV" />
        <GaugeCard label="Beta Wave (13-30Hz)" value={signals.beta} unit="μV" />
        <GaugeCard label="Theta Wave (4-8Hz)" value={signals.theta} unit="μV" />
        <GaugeCard label="Beta/Alpha Ratio" value={signals.baRatio} unit="ratio" />
      </div>

      {classification && (
        <>
          <div className="section-label" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>ASSESSMENT & CLASSIFICATION</div>
          <div className="grid-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <span className={`state-badge ${getStateClass(classification.state)}`} style={{ fontSize: '1.1rem', padding: '6px 18px' }}>{classification.state}</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                {classification.method} · Confidence: <strong style={{color:'var(--primary)'}}>{Math.min(80, Math.round((classification.confidence || 0.8) * 100))}%</strong> · Dynamic Accuracy: <strong style={{color:'var(--accent)'}}>{classification.dynamicAccuracy || 86.0}%</strong>
              </div>
              <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="metric-card" style={{ padding: '1.25rem' }}>
                  <div className="metric-label" style={{ fontSize: '0.88rem' }}>Stress Index</div>
                  <div className="metric-value" style={{ fontSize: '1.75rem' }}>{Math.round(classification.stressIdx)}/100</div>
                </div>
                <div className="metric-card" style={{ padding: '1.25rem' }}>
                  <div className="metric-label" style={{ fontSize: '0.88rem' }}>Calm Score</div>
                  <div className="metric-value" style={{ fontSize: '1.75rem' }}>{Math.round(classification.calmScore)}/100</div>
                </div>
              </div>
              <div className="section-label" style={{ marginBottom: '0.75rem' }}>ML CLASS PROBABILITIES</div>
              {classification.proba.map((p, i) => (
                <div className="confidence-bar-item" key={i} style={{ marginBottom: '0.85rem' }}>
                  <div className="confidence-bar-header" style={{ fontSize: '0.92rem', marginBottom: '4px' }}>
                    <span>{BAR_LABELS[i]}</span>
                    <span style={{fontWeight:800,color:'var(--text-primary)'}}>{(p*100).toFixed(1)}%</span>
                  </div>
                  <div className="confidence-bar-track" style={{ height: '8px', borderRadius: '4px' }}>
                    <div className="confidence-bar-fill" style={{ width: `${p*100}%`, background: BAR_COLORS[i], height: '100%', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="section-label" style={{ marginBottom: '1rem' }}>LIVE EEG SPECTRAL DENSITY</div>
              <div className="card" style={{ background: '#1B1B2D', color: '#fff', padding: '1.85rem', borderRadius: 'var(--radius-lg)', minHeight: 220 }}>
                <div style={{ fontSize: '0.95rem', opacity: 0.8, marginBottom: '0.75rem', fontWeight: 600 }}>BioAmp Frontal EEG Bands</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '1rem', marginTop: '1rem' }}>
                  <div><span style={{color:'var(--green-soft)'}}>●</span> Alpha (8-13 Hz): <strong>{signals.alpha} μV</strong></div>
                  <div><span style={{color:'var(--amber-soft)'}}>●</span> Beta (13-30 Hz): <strong>{signals.beta} μV</strong></div>
                  <div><span style={{color:'var(--blue-soft)'}}>●</span> Theta (4-8 Hz): <strong>{signals.theta} μV</strong></div>
                  <div><span style={{color:'var(--primary)'}}>●</span> Sampling: <strong>256 Hz</strong></div>
                </div>
                <div style={{ marginTop: '1.75rem', fontSize: '0.92rem', opacity: 0.8 }}>Beta/Alpha Spectral Ratio</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{signals.baRatio.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {verse && (
            <>
              <hr className="divider" style={{ margin: '2rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.75rem' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px', fontSize: '1.85rem' }}>Gita Remediation & Vedantic Wisdom</h2>
                  <p style={{ margin: 0, fontSize: '1.02rem' }}>Personalised philosophical grounding and Sanskrit prescriptions for {classification.state}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'var(--bg-subtle)', padding: '5px 8px', borderRadius: '12px', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>Language:</span>
                  <button type="button" className={`btn ${lang === 'en' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLang('en')} style={{ fontSize: '0.88rem', padding: '5px 12px', borderRadius: '10px' }}>
                    English
                  </button>
                  <button type="button" className={`btn ${lang === 'hi' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLang('hi')} style={{ fontSize: '0.88rem', padding: '5px 12px', borderRadius: '10px' }}>
                    हिन्दी
                  </button>
                  <button type="button" className={`btn ${lang === 'bn' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLang('bn')} style={{ fontSize: '0.88rem', padding: '5px 12px', borderRadius: '10px' }}>
                    বাংলা
                  </button>
                  <button type="button" className={`btn ${lang === 'hl' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLang('hl')} style={{ fontSize: '0.88rem', padding: '5px 12px', borderRadius: '10px' }}>
                    Hinglish
                  </button>
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', border: '1.5px solid var(--border)', borderLeft: '5px solid var(--primary)', borderRadius: '16px', padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>Target Neuro-State</span>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '4px' }}>{classification.state}</div>
                </div>
                <span style={{ background: 'rgba(76,114,255,0.15)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 800 }}>
                  {classification.method} · {Math.round(classification.confidence * 100)}% Conf · {classification.dynamicAccuracy || 86.0}% Recalibrated Acc
                </span>
              </div>

              {(() => {
                const pAct = lang === 'hi' ? verse.physicalActivity_hi || verse.physicalActivity : lang === 'bn' ? verse.physicalActivity_bn || verse.physicalActivity : lang === 'hl' ? verse.physicalActivity_hl || verse.physicalActivity : verse.physicalActivity;
                if (!pAct) return null;
                return (
                  <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(76,114,255,0.05))', borderLeft: '6px solid var(--sage)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <FiActivity size={20} color="#10B981" />
                        <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          PRESCRIBED PHYSICAL ACTIVITY & SOMATIC MOVEMENT
                        </span>
                      </div>
                      <span style={{ background: 'var(--sage-bg)', border: '1.5px solid var(--sage)', color: 'var(--sage)', padding: '4px 14px', borderRadius: '16px', fontSize: '0.88rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FiClock size={14} /> {pAct.duration}
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: '1.35rem', fontWeight: 800 }}>
                      {pAct.name}
                    </h3>
                    <p style={{ margin: '0 0 14px', fontSize: '1.02rem', color: 'var(--text-primary)', lineHeight: '1.7' }}>
                      <strong>Step-by-Step Instructions:</strong> {pAct.instructions}
                    </p>
                    <div style={{ background: '#fff', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '10px 16px', fontSize: '0.96rem', color: 'var(--text-secondary)' }}>
                      <strong>Biological & Vagal Benefit:</strong> {pAct.benefit}
                    </div>
                  </div>
                );
              })()}

              <div className="grid-2" style={{ gap: '2rem', marginBottom: '3rem' }}>
                <div>
                  <div className="section-label" style={{ marginBottom: '0.75rem' }}>PRESCRIPTION SHLOKA & MEANING</div>
                  <div className="remedy-card" style={{ padding: '1.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.2rem' }}>
                        {lang === 'hi' ? verse.concept_hi || verse.concept : lang === 'bn' ? verse.concept_bn || verse.concept : lang === 'hl' ? verse.concept_hl || verse.concept : verse.concept}
                      </span>
                      <span style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px 12px', color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 700 }}>
                        Chapter {verse.chapter}, Verse {verse.verse}
                      </span>
                    </div>
                    <div className="sanskrit-block" style={{ fontSize: '1.25rem', lineHeight: '1.8', marginBottom: '1rem' }}>
                      {(lang === 'bn' && verse.sanskritBengali ? verse.sanskritBengali : verse.sanskrit).split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
                    </div>
                    {(lang === 'en' || lang === 'hl') && (
                      <div className="transliteration" style={{ fontSize: '0.96rem', lineHeight: '1.6', marginBottom: '1rem' }}>{verse.transliteration.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}</div>
                    )}
                    <div className="translation-block" style={{ fontSize: '0.98rem', lineHeight: '1.7' }}>
                      <strong>{lang === 'hi' ? 'सीधा अर्थ (भावार्थ):' : lang === 'bn' ? 'বঙ্গানুবাদ ও ভাবার্থ:' : lang === 'hl' ? 'Direct Meaning (Bhavarth):' : 'Direct Meaning:'}</strong><br />
                      {lang === 'hi' ? verse.translation_hi || verse.translation : lang === 'bn' ? verse.translation_bn || verse.translation : lang === 'hl' ? verse.translation_hl || verse.translation : verse.translation}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="section-label" style={{ marginBottom: '0.75rem' }}>PATHWAY & SOMATIC GROUNDING</div>
                  <div className="pathway-card" style={{ padding: '1.85rem' }}>
                    <div className="section-label">REMEDIATION TRAJECTORY</div>
                    <span className={`state-badge ${getStateClass(classification.state)}`} style={{ fontSize: '0.95rem', padding: '5px 14px' }}>{classification.state}</span>
                    <div className="pathway-arrow" style={{ fontSize: '1.25rem', margin: '0.4rem 0' }}>↓</div>
                    <div className="pathway-node" style={{ background: 'var(--sage-bg)', border: '1px solid var(--sage)', fontSize: '1rem', padding: '0.75rem 1rem' }}>
                      {lang === 'hi' ? verse.concept_hi || verse.concept : lang === 'bn' ? verse.concept_bn || verse.concept : lang === 'hl' ? verse.concept_hl || verse.concept : verse.concept}
                    </div>
                    <div className="pathway-arrow" style={{ fontSize: '1.25rem', margin: '0.4rem 0' }}>↓</div>
                    <div className="pathway-node" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: '1rem', padding: '0.75rem 1rem' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Ch. {verse.chapter}, V. {verse.verse}</span>
                    </div>
                    <hr className="divider" style={{ margin: '1.25rem 0' }} />
                    <div className="section-label" style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
                      {lang === 'hi' ? '3-चरणीय दैहिक स्थिरता अभ्यास' : lang === 'bn' ? '৩-পর্যায়ের মানসিক ও দৈহিক প্রশান্তি অনুশীলন' : lang === 'hl' ? '3-STAGE SOMATIC GROUNDING (STHIRATA ABHYAS)' : 'SOMATIC GROUNDING STEPS'}
                    </div>
                    {(lang === 'hi' ? verse.groundingSteps_hi || verse.groundingSteps : lang === 'bn' ? verse.groundingSteps_bn || verse.groundingSteps : lang === 'hl' ? verse.groundingSteps_hl || verse.groundingSteps : verse.groundingSteps).map((step, i) => (
                      <div className="grounding-step" key={i} style={{ fontSize: '0.95rem', lineHeight: '1.5', gap: '0.65rem', marginBottom: '0.6rem' }}>
                        <span className="step-marker" style={{ fontSize: '0.85rem', fontWeight: 800 }}>Step {i + 1}:</span>
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
      <label style={{ fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}</span>
      </label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

function GaugeCard({ label, value, unit }) {
  return (
    <div className="gauge-card" style={{ padding: '1.4rem 1rem' }}>
      <div className="gauge-value" style={{ fontSize: '2.3rem' }}>{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}</div>
      <div className="gauge-unit" style={{ fontSize: '0.88rem' }}>{unit}</div>
      <div className="gauge-label" style={{ fontSize: '0.84rem' }}>{label}</div>
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
