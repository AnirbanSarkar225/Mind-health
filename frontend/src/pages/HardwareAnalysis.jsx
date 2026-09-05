import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import useESP32Data from '../hooks/useESP32Data';
import { FiActivity, FiClock, FiCheckCircle, FiArrowLeft, FiWifi, FiWifiOff, FiCpu, FiZap } from 'react-icons/fi';
import { FaWaveSquare, FaBrain } from 'react-icons/fa6';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BAR_COLORS = ['var(--red-soft)', 'var(--blue-soft)', 'var(--amber-soft)', 'var(--green-soft)'];
const BAR_LABELS = ['Anxiety', 'Depression', 'Stress', 'Equilibrium'];

export default function HardwareAnalysis() {
  const navigate = useNavigate();

  // ── Live ESP32 data via WebSocket ────────────────────────────────────────
  const { latestData, classification: liveClassification, history, connectionStatus, isLive, reconnect } = useESP32Data({ maxHistory: 120 });

  // ── Manual signals (fallback when ESP32 not connected) ───────────────────
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
  const [savedMessage, setSavedMessage] = useState('');

  // ── LLM State ────────────────────────────────────────────────────────────
  const [llmAvailable, setLlmAvailable] = useState(false);
  const [neuralInsight, setNeuralInsight] = useState(null);
  const [llmCalibration, setLlmCalibration] = useState(null);
  const [useLLMCalibration, setUseLLMCalibration] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);

  // Check LLM availability on mount
  useEffect(() => {
    api.llmStatus()
      .then((d) => setLlmAvailable(d.available))
      .catch(() => setLlmAvailable(false));
  }, []);

  // Auto-populate signals from live ESP32 data
  useEffect(() => {
    if (isLive && latestData) {
      setSignals({
        attention: latestData.attention ?? 50,
        meditation: latestData.meditation ?? 50,
        alpha: latestData.alpha ?? 15,
        beta: latestData.beta ?? 10,
        theta: latestData.theta ?? 12,
        baRatio: latestData.ba_ratio ?? 0.67,
      });
    }
  }, [isLive, latestData]);

  // Auto-classify from live data
  useEffect(() => {
    if (liveClassification) {
      setClassification(liveClassification);
    }
  }, [liveClassification]);

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

      // LLM Calibration (if enabled and available)
      if (useLLMCalibration && llmAvailable) {
        api.llmCalibrate({
          signals,
          ruleState: result.state,
          mlState: result.state,
          confidence: result.confidence,
        }).then((cal) => {
          if (cal && !cal.fallback) setLlmCalibration(cal);
        }).catch(() => {});
      }

      await api.saveSessions({
        attention: signals.attention,
        meditation: signals.meditation,
        alpha: signals.alpha,
        beta: signals.beta,
        theta: signals.theta,
        baRatio: signals.baRatio,
        state: result.state,
        method: isLive ? 'BioAmp Live Stream' : (result.method || 'BioAmp Hardware Stream'),
        confidence: Math.min(0.80, result.confidence || 0.80),
      });
      setSavedMessage(isLive ? 'Live ESP32 sensor recording saved' : 'Hardware sensor recording saved to session history');
      setTimeout(() => setSavedMessage(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch LLM neural insight
  const fetchNeuralInsight = async () => {
    if (!llmAvailable) return;
    setInsightLoading(true);
    try {
      const res = await api.llmAnalyze({
        signals,
        answers: {},
        state: classification?.state || 'unknown',
        description: `Live EEG reading - Attention: ${signals.attention}, Meditation: ${signals.meditation}, Alpha: ${signals.alpha}μV, Beta: ${signals.beta}μV, Theta: ${signals.theta}μV, B/A Ratio: ${signals.baRatio}`,
      });
      if (res && !res.fallback) {
        setNeuralInsight(res);
      }
    } catch (e) {
      console.error('Neural insight error:', e);
    }
    setInsightLoading(false);
  };

  const verse = classification?.verse;
  const statusColor = connectionStatus === 'connected' ? '#10B981' : connectionStatus === 'reconnecting' ? '#F59E0B' : '#EF4444';
  const statusIcon = connectionStatus === 'connected' ? <FiWifi size={14} /> : <FiWifiOff size={14} />;
  const statusText = connectionStatus === 'connected' ? 'ESP32 Live' : connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected';

  // Prepare chart data
  const chartData = history.slice(-60).map((r, i) => ({
    idx: i,
    alpha: r.alpha?.toFixed(1) ?? 0,
    beta: r.beta?.toFixed(1) ?? 0,
    theta: r.theta?.toFixed(1) ?? 0,
    attention: r.attention?.toFixed(0) ?? 0,
  }));

  return (
    <>
      <button className="back-to-dash" onClick={() => navigate('/')}>
        <FiArrowLeft size={16} /> Back to Dashboard
      </button>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span className="medical-header-badge">
            <FaWaveSquare size={13} /> Hardware Telemetry
          </span>
          {/* ── Live Connection Status Badge ───────────── */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: `${statusColor}18`, border: `1.5px solid ${statusColor}`,
            color: statusColor, padding: '4px 12px', borderRadius: '20px',
            fontSize: '0.82rem', fontWeight: 800,
          }}>
            {statusIcon} {statusText}
          </span>
          {llmAvailable && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: 'rgba(139,92,246,0.12)', border: '1.5px solid #8B5CF6',
              color: '#8B5CF6', padding: '4px 12px', borderRadius: '20px',
              fontSize: '0.82rem', fontWeight: 800,
            }}>
              <FaBrain size={12} /> Gemini LLM Active
            </span>
          )}
        </div>
        <h1 style={{ fontSize: '2.2rem' }}>EEG Hardware & Analysis</h1>
        <p style={{ fontSize: '1.02rem' }}>
          {isLive
            ? 'Receiving live BioAmp EXG Pill telemetry via ESP32 WiFi — real-time brainwave analysis & AI Vedantic remediation'
            : 'BioAmp EXG Pill telemetry, real-time brainwave spectrum analysis, and AI Vedantic remediation'}
        </p>
      </div>

      {/* ── Signal Source Card ──────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h4 style={{ fontSize: '1.25rem', margin: 0 }}>
            {isLive ? '🟢 Live ESP32 Telemetry Stream' : 'Signal Source — BioAmp EEG Calibration'}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.98rem', fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" checked={useML} onChange={(e) => setUseML(e.target.checked)} />
              ML Gaussian Classifier
            </label>
            {llmAvailable && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.98rem', fontWeight: 600, cursor: 'pointer', color: '#8B5CF6' }}>
                <input type="checkbox" checked={useLLMCalibration} onChange={(e) => setUseLLMCalibration(e.target.checked)} />
                <FaBrain size={13} /> LLM Calibration
              </label>
            )}
          </div>
        </div>

        {isLive ? (
          <div style={{
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
          }}>
            <FiZap size={18} color="#10B981" />
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10B981' }}>
              Auto-populating from ESP32 live stream — signals update every 500ms
            </span>
            <button className="btn btn-secondary btn-sm" onClick={reconnect} style={{ marginLeft: 'auto', fontSize: '0.85rem' }}>
              Reconnect
            </button>
          </div>
        ) : (
          <div style={{
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: '12px', padding: '0.85rem 1.25rem', marginBottom: '1rem',
            fontSize: '0.92rem', color: '#92400E',
          }}>
            <FiWifiOff size={14} style={{ marginRight: '6px' }} />
            ESP32 not connected — using manual calibration sliders. Connect your BioAmp hardware to receive live data.
          </div>
        )}

        <div className="gauges-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem' }}>
          <SliderInput label="EEG Attention" min={0} max={100} value={signals.attention} onChange={v => updateSignal('attention', v)} disabled={isLive} />
          <SliderInput label="Alpha Power (μV)" min={1} max={50} value={signals.alpha} onChange={v => updateSignal('alpha', v)} disabled={isLive} />
          <SliderInput label="Beta Power (μV)" min={1} max={50} value={signals.beta} onChange={v => updateSignal('beta', v)} disabled={isLive} />
          <SliderInput label="Theta Power (μV)" min={1} max={50} value={signals.theta} onChange={v => updateSignal('theta', v)} disabled={isLive} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={runClassification} style={{ padding: '0.85rem 1.85rem', fontSize: '1.02rem' }}>
            {isLive ? 'Classify Live Biosignals' : 'Analyze EEG Biosignals'}
          </button>
          {llmAvailable && classification && (
            <button className="btn btn-secondary" onClick={fetchNeuralInsight} disabled={insightLoading} style={{ padding: '0.85rem 1.5rem', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaBrain size={14} /> {insightLoading ? 'Analyzing...' : 'AI Neural Insight'}
            </button>
          )}
          {savedMessage && (
            <span style={{ color: 'var(--sage)', fontWeight: 700, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FiCheckCircle size={16} /> {savedMessage}
            </span>
          )}
        </div>
      </div>

      {/* ── Real-Time EEG Charts (when history available) ─────── */}
      {chartData.length > 3 && (
        <>
          <div className="section-label" style={{ marginBottom: '1rem' }}>REAL-TIME BRAINWAVE SPECTRUM</div>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="idx" tick={false} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.88rem' }} />
                <Line type="monotone" dataKey="alpha" stroke="#10B981" strokeWidth={2} dot={false} name="Alpha (8-13Hz)" />
                <Line type="monotone" dataKey="beta" stroke="#F59E0B" strokeWidth={2} dot={false} name="Beta (13-30Hz)" />
                <Line type="monotone" dataKey="theta" stroke="#3B82F6" strokeWidth={2} dot={false} name="Theta (4-8Hz)" />
                <Line type="monotone" dataKey="attention" stroke="#8B5CF6" strokeWidth={1.5} dot={false} name="Attention" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="section-label" style={{ marginBottom: '1rem' }}>EEG TELEMETRY METRICS</div>
      <div className="gauges-row" style={{ gap: '1.25rem', marginBottom: '2.5rem' }}>
        <GaugeCard label="EEG Attention" value={signals.attention} unit="/100" />
        <GaugeCard label="Alpha Wave (8-13Hz)" value={signals.alpha} unit="μV" />
        <GaugeCard label="Beta Wave (13-30Hz)" value={signals.beta} unit="μV" />
        <GaugeCard label="Theta Wave (4-8Hz)" value={signals.theta} unit="μV" />
        <GaugeCard label="Beta/Alpha Ratio" value={signals.baRatio} unit="ratio" />
      </div>

      {/* ── LLM Neural Insight Panel ──────────────────────────── */}
      {neuralInsight && (
        <>
          <div className="section-label" style={{ marginBottom: '1rem' }}>
            <FaBrain size={13} style={{ marginRight: '6px' }} /> AI NEURAL ANALYSIS (GEMINI)
          </div>
          <div className="card" style={{ marginBottom: '2rem', padding: '1.85rem', borderLeft: '5px solid #8B5CF6', background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(76,114,255,0.04))' }}>
            {neuralInsight.summary && (
              <p style={{ fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                {neuralInsight.summary}
              </p>
            )}
            {neuralInsight.insights && neuralInsight.insights.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#8B5CF6', marginBottom: '0.5rem' }}>Key Observations</div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.96rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                  {neuralInsight.insights.map((ins, i) => <li key={i}>{ins}</li>)}
                </ul>
              </div>
            )}
            {neuralInsight.recommendations && neuralInsight.recommendations.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#10B981', marginBottom: '0.5rem' }}>Recommendations</div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.96rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                  {neuralInsight.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>
            )}
            {neuralInsight.neuralPattern && (
              <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '10px 16px', fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                <strong style={{ color: '#8B5CF6' }}>Neural Pattern:</strong> {neuralInsight.neuralPattern}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── LLM Calibration Notice ────────────────────────────── */}
      {llmCalibration && (
        <div style={{ background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.3)', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <FaBrain size={18} color="#8B5CF6" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
            <strong style={{ color: '#8B5CF6' }}>LLM Calibration:</strong>{' '}
            {llmCalibration.reasoning}
            {llmCalibration.suggestedState && llmCalibration.suggestedState !== classification?.state && (
              <span style={{ display: 'block', marginTop: '4px', fontWeight: 700, color: '#8B5CF6' }}>
                Suggested adjustment: {llmCalibration.suggestedState} (Confidence: {Math.round((llmCalibration.calibratedConfidence || 0.7) * 100)}%)
              </span>
            )}
          </div>
        </div>
      )}

      {classification && (
        <>
          <div className="section-label" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>ASSESSMENT & CLASSIFICATION</div>
          <div className="grid-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <span className={`state-badge ${getStateClass(classification.state)}`} style={{ fontSize: '1.1rem', padding: '6px 18px' }}>{classification.state}</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                {classification.method} · Confidence: <strong style={{color:'var(--primary)'}}>{Math.min(69.8, Math.round((classification.confidence || 0.698) * 100))}%</strong> · Dynamic Accuracy: <strong style={{color:'var(--accent)'}}>{classification.dynamicAccuracy || 69.8}%</strong>
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
                {isLive && (
                  <div style={{ marginTop: '1rem', fontSize: '0.82rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                    Live stream — {history.length} readings buffered
                  </div>
                )}
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
                  {classification.method} · {Math.round(classification.confidence * 100)}% Conf · {classification.dynamicAccuracy || 69.8}% Recalibrated Acc
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
                      {lang === 'hi' ? '3-चरणीय दैहिक स्थिरता अभ्यास' : lang === 'bn' ? '৩-পর্যায়ের মানসিক ও দৈহিক প্রশান্তি অনুশীলন' : lang === 'hl' ? '3-STAGE SOMATIC GROUNDING (STHIRATA ABHYAS)' : 'SOMATIC GROUNDING STEPS'}
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

function SliderInput({ label, min, max, step = 1, value, onChange, disabled = false }) {
  return (
    <div className="slider-group">
      <label style={{ fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ color: disabled ? '#10B981' : 'var(--primary)', fontWeight: 800 }}>
          {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
          {disabled && <span style={{ fontSize: '0.7rem', marginLeft: '4px', opacity: 0.7 }}>LIVE</span>}
        </span>
      </label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} disabled={disabled} style={disabled ? { opacity: 0.5 } : {}} />
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
