import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FiCheckCircle,
  FiEdit3,
  FiRefreshCw,
  FiActivity,
  FiClock,
  FiBookOpen,
  FiArrowLeft,
} from 'react-icons/fi';
import { FaBrain } from 'react-icons/fa6';

const SYMPTOM_OPTIONS = [
  'Racing heart', 'Chest tightness', 'Shortness of breath',
  'Excessive worry', 'Fatigue', 'Difficulty concentrating',
  'Irritability', 'Muscle tension', 'Sleep disruption',
  'Restlessness', 'Sadness', 'Loss of interest',
  'Brain fog', 'Dizziness', 'Intrusive thoughts', 'Digestive distress',
];

/**
 * Intelligent Clinical NLP Question Generator
 * Generates dynamic, highly specific questions grounded in the user's exact problem description & symptoms.
 */
function generateTargetedQuestions(text = '', selectedSymptoms = []) {
  const clean = text.trim();
  const t = (clean + ' ' + selectedSymptoms.join(' ')).toLowerCase();
  const preview = clean.length > 55 ? `${clean.slice(0, 55)}...` : clean;

  // 1. Academic & Exam & Performance Strain
  if (/exam|test|study|studying|grade|grades|gpa|school|college|university|assignment|thesis|deadline|interview|presentation|stage|speech|viva/i.test(t)) {
    return {
      focusTags: ['Academic & Evaluation Strain', 'Attentional Load', 'Performance Pressure'],
      questions: [
        {
          id: 'q_primary_trigger',
          text: 'Trigger Specificity: What aspect of this upcoming test, deadline, or performance is generating the most psychological strain?',
          options: [
            'Fear of underperforming or failing personal or family expectations',
            'Severe time shortage and volume of material left to complete',
            'Imposter feelings or worry that my mind will go blank under pressure',
          ],
        },
        {
          id: 'q_somatic_cognitive',
          text: 'Attentional & Bodily Response: When you sit down to prepare or think about this, how does your system react?',
          options: [
            'Mind gets hijacked by "worst-case" scenarios and racing thoughts',
            'Physical tension — elevated pulse, shallow breathing, or chest tightness',
            'Cognitive paralysis — feeling too overwhelmed to start or absorb material',
          ],
        },
        {
          id: 'q_functional_impact',
          text: 'Impact on Daily Routine: How is this pressure currently affecting your daily functioning and rest?',
          options: [
            'Disrupting my sleep and ability to fully relax',
            'Causing severe procrastination and difficulty initiating tasks',
            'Making me irritable and emotionally exhausted throughout the day',
          ],
        },
      ],
    };
  }

  // 2. Sleep Latency & Insomnia
  if (/sleep|insomnia|night|awake|bed|wake|waking|midnight|dreams|nightmare/i.test(t)) {
    return {
      focusTags: ['Sleep Architecture', 'Pre-Sleep Arousal', 'Restorative Deficit'],
      questions: [
        {
          id: 'q_sleep_pattern',
          text: 'Sleep Pattern Disruption: Where is the primary difficulty occurring in your rest cycle?',
          options: [
            'Difficulty falling asleep — lying awake for over 45 minutes with a busy mind',
            'Waking up in the middle of the night (2–4 AM) with a sudden surge of alertness or worry',
            'Waking up prematurely and feeling completely unrefreshed despite hours in bed',
          ],
        },
        {
          id: 'q_presleep_thoughts',
          text: 'Pre-Bedtime Mental State: When attempting to fall asleep, what is your dominant mental experience?',
          options: [
            'Replaying unresolved problems, conversations, or tomorrow\'s responsibilities',
            'Physical restlessness or tension that prevents settling comfortably',
            'An intrusive loop of worries that becomes louder in silence',
          ],
        },
        {
          id: 'q_daytime_impact',
          text: 'Daytime Impact: How is this lack of restorative sleep affecting your daytime functioning?',
          options: [
            'Brain fog, delayed concentration, and low mental stamina',
            'Emotional volatility, heightened anxiety, or short temper',
            'Severe physical fatigue and heavy reliance on caffeine or stimulants',
          ],
        },
      ],
    };
  }

  // 3. Acute Panic & Somatic Autonomic Surge
  if (/panic|heart|palpitat|breath|breathing|chest|tight|chok|trembl|shak|dizz|sweat|hyperventilat|pulse|suffocat/i.test(t)) {
    return {
      focusTags: ['Autonomic Arousal', 'Somatic Reactivity', 'Physiological Regulation'],
      questions: [
        {
          id: 'q_panic_nature',
          text: 'Nature of Physical Sensation: How do the chest, heart, or breathing sensations you described unfold?',
          options: [
            'Abrupt, intense spikes that surge quickly and create acute alarm',
            'Constant, lingering tightness or shallow breathing that persists through the day',
            'Intermittent palpitations or shortness of breath triggered during specific stressful moments',
          ],
        },
        {
          id: 'q_panic_reaction',
          text: 'Immediate Cognitive Reaction: When these physical sensations peak, what thought is most prominent?',
          options: [
            '"I am experiencing acute stress, but I can breathe through it"',
            '"What if my body cannot calm down or something goes wrong?"',
            'An intense urge to stop whatever I am doing and immediately get away',
          ],
        },
        {
          id: 'q_panic_recovery',
          text: 'Recovery & Baseline: After an episode of high physical tension, how does your system settle?',
          options: [
            'Settles down within 15–20 minutes with conscious rest',
            'Takes several hours of lingering alertness before feeling normal',
            'Leaves me feeling physically drained and on edge for the rest of the day',
          ],
        },
      ],
    };
  }

  // 4. Depressive Inertia & Low Energy & Apathy
  if (/depress|hopeless|empty|numb|pointless|worthless|sad|cry|crying|lonely|alone|no motivation|inertia|meaningless|apathy|give up/i.test(t)) {
    return {
      focusTags: ['Psychomotor Drive', 'Affective Responsiveness', 'Energy Baseline'],
      questions: [
        {
          id: 'q_depress_energy',
          text: 'Energy & Task Initiation: How would you describe your baseline drive to initiate daily tasks right now?',
          options: [
            'Low energy, but I can manage essential responsibilities with conscious effort',
            'Heavy physical inertia — simple daily tasks feel overwhelming and exhausting',
            'Severe lack of motivation where starting anything feels nearly impossible',
          ],
        },
        {
          id: 'q_depress_affect',
          text: 'Emotional Experience: How are you currently experiencing interest and emotional connection?',
          options: [
            'Muted enjoyment, but still able to engage in moments of connection',
            'Emotional numbness and a noticeable loss of interest in things I normally care about',
            'Pervasive feelings of sadness, emptiness, or feeling disconnected from others',
          ],
        },
        {
          id: 'q_depress_thoughts',
          text: 'Internal Narrative: What is the most frequent tone of your self-talk right now?',
          options: [
            '"I am exhausted and need a structured recovery"',
            '"I am falling behind and not meeting my own expectations"',
            '"Things feel pointless and difficult to improve"',
          ],
        },
      ],
    };
  }

  // 5. Workplace Stress & Burnout
  if (/work|job|boss|manager|client|project|office|career|colleague|coworker|shift|overtime|burnout|workload|corporate|meeting/i.test(t)) {
    return {
      focusTags: ['Occupational Stress', 'Cognitive Load', 'Boundary Management'],
      questions: [
        {
          id: 'q_work_driver',
          text: 'Primary Work Stressor: What is the main source of the strain in your work environment?',
          options: [
            'Excessive volume of tasks, urgent deadlines, and competing priorities',
            'Interpersonal friction, difficult communications, or lack of support',
            'High pressure and fear of making critical mistakes or falling short',
          ],
        },
        {
          id: 'q_work_mental_state',
          text: 'Cognitive Capacity: How is this work pressure affecting your mental clarity during the day?',
          options: [
            'Concentration is strained, requiring frequent double-checking',
            'Mental exhaustion and decision fatigue by mid-day',
            'Feeling burned out, where even minor requests provoke frustration',
          ],
        },
        {
          id: 'q_work_boundary',
          text: 'Disconnection After Hours: Are you able to disconnect from work thoughts during personal time?',
          options: [
            'Yes, I can generally leave work behind once my shift ends',
            'Work worries frequently intrude into my evenings and free time',
            'Constant dread about the next workday and inability to relax off-duty',
          ],
        },
      ],
    };
  }

  // 6. Anger & Irritation & Frustration
  if (/anger|angry|furious|irritat|frustrat|rage|hate|mad|pissed|temper|yell|snapped|resent|argument|conflict/i.test(t)) {
    return {
      focusTags: ['Reactivity Threshold', 'Musculoskeletal Tension', 'Emotional Regulation'],
      questions: [
        {
          id: 'q_anger_trigger',
          text: 'Reactivity & Triggers: How do minor delays, friction, or unexpected issues affect you right now?',
          options: [
            'Mild irritation that I can usually manage internally',
            'A quick flare-up of anger with a strong impulse to snap or react',
            'A persistent, simmering frustration that stays on my mind for hours',
          ],
        },
        {
          id: 'q_anger_body',
          text: 'Physical Tension Holding: Where in your body do you notice this tension and agitation?',
          options: [
            'Jaw clenching, neck stiffness, or tight shoulders',
            'A surge of physical heat, faster heartbeat, or rapid breathing',
            'Stomach knots, digestive tension, or headaches',
          ],
        },
        {
          id: 'q_anger_settling',
          text: 'Cooling Down: After an episode of frustration or conflict, how does your state unfold?',
          options: [
            'I settle down within 10–15 minutes once the situation passes',
            'The grievance replays in my mind for hours, disturbing my focus and mood',
            'Leaves me feeling emotionally drained, tense, or regretful afterward',
          ],
        },
      ],
    };
  }

  // 7. Overthinking & Racing Thoughts
  if (/overthink|racing|loop|thoughts|can't stop thinking|in my head|intrusive|obsess|analyzing|mind|spiral/i.test(t)) {
    return {
      focusTags: ['Thought Velocity', 'Attentional Focus', 'Mental Regulation'],
      questions: [
        {
          id: 'q_overthink_pattern',
          text: 'Structure of Overthinking: How would you describe the way your thoughts are moving?',
          options: [
            'Jumping rapidly from one worry to another without reaching conclusions',
            'Looping repeatedly over a specific problem, past event, or future uncertainty',
            'A constant background hum of mental noise that prevents quiet and calm',
          ],
        },
        {
          id: 'q_overthink_focus',
          text: 'Focus & Concentration: When trying to focus on a single task or rest quietly, what happens?',
          options: [
            'I can focus for a few minutes before drifting back into mental loops',
            'Intrusive thoughts immediately pull my attention away',
            'Physical restlessness that makes sitting still uncomfortable',
          ],
        },
        {
          id: 'q_overthink_driver',
          text: 'Underlying Driver: What feels like the main cause of this continuous mental activity?',
          options: [
            'A feeling that if I don\'t analyze everything, something will go wrong',
            'Frustration with unresolved issues or uncertainty about outcomes',
            'Mental habit of hyper-analysis and difficulty slowing down',
          ],
        },
      ],
    };
  }

  // 8. General / Context-Grounded Clinical Evaluation (Universal Fallback)
  return {
    focusTags: ['Cognitive vs Physical Distribution', 'Onset & Chronicity', 'Daily Functional Impact'],
    questions: [
      {
        id: 'q_general_distribution',
        text: `Regarding your stated situation ("${preview}"): Is your discomfort primarily mental or physical?`,
        options: [
          'Predominantly mental: Overthinking, racing thoughts, worry, or difficulty focusing',
          'Predominantly physical: Bodily tension, elevated pulse, shallow breathing, or fatigue',
          'A significant combination of both mental turbulence and physical exhaustion',
        ],
      },
      {
        id: 'q_general_chronicity',
        text: 'Chronicity & Pattern: How long has this current emotional or cognitive pattern been persisting?',
        options: [
          'Just started recently / acute reaction to an event today',
          'Episodic pattern that has been fluctuating over the past few days',
          'Ongoing for multiple weeks / chronic pattern that keeps recurring',
        ],
      },
      {
        id: 'q_general_impact',
        text: 'Functional Impairment: How significantly is this state affecting your daily routine, sleep, and peace of mind?',
        options: [
          'Mildly noticeable; I can maintain my normal responsibilities with effort',
          'Moderately disruptive; my concentration, mood, and sleep are clearly strained',
          'Severely impacting my daily tasks, emotional stability, and overall peace',
        ],
      },
    ],
  };
}

