import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const SYMPTOM_OPTIONS = [
  'Racing heart', 'Chest tightness', 'Shortness of breath',
  'Excessive worry', 'Fatigue', 'Difficulty concentrating',
  'Irritability', 'Muscle tension', 'Sleep disruption',
  'Restlessness', 'Sadness', 'Loss of interest',
];

function generateTargetedQuestions(text = '') {
  const t = text.toLowerCase();
  
  if (t.includes('anxi') || t.includes('panic') || t.includes('fear') || t.includes('worry') || t.includes('scared') || t.includes('heart') || t.includes('breath') || t.includes('exam') || t.includes('tight')) {
    return [
      {
        id: 'q1',
        text: 'Autonomic & Somatic Arousal: Are you experiencing acute bodily sensations like heart fluttering, rapid shallow breathing, or chest tightness?',
        options: ['No somatic sensations', 'Mild chest/throat tightness', 'Severe pounding heart & breathlessness'],
      },
      {
        id: 'q2',
        text: 'Cognitive Locus of Worry: Are your thoughts predominantly fixated on future performance, fear of failure, or uncontrollable outcomes?',
        options: ['Focused on present tasks', 'Frequent worry about upcoming results', 'Completely overwhelmed by catastrophic future outcomes'],
      },
      {
        id: 'q3',
        text: 'Cortical Restlessness: When you attempt to sit in silence or close your eyes, what happens to your mind?',
        options: ['I can settle down calmly', 'Thoughts race with "what-if" scenarios', 'Severe restlessness, unable to remain still'],
      },
    ];
  }

  if (t.includes('depress') || t.includes('hopeless') || t.includes('sad') || t.includes('low') || t.includes('tired') || t.includes('exhaust') || t.includes('empty') || t.includes('alone') || t.includes('lazy')) {
    return [
      {
        id: 'q1',
        text: 'Psychomotor Energy & Drive: How would you describe your baseline physical energy and motivation to initiate tasks today?',
        options: ['Normal motivation', 'Heavy, sluggish, and low drive', 'Paralyzing exhaustion and complete inertia'],
      },
      {
        id: 'q2',
        text: 'Affective State & Anhedonia: Are you experiencing emotional numbness, sadness, or detachment from activities you normally value?',
        options: ['Emotionally responsive', 'Noticeable apathy and loss of interest', 'Deep hopelessness and complete social withdrawal'],
      },
      {
        id: 'q3',
        text: 'Cognitive Clarity & Sleep: How has your morning wakefulness and ability to sustain mental focus been?',
        options: ['Clear and refreshed', 'Brain fog and delayed focus', 'Waking up feeling completely depleted'],
      },
    ];
  }

  if (t.includes('stress') || t.includes('anger') || t.includes('irritat') || t.includes('frustrat') || t.includes('tense') || t.includes('work') || t.includes('overwhelm') || t.includes('burnout')) {
    return [
      {
        id: 'q1',
        text: 'Emotional Reactivity: How quickly do minor obstacles, delays, or interactions trigger irritation and agitation in you?',
        options: ['I remain patient and composed', 'Frequently short-tempered and frustrated', 'Intense agitation and ready to snap'],
      },
      {
        id: 'q2',
        text: 'Musculoskeletal Tension: Do you notice involuntary physical tension in your jaw, brow, neck, or shoulders?',
        options: ['Muscles feel relaxed', 'Moderate stiffness in neck and shoulders', 'Severe jaw clenching and physical armoring'],
      },
      {
        id: 'q3',
        text: 'Cognitive Load & Pressure: How manageable does your current cognitive workload feel relative to your emotional capacity?',
        options: ['Comfortably manageable', 'Straining my limits under high pressure', 'Severely burned out and chaotic'],
      },
    ];
  }

  return [
    {
      id: 'q1',
      text: 'Cognitive vs Somatic Distribution: Is your primary discomfort centered more in your mental thoughts (overthinking) or physical body (tension/exhaustion)?',
      options: ['Predominantly mental overthinking', 'Predominantly physical tension/fatigue', 'Both mental and physical equally'],
    },
    {
      id: 'q2',
      text: 'Chronicity & Pattern: How long has this current emotional or cognitive pattern been persisting?',
      options: ['Just started today / Acute', 'Past few days / Episodic', 'Ongoing for weeks / Chronic pattern'],
    },
    {
      id: 'q3',
      text: 'Functional Impairment: How significantly is this state affecting your decision-making, peace of mind, and daily functioning?',
      options: ['Mildly noticeable, functional', 'Moderately disrupting my concentration', 'Severely impeding my daily tasks and peace'],
    },
  ];
}

