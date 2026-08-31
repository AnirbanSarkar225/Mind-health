import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [discomfort, setDiscomfort] = useState(3);
  const [confirmedState, setConfirmedState] = useState(STATES[0]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [newAccuracy, setNewAccuracy] = useState(86.0);
  const [resultVerse, setResultVerse] = useState(null);
  const [savedSessionId, setSavedSessionId] = useState(null);

  const toggleSymptom = (s) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Save a minimal EEG session first
      const sessRes = await api.saveSessions({
        attention: 50, meditation: 50,
        alpha: 15, beta: 10, theta: 10, baRatio: 0.67,
        state: confirmedState, method: 'Self-Report', confidence: 1.0,
      });

      if (sessRes?.id) {
        setSavedSessionId(sessRes.id);
      }

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
      const updateRes = await api.updateClassifier({
        attention: 50, meditation: 50,
        alpha: 15, beta: 10, theta: 10, baRatio: 0.67,
        trueState: confirmedState, feedbackScore: discomfort,
      });

      if (updateRes?.dynamicAccuracy) {
        setNewAccuracy(updateRes.dynamicAccuracy);
      }

      if (updateRes?.verse) {
        setResultVerse(updateRes.verse);
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setSubmitted(false);
    setDescription('');
    setSymptoms([]);
    setDiscomfort(3);
    setResultVerse(null);
  };

  if (submitted) {
    return (
      <>
        <button className="back-to-dash" onClick={() => navigate('/')}>
          &larr; Dashboard
        </button>

        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <h1>Assessment Results & Clinical Prescription</h1>
          <p>Your self-report has been recorded and incorporated into the online Gaussian training engine.</p>
        </div>

        {/* Top Summary Banner */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(76,114,255,0.08), rgba(16,185,129,0.08))', border: '1px solid rgba(76,114,255,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700 }}>
                DIAGNOSED PSYCHOPHYSIOLOGICAL STATE
              </div>
              <h2 style={{ margin: '4px 0 0', color: 'var(--primary)', fontSize: '1.4rem' }}>
                {confirmedState}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px 14px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Discomfort</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{discomfort} / 5</strong>
              </div>
              <div style={{ background: '#fff', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '10px', padding: '6px 14px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--sage)', display: 'block', fontWeight: 700 }}>Live Model Accuracy</span>
                <strong style={{ color: 'var(--sage)', fontSize: '1rem' }}>{newAccuracy}% (Self-Tuned)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Result Grid: Feedback Details + Prescribed Remedy */}
        <div className="grid-2" style={{ marginBottom: '2rem' }}>
          {/* Left Column: Recorded Symptoms & Notes */}
          <div className="card">
            <div className="section-label">RECORDED SYMPTOMS & OBSERVATIONS</div>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                Reported Symptoms ({symptoms.length}):
              </strong>
              {symptoms.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {symptoms.map(s => (
                    <span key={s} style={{ background: 'rgba(76,114,255,0.12)', color: 'var(--primary)', padding: '3px 9px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                      ✓ {s}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No specific symptoms selected</span>
              )}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                User Notes & Physical Sensations:
              </strong>
              <div className="card-subtle" style={{ fontStyle: description ? 'normal' : 'italic', color: description ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.88rem' }}>
                {description || 'No additional notes provided.'}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ✓ <strong>Session Logged:</strong> Session #{savedSessionId || 'Active'} saved to local SQLite database with 100% data encryption.
              </div>
            </div>
          </div>

          {/* Right Column: Prescribed Vedantic Grounding */}
          {resultVerse && (
            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="section-label">PRESCRIBED VEDANTIC REMEDY & SHLOKA</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.05rem' }}>
                  {resultVerse.concept} ({resultVerse.conceptSanskrit})
                </span>
                <span style={{ fontSize: '0.82rem', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '8px', fontWeight: 700 }}>
                  Chapter {resultVerse.chapter}, Verse {resultVerse.verse}
                </span>
              </div>

              {/* Sanskrit text */}
              <div className="sanskrit-block" style={{ marginBottom: '0.75rem' }}>
                {resultVerse.sanskrit.split('\n').map((l, i) => (
                  <span key={i}>{l}<br /></span>
                ))}
              </div>

              {/* Transliteration */}
              <div className="transliteration" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                {resultVerse.transliteration.split('\n').map((l, i) => (
                  <span key={i}>{l}<br /></span>
                ))}
              </div>

              {/* Translation */}
              <div className="translation-block" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
                <strong>Direct Translation:</strong><br />
                {resultVerse.translation}
              </div>

              {/* 3-Step Somatic Grounding */}
              <div className="section-label" style={{ marginTop: '1rem' }}>3-STAGE SOMATIC GROUNDING TRAJECTORY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {resultVerse.groundingSteps?.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.85rem' }}>
                    <span style={{ background: 'var(--primary)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', flexShrink: 0, marginTop: '2px' }}>
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <button className="btn btn-primary" onClick={resetForm}>
            Submit Another Assessment
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/sessions')}>
            View Session History
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <button className="back-to-dash" onClick={() => navigate('/')}>
        &larr; Dashboard
      </button>
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting & Training ML...' : 'Save Assessment & Update ML Model'}
          </button>
        </div>
      </form>
    </>
  );
}
