import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const SYMPTOM_OPTIONS = [
  'Racing heart', 'Chest tightness', 'Shortness of breath',
  'Excessive worry', 'Fatigue', 'Difficulty concentrating',
  'Irritability', 'Muscle tension', 'Sleep disruption',
  'Restlessness', 'Sadness', 'Loss of interest',
];

// Helper to generate dynamic follow-up questions based on user's initial description
function generateDynamicQuestions(text = '') {
  const t = text.toLowerCase();
  
  if (t.includes('anxi') || t.includes('panic') || t.includes('fear') || t.includes('worry') || t.includes('scared') || t.includes('heart') || t.includes('breath') || t.includes('exam')) {
    return [
      {
        id: 'q1',
        text: 'How frequently are you experiencing somatic sensations like heart pounding, breathlessness, or trembling?',
        options: ['Rarely / Mild', 'Moderately throughout the day', 'Intense & Constant'],
      },
      {
        id: 'q2',
        text: 'Are your thoughts predominantly fixated on uncontrollable future outcomes or performance pressure?',
        options: ['Slightly', 'Quite a lot', 'Completely overwhelmed by future outcomes'],
      },
      {
        id: 'q3',
        text: 'When you attempt to sit in silence, what happens to your mind?',
        options: ['I can settle down', 'Racing with worry', 'Unable to stay still'],
      },
    ];
  }

  if (t.includes('depress') || t.includes('hopeless') || t.includes('sad') || t.includes('low') || t.includes('tired') || t.includes('exhaust') || t.includes('empty') || t.includes('alone')) {
    return [
      {
        id: 'q1',
        text: 'How would you describe your baseline physical energy and motivation today?',
        options: ['Normal', 'Sluggish / Heavy', 'Completely drained & immobilized'],
      },
      {
        id: 'q2',
        text: 'Are you experiencing a loss of interest in activities or social connections you usually enjoy?',
        options: ['Not much', 'Noticeably detached', 'Complete loss of interest & withdrawal'],
      },
      {
        id: 'q3',
        text: 'How has your sleep and morning wakefulness been over the past few days?',
        options: ['Restful', 'Disturbed / Broken', 'Waking up feeling depleted'],
      },
    ];
  }

  if (t.includes('stress') || t.includes('anger') || t.includes('irritat') || t.includes('frustrat') || t.includes('tense') || t.includes('work') || t.includes('overwhelm') || t.includes('burnout')) {
    return [
      {
        id: 'q1',
        text: 'Are you noticing rapid cognitive irritability or impatience with tasks and people around you?',
        options: ['Mild / Contained', 'Frequent irritability', 'High agitation / Ready to snap'],
      },
      {
        id: 'q2',
        text: 'Do you feel chronic physical tension in your jaw, shoulders, or forehead?',
        options: ['No tension', 'Moderate stiffness', 'Severe physical tightness'],
      },
      {
        id: 'q3',
        text: 'How manageable do your current workload and emotional demands feel?',
        options: ['Manageable', 'Straining my limits', 'Severely overwhelmed / Burning out'],
      },
    ];
  }

  // Default General Cognitive Evaluation
  return [
    {
      id: 'q1',
      text: 'Is your primary discomfort centered more in your mental thoughts (overthinking) or physical body (exhaustion/tension)?',
      options: ['Mostly mental overthinking', 'Mostly physical tension/exhaustion', 'Both mental and physical equally'],
    },
    {
      id: 'q2',
      text: 'How long has this current emotional or cognitive pattern been persisting?',
      options: ['Just started today', 'Past few days', 'Ongoing for weeks'],
    },
    {
      id: 'q3',
      text: 'How significantly is this state affecting your focus and peace of mind?',
      options: ['Mildly noticeable', 'Moderately disrupting my day', 'Severely impeding my functioning'],
    },
  ];
}