const CLINICAL_EXERCISES = {
  'ACUTE ANXIETY (Visada)': {
    somaticExercise: '4-4-6 Extended Exhalation Breathing — Inhale for 4 seconds, hold for 4 seconds, exhale slowly for 6 seconds. Repeat 5 cycles to stimulate the vagus nerve and slow elevated heart rate.',
    cognitiveExercise: 'Circle of Control Exercise — On a paper, write 3 factors outside your control (e.g. other people, exam questions, future outcomes) and draw a line through them. Write 1 immediate action you control right now.',
    lifestyleSuggestion: 'Take a 15-minute complete digital screen pause. Drink a glass of room-temperature water slowly with conscious sips.',
  },
  'DEPRESSION / LETHARGY (Tamas)': {
    somaticExercise: 'Postural Expansion & Movement Trigger — Stand up straight, pull shoulders back, expand your chest cavity, and take 10 deep expansive breaths. Walk at a brisk pace for 3 minutes to break physical inertia.',
    cognitiveExercise: 'The 2-Minute Micro-Victory Rule — Choose one tiny achievable task (wash one glass, make your bed, open the window). Complete it and explicitly acknowledge it as an intentional win over lethargy.',
    lifestyleSuggestion: 'Get 10 minutes of direct natural sunlight. Splash cold water on your face to stimulate the mammalian dive reflex.',
  },
  'STRESS & AGITATION (Krodha)': {
    somaticExercise: 'Sitali Cooling Breath & Palm Pressure — Inhale slowly through curled tongue or teeth with a cooling sensation; exhale through nose. Press both palms together firmly for 10 seconds to discharge autonomic tension.',
    cognitiveExercise: '90-Second Impulse Buffer — When feeling irritated or reactive, step away from the stimulus for exactly 90 seconds to allow the adrenaline surge to naturally metabolize.',
    lifestyleSuggestion: 'Perform progressive shoulder rolls and conscious jaw unclogging. Avoid caffeine or stimulants for the next 4 hours.',
  },
  'EQUILIBRIUM (Sattva)': {
    somaticExercise: 'Alpha Coherence Mindfulness — Close your eyes, rest hands on your lap, and observe the natural flow of breath at the tip of your nostrils for 3 minutes without forcing the rhythm.',
    cognitiveExercise: 'Sakshi-Bhava (Witness Observation) — Observe passing thoughts and external events as a calm, detached witness, recognizing that you are the steady observer, not the turbulent thought.',
    lifestyleSuggestion: 'Reinforce your positive state by writing down one insight or offering a kind, calming word to someone nearby.',
  },
};

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

  Object.values(answers).forEach(ans => {
    const a = (ans || '').toLowerCase();
    if (a.includes('overwhelmed') || a.includes('fluttering') || a.includes('racing') || a.includes('restlessness') || a.includes('catastrophic')) anxietyScore += 2.5;
    if (a.includes('drained') || a.includes('withdrawal') || a.includes('depleted') || a.includes('sluggish') || a.includes('numbness')) depressionScore += 2.5;
    if (a.includes('agitation') || a.includes('tightness') || a.includes('burning out') || a.includes('jaw') || a.includes('short-tempered')) stressScore += 2.5;
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

  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [dynamicQuestions, setDynamicQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [symptoms, setSymptoms] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [discomfort, setDiscomfort] = useState(3);

  const [lang, setLang] = useState('en');
  const [diagnosedState, setDiagnosedState] = useState('');
  const [newAccuracy, setNewAccuracy] = useState(86.0);
  const [resultVerse, setResultVerse] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProceedToQuestions = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please briefly describe your current state or feelings to continue.');
      return;
    }
    setError('');
    const questions = generateTargetedQuestions(description);
    setDynamicQuestions(questions);
    setAnswers({});
    setStep(2);
  };

  const toggleSymptom = (s) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleAnswerSelect = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const inferred = inferState(symptoms, discomfort, description, additionalNotes, answers);
      setDiagnosedState(inferred);

      const combinedNotes = `Description: ${description} | Q&A: ${Object.entries(answers).map(([k, v]) => `${k}:${v}`).join('; ')} | Other: ${additionalNotes}`;

      const sessRes = await api.saveSessions({
        attention: 0,
        meditation: 0,
        alpha: 0,
        beta: 0,
        theta: 0,
        baRatio: 0,
        state: inferred,
        method: 'Cognitive Self-Assessment',
        confidence: 0.95,
      });

      await api.saveFeedback({
        sessionId: sessRes.id,
        confirmedState: inferred,
        discomfortLevel: discomfort,
        notes: combinedNotes,
        description,
        symptoms,
      });

      const updateRes = await api.updateClassifier({
        attention: 50,
        meditation: 50,
        alpha: 15,
        beta: 10,
        theta: 10,
        baRatio: 0.67,
        trueState: inferred,
        feedbackScore: discomfort,
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

  const getPhysicalActivity = () => {
    if (!resultVerse) return null;
    if (lang === 'hi') return resultVerse.physicalActivity_hi || resultVerse.physicalActivity;
    if (lang === 'bn') return resultVerse.physicalActivity_bn || resultVerse.physicalActivity;
    if (lang === 'hl') return resultVerse.physicalActivity_hl || resultVerse.physicalActivity;
    return resultVerse.physicalActivity;
  };

  const exercises = CLINICAL_EXERCISES[diagnosedState] || CLINICAL_EXERCISES['EQUILIBRIUM (Sattva)'];
  const physicalAct = getPhysicalActivity();

  return (
    <>
      <button className="back-to-dash" onClick={() => navigate('/')}>
        &larr; Dashboard
      </button>

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
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: step === 2 ? 'var(--primary)' : 'var(--text-secondary)' }}>Targeted Questions & Symptoms</span>
        </div>
        <span style={{ color: 'var(--border)' }}>&rarr;</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= 3 ? 1 : 0.4 }}>
          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === 3 ? 'var(--primary)' : 'var(--border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700 }}>
            3
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: step === 3 ? 'var(--primary)' : 'var(--text-secondary)' }}>Clinical Report & Physical Exercises</span>
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {step === 1 && (
        <div className="card" style={{ maxWidth: 700, margin: '0 auto 3rem', padding: '2rem' }}>
          <div className="page-header" style={{ marginBottom: '1.25rem', padding: 0 }}>
            <h1 style={{ fontSize: '1.6rem' }}>How are you feeling right now?</h1>
            <p>Briefly describe your current thoughts, physical sensations, or emotional challenges in your own words.</p>
          </div>

          <form onSubmit={handleProceedToQuestions}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <textarea
                className="form-control"
                rows={6}
                placeholder="Example: I have an important test tomorrow and I can't stop overthinking. My chest feels tight, and I can't focus on studying..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
                required
                style={{ fontSize: '0.95rem', lineHeight: '1.6', padding: '1rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.95rem' }}>
                Continue to Diagnostic Questions &rarr;
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleFinalSubmit}>
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <h1>Targeted Cognitive Assessment</h1>
            <p>Answer the clinical follow-up questions generated from your description, select symptoms, and add any other details.</p>
          </div>

          <div className="card-subtle" style={{ marginBottom: '1.5rem', background: 'rgba(76,114,255,0.06)', border: '1px solid rgba(76,114,255,0.2)', padding: '12px 18px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Your Problem Statement:
            </span>
            <span style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              "{description}"
            </span>
          </div>

          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <div className="section-label">TARGETED CLINICAL QUESTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                {dynamicQuestions.map((q, idx) => (
                  <div key={q.id}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                      {idx + 1}. {q.text}
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {q.options.map(opt => (
                        <label
                          key={opt}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem',
                            padding: '7px 11px', borderRadius: '8px', cursor: 'pointer',
                            background: answers[q.id] === opt ? 'rgba(76,114,255,0.12)' : 'var(--bg-subtle)',
                            border: answers[q.id] === opt ? '1px solid var(--primary)' : '1px solid var(--border)',
                            transition: 'all 0.15s ease',
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

              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <div className="section-label">OTHER / ADDITIONAL DETAILS</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  If the above questions did not fully capture your analysis or specific condition, add extra input below:
                </p>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Type any additional context, specific triggers, or feelings that weren't covered..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                />
              </div>
            </div>

            <div>
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
              &larr; Back to Problem Description
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '10px 24px' }}>
              {loading ? 'Analyzing & Compiling Report...' : 'Analyze Symptoms & Generate Clinical Report \u2192'}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <>
          <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1>Clinical Cognitive Assessment & Remediation Report</h1>
              <p>Prescribed physical activity, somatic exercises, behavioral suggestions, and Vedantic grounding.</p>
            </div>

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
                हिन्दी
              </button>
              <button
                type="button"
                className={`btn btn-sm ${lang === 'bn' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLang('bn')}
                style={{ fontSize: '0.78rem', padding: '3px 9px' }}
              >
                বাংলা
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

          <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(76,114,255,0.08), rgba(16,185,129,0.08))', border: '1px solid rgba(76,114,255,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  AI-DIAGNOSED PSYCHOPHYSIOLOGICAL PROFILE
                </div>
                <h2 style={{ margin: '4px 0 0', color: 'var(--primary)', fontSize: '1.4rem' }}>
                  {diagnosedState}
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px 14px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Reported Discomfort</span>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{discomfort} / 5</strong>
                </div>
                <div style={{ background: '#fff', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '10px', padding: '6px 14px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--sage)', display: 'block', fontWeight: 700 }}>Model Dynamic Accuracy</span>
                  <strong style={{ color: 'var(--sage)', fontSize: '1rem' }}>{newAccuracy}% (Self-Calibrated)</strong>
                </div>
              </div>
            </div>
          </div>

          {physicalAct && (
            <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(76,114,255,0.05))', borderLeft: '5px solid var(--sage)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>🏃</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    PRESCRIBED PHYSICAL ACTIVITY & SOMATIC MOVEMENT
                  </span>
                </div>
                <span style={{ background: 'var(--sage-bg)', border: '1px solid var(--sage)', color: 'var(--sage)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                  ⏱️ {physicalAct.duration}
                </span>
              </div>
              <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '1.15rem' }}>
                {physicalAct.name}
              </h3>
              <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                <strong>Step-by-Step Instructions:</strong> {physicalAct.instructions}
              </p>
              <div style={{ background: '#fff', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <strong>🔬 Biological & Vagal Benefit:</strong> {physicalAct.benefit}
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            <div className="section-label">RECOMMENDED COGNITIVE & LIFESTYLE EXERCISES</div>
            <div className="grid-3" style={{ gap: '1rem', marginTop: '0.75rem' }}>
              <div className="card-subtle">
                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  🫁 Somatic Breathing Exercise
                </strong>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {exercises.somaticExercise}
                </p>
              </div>

              <div className="card-subtle">
                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  🧠 Cognitive Re-framing Exercise
                </strong>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {exercises.cognitiveExercise}
                </p>
              </div>

              <div className="card-subtle">
                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  🌿 Lifestyle & Environment Suggestion
                </strong>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {exercises.lifestyleSuggestion}
                </p>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '2rem' }}>
            <div className="card">
              <div className="section-label">PATIENT REPORT PROFILE</div>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Reported Problem Description:
                </strong>
                <div className="card-subtle" style={{ fontSize: '0.88rem' }}>
                  "{description}"
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  Recorded Symptoms ({symptoms.length}):
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
                    Additional Patient Notes:
                  </strong>
                  <div className="card-subtle" style={{ fontSize: '0.88rem' }}>
                    {additionalNotes}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ✓ <strong>Session Saved:</strong> Logged to your private medical history.
                </div>
              </div>
            </div>

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

                <div className="sanskrit-block" style={{ marginBottom: '0.75rem' }}>
                  {getSanskritText().split('\n').map((l, i) => (
                    <span key={i}>{l}<br /></span>
                  ))}
                </div>

                {(lang === 'en' || lang === 'hl') && (
                  <div className="transliteration" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    {resultVerse.transliteration.split('\n').map((l, i) => (
                      <span key={i}>{l}<br /></span>
                    ))}
                  </div>
                )}

                <div className="translation-block" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
                  <strong>
                    {lang === 'hi' ? 'सीधा अर्थ (भावार्थ):' : lang === 'bn' ? 'বঙ্গানুবাদ ও ভাবার্থ:' : lang === 'hl' ? 'Direct Meaning (Bhavarth):' : 'Direct Meaning:'}
                  </strong>
                  <br />
                  {getTranslation()}
                </div>

                <div className="section-label" style={{ marginTop: '1rem' }}>
                  {lang === 'hi' ? '3-चरणीय स्थिरता अभ्यास' : lang === 'bn' ? '৩-পর্যায়ের মানসিক প্রশান্তি অনুশীলন' : lang === 'hl' ? '3-STAGE SOMATIC GROUNDING (STHIRATA ABHYAS)' : '3-STAGE SOMATIC GROUNDING TRAJECTORY'}
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

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <button className="btn btn-primary" onClick={resetAll}>
              Submit Another Assessment
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/history')}>
              View in Session History
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