const CLINICAL_EXERCISES = {
  'ACUTE ANXIETY (Visada)': {
    somaticExercise: '4-4-6 Extended Exhalation Breathing — Inhale for 4 seconds, hold for 4 seconds, exhale slowly for 6 seconds. Repeat 5 cycles to stimulate the vagus nerve and down-regulate elevated heart rate.',
    cognitiveExercise: 'Circle of Control Matrix — On paper, write 3 factors outside your immediate control (e.g. other people, exam questions, future outcomes) and draw a line through them. Write 1 immediate physical action you control right now.',
    lifestyleSuggestion: 'Take a 15-minute digital screen pause. Drink a glass of room-temperature water with slow, conscious sips.',
  },
  'DEPRESSION / LETHARGY (Tamas)': {
    somaticExercise: 'Postural Expansion & Movement Trigger — Stand tall, pull shoulders back, expand your chest cavity, and take 10 deep expansive breaths. Walk at a brisk pace for 3 minutes to break physical inertia.',
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

  symptoms.forEach((s) => {
    const ls = s.toLowerCase();
    if (['racing heart', 'chest tightness', 'shortness of breath', 'excessive worry', 'dizziness'].includes(ls)) anxietyScore += 3;
    if (['fatigue', 'sadness', 'loss of interest', 'brain fog', 'difficulty concentrating'].includes(ls)) depressionScore += 3;
    if (['irritability', 'muscle tension', 'digestive distress'].includes(ls)) stressScore += 3;
    if (['restlessness', 'sleep disruption', 'intrusive thoughts'].includes(ls)) { anxietyScore += 1.5; stressScore += 1.5; }
  });

  const fullText = `${desc} ${additionalNotes}`.toLowerCase();
  if (fullText.includes('anxi') || fullText.includes('panic') || fullText.includes('fear') || fullText.includes('palpitat') || fullText.includes('scared') || fullText.includes('worry') || fullText.includes('exam') || fullText.includes('test')) anxietyScore += 3.5;
  if (fullText.includes('depress') || fullText.includes('hopeless') || fullText.includes('empty') || fullText.includes('tired') || fullText.includes('sad') || fullText.includes('alone') || fullText.includes('numb')) depressionScore += 3.5;
  if (fullText.includes('stress') || fullText.includes('anger') || fullText.includes('irritat') || fullText.includes('tense') || fullText.includes('burnout') || fullText.includes('frustrat') || fullText.includes('boss')) stressScore += 3.5;

  Object.values(answers).forEach((ans) => {
    const a = (ans || '').toLowerCase();
    if (a.includes('overwhelm') || a.includes('flutter') || a.includes('racing') || a.includes('restless') || a.includes('catastrophic') || a.includes('panic') || a.includes('paralysis') || a.includes('shortness')) anxietyScore += 2.5;
    if (a.includes('drain') || a.includes('withdraw') || a.includes('deplet') || a.includes('sluggish') || a.includes('numb') || a.includes('inertia') || a.includes('hopeless')) depressionScore += 2.5;
    if (a.includes('agitati') || a.includes('tight') || a.includes('burnout') || a.includes('jaw') || a.includes('temper') || a.includes('resent') || a.includes('gridlock')) stressScore += 2.5;
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
  const [answers, setAnswers] = useState({});
  const [symptoms, setSymptoms] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [discomfort, setDiscomfort] = useState(3);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');

  const [lang, setLang] = useState('en');
  const [diagnosedState, setDiagnosedState] = useState('');
  const [newAccuracy, setNewAccuracy] = useState(86.0);
  const [resultVerse, setResultVerse] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dynamically compute targeted questions based on the user's description and selected symptoms
  const targetedQuestionData = useMemo(() => {
    return generateTargetedQuestions(description, symptoms);
  }, [description, symptoms]);

  const handleProceedToQuestions = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please describe your current feelings or situation to generate targeted clinical questions.');
      return;
    }
    setError('');
    setAnswers({});
    setStep(2);
  };

  const toggleSymptom = (s) => {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleAnswerSelect = (qId, option) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleUpdateDescriptionInline = (e) => {
    e.preventDefault();
    if (tempDescription.trim()) {
      setDescription(tempDescription.trim());
      setAnswers({});
      setIsEditingDescription(false);
    }
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
        confidence: 0.80,
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
        <FiArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* ── Diagnostic Step Progress Bar ────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', opacity: step >= 1 ? 1 : 0.4 }}>
          <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: step === 1 ? 'var(--primary)' : 'var(--sage)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 800 }}>
            1
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: step === 1 ? 'var(--primary)' : 'var(--text-secondary)' }}>
            Problem Description
          </span>
        </div>
        <span style={{ color: 'var(--border)', fontSize: '1.2rem' }}>&rarr;</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', opacity: step >= 2 ? 1 : 0.4 }}>
          <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: step === 2 ? 'var(--primary)' : step > 2 ? 'var(--sage)' : 'var(--border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 800 }}>
            2
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: step === 2 ? 'var(--primary)' : 'var(--text-secondary)' }}>
            Targeted Questions
          </span>
        </div>
        <span style={{ color: 'var(--border)', fontSize: '1.2rem' }}>&rarr;</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', opacity: step >= 3 ? 1 : 0.4 }}>
          <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: step === 3 ? 'var(--primary)' : 'var(--border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 800 }}>
            3
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: step === 3 ? 'var(--primary)' : 'var(--text-secondary)' }}>
            Clinical Report & Remediation
          </span>
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {/* ── STEP 1: Problem Input ───────────────────────────── */}
      {step === 1 && (
        <Card style={{ maxWidth: 860, margin: '1rem auto 3rem' }}>
          <CardHeader style={{ padding: '2rem 2rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="medical-header-badge">
                <FaBrain size={14} /> Clinical Intake
              </span>
            </div>
            <CardTitle style={{ fontSize: '2rem' }}>How are you feeling right now?</CardTitle>
            <CardDescription style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
              Describe your current thoughts, physical sensations, triggers (e.g. work deadlines, exam stress, sleep issues, emotional tension), or challenges in your own words.
            </CardDescription>
          </CardHeader>

          <CardContent style={{ padding: '1rem 2rem 2rem' }}>
            <form onSubmit={handleProceedToQuestions}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder="Example: I have an important presentation tomorrow morning and my chest feels tight. My heart won't stop racing and I can't sleep because I keep overthinking mistakes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  autoFocus
                  required
                  style={{ fontSize: '1.05rem', lineHeight: '1.7', padding: '1.25rem', borderRadius: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
                  Confidential clinical analysis engine
                </span>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
                  Generate Targeted Questions &rarr;
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 2: Targeted Questions & Symptoms ───────────── */}
      {step === 2 && (
        <form onSubmit={handleFinalSubmit}>
          <div className="page-header" style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="medical-header-badge">
                <FiActivity size={14} /> Targeted Evaluation
              </span>
            </div>
            <h1 style={{ fontSize: '2.2rem' }}>Targeted Cognitive Assessment</h1>
            <p style={{ fontSize: '1.05rem' }}>
              Please answer the follow-up questions generated directly from your problem description and symptom selection.
            </p>
          </div>

          {/* User Statement Context Box with Inline Edit */}
          <div style={{ background: 'var(--bg-subtle)', border: '1.5px solid var(--border)', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 800 }}>
                  Active Problem Statement:
                </span>
                {targetedQuestionData.focusTags?.map((tag) => (
                  <span key={tag} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 10px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800 }}>
                    {tag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempDescription(description);
                  setIsEditingDescription(!isEditingDescription);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <FiEdit3 size={15} /> {isEditingDescription ? 'Cancel' : 'Edit Context'}
              </button>
            </div>

            {isEditingDescription ? (
              <div style={{ marginTop: '0.75rem' }}>
                <textarea
                  className="form-control"
                  rows={3}
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  style={{ marginBottom: '0.75rem', fontSize: '1rem' }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleUpdateDescriptionInline}
                  style={{ fontSize: '0.9rem' }}
                >
                  <FiRefreshCw size={13} style={{ marginRight: 5 }} /> Update & Re-target Questions
                </button>
              </div>
            ) : (
              <p style={{ margin: 0, fontStyle: 'italic', fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                "{description}"
              </p>
            )}
          </div>

          <div className="grid-2" style={{ marginBottom: '2rem', alignItems: 'start', gap: '2rem' }}>
            {/* Left: Dynamically Generated Questions Card */}
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <CardTitle style={{ fontSize: '1.35rem' }}>Targeted Clinical Inquiries</CardTitle>
                  <span style={{ fontSize: '0.85rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 10px', borderRadius: '8px', fontWeight: 800 }}>
                    {targetedQuestionData.questions.length} Items
                  </span>
                </div>
                <CardDescription style={{ fontSize: '0.95rem' }}>
                  Select the option that most accurately reflects your experience
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  {targetedQuestionData.questions.map((q, idx) => (
                    <div key={q.id}>
                      <label style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                        {idx + 1}. {q.text}
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {q.options.map((opt) => (
                          <label
                            key={opt}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.85rem',
                              fontSize: '0.96rem',
                              padding: '12px 16px',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              background: answers[q.id] === opt ? 'rgba(76,114,255,0.12)' : 'var(--bg-subtle)',
                              border: answers[q.id] === opt ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                              transition: 'all 0.15s ease',
                              lineHeight: '1.5',
                            }}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={answers[q.id] === opt}
                              onChange={() => handleAnswerSelect(q.id, opt)}
                              style={{ marginTop: '4px' }}
                            />
                            <span style={{ color: answers[q.id] === opt ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: answers[q.id] === opt ? 700 : 400 }}>
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <div className="section-label" style={{ marginBottom: '0.5rem' }}>ADDITIONAL CONTEXT & TRIGGERS</div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Add any extra triggers, specific timeline details, or thoughts not covered above:
                  </p>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Type additional clinical context or notes here..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    style={{ borderRadius: '12px', fontSize: '0.96rem' }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right: Symptoms Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <Card>
                <CardHeader>
                  <CardTitle style={{ fontSize: '1.35rem' }}>Symptom Checklist</CardTitle>
                  <CardDescription style={{ fontSize: '0.95rem' }}>
                    Select all concurrent sensations to refine your clinical diagnostic profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    {SYMPTOM_OPTIONS.map((s) => (
                      <button
                        type="button"
                        key={s}
                        className={`btn ${symptoms.includes(s) ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => toggleSymptom(s)}
                        style={{ fontSize: '0.92rem', padding: '7px 16px', borderRadius: '24px' }}
                      >
                        {symptoms.includes(s) ? `Selected: ${s}` : `+ ${s}`}
                      </button>
                    ))}
                  </div>

                  {symptoms.length > 0 ? (
                    <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', fontSize: '0.92rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Selected Symptoms ({symptoms.length}):</strong>
                      <div style={{ marginTop: '6px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {symptoms.join(' · ')}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '1rem', fontSize: '0.92rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Click on any concurrent physical or cognitive symptoms above if applicable.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              &larr; Back to Problem Description
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
              {loading ? 'Analyzing Telemetry...' : 'Compile Clinical Report & Prescriptions \u2192'}
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 3: Report & Remediation ────────────────────── */}
      {step === 3 && (
        <>
          <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="medical-header-badge">
                  <FiCheckCircle size={12} /> Diagnostic Report
                </span>
              </div>
              <h1 style={{ fontSize: '1.75rem' }}>Clinical Cognitive Assessment & Remediation Report</h1>
              <p>Prescribed physical activity, somatic exercises, behavioral suggestions, and Vedantic grounding.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-subtle)', padding: '4px 6px', borderRadius: '10px', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>Language:</span>
              <button
                type="button"
                className={`btn btn-sm ${lang === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLang('en')}
                style={{ fontSize: '0.9rem', padding: '6px 14px', borderRadius: '12px' }}
              >
                English
              </button>
              <button
                type="button"
                className={`btn btn-sm ${lang === 'hi' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLang('hi')}
                style={{ fontSize: '0.9rem', padding: '6px 14px', borderRadius: '12px' }}
              >
                हिन्दी
              </button>
              <button
                type="button"
                className={`btn btn-sm ${lang === 'bn' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLang('bn')}
                style={{ fontSize: '0.9rem', padding: '6px 14px', borderRadius: '12px' }}
              >
                বাংলা
              </button>
              <button
                type="button"
                className={`btn btn-sm ${lang === 'hl' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLang('hl')}
                style={{ fontSize: '0.9rem', padding: '6px 14px', borderRadius: '12px' }}
              >
                Hinglish
              </button>
            </div>
          </div>

          <Card style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(76,114,255,0.06), rgba(16,185,129,0.06))', border: '1.5px solid rgba(76,114,255,0.25)' }}>
            <CardContent style={{ padding: '1.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', fontWeight: 800 }}>
                    AI-DIAGNOSED PSYCHOPHYSIOLOGICAL PROFILE
                  </div>
                  <h2 style={{ margin: '6px 0 0', color: 'var(--primary)', fontSize: '1.9rem', fontWeight: 800 }}>
                    {diagnosedState}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '8px 18px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Verified Biomarkers</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '1.15rem' }}>{symptoms.length} Symptoms</strong>
                  </div>
                  <div style={{ background: '#fff', border: '1.5px solid rgba(16,185,129,0.5)', borderRadius: '12px', padding: '8px 18px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#10B981', display: 'block', fontWeight: 700 }}>Model Dynamic Accuracy</span>
                    <strong style={{ color: '#10B981', fontSize: '1.15rem' }}>{newAccuracy}% (Self-Calibrated)</strong>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {physicalAct && (
            <Card style={{ marginBottom: '2rem', borderLeft: '6px solid #10B981' }}>
              <CardContent style={{ padding: '1.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <FiActivity size={20} color="#10B981" />
                    <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Prescribed Physical Activity & Somatic Movement
                    </span>
                  </div>
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1.5px solid #10B981', color: '#10B981', padding: '4px 14px', borderRadius: '16px', fontSize: '0.88rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FiClock size={14} /> {physicalAct.duration}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: '1.35rem', fontWeight: 800 }}>
                  {physicalAct.name}
                </h3>
                <p style={{ margin: '0 0 14px', fontSize: '1.02rem', color: 'var(--text-primary)', lineHeight: '1.7' }}>
                  <strong>Step-by-Step Instructions:</strong> {physicalAct.instructions}
                </p>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 16px', fontSize: '0.96rem', color: 'var(--text-secondary)' }}>
                  <strong>Biological & Vagal Benefit:</strong> {physicalAct.benefit}
                </div>
              </CardContent>
            </Card>
          )}

          <Card style={{ marginBottom: '2rem', borderLeft: '5px solid var(--primary)' }}>
            <CardHeader>
              <CardTitle style={{ fontSize: '1.35rem' }}>Recommended Cognitive & Lifestyle Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid-3" style={{ gap: '1.5rem' }}>
                <div className="card-subtle" style={{ padding: '1.35rem' }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.5rem', fontSize: '1.02rem' }}>
                    Somatic Breathing Protocol
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {exercises.somaticExercise}
                  </p>
                </div>

                <div className="card-subtle" style={{ padding: '1.35rem' }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.5rem', fontSize: '1.02rem' }}>
                    Cognitive Re-framing Protocol
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {exercises.cognitiveExercise}
                  </p>
                </div>

                <div className="card-subtle" style={{ padding: '1.35rem' }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.5rem', fontSize: '1.02rem' }}>
                    Lifestyle & Environmental Protocol
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {exercises.lifestyleSuggestion}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid-2" style={{ marginBottom: '2rem', gap: '2rem' }}>
            <Card>
              <CardHeader>
                <CardTitle style={{ fontSize: '1.35rem' }}>Patient Assessment Record</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ marginBottom: '1.25rem' }}>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                    Reported Problem Description:
                  </strong>
                  <div className="card-subtle" style={{ fontSize: '0.98rem', lineHeight: 1.6 }}>
                    "{description}"
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    Recorded Symptoms ({symptoms.length}):
                  </strong>
                  {symptoms.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {symptoms.map((s) => (
                        <span key={s} style={{ background: 'rgba(76,114,255,0.12)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '14px', fontSize: '0.88rem', fontWeight: 700 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No specific symptoms selected</span>
                  )}
                </div>

                {additionalNotes && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                      Additional Patient Notes:
                    </strong>
                    <div className="card-subtle" style={{ fontSize: '0.98rem' }}>
                      {additionalNotes}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Session encrypted and saved to medical record history.
                </span>
              </CardFooter>
            </Card>

            {resultVerse && (
              <Card style={{ borderLeft: '5px solid var(--primary)' }}>
                <CardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiBookOpen size={18} color="var(--primary)" />
                      <CardTitle style={{ fontSize: '1.35rem' }}>{getConcept()}</CardTitle>
                    </div>
                    <span style={{ fontSize: '0.88rem', background: 'var(--bg-subtle)', padding: '3px 10px', borderRadius: '10px', fontWeight: 800 }}>
                      Chapter {resultVerse.chapter}, Verse {resultVerse.verse}
                    </span>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="sanskrit-block" style={{ marginBottom: '1rem', fontSize: '1.25rem', lineHeight: '1.8' }}>
                    {getSanskritText().split('\n').map((l, i) => (
                      <span key={i}>{l}<br /></span>
                    ))}
                  </div>

                  {(lang === 'en' || lang === 'hl') && (
                    <div className="transliteration" style={{ marginBottom: '1rem', fontSize: '0.96rem', lineHeight: '1.6' }}>
                      {resultVerse.transliteration.split('\n').map((l, i) => (
                        <span key={i}>{l}<br /></span>
                      ))}
                    </div>
                  )}

                  <div className="translation-block" style={{ marginBottom: '1.25rem', fontSize: '0.98rem', lineHeight: '1.7' }}>
                    <strong>
                      {lang === 'hi' ? 'सीधा अर्थ (भावार्थ):' : lang === 'bn' ? 'বঙ্গানুবাদ ও ভাবার্থ:' : lang === 'hl' ? 'Direct Meaning (Bhavarth):' : 'Direct Meaning:'}
                    </strong>
                    <br />
                    {getTranslation()}
                  </div>

                  <div className="section-label" style={{ marginTop: '1.25rem', marginBottom: '0.6rem' }}>
                    {lang === 'hi' ? '3-चरणीय स्थिरता अभ्यास' : lang === 'bn' ? '৩-পর্যায়ের মানসিক প্রশান্তি অনুশীলন' : lang === 'hl' ? '3-STAGE SOMATIC GROUNDING (STHIRATA ABHYAS)' : '3-STAGE SOMATIC GROUNDING TRAJECTORY'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {getGroundingSteps().map((stepText, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        <span style={{ background: 'var(--primary)', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
                          {i + 1}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{stepText}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
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