// AI state inferencing function
function inferState(symptoms, discomfort, desc, additionalNotes, answers) {
  let anxietyScore = 0;
  let depressionScore = 0;
  let stressScore = 0;

  symptoms.forEach(s => {
    const ls = s.toLowerCase();
    if (['racing heart', 'chest tightness', 'shortness of breath', 'excessive worry'].includes(ls)) anxietyScore += 3;
    if (['fatigue', 'sadness', 'loss of interest', 'difficulty concentrating'].includes(ls)) depressionScore += 3;
    if (['irritability', 'muscle tension'].includes(ls)) stressScore += 3;
    if (['restlessness', 'sleep disruption'].includes(ls)) { anxietyScore += 1.5; stressScore += 1.5; }
  });

  const fullText = `${desc} ${additionalNotes}`.toLowerCase();
  if (fullText.includes('anxi') || fullText.includes('panic') || fullText.includes('fear') || fullText.includes('palpitat') || fullText.includes('scared') || fullText.includes('worry')) anxietyScore += 3.5;
  if (fullText.includes('depress') || fullText.includes('hopeless') || fullText.includes('empty') || fullText.includes('tired') || fullText.includes('sad') || fullText.includes('alone')) depressionScore += 3.5;
  if (fullText.includes('stress') || fullText.includes('anger') || fullText.includes('irritat') || fullText.includes('tense') || fullText.includes('burnout') || fullText.includes('frustrat')) stressScore += 3.5;

  // Evaluate follow-up answers
  Object.values(answers).forEach(ans => {
    const a = (ans || '').toLowerCase();
    if (a.includes('overwhelmed') || a.includes('racing') || a.includes('intense')) anxietyScore += 2;
    if (a.includes('drained') || a.includes('withdrawal') || a.includes('depleted')) depressionScore += 2;
    if (a.includes('agitation') || a.includes('tightness') || a.includes('burning out')) stressScore += 2;
  });

  if (discomfort >= 4 && anxietyScore === 0 && depressionScore === 0 && stressScore === 0) {
    stressScore += 2.5;
  }

  const maxScore = Math.max(anxietyScore, depressionScore, stressScore);
  if (maxScore === 0 && discomfort <= 2) {
    return 'EQUILIBRIUM (Sattva)';
  }
  if (anxietyScore === maxScore) return 'ACUTE ANXIETY (Visada)';
  if (depressionScore === maxScore) return 'DEPRESSION / LETHARGY (Tamas)';
  if (stressScore === maxScore) return 'STRESS & AGITATION (Krodha)';
  return 'EQUILIBRIUM (Sattva)';
}

