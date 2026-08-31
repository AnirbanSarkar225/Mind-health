import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [classification, setClassification] = useState(null);

  useEffect(() => {
    api.getStats().then(d => setStats(d.stats)).catch(() => {});
    api.classify({ bpm: 0, hrv: 0, attention: 0, meditation: 0, alpha: 0, beta: 0, theta: 0, baRatio: 0 })
      .then(d => setClassification(d)).catch(() => {});
  }, []);

  const s = stats || { totalSessions: 0, lastSessionAt: null, mostFrequentState: 'N/A', avgBpm: 0, avgMeditation: 0, avgConfidence: 0, totalFeedback: 0 };
  const lastStr = s.lastSessionAt ? new Date(s.lastSessionAt).toLocaleString().slice(0, 19) : 'No sessions yet';

  return (
    <>
      <div className="page-header">
        <h1>Welcome, {user?.username || 'User'}</h1>
        <p>Your AI-powered neuro-psychological dashboard — overview and quick actions</p>
      </div>

      {/* Summary Stats */}
      <div className="dashboard-stats">
        <div className="dash-stat-card">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{s.totalSessions}</div>
        </div>
        <div className="dash-stat-card">
          <div className="stat-label">Current State</div>
          <div className="stat-value primary" style={{fontSize:'1rem'}}>{classification?.state || 'Idle'}</div>
          <div className="stat-sub">{classification?.method || 'Awaiting'}</div>
        </div>
        <div className="dash-stat-card">
          <div className="stat-label">Most Frequent State</div>
          <div className="stat-value accent" style={{fontSize:'1rem'}}>{s.mostFrequentState}</div>
        </div>
        <div className="dash-stat-card">
          <div className="stat-label">ML Training Updates</div>
          <div className="stat-value">{classification?.mlUpdates || 0}</div>
        </div>
      </div>

      <hr className="divider" />

      {/* Insight Row */}
      <div className="grid-2">
        <div>
          <div className="section-label">LATEST READING SNAPSHOT</div>
          {classification && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span className={`state-badge ${getStateClass(classification.state)}`}>{classification.state}</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {classification.method} · Confidence: <strong style={{color:'var(--primary)'}}>{Math.round(classification.confidence * 100)}%</strong>
              </div>
              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="metric-card">
                  <div className="metric-label">Stress Index</div>
                  <div className="metric-value">{Math.round(classification.stressIdx)}/100</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Calm Score</div>
                  <div className="metric-value">{Math.round(classification.calmScore)}/100</div>
                </div>
              </div>
            </>
          )}
        </div>
        <div>
          <div className="section-label">ACTIVITY SUMMARY</div>
          <div className="card-subtle">
            <strong>Last Session:</strong> {lastStr}<br />
            <strong>Avg Heart Rate:</strong> {s.avgBpm.toFixed(1)} bpm<br />
            <strong>Avg Meditation Score:</strong> {s.avgMeditation.toFixed(1)}/100<br />
            <strong>Feedback Contributions:</strong> {s.totalFeedback}
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* Quick Actions */}
      <div className="section-label">QUICK ACTIONS</div>
      <div className="grid-3" style={{ gap: '1rem' }}>
        <button className="btn btn-primary btn-block" onClick={() => navigate('/hardware')}>Start New Reading</button>
        <button className="btn btn-secondary btn-block" onClick={() => navigate('/history')}>View Session History</button>
        <button className="btn btn-secondary btn-block" onClick={() => navigate('/assessment')}>Log Self-Assessment</button>
      </div>
    </>
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
