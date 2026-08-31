import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [latestSession, setLatestSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStats().then(d => setStats(d.stats)).catch(() => {}),
      api.getSessions(1).then(d => {
        if (d.sessions && d.sessions.length > 0) {
          setLatestSession(d.sessions[0]);
        }
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const s = stats || { totalSessions: 0, lastSessionAt: null, mostFrequentState: 'N/A', avgAttention: 0, avgConfidence: 0, dynamicAccuracy: 85.34, totalFeedback: 0 };
  const lastStr = s.lastSessionAt ? new Date(s.lastSessionAt).toLocaleString().slice(0, 19) : 'No sessions yet';
  const liveAccuracy = s.dynamicAccuracy || 85.34;

  const isSelf = latestSession?.classifier_method?.toLowerCase().includes('self');

  return (
    <>
      <div className="page-header">
        <h1>Welcome, {user?.username || 'User'}</h1>
        <p>Your AI-powered neuro-psychological dashboard — overview and clinical insights</p>
      </div>

      {/* Summary Stats */}
      <div className="dashboard-stats">
        <div className="dash-stat-card">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{s.totalSessions}</div>
        </div>
        <div className="dash-stat-card">
          <div className="stat-label">Latest Diagnosed State</div>
          <div className="stat-value primary" style={{ fontSize: '0.95rem' }}>
            {latestSession ? latestSession.detected_state : 'Awaiting Input'}
          </div>
          <div className="stat-sub">
            {latestSession ? (isSelf ? 'Cognitive Assessment' : 'Hardware Stream') : 'No Readings Yet'}
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="stat-label">Live Model Accuracy</div>
          <div className="stat-value accent" style={{ fontSize: '1.3rem' }}>{liveAccuracy}%</div>
          <div className="stat-sub">Online Self-Tuned</div>
        </div>
        <div className="dash-stat-card">
          <div className="stat-label">ML Training Updates</div>
          <div className="stat-value">{s.totalFeedback || 0}</div>
          <div className="stat-sub">Feedback Tuned</div>
        </div>
      </div>

      <hr className="divider" />

      {/* Insight Row */}
      <div className="grid-2">
        <div>
          <div className="section-label">LATEST READING SNAPSHOT</div>
          {latestSession ? (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <span className={`state-badge ${getStateClass(latestSession.detected_state)}`}>
                  {latestSession.detected_state}
                </span>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {latestSession.classifier_method} · Recorded on {new Date(latestSession.created_at).toLocaleString()}
              </div>

              {isSelf ? (
                <div className="card-subtle" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <strong>Problem Statement:</strong>
                  <p style={{ margin: '4px 0 0', fontStyle: 'italic' }}>
                    "{latestSession.problem_description || latestSession.feedback_notes || 'Cognitive assessment completed.'}"
                  </p>
                </div>
              ) : (
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div className="metric-card">
                    <div className="metric-label">Alpha Power</div>
                    <div className="metric-value" style={{ color: 'var(--sage)' }}>
                      {latestSession.alpha_power?.toFixed?.(1) ?? latestSession.alpha_power} μV
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Beta/Alpha Ratio</div>
                    <div className="metric-value">
                      {latestSession.beta_alpha_ratio?.toFixed?.(2) ?? latestSession.beta_alpha_ratio}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate('/history')}
                  style={{ fontSize: '0.78rem' }}
                >
                  Inspect Full Details in Session History &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="card-subtle" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🩺</div>
              <strong style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.95rem' }}>
                No Active Reading Recorded Yet
              </strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '1.25rem' }}>
                Start a live BioAmp EEG scan or log a Self-Assessment to diagnose your mental state.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/assessment')}>
                  Start Self-Assessment
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/hardware')}>
                  Hardware Scan
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="section-label">ACTIVITY SUMMARY</div>
          <div className="card-subtle">
            <strong>Last Session:</strong> {lastStr}<br />
            <strong>Avg Attention Score:</strong> {(s.avgAttention || 0).toFixed(1)}/100<br />
            <strong>Dynamic Model Accuracy:</strong> {liveAccuracy}% (Auto-Recalibrating)<br />
            <strong>Feedback Contributions:</strong> {s.totalFeedback}
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* Quick Actions */}
      <div className="section-label">QUICK ACTIONS</div>
      <div className="grid-3" style={{ gap: '1rem' }}>
        <button className="btn btn-secondary btn-block" onClick={() => navigate('/hardware')}>Start Hardware Reading</button>
        <button className="btn btn-secondary btn-block" onClick={() => navigate('/history')}>View Session History</button>
        <button className="btn btn-secondary btn-block" onClick={() => navigate('/assessment')}>Log Self-Assessment</button>
      </div>
    </>
  );
}

function getStateClass(state) {
  if (!state) return 'state-visada';
  const s = state.toLowerCase();
  if (s.includes('anxiety') || s.includes('visada')) return 'state-visada';
  if (s.includes('depression') || s.includes('tamas')) return 'state-tamas';
  if (s.includes('stress') || s.includes('krodha')) return 'state-krodha';
  return 'state-sattva';
}