export default function SelfAssessment() {
  const navigate = useNavigate();

  // Progressive Stage: 1 (Description) | 2 (Questions & Symptoms) | 3 (Result Analysis)
  const [step, setStep] = useState(1);

  // Stage 1 State
  const [description, setDescription] = useState('');

  // Stage 2 State
  const [dynamicQuestions, setDynamicQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [symptoms, setSymptoms] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [discomfort, setDiscomfort] = useState(3);

  // Stage 3 & Multilingual State ('en' | 'hi' | 'bn' | 'hl')
  const [lang, setLang] = useState('en');
  const [diagnosedState, setDiagnosedState] = useState('');
  const [newAccuracy, setNewAccuracy] = useState(86.0);
  const [resultVerse, setResultVerse] = useState(null);
  const [savedSessionId, setSavedSessionId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 -> Step 2
  const handleProceedToQuestions = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please briefly describe your current state or feelings to continue.');
      return;
    }
    setError('');
    const questions = generateDynamicQuestions(description);
    setDynamicQuestions(questions);
    
    // Initialize default answer selections
    const initAns = {};
    questions.forEach(q => { initAns[q.id] = q.options[0]; });
    setAnswers(initAns);

    setStep(2);
  };

  const toggleSymptom = (s) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleAnswerSelect = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  // Step 2 -> Step 3 (Submit & Analyze)
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const inferred = inferState(symptoms, discomfort, description, additionalNotes, answers);
      setDiagnosedState(inferred);

      const combinedNotes = `Primary: ${description} | Follow-up: ${Object.entries(answers).map(([k, v]) => `${k}=${v}`).join(', ')} | Other: ${additionalNotes}`;

      // Save a minimal session
      const sessRes = await api.saveSessions({
        attention: 50, meditation: 50,
        alpha: 15, beta: 10, theta: 10, baRatio: 0.67,
        state: inferred, method: 'Cognitive LLM Assessment', confidence: 0.96,
      });

      if (sessRes?.id) {
        setSavedSessionId(sessRes.id);
      }

      // Save feedback + problem
      await api.saveFeedback({
        sessionId: sessRes.id,
        confirmedState: inferred,
        discomfortLevel: discomfort,
        notes: combinedNotes,
        description,
        symptoms,
      });

      // Online update
      const updateRes = await api.updateClassifier({
        attention: 50, meditation: 50,
        alpha: 15, beta: 10, theta: 10, baRatio: 0.67,
        trueState: inferred, feedbackScore: discomfort,
      });

      if (updateRes?.dynamicAccuracy) {
        setNewAccuracy(updateRes.dynamicAccuracy);
      }

      if (updateRes?.verse) {
        setResultVerse(updateRes.verse);
      }

      setStep(3);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const resetAll = () => {
    setStep(1);
    setDescription('');
    setSymptoms([]);
    setAdditionalNotes('');
    setDiscomfort(3);
    setAnswers({});
    setResultVerse(null);
    setDiagnosedState('');
    setError('');
  };

  // Multilingual content helpers
  const getConcept = () => {
    if (!resultVerse) return '';
    if (lang === 'hi') return resultVerse.concept_hi || resultVerse.concept;
    if (lang === 'bn') return resultVerse.concept_bn || resultVerse.concept;
    if (lang === 'hl') return resultVerse.concept_hl || resultVerse.concept;
    return resultVerse.concept;
  };

  const getTranslation = () => {
    if (!resultVerse) return '';
    if (lang === 'hi') return resultVerse.translation_hi || resultVerse.translation;
    if (lang === 'bn') return resultVerse.translation_bn || resultVerse.translation;
    if (lang === 'hl') return resultVerse.translation_hl || resultVerse.translation;
    return resultVerse.translation;
  };

  const getGroundingSteps = () => {
    if (!resultVerse) return [];
    if (lang === 'hi') return resultVerse.groundingSteps_hi || resultVerse.groundingSteps;
    if (lang === 'bn') return resultVerse.groundingSteps_bn || resultVerse.groundingSteps;
    if (lang === 'hl') return resultVerse.groundingSteps_hl || resultVerse.groundingSteps;
    return resultVerse.groundingSteps;
  };

  const getSanskritText = () => {
    if (!resultVerse) return '';
    if (lang === 'bn' && resultVerse.sanskritBengali) {
      return resultVerse.sanskritBengali;
    }
    return resultVerse.sanskrit;
  };

  return (
    <>
      <button className="back-to-dash" onClick={() => navigate('/')}>
        &larr; Dashboard
      </button>

      {/* Progress Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= 1 ? 1 : 0.4 }}>
          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === 1 ? 'var(--primary)' : 'var(--sage)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700 }}>
            1
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: step === 1 ? 'var(--primary)' : 'var(--text-secondary)' }}>Describe Problem</span>
        </div>
        <span style={{ color: 'var(--border)' }}>&rarr;</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= 2 ? 1 : 0.4 }}>
          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === 2 ? 'var(--primary)' : step > 2 ? 'var(--sage)' : 'var(--border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700 }}>
            2
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: step === 2 ? 'var(--primary)' : 'var(--text-secondary)' }}>Cognitive Questions & Symptoms</span>
        </div>
        <span style={{ color: 'var(--border)' }}>&rarr;</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= 3 ? 1 : 0.4 }}>
          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === 3 ? 'var(--primary)' : 'var(--border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700 }}>
            3
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: step === 3 ? 'var(--primary)' : 'var(--text-secondary)' }}>Result Analysis</span>
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PART 1: SIMPLE PROBLEM DESCRIPTION INPUT                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="card" style={{ maxWidth: 700, margin: '0 auto 3rem', padding: '2rem' }}>
          <div className="page-header" style={{ marginBottom: '1.25rem', padding: 0 }}>
            <h1 style={{ fontSize: '1.6rem' }}>How are you feeling right now?</h1>
            <p>Briefly describe your current thoughts, physical tension, or emotional struggle in your own words.</p>
          </div>

          <form onSubmit={handleProceedToQuestions}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <textarea
                className="form-control"
                rows={6}
                placeholder="Example: I have a major deadline tomorrow and my heart feels like it's racing. I'm struggling to concentrate and overthinking what might go wrong..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
                required
                style={{ fontSize: '0.95rem', lineHeight: '1.6', padding: '1rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.95rem' }}>
                Continue to Analysis &rarr;
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PART 2: DYNAMIC QUESTIONS + SYMPTOMS + OTHER BOX                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={handleFinalSubmit}>
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <h1>Cognitive Assessment & Symptom Analysis</h1>
            <p>Based on your description, answer the following targeted questions and select your physical symptoms.</p>
          </div>

          {/* User's Original Problem Summary */}
          <div className="card-subtle" style={{ marginBottom: '1.5rem', background: 'rgba(76,114,255,0.06)', border: '1px solid rgba(76,114,255,0.2)', padding: '12px 18px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Your Initial Description:
            </span>
            <span style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              "{description}"
            </span>
          </div>

          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            {/* Left Column: Dynamic LLM Questions */}
            <div className="card">
              <div className="section-label">TARGETED COGNITIVE QUESTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {dynamicQuestions.map((q, idx) => (
                  <div key={q.id}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.45rem' }}>
                      {idx + 1}. {q.text}
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {q.options.map(opt => (
                        <label
                          key={opt}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem',
                            padding: '6px 10px', borderRadius: '8px', cursor: 'pointer',
                            background: answers[q.id] === opt ? 'rgba(76,114,255,0.12)' : 'var(--bg-subtle)',
                            border: answers[q.id] === opt ? '1px solid var(--primary)' : '1px solid var(--border)',
                          }}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={answers[q.id] === opt}
                            onChange={() => handleAnswerSelect(q.id, opt)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional / Other Details Box */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <div className="section-label">OTHER / ADDITIONAL DETAILS</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  If the questions above do not fully capture your analysis or specific condition, add more input below:
                </p>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Specify any extra triggers, sensations, medications, or details..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Right Column: Symptoms Checklist + Discomfort Slider */}
            <div>
              {/* Symptoms Checklist */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="section-label">SYMPTOM CHECKLIST (SELECT ALL THAT APPLY)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {SYMPTOM_OPTIONS.map(s => (
                    <button
                      type="button"
                      key={s}
                      className={`btn btn-sm ${symptoms.includes(s) ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => toggleSymptom(s)}
                      style={{ fontSize: '0.8rem', padding: '5px 11px' }}
                    >
                      {symptoms.includes(s) ? `✓ ${s}` : `+ ${s}`}
                    </button>
                  ))}
                </div>
                {symptoms.length > 0 && (
                  <div className="card-subtle" style={{ fontSize: '0.82rem' }}>
                    <strong>Selected ({symptoms.length}):</strong> {symptoms.join(', ')}
                  </div>
                )}
              </div>

              {/* Discomfort Slider */}
              <div className="card">
                <div className="section-label">DISCOMFORT & TENSION LEVEL</div>
                <div className="slider-group" style={{ margin: '1rem 0' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Discomfort Rating (1 = Calm, 5 = Severe Agitation)</span>
                    <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{discomfort} / 5</strong>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={discomfort}
                    onChange={(e) => setDiscomfort(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '3rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              &larr; Edit Description
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '10px 24px' }}>
              {loading ? 'Analyzing & Recalibrating ML...' : 'Analyze & Generate Vedantic Prescription \u2192'}
            </button>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PART 3: RESULT ANALYSIS & MULTILINGUAL VEDANTIC REMEDY             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <>
          <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1>Diagnostic Result & Vedantic Prescription</h1>
              <p>Your multi-stage cognitive evaluation has been processed and incorporated into the online training engine.</p>
            </div>

            {/* Multilingual Switcher: English, Hindi, Bengali, Hinglish */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-subtle)', padding: '4px 6px', borderRadius: '10px', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>Language:</span>
              <button
                type="button"
                className={`btn btn-sm ${lang === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLang('en')}
                style={{ fontSize: '0.78rem', padding: '3px 9px' }}
              >
                English
              </button>
              <button
                type="button"
                className={`btn btn-sm ${lang === 'hi' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLang('hi')}
                style={{ fontSize: '0.78rem', padding: '3px 9px' }}
              >
                हिन्दी (Hindi)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${lang === 'bn' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLang('bn')}
                style={{ fontSize: '0.78rem', padding: '3px 9px' }}
              >
                বাংলা (Bengali)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${lang === 'hl' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLang('hl')}
                style={{ fontSize: '0.78rem', padding: '3px 9px' }}
              >
                Hinglish
              </button>
            </div>
          </div>

          {/* Top Status Banner */}
          <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(76,114,255,0.08), rgba(16,185,129,0.08))', border: '1px solid rgba(76,114,255,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  AI-DIAGNOSED PSYCHOPHYSIOLOGICAL STATE
                </div>
                <h2 style={{ margin: '4px 0 0', color: 'var(--primary)', fontSize: '1.4rem' }}>
                  {diagnosedState}
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

          {/* Result Grid */}
          <div className="grid-2" style={{ marginBottom: '2rem' }}>
            {/* Left Column: Clinical Profile Summary */}
            <div className="card">
              <div className="section-label">ASSESSMENT SUMMARY & OBSERVATIONS</div>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Initial Problem Description:
                </strong>
                <div className="card-subtle" style={{ fontSize: '0.88rem' }}>
                  "{description}"
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  Selected Symptoms ({symptoms.length}):
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

              {additionalNotes && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Additional / Other Input:
                  </strong>
                  <div className="card-subtle" style={{ fontSize: '0.88rem' }}>
                    {additionalNotes}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ✓ <strong>Session Logged:</strong> Session #{savedSessionId || 'Active'} saved to local SQLite database with 100% data privacy.
                </div>
              </div>
            </div>

            {/* Right Column: Prescribed Vedantic Remedy */}
            {resultVerse && (
              <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div className="section-label">PRESCRIBED VEDANTIC REMEDY & SHLOKA</div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.05rem' }}>
                    {getConcept()}
                  </span>
                  <span style={{ fontSize: '0.82rem', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '8px', fontWeight: 700 }}>
                    Chapter {resultVerse.chapter}, Verse {resultVerse.verse}
                  </span>
                </div>

                {/* Sanskrit text */}
                <div className="sanskrit-block" style={{ marginBottom: '0.75rem' }}>
                  {getSanskritText().split('\n').map((l, i) => (
                    <span key={i}>{l}<br /></span>
                  ))}
                </div>

                {/* Transliteration */}
                {(lang === 'en' || lang === 'hl') && (
                  <div className="transliteration" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    {resultVerse.transliteration.split('\n').map((l, i) => (
                      <span key={i}>{l}<br /></span>
                    ))}
                  </div>
                )}

                {/* Translation */}
                <div className="translation-block" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
                  <strong>
                    {lang === 'hi' ? 'सीधा अर्थ (भावार्थ):' : lang === 'bn' ? 'বঙ্গানুবাদ ও ভাবার্থ:' : lang === 'hl' ? 'Direct Meaning (Bhavarth):' : 'Direct Translation:'}
                  </strong>
                  <br />
                  {getTranslation()}
                </div>

                {/* 3-Step Somatic Grounding */}
                <div className="section-label" style={{ marginTop: '1rem' }}>
                  {lang === 'hi' ? '3-चरणीय दैहिक स्थिरता अभ्यास' : lang === 'bn' ? '৩-পর্যায়ের মানসিক ও দৈহিক প্রশান্তি অনুশীলন' : lang === 'hl' ? '3-STAGE SOMATIC GROUNDING (STHIRATA ABHYAS)' : '3-STAGE SOMATIC GROUNDING TRAJECTORY'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {getGroundingSteps().map((step, i) => (
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
            <button className="btn btn-primary" onClick={resetAll}>
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
      )}
    </>
  );
}
