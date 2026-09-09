import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import useESP32Data from '../hooks/useESP32Data';
import { FiActivity, FiClock, FiCheckCircle, FiArrowLeft, FiWifi, FiWifiOff, FiCpu, FiZap, FiHeart, FiDroplet } from 'react-icons/fi';
import { FaWaveSquare, FaBrain, FaHeartPulse } from 'react-icons/fa6';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BAR_COLORS = ['var(--red-soft)', 'var(--blue-soft)', 'var(--amber-soft)', 'var(--green-soft)'];
const BAR_LABELS = ['Anxiety', 'Depression', 'Stress', 'Equilibrium'];

export default function HardwareAnalysis() {
  const navigate = useNavigate();

  // ── Live ESP32 data via WebSocket ────────────────────────────────────────
  const { latestData, classification: liveClassification, history, connectionStatus, isLive, reconnect } = useESP32Data({ maxHistory: 120 });

  // ── Signals (starts clean at 0, only live numbers displayed) ──────────────
  const [signals, setSignals] = useState({
    attention: 0,
    meditation: 0,
    alpha: 0,
    beta: 0,
    theta: 0,
    baRatio: 0,
    bpm: 0,
    spo2: 0,
    hrv_sdnn: 0,
    finger: 0,
    measuring: 0,
    ready: 0,
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

  // Auto-populate signals from live ESP32 data (pure live numbers, zero stock defaults)
  useEffect(() => {
    if (isLive && latestData) {
      setSignals({
        attention: latestData.attention ?? 0,
        meditation: latestData.meditation ?? 0,
        alpha: latestData.alpha ?? 0,
        beta: latestData.beta ?? 0,
        theta: latestData.theta ?? 0,
        baRatio: latestData.ba_ratio ?? 0,
        bpm: latestData.bpm ?? 0,
        spo2: latestData.spo2 ?? 0,
        hrv_sdnn: latestData.hrv_sdnn ?? 0,
        finger: latestData.finger ?? 0,
        measuring: latestData.measuring ?? 0,
        ready: latestData.ready ?? 0,
      });
    }
  }, [isLive, latestData]);

  // Auto-classify from live data
  useEffect(() => {
    if (liveClassification) {
      setClassification(liveClassification);
    } else if (isLive) {
      setClassification(null);
    }
  }, [liveClassification, isLive]);

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
        bpm: signals.bpm || 0,
        spo2: signals.spo2 || 0,
        attention: signals.attention,
        meditation: signals.meditation,
        alpha: signals.alpha,
        beta: signals.beta,
        theta: signals.theta,
        baRatio: signals.baRatio,
        state: result.state,
        method: isLive ? 'BioAmp + MAX30102 Live Telemetry' : (result.method || 'BioAmp Hardware Stream'),
        confidence: Math.min(0.80, result.confidence || 0.80),
      });
      setSavedMessage(isLive ? 'Live ESP32 EEG & SpO2 recording saved' : 'Hardware sensor recording saved to session history');
      setTimeout(() => setSavedMessage(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch LLM neural & cardiovascular insight
  const fetchNeuralInsight = async () => {
    if (!llmAvailable) return;
    setInsightLoading(true);
    try {
      const res = await api.llmAnalyze({
        signals,
        answers: {},
        state: classification?.state || 'unknown',
        description: `Live Biosignal reading - Heart Rate: ${signals.bpm ? `${signals.bpm} BPM` : 'N/A'}, SpO2: ${signals.spo2 ? `${signals.spo2}%` : 'N/A'}, Attention: ${signals.attention}, Meditation: ${signals.meditation}, Alpha: ${signals.alpha}μV, Beta: ${signals.beta}μV, Theta: ${signals.theta}μV, B/A Ratio: ${signals.baRatio}`,
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
  const statusColor = isLive ? '#10B981' : connectionStatus === 'reconnecting' ? '#F59E0B' : '#94A3B8';
  const statusIcon = isLive ? <FiWifi size={14} /> : <FiWifiOff size={14} />;
  const statusText = isLive ? 'ESP32 Live' : connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'ESP32 Standby';

  // Prepare chart data
  const chartData = history.slice(-60).map((r, i) => ({
    idx: i,
    alpha: r.alpha?.toFixed(1) ?? 0,
    beta: r.beta?.toFixed(1) ?? 0,
    theta: r.theta?.toFixed(1) ?? 0,
    attention: r.attention?.toFixed(0) ?? 0,
    bpm: r.bpm && r.bpm > 0 ? Number(r.bpm.toFixed(0)) : null,
    spo2: r.spo2 && r.spo2 > 0 ? Number(r.spo2.toFixed(0)) : null,
  }));

  // Cardiovascular qualitative status based on live ESP32 hardware state
  const getBpmStatus = (bpm, finger, measuring) => {
    if (!finger || finger === 0) return { text: 'Place finger on MAX30102', color: 'var(--text-muted)' };
    if (measuring === 1) return { text: 'Measuring... Keep finger still', color: '#F59E0B' };
    if (!bpm || bpm <= 0) return { text: 'Acquiring pulse waveform...', color: '#3B82F6' };
    if (bpm < 60) return { text: 'Resting Bradycardia (<60 BPM)', color: '#3B82F6' };
    if (bpm <= 100) return { text: 'Normal Resting Pulse (60–100 BPM)', color: '#10B981' };
    return { text: 'Elevated Pulse / Tachycardia (>100 BPM)', color: '#EF4444' };
  };

  const getSpo2Status = (spo2, finger, measuring) => {
    if (!finger || finger === 0) return { text: 'Waiting for finger contact', color: 'var(--text-muted)' };
    if (measuring === 1) return { text: 'Analyzing optical absorption...', color: '#F59E0B' };
    if (!spo2 || spo2 <= 0) return { text: 'Calculating SpO2 saturation...', color: '#3B82F6' };
    if (spo2 >= 95) return { text: 'Optimal Oxygenation (95–100%)', color: '#10B981' };
    if (spo2 >= 90) return { text: 'Mild Hypoxia (90–94%)', color: '#F59E0B' };
    return { text: 'Hypoxia Alert (<90%)', color: '#EF4444' };
  };

  const getHrvStatus = (hrv, finger, measuring) => {
    if (!finger || finger === 0) return { text: 'Awaiting sensor contact', color: 'var(--text-muted)' };
    if (measuring === 1) return { text: 'Sampling beat intervals...', color: '#F59E0B' };
    if (!hrv || hrv <= 0) return { text: 'Accumulating pulse intervals...', color: '#3B82F6' };
    if (hrv >= 50) return { text: 'Healthy HRV (High Vagal Tone)', color: '#10B981' };
    if (hrv >= 30) return { text: 'Moderate Autonomic Tone', color: '#F59E0B' };
    return { text: 'Low HRV / Sympathetic Dominance', color: '#EF4444' };
  };

  const bpmInfo = getBpmStatus(signals.bpm, signals.finger, signals.measuring);
  const spo2Info = getSpo2Status(signals.spo2, signals.finger, signals.measuring);
  const hrvInfo = getHrvStatus(signals.hrv_sdnn, signals.finger, signals.measuring);

  // BioAmp noise detection: when BioAmp EXG is NOT connected, GPIO 34 reads floating ADC noise.
  // Noise signature: beta dominates (>70%), attention pegged at 100, alpha + theta very low.
  // This flag warns the user that EEG values are from electrical noise, not brain signals.
  const bioampNoise = isLive && signals.beta > 70 && signals.attention >= 100 && signals.alpha < 15;

  return (
    <>
      <style>{`
        @keyframes pulseHeart {
          0% { transform: scale(1); }
          15% { transform: scale(1.22); }
          30% { transform: scale(1); }
          45% { transform: scale(1.15); }
          60% { transform: scale(1); }
          100% { transform: scale(1); }
        }
        .heart-pulsing {
          animation: pulseHeart 1.1s infinite;
          display: inline-block;
        }
      `}</style>

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
              <FaBrain size={12} /> LLM Active
            </span>
          )}
        </div>
        <h1 style={{ fontSize: '2.2rem' }}>Multi-Modal Hardware Telemetry</h1>
        <p style={{ fontSize: '1.02rem' }}>
          {isLive
            ? 'Streaming live BioAmp EXG EEG & MAX30102 SpO2/Heart Rate telemetry via ESP32 WiFi'
            : 'BioAmp EXG EEG spectrum & MAX30102 Pulse Oximetry calibration with Vedantic remediation'}
        </p>
      </div>

      {/* ── Signal Source Card ──────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h4 style={{ fontSize: '1.25rem', margin: 0 }}>
            {isLive ? '🟢 Live ESP32 Telemetry Stream (EEG + SpO2)' : 'Signal Source — BioAmp EEG & Pulse Calibration'}
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
              Auto-populating from ESP32 live stream — EEG & SpO2 updates every 500ms
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
            ESP32 in standby — using manual calibration sliders. Connect your BioAmp & MAX30102 hardware to stream live telemetry.
          </div>
        )}

        {/* ── EEG Calibration Sliders ── */}
        <div style={{ fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
          Brainwave Spectrum Calibration
        </div>
        <div className="gauges-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <SliderInput label="EEG Attention" min={0} max={100} value={signals.attention} onChange={v => updateSignal('attention', v)} disabled={isLive} />
          <SliderInput label="Alpha Wave" min={0} max={100} value={signals.alpha} onChange={v => updateSignal('alpha', v)} disabled={isLive} />
          <SliderInput label="Beta Wave" min={0} max={100} value={signals.beta} onChange={v => updateSignal('beta', v)} disabled={isLive} />
          <SliderInput label="Theta Wave" min={0} max={100} value={signals.theta} onChange={v => updateSignal('theta', v)} disabled={isLive} />
        </div>

        {/* ── Pulse, SpO2 & HRV Sliders (Manual standby mode) ── */}
        <div style={{ fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
          Cardiovascular & Oxygenation Calibration
        </div>
        <div className="gauges-row" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem', marginBottom: '1rem' }}>
          <SliderInput label="Heart Rate (BPM)" min={0} max={200} value={signals.bpm} onChange={v => updateSignal('bpm', v)} disabled={isLive} />
          <SliderInput label="Blood Oxygen SpO2 (%)" min={0} max={100} value={signals.spo2} onChange={v => updateSignal('spo2', v)} disabled={isLive} />
          <SliderInput label="HRV SDNN (ms)" min={0} max={150} value={signals.hrv_sdnn} onChange={v => updateSignal('hrv_sdnn', v)} disabled={isLive} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={runClassification} style={{ padding: '0.85rem 1.85rem', fontSize: '1.02rem' }}>
            {isLive ? 'Classify Live Biosignals' : 'Analyze Multi-Modal Biosignals'}
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

      {/* ── Cardiovascular & SpO2 Telemetry Cards ────────────── */}
      <div className="section-label" style={{ marginBottom: '1rem' }}>
        <FaHeartPulse size={14} style={{ marginRight: '6px', color: '#EF4444' }} />
        CARDIOVASCULAR & PULSE OXIMETRY (MAX30102)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Heart Rate Card */}
        <div className="card" style={{ padding: '1.75rem', borderLeft: '5px solid #EF4444', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                Heart Rate / Pulse
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {signals.bpm && signals.bpm > 0 ? signals.bpm : '--'}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>BPM</span>
              </div>
            </div>
            <div style={{
              width: 52, height: 52, borderRadius: '14px',
              background: 'rgba(239,68,68,0.12)', color: '#EF4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FaHeartPulse size={26} className={signals.bpm > 0 ? 'heart-pulsing' : ''} />
            </div>
          </div>
          <div style={{
            marginTop: '1.25rem', padding: '8px 12px', borderRadius: '10px',
            background: 'var(--bg-subtle)', border: '1px solid var(--border)',
            fontSize: '0.92rem', fontWeight: 700, color: bpmInfo.color,
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: bpmInfo.color, display: 'inline-block' }}></span>
            {bpmInfo.text}
          </div>
        </div>

        {/* SpO2 Card */}
        <div className="card" style={{ padding: '1.75rem', borderLeft: '5px solid #0EA5E9', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                Blood Oxygen Saturation
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {signals.spo2 && signals.spo2 > 0 ? `${signals.spo2}` : '--'}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>% SpO₂</span>
              </div>
            </div>
            <div style={{
              width: 52, height: 52, borderRadius: '14px',
              background: 'rgba(14,165,233,0.12)', color: '#0EA5E9',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FiDroplet size={26} />
            </div>
          </div>
          <div style={{
            marginTop: '1.25rem', padding: '8px 12px', borderRadius: '10px',
            background: 'var(--bg-subtle)', border: '1px solid var(--border)',
            fontSize: '0.92rem', fontWeight: 700, color: spo2Info.color,
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: spo2Info.color, display: 'inline-block' }}></span>
            {spo2Info.text}
          </div>
        </div>

        {/* HRV SDNN Card */}
        <div className="card" style={{ padding: '1.75rem', borderLeft: '5px solid #8B5CF6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                Heart Rate Variability (HRV)
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {signals.hrv_sdnn && signals.hrv_sdnn > 0 ? Math.round(signals.hrv_sdnn) : '--'}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ms SDNN</span>
              </div>
            </div>
            <div style={{
              width: 52, height: 52, borderRadius: '14px',
              background: 'rgba(139,92,246,0.12)', color: '#8B5CF6',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FiActivity size={26} />
            </div>
          </div>
          <div style={{
            marginTop: '1.25rem', padding: '8px 12px', borderRadius: '10px',
            background: 'var(--bg-subtle)', border: '1px solid var(--border)',
            fontSize: '0.92rem', fontWeight: 700, color: hrvInfo.color,
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: hrvInfo.color, display: 'inline-block' }}></span>
            {hrvInfo.text}
          </div>
        </div>
      </div>

      {/* ── Real-Time EEG & Pulse Spectrum Charts ─────── */}
      {chartData.length > 3 && (
        <>
          <div className="section-label" style={{ marginBottom: '1rem' }}>REAL-TIME MULTI-MODAL TELEMETRY GRAPH</div>
          {bioampNoise && (
            <div style={{
              background: 'rgba(245,158,11,0.1)', border: '1.5px solid rgba(245,158,11,0.4)',
              borderRadius: '12px', padding: '0.85rem 1.25rem', marginBottom: '1rem',
              fontSize: '0.92rem', color: '#92400E', display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            }}>
              <FiCpu size={18} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>BioAmp EXG Not Connected</strong> — EEG readings are from ADC noise on GPIO 34 (floating pin).
                Beta dominance (~{signals.beta.toFixed(0)}%) and Attention pegged at 100 are characteristic of electrical noise, not brain signals.
                Connect BioAmp EXG electrodes to GPIO 34 for real EEG data.
              </div>
            </div>
          )}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="idx" tick={false} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.88rem' }} />
                <Line type="monotone" dataKey="alpha" stroke="#10B981" strokeWidth={2} dot={false} name="Alpha Wave (8-13Hz)" />
                <Line type="monotone" dataKey="beta" stroke="#F59E0B" strokeWidth={2} dot={false} name="Beta Wave (13-30Hz)" />
                <Line type="monotone" dataKey="theta" stroke="#3B82F6" strokeWidth={2} dot={false} name="Theta Wave (4-8Hz)" />
                <Line type="monotone" dataKey="attention" stroke="#8B5CF6" strokeWidth={1.5} dot={false} name="EEG Attention" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="bpm" stroke="#EF4444" strokeWidth={2} dot={false} name="Heart Rate (BPM)" connectNulls={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ── EEG Band Gauges ── */}
      <div className="section-label" style={{ marginBottom: '1rem' }}>
        EEG TELEMETRY METRICS
        {bioampNoise && (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F59E0B', marginLeft: '10px', textTransform: 'none', letterSpacing: 0 }}>
            ⚠ ADC Noise — BioAmp EXG not connected
          </span>
        )}
      </div>
      <div className="gauges-row" style={{ gap: '1.25rem', marginBottom: '2.5rem' }}>
        <GaugeCard label="EEG Attention" value={signals.attention} unit="/100" />
        <GaugeCard label="Alpha Wave (8-13Hz)" value={signals.alpha} unit="%" />
        <GaugeCard label="Beta Wave (13-30Hz)" value={signals.beta} unit="%" />
        <GaugeCard label="Theta Wave (4-8Hz)" value={signals.theta} unit="%" />
        <GaugeCard label="Beta/Alpha Ratio" value={signals.baRatio} unit="ratio" />
      </div>

      {/* ── LLM Neural Insight Panel ──────────────────────────── */}
      {neuralInsight && (
        <>
          <div className="section-label" style={{ marginBottom: '1rem' }}>
            <FaBrain size={13} style={{ marginRight: '6px' }} /> AI NEURAL ANALYSIS (LLM)
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
                <strong style={{ color: '#8B5CF6' }}>Physiological Pattern:</strong> {neuralInsight.neuralPattern}
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

      {classification ? (
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
              <div className="section-label" style={{ marginBottom: '1rem' }}>LIVE MULTI-MODAL SPECTRAL DENSITY</div>
              <div className="card" style={{ background: '#1B1B2D', color: '#fff', padding: '1.85rem', borderRadius: 'var(--radius-lg)', minHeight: 220 }}>
                <div style={{ fontSize: '0.95rem', opacity: 0.8, marginBottom: '0.75rem', fontWeight: 600 }}>Frontal EEG & Pulse Telemetry</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '1rem', marginTop: '1rem' }}>
                  <div><span style={{color:'var(--green-soft)'}}>●</span> Alpha (8-13 Hz): <strong>{signals.alpha}%</strong></div>
                  <div><span style={{color:'var(--amber-soft)'}}>●</span> Beta (13-30 Hz): <strong>{signals.beta}%</strong></div>
                  <div><span style={{color:'var(--blue-soft)'}}>●</span> Theta (4-8 Hz): <strong>{signals.theta}%</strong></div>
                  <div><span style={{color:'#EF4444'}}>●</span> Heart Rate: <strong>{signals.bpm > 0 ? `${signals.bpm} BPM` : '--'}</strong></div>
                  <div><span style={{color:'#0EA5E9'}}>●</span> SpO2 Oxygen: <strong>{signals.spo2 > 0 ? `${signals.spo2}%` : '--'}</strong></div>
                  <div><span style={{color:'#8B5CF6'}}>●</span> HRV SDNN: <strong>{signals.hrv_sdnn > 0 ? `${Math.round(signals.hrv_sdnn)} ms` : '--'}</strong></div>
                </div>
                <div style={{ marginTop: '1.75rem', fontSize: '0.92rem', opacity: 0.8 }}>Beta/Alpha Spectral Ratio</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{signals.baRatio.toFixed(2)}</div>
                {isLive && (
                  <div style={{ marginTop: '1rem', fontSize: '0.82rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
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
      ) : (
        <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', marginTop: '1.5rem', marginBottom: '2.5rem', border: '1.5px dashed var(--border)', background: 'var(--bg-subtle)', borderRadius: '16px' }}>
          <FaBrain size={38} style={{ color: 'var(--text-muted)', marginBottom: '0.85rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            {isLive ? 'Awaiting Live Biosignal Stream' : 'Awaiting Biosignal Assessment'}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.98rem', maxWidth: '560px', marginInline: 'auto', lineHeight: '1.6' }}>
            {isLive
              ? 'ESP32 telemetry stream connected. Place your finger on the MAX30102 sensor and connect BioAmp EXG electrodes (GPIO 34). Assessment and Gita guidance will display automatically when signals arrive.'
              : 'All biosignals currently start at 0. Adjust the calibration sliders above and click "Analyze Multi-Modal Biosignals", or stream live numbers directly from your ESP32.'}
          </p>
        </div>
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
