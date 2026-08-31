import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function SessionHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSessions(100)
      .then(d => setSessions(d.sessions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = sessions.length;
  const avgMed = total > 0 ? (sessions.reduce((a, s) => a + (s.eeg_meditation || 0), 0) / total).toFixed(1) : '0.0';
  const avgConf = total > 0 ? (sessions.reduce((a, s) => a + (s.confidence || 0), 0) / total * 100).toFixed(1) : '0.0';

  const dist = {};
  sessions.forEach(s => { dist[s.detected_state] = (dist[s.detected_state] || 0) + 1; });

  const exportCSV = () => {
    const headers = 'Date,Attention,Meditation,Alpha,Beta,Theta,BA_Ratio,State,Method,Confidence\n';
    const rows = sessions.map(s =>
      `${new Date(s.created_at).toISOString()},${s.eeg_attention},${s.eeg_meditation},${s.alpha_power},${s.beta_power},${s.theta_power},${s.beta_alpha_ratio},${s.detected_state},${s.classifier_method},${s.confidence}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gita-neurosync-eeg-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{padding:'2rem',textAlign:'center',color:'var(--text-secondary)'}}>Loading sessions...</div>;

  return (
    <>
      <button className="back-to-dash" onClick={() => navigate('/')}>
        &larr; Dashboard
      </button>
      <div className="page-header">
        <h1>EEG Session History</h1>
        <p>Telemetry log with brainwave spectrum classifications, confidence scores, and trend analysis</p>
      </div>

      {/* Summary */}
      <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '1.5rem' }}>
        <div className="dash-stat-card">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="dash-stat-card">
          <div className="stat-label">Avg Meditation Score</div>
          <div className="stat-value primary">{avgMed} <span style={{fontSize:'0.8rem',fontWeight:400}}>/100</span></div>
        </div>
        <div className="dash-stat-card">
          <div className="stat-label">Avg Confidence</div>
          <div className="stat-value accent">{avgConf}%</div>
        </div>
      </div>

      {/* State Distribution */}
      {Object.keys(dist).length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-label">STATE DISTRIBUTION</div>
          {Object.entries(dist).map(([state, count]) => (
            <div className="confidence-bar-item" key={state}>
              <div className="confidence-bar-header">
                <span>{state}</span>
                <span style={{fontWeight:700}}>{count} ({total > 0 ? (count / total * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="confidence-bar-track">
                <div className="confidence-bar-fill" style={{
                  width: `${total > 0 ? count / total * 100 : 0}%`,
                  background: getBarColor(state),
                }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV} disabled={total === 0}>
          Export CSV
        </button>
      </div>

      {/* Table */}
      {total === 0 ? (
        <div className="card-subtle" style={{ textAlign: 'center', padding: '3rem' }}>
          No sessions recorded yet. Start a reading from the Hardware page.
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Attention</th>
                <th>Meditation</th>
                <th>Alpha (μV)</th>
                <th>Beta (μV)</th>
                <th>Theta (μV)</th>
                <th>Beta/Alpha</th>
                <th>State</th>
                <th>Method</th>
                <th>Conf</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(s.created_at).toLocaleString().slice(0, 19)}</td>
                  <td>{s.eeg_attention?.toFixed?.(1) ?? s.eeg_attention}</td>
                  <td>{s.eeg_meditation?.toFixed?.(1) ?? s.eeg_meditation}</td>
                  <td>{s.alpha_power?.toFixed?.(1) ?? s.alpha_power}</td>
                  <td>{s.beta_power?.toFixed?.(1) ?? s.beta_power}</td>
                  <td>{s.theta_power?.toFixed?.(1) ?? s.theta_power}</td>
                  <td>{s.beta_alpha_ratio?.toFixed?.(2) ?? s.beta_alpha_ratio}</td>
                  <td><span className={`state-badge ${getStateClass(s.detected_state)}`}>{s.detected_state}</span></td>
                  <td>{s.classifier_method}</td>
                  <td>{(s.confidence * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function getBarColor(state) {
  if (!state) return 'var(--primary)';
  const s = state.toLowerCase();
  if (s.includes('anxiety')) return 'var(--red-soft)';
  if (s.includes('depression')) return 'var(--blue-soft)';
  if (s.includes('stress')) return 'var(--amber-soft)';
  return 'var(--green-soft)';
}

function getStateClass(state) {
  if (!state) return '';
  const s = state.toLowerCase();
  if (s.includes('anxiety')) return 'anxiety';
  if (s.includes('depression')) return 'depression';
  if (s.includes('stress')) return 'stress';
  return 'equilibrium';
}
