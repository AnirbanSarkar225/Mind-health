import { useState } from 'react';
import { api } from '../api/client';

const STATES = [
  'ACUTE ANXIETY (Visada)',
  'DEPRESSION / LETHARGY (Tamas)',
  'STRESS & AGITATION (Krodha)',
  'EQUILIBRIUM (Sattva)',
];

const SYMPTOM_OPTIONS = [
  'Racing heart', 'Chest tightness', 'Shortness of breath',
  'Excessive worry', 'Fatigue', 'Difficulty concentrating',
  'Irritability', 'Muscle tension', 'Sleep disruption',
  'Restlessness', 'Sadness', 'Loss of interest',
];

export default function SelfAssessment() {
  const [description, setDescription] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [discomfort, setDiscomfort] = useState(3);
  const [confirmedState, setConfirmedState] = useState(STATES[3]);
  const [sessionId, setSessionId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSymptom = (s) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Save a minimal session first
      const sessRes = await api.saveSessions({
        bpm: 72, hrv: 45, attention: 50, meditation: 50,
        alpha: 15, beta: 15, theta: 10, baRatio: 1.0,
        state: confirmedState, method: 'Self-Report', confidence: 1.0,
      });

      // Save feedback + problem
      await api.saveFeedback({
        sessionId: sessRes.id,
        confirmedState,
        discomfortLevel: discomfort,
        notes: description,
        description,
        symptoms,
      });

      // Online update
      await api.updateClassifier({
        bpm: 72, hrv: 45, attention: 50, meditation: 50,
        alpha: 15, beta: 15, theta: 10, baRatio: 1.0,
        trueState: confirmedState, feedbackScore: discomfort,
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <>
        <div className="page-header">
          <h1>Self-Assessment</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
          <h2>Assessment Saved</h2>
          <p style={{ marginBottom: '1.5rem' }}>Your feedback has been recorded and the ML classifier updated.</p>
          <button className="btn btn-primary" onClick={() => { setSubmitted(false); setDescription(''); setSymptoms([]); setDiscomfort(3); }}>
            Submit Another
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Self-Assessment</h1>
        <p>Manually log your symptoms and confirm your mental state — train the ML model with your feedback</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div>
            <div className="section-label">HOW ARE YOU FEELING?</div>
            <div className="form-group">
              <label>Describe your current state</label>
              <textarea className="form-control" rows={4} placeholder="Describe your current emotional and physical state..."
                value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Discomfort Level (1–5)</label>
              <div className="slider-group">
                <label>
                  <span>Level {discomfort}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{discomfort}/5</span>
                </label>
                <input type="range" min={1} max={5} value={discomfort} onChange={(e) => setDiscomfort(parseInt(e.target.value))} />
              </div>
            </div>

            <div className="form-group">
              <label>Confirmed Mental State</label>
              <select className="form-control" value={confirmedState} onChange={(e) => setConfirmedState(e.target.value)}>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="section-label">SYMPTOM CHECKLIST</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {SYMPTOM_OPTIONS.map(s => (
                <button type="button" key={s} className={`btn btn-sm ${symptoms.includes(s) ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleSymptom(s)} style={{ fontSize: '0.8rem' }}>
                  {s}
                </button>
              ))}
            </div>
            {symptoms.length > 0 && (
              <div className="card-subtle">
                <strong>Selected ({symptoms.length}):</strong> {symptoms.join(', ')}
              </div>
            )}
          </div>
        </div>

        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Confirm & Train ML Model'}
        </button>
      </form>
    </>
  );
}
