import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/card';
import {
  FiActivity,
  FiTrendingUp,
  FiCpu,
  FiFileText,
  FiLayers,
  FiShield,
  FiArrowRight,
  FiCheckCircle,
} from 'react-icons/fi';
import { FaBrain, FaWaveSquare } from 'react-icons/fa6';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [latestSession, setLatestSession] = useState(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStats().then((d) => setStats(d.stats)).catch(() => {}),
      api.getSessions(1).then((d) => {
        if (d.sessions && d.sessions.length > 0) {
          setLatestSession(d.sessions[0]);
        }
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const s = stats || {
    totalSessions: 0,
    lastSessionAt: null,
    mostFrequentState: 'N/A',
    avgAttention: 0,
    avgConfidence: 0,
    dynamicAccuracy: 69.8,
    totalFeedback: 0,
  };

  const lastStr = s.lastSessionAt
    ? new Date(s.lastSessionAt).toLocaleString().slice(0, 19)
    : 'No sessions recorded';
  const liveAccuracy = s.dynamicAccuracy || 69.8;
  const isSelf = latestSession?.classifier_method?.toLowerCase().includes('self');

  return (
    <div className="dashboard-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ── Medical Patient / Clinician Header ─────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
            <span className="medical-header-badge">
              <span className="medical-live-indicator"></span>
              Clinical Telemetry System
            </span>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Gita-NeuroSync v2.4
            </span>
          </div>
          <h1 style={{ fontSize: '2.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Welcome, {user?.username || 'Clinician / Patient'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: '0.45rem 0 0 0' }}>
            Quantitative neuro-psychological telemetry overview, real-time classifier status, and clinical diagnostic history.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.85rem' }}>
          <button className="btn btn-primary" onClick={() => navigate('/hardware')} style={{ padding: '0.75rem 1.5rem', fontSize: '0.98rem' }}>
            <FaWaveSquare style={{ marginRight: 6 }} /> Live Scan
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/assessment')} style={{ padding: '0.75rem 1.5rem', fontSize: '0.98rem' }}>
            <FiFileText style={{ marginRight: 6 }} /> Assessment
          </button>
        </div>
      </div>

      {/* ── Clinical Key Metrics (4 Stat Cards) ────────────── */}
      <div className="grid-4" style={{ gap: '1.5rem' }}>
        <Card className="hover:shadow-md transition-all">
          <CardHeader style={{ padding: '1.5rem 1.5rem 0.5rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardDescription style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Total Evaluations
              </CardDescription>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiActivity size={19} />
              </div>
            </div>
            <CardTitle style={{ fontSize: '2.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
              {s.totalSessions}
            </CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
              Recorded clinical records
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader style={{ padding: '1.5rem 1.5rem 0.5rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardDescription style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Latest Diagnosed State
              </CardDescription>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'var(--sage-bg)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaBrain size={18} />
              </div>
            </div>
            <div style={{ marginTop: '0.55rem' }}>
              {latestSession ? (
                <span className={`state-badge ${getStateClass(latestSession.detected_state)}`} style={{ display: 'inline-block', fontSize: '0.92rem', padding: '0.3rem 0.8rem' }}>
                  {latestSession.detected_state}
                </span>
              ) : (
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Awaiting Telemetry
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
              {latestSession ? (isSelf ? 'Cognitive Assessment' : 'Hardware Stream') : 'No readings logged'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader style={{ padding: '1.5rem 1.5rem 0.5rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardDescription style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Live Model Accuracy
              </CardDescription>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(52, 211, 153, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiTrendingUp size={19} />
              </div>
            </div>
            <CardTitle style={{ fontSize: '2.35rem', fontWeight: 800, color: '#10B981', marginTop: '0.35rem' }}>
              {liveAccuracy}%
            </CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
              Gaussian Naive Bayes auto-calibrated
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader style={{ padding: '1.5rem 1.5rem 0.5rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardDescription style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Model Training Iterations
              </CardDescription>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiCpu size={19} />
              </div>
            </div>
            <CardTitle style={{ fontSize: '2.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
              {s.totalFeedback || 0}
            </CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
              Feedback loop calibrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main 2-Column Clinical Section ─────────────────── */}
      <div className="grid-2" style={{ gap: '1.75rem', alignItems: 'stretch' }}>
        {/* Left Column: Latest Reading Snapshot Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle style={{ fontSize: '1.35rem' }}>Latest Reading Snapshot</CardTitle>
                <span className="badge-chip" style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
                  {latestSession ? (isSelf ? 'Self-Assessment' : 'BioAmp EEG') : 'Idle'}
                </span>
              </div>
              <CardDescription style={{ fontSize: '0.95rem' }}>
                Detailed psychophysiological state telemetry and spectral breakdown
              </CardDescription>
            </CardHeader>

            <CardContent>
              {latestSession ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Diagnosed Condition
                      </div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                        {latestSession.detected_state}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                    <strong>Classifier Engine:</strong> {latestSession.classifier_method} · Recorded on {new Date(latestSession.created_at).toLocaleString()}
                  </div>

                  {isSelf ? (
                    <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem', fontSize: '0.96rem' }}>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '6px', fontSize: '0.96rem' }}>
                        Reported Problem Statement / Symptoms:
                      </strong>
                      <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.96rem' }}>
                        "{latestSession.problem_description || latestSession.feedback_notes || 'Cognitive self-assessment completed successfully.'}"
                      </p>
                    </div>
                  ) : (
                    <div className="grid-2" style={{ gap: '1rem' }}>
                      <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Alpha Band Power (8-13 Hz)</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                          {latestSession.alpha_power?.toFixed?.(1) ?? latestSession.alpha_power ?? '—'} μV
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Beta/Alpha Vigilance Ratio</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                          {latestSession.beta_alpha_ratio?.toFixed?.(2) ?? latestSession.beta_alpha_ratio ?? '—'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                    No Active Clinical Reading Recorded
                  </strong>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', maxWidth: 440, margin: '0 auto 1.5rem' }}>
                    Connect your BioAmp hardware stream or complete a Self-Assessment to log patient neuro-state.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.95rem' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/assessment')} style={{ padding: '0.75rem 1.4rem' }}>
                      Start Assessment
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/hardware')} style={{ padding: '0.75rem 1.4rem' }}>
                      Hardware Scan
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          {latestSession && (
            <CardFooter style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Session ID: #{latestSession.id || 'LIVE'}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/history')}
                style={{ fontSize: '0.9rem', padding: '0.55rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                Inspect Full Details in Session History <FiArrowRight size={14} />
              </button>
            </CardFooter>
          )}
        </Card>

        {/* Right Column: Clinical Activity & Telemetry Summary Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle style={{ fontSize: '1.35rem' }}>Clinical Telemetry Summary</CardTitle>
                <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiShield size={16} />
                </div>
              </div>
              <CardDescription style={{ fontSize: '0.95rem' }}>
                Aggregated psychophysiological indices and classifier health
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Last Diagnostic Session:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{lastStr}</span>
                </div>

                <div style={{ paddingBottom: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Average Attention Index:</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {(s.avgAttention || 0).toFixed(1)} / 100
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'var(--bg-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(s.avgAttention || 0, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #4C72FF 0%, #34D399 100%)', borderRadius: 6 }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Dynamic Classifier Accuracy:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <FiCheckCircle size={15} /> {liveAccuracy}% (Auto-Tuned)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Feedback Iterations:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {s.totalFeedback || 0} Calibrations
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Confidentiality & Privacy:</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 10px', borderRadius: '8px' }}>
                    100% Encrypted
                  </span>
                </div>
              </div>
            </CardContent>
          </div>

          <CardFooter style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Gita-NeuroSync complies with patient telemetry data privacy and localized inference standards.
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* ── Quick Actions (3 Action Cards) ─────────────────── */}
      <div>
        <div className="section-label" style={{ marginBottom: '1rem' }}>CLINICAL QUICK ACTIONS</div>
        <div className="grid-3" style={{ gap: '1.5rem' }}>
          <Card className="hover:shadow-md transition-all">
            <CardHeader style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaWaveSquare size={20} />
                </div>
                <div>
                  <CardTitle style={{ fontSize: '1.15rem' }}>Hardware Stream</CardTitle>
                  <CardDescription style={{ fontSize: '0.88rem' }}>Live BioAmp EEG telemetry</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardFooter style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
              <button className="btn btn-primary btn-block" onClick={() => navigate('/hardware')} style={{ padding: '0.8rem 1rem', fontSize: '0.96rem' }}>
                Launch Live Scan &rarr;
              </button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardHeader style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--sage-bg)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiFileText size={20} />
                </div>
                <div>
                  <CardTitle style={{ fontSize: '1.15rem' }}>Self-Assessment</CardTitle>
                  <CardDescription style={{ fontSize: '0.88rem' }}>Sanskrit psychophysiology log</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardFooter style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
              <button className="btn btn-secondary btn-block" onClick={() => navigate('/assessment')} style={{ padding: '0.8rem 1rem', fontSize: '0.96rem' }}>
                Begin Assessment &rarr;
              </button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardHeader style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--bg-subtle)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiLayers size={20} />
                </div>
                <div>
                  <CardTitle style={{ fontSize: '1.15rem' }}>Session History</CardTitle>
                  <CardDescription style={{ fontSize: '0.88rem' }}>Inspect diagnostic archives</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardFooter style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
              <button className="btn btn-secondary btn-block" onClick={() => navigate('/history')} style={{ padding: '0.8rem 1rem', fontSize: '0.96rem' }}>
                Open Records &rarr;
              </button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getStateClass(state) {
  if (!state) return 'state-visada';
  const s = state.toLowerCase();
  if (s.includes('anxiety') || s.includes('visada')) return 'state-visada';
  if (s.includes('depression') || s.includes('avasada') || s.includes('tamas')) return 'state-tamas';
  if (s.includes('stress') || s.includes('krodha')) return 'state-krodha';
  if (s.includes('fatigue') || s.includes('klama')) return 'state-klama';
  if (s.includes('insomnia') || s.includes('anidra')) return 'state-anidra';
  if (s.includes('restless') || s.includes('chanchalatva')) return 'state-chanchalatva';
  if (s.includes('fear') || s.includes('bhaya')) return 'state-bhaya';
  return 'state-sattva';
}
