import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { FiLayers, FiClock, FiActivity, FiDownload, FiArrowLeft } from 'react-icons/fi';

const CLINICAL_EXERCISES = {
  'ACUTE ANXIETY (Visada)': {
    somatic: '4-4-6 Extended Exhalation Breathing — Inhale 4s, hold 4s, exhale slowly 6s. Repeat 5 cycles to stimulate the vagus nerve.',
    cognitive: 'Circle of Control — Note 3 uncontrollable outcomes and cross them out; commit to 1 immediate actionable effort.',
    lifestyle: '15-minute complete digital screen pause. Drink a glass of warm water slowly.',
  },
  'DEPRESSION / LETHARGY (Tamas)': {
    somatic: 'Postural Expansion & Dynamic Movement — Stand tall, open chest cavity, take 10 expansive breaths, walk for 3 minutes.',
    cognitive: 'The 2-Minute Micro-Victory Rule — Complete one small task (e.g. make bed, wash cup) and celebrate it as an intentional win.',
    lifestyle: 'Get 10 minutes of direct morning sunlight. Splash cold water on your face.',
  },
  'STRESS & AGITATION (Krodha)': {
    somatic: 'Sitali Cooling Breath & Palm Press — Inhale cooling breath through teeth/curled tongue; press palms together for 10s to interrupt anger loop.',
    cognitive: '90-Second Impulse Buffer — Step back from the trigger for 90s to allow autonomic adrenaline spikes to metabolize.',
    lifestyle: 'Perform progressive shoulder rolls and unclench your jaw. Avoid stimulants for 4 hours.',
  },
  'EQUILIBRIUM (Sattva)': {
    somatic: 'Alpha Coherence Meditation — Observe gentle rise and fall of breath at the tip of nostrils for 3 minutes.',
    cognitive: 'Sakshi-Bhava (Witness State) — Observe passing emotions without impulsive clinging or reactivity.',
    lifestyle: 'Reinforce calm by writing down one insight or sharing an encouraging word with someone.',
  },
};

const GITA_VERSES = {
  'ACUTE ANXIETY (Visada)': {
    chapter: 2, verse: 47,
    concept: 'Nishkama Karma',
    concept_hi: 'निष्काम कर्म (Nishkama Karma)',
    concept_bn: 'নিষ্কাম কর্ম (Nishkama Karma)',
    concept_hl: 'Nishkama Karma (Bina Phal Ki Chinta Kiye Karm)',
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    sanskritBengali: 'কর্মণ্যেবাধিকারস্তে মা ফলেষু কদাচন।\nমা কর্মফলহেতুর্ভুর্মা তে সঙ্গোঽস্ত্বকৰ্মণি॥',
    transliteration: "karmanhy evadhikaras te ma phaleshu kadachana\nma karma-phala-hetur bhur ma te sango 'stv akarmani",
    translation: 'You have the right to perform your duty, but you are not entitled to the fruits of your actions. Never consider yourself the cause of results, and never be attached to inaction.',
    translation_hi: 'तुम्हारा अधिकार केवल कर्म करने में है, उसके फलों में कभी नहीं। इसलिए कर्मफल के कारण मत बनो और न ही कर्म न करने में तुम्हारी आसक्ति हो।',
    translation_bn: 'কর্মে তোমার অধিকার আছে, কিন্তু কর্মফলে কখনো অধিকার নেই। অতএব কর্মফলের হেতু হয়ো না এবং কর্মত্যাগেও তোমার যেন আসক্তি না থাকে।',
    translation_hl: 'Aapka adhikaar sirf karm karne mein hai, uske phal par kabhi nahi. Isliye phal ki chinta karke karm mat roko aur na hi aalas mein phaso.',
    groundingSteps: [
      'BREATHE — Close eyes. Inhale 4s, hold 4s, exhale 6s. Repeat 5 cycles.',
      'RE-FRAME — Write: "I control the effort, not the result." Read it aloud.',
      'ACT — Pick one task you have been avoiding. Work on it for 10 minutes without perfection pressure.',
    ],
    groundingSteps_hi: [
      'प्राणायाम — 4 सेकंड सांस लें, 4 सेकंड रोकें, 6 सेकंड छोड़ें। 5 बार दोहराएं।',
      'सकारात्मक विचार — लिखें: "मेरा नियंत्रण केवल प्रयास पर है, परिणाम पर नहीं।"',
      'कर्म — किसी एक छोटे काम को 10 मिनट तक बिना चिंता किए पूरा करें।',
    ],
    groundingSteps_bn: [
      'শ্বাসপ্রশ্বাস — ৪ সেকেন্ড শ্বাস নিন, ৪ সেকেন্ড ধরে রাখুন, ৬ সেকেন্ডে ছাড়ুন। ৫ বার করুন।',
      'চিন্তার পরিবর্তন — মনে রাখুন: "আমার নিয়ন্ত্রণ শুধু আমার প্রচেষ্টায়, ফলাফলে নয়।"',
      'কর্ম সম্পাদন — যে কাজটি করতে ভয় পাচ্ছেন তা ১০ মিনিটের জন্য শুরু করুন।',
    ],
    groundingSteps_hl: [
      'SAANS LEIN — 4s saans andar lein, 4s rokein, 6s mein chhodein. 5 baar karein.',
      'THOUGHT REFRAME — Kahein: "Mera control sirf meri mehnat par hai, outcome par nahi."',
      'ACTION LEIN — Ek chhota task bina perfection ki chinta ke 10 min karein.',
    ],
  },
  'DEPRESSION / LETHARGY (Tamas)': {
    chapter: 6, verse: 5,
    concept: 'Atma-Uddhara (Self-Elevation)',
    concept_hi: 'आत्मोद्धार एवं आत्म-शक्ति (Atma-Uddhara)',
    concept_bn: 'আত্মোদ্ধার ও আত্মশক্তি (Atma-Uddhara)',
    concept_hl: 'Atma-Uddhara (Khud Ko Uthana Aur Aage Badhana)',
    sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत् ।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः ॥',
    sanskritBengali: 'উদ্ধরেদাত্মনাত্মানং নাত্মানমবসাদয়েৎ।\nআত্মৈব হ্যাত্মনো বন্ধুরত্মৈব রিপুরাত্মনঃ॥',
    transliteration: 'uddhared atmanatmanam natmanam avasadayet\natmaiva hy atmano bandhur atmaiva ripur atmanah',
    translation: 'Elevate yourself through the power of your own mind, and do not degrade yourself. The mind can be the friend and also the enemy of the self.',
    translation_hi: 'मनुष्य को चाहिए कि वह अपने मन द्वारा अपना उद्धार करे, अपने आपको नीचे न गिरने दे। क्योंकि मन ही जीवात्मा का सच्चा मित्र है और मन ही उसका शत्रु भी है।',
    translation_bn: 'নিজের মন দ্বারা নিজেকে উন্নত করো, নিজেকে অবসাদগ্রস্ত বা অধঃপতিত করো না। কারণ মনই নিজের পরম বন্ধু এবং মনই নিজের চরম শত্রু।',
    translation_hl: 'Apne man ki shakti se khud ka uddhar karein, khud ko giraane na dein. Kyunki man hi aapka sabse bada dost hai aur man hi sabse bada dushman.',
    groundingSteps: [
      'MORNING ANCHOR — Place feet firmly on the ground. Say: "I am my own ally."',
      'MICRO-VICTORY — Complete one tiny task (drink water, make bed) and mark it a win.',
      'CONNECTION — Reach out to one friend or family member today. You are not alone.',
    ],
    groundingSteps_hi: [
      'आत्म-संकल्प — कहें: "मैं स्वयं का मित्र हूँ। मैं आज प्रगति चुनता हूँ।"',
      'लघु-सफलता — एक छोटा काम पूरा करें (पानी पीना, 2 मिनट खुली हवा में जाना)।',
      'सम्पर्क — आज किसी एक प्रियजन से बात करें या संदेश भेजें।',
    ],
    groundingSteps_bn: [
      'আত্ম-জাগরণ — বলুন: "আমি নিজেই আমার সবচেয়ে বড় শক্তি। আজ আমি অবসাদ মুক্ত হব।"',
      'ক্ষুদ্র বিজয় — যেকোনো একটি ছোট কাজ সম্পূর্ণ করুন (যেমন এক গ্লাস জল খাওয়া)।',
      'যোগাযোগ — পরিচিত কারো সাথে সামান্য কথা বলুন বা বার্তা পাঠান।',
    ],
    groundingSteps_hl: [
      'MORNING ANCHOR — Kahein: "Main khud ka saathi hoon, main aaj aage badhoonga."',
      'MICRO-VICTORY — Ek chhota task poora karein aur isse apni jeet maanein.',
      'CONNECTION — Aaj kisi ek dost ya family member ko call ya message karein.',
    ],
  },
  'STRESS & AGITATION (Krodha)': {
    chapter: 2, verse: 63,
    concept: 'Indriya-Nigraha (Sensory Calming)',
    concept_hi: 'इन्द्रिय-निग्रह एवं शांति (Indriya-Nigraha)',
    concept_bn: 'ইন্দ্রিয় সংযম ও প্রশান্তি (Indriya-Nigraha)',
    concept_hl: 'Indriya-Nigraha (Gusse Aur Tension Ko Shaant Karna)',
    sanskrit: 'क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः ।\nस्मृतिभ्रंशाद् बुद्धिनाशो बुद्धिनाशात्प्रणश्यति ॥',
    sanskritBengali: 'ক্রোধাদ্ভবতি সংমোহঃ সংমোহাৎস্মৃতিবিভ্রমঃ।\nস্মৃতিভ্রংশাদ বুদ্ধিনাশো বুদ্ধিনাশাৎপ্রণশ্যতি॥',
    transliteration: 'krodhad bhavati sammohah sammohat smriti-vibhramah\nsmriti-bhramsad buddhi-nasho buddhi-nashat pranashyati',
    translation: 'From anger arises delusion; from delusion, confusion of memory; from confusion of memory, loss of reason; and from loss of reason, one falls into ruin.',
    translation_hi: 'क्रोध से अविवेक उत्पन्न होता है, अविवेक से स्मृति भ्रमित होती है, स्मृति-भ्रम से बुद्धि का नाश होता है और बुद्धि नष्ट होने से मनुष्य का पतन हो जाता है।',
    translation_bn: 'ক্রোধ থেকে বিচারহীনতা জন্ম নেয়, তা থেকে স্মৃতিবিভ্রম ঘটে, স্মৃতিভ্রষ্ট হলে বুদ্ধিনাশ ঘটে এবং বুদ্ধি নষ্ট হলে মানুষের পতন ঘটে।',
    translation_hl: 'Gusse se samajh khatam hoti hai, samajh khone se memory bhatak jaati hai, aur memory bhatakne se buddhi ka nash hota hai jisse insaan gir jaata hai.',
    groundingSteps: [
      'PAUSE — Stop immediately. Press palms together firmly for 10 seconds.',
      '5-4-3-2-1 GROUNDING — Name 5 things you see, 4 touch, 3 hear, 2 smell, 1 taste.',
      'DHYANA RESET — Take 10 slow diaphragmatic breaths to reset nervous system.',
    ],
    groundingSteps_hi: [
      'विराम — तुरंत रुकें और दोनों हथेलियों को 10 सेकंड तक आपस में दबाएं।',
      'इन्द्रिय-केंद्रण — 5 चीज़ें देखें, 4 स्पर्श करें, 3 सुनें, 2 सूंघें, 1 स्वाद महसूस करें।',
      'ध्यान — 10 गहरी सांसें लेकर तंत्रिका तंत्र को पुनः संतुलित करें।',
    ],
    groundingSteps_bn: [
      'স্থিরতা — সাথে সাথে থামুন। ১০ সেকেন্ডের জন্য দুই হাতের তালু একসাথে চাপুন।',
      'ইন্দ্রিয় সচেতনতা — ৫টি জিনিস দেখুন, ৪টি স্পর্শ করুন, ৩টি শুনুন, ২টি গন্ধ নিন, ১টি স্বাদ নিন।',
      'গভীর শ্বাস — ধীরে ধীরে ১০টি দীর্ঘ শ্বাস নিয়ে শরীরকে শান্ত করুন।',
    ],
    groundingSteps_hl: [
      'PAUSE — Turant rukein. Dono hatho ko 10s zor se press karein.',
      '5-4-3-2-1 GROUNDING — 5 cheezein dekhein, 4 touch karein, 3 sunein, 2 smell, 1 taste.',
      'DHYANA RESET — 10 gehri saansein lein aur nervous system ko shaant karein.',
    ],
  },
  'EQUILIBRIUM (Sattva)': {
    chapter: 2, verse: 56,
    concept: 'Sthitaprajna (Steady Wisdom)',
    concept_hi: 'स्थितप्रज्ञ (अटल समत्व) (Sthitaprajna)',
    concept_bn: 'স্থিতপ্রজ্ঞ (স্থির প্রজ্ঞা) (Sthitaprajna)',
    concept_hl: 'Sthitaprajna (Har Haalat Mein Shaant Rehna)',
    sanskrit: 'दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः ।\nवीतरागभयक्रोधः स्थितधीर्मुनिरुच्यते ॥',
    sanskritBengali: 'দুঃখেষ্বনুদ্ধিগ্নমনাঃ সুখেষু বিগতস্পৃহঃ।\nবীতরাগভয়ক্রোধঃ স্থিতধীর্যুনিরুচ্যতে॥',
    transliteration: 'duhkheshv anudvigna-manah sukheshu vigata-sprhah\nvita-raga-bhaya-krodhah sthita-dhir munir ucyate',
    translation: 'One whose mind remains undisturbed amidst sorrow, who does not crave pleasure, and who is free from attachment, fear, and anger — such a person is called a sage of steady wisdom.',
    translation_hi: 'जो दुःखों में उद्विग्न नहीं होता, सुखों में निःस्पृह रहता है, तथा जिसके राग, भय और क्रोध नष्ट हो चुके हैं, वह स्थिर बुद्धि वाला मुनि कहलाता है।',
    translation_bn: 'দুঃখে যার মন উদ্বিগ্ন হয় না, সুখে যার আসক্তি নেই এবং যিনি ভয় ও ক্রোধ থেকে মুক্ত — তিনিই স্থিতপ্রজ্ঞ অর্থাৎ স্থির বুদ্ধিসম্পন্ন পুরুষ।',
    translation_hl: 'Jo dukh mein ghabrata nahi, sukh mein behakta nahi, aur jiske man se dar, gussa aur attachment khatam ho chuka hai — wahi sthir buddhi wala hai.',
    groundingSteps: [
      'GRATITUDE PAUSE — Close eyes and list 3 things you are grateful for right now.',
      'WITNESS STATE — Observe external events calmly without emotional clinging.',
      'SHARE PEACE — Share a positive, encouraging word with someone nearby.',
    ],
    groundingSteps_hi: [
      'कृतज्ञता — 3 ऐसी बातों का स्मरण करें जिनके प्रति आप आभारी हैं।',
      'साक्षी भाव — घटनाओं को शांत साक्षी बनकर देखें।',
      'शांति प्रसार — किसी के साथ मधुर व सकारात्मक व्यवहार साझा करें।',
    ],
    groundingSteps_bn: [
      'কৃতজ্ঞতা প্রকাশ — ৩টি বিষয়ের কথা স্মরণ করুন যার জন্য আপনি কৃতজ্ঞ।',
      'সাক্ষী ভাব — জীবনের ঘটনাগুলোকে স্থিরভাবে অবলোকন করুন।',
      'প্রশান্তি ছড়িয়ে দিন — অপরের সাথে একটি সুন্দর হাসি ভাগ করে নিন।',
    ],
    groundingSteps_hl: [
      'GRATITUDE PAUSE — 3 aisi cheezein sochein jinke liye aap thankful hain.',
      'SAKSHI BHAV — Zindagi ke events ko ek shaant observer bankar dekhein.',
      'SHANTI SPREAD — Kisi ke saath ek positive gesture share karein.',
    ],
  },
};

export default function SessionHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalLang, setModalLang] = useState('en');

  useEffect(() => {
    api.getSessions(100)
      .then(d => setSessions(d.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = sessions.length;
  const hardwareSessions = sessions.filter(s => !s.classifier_method?.toLowerCase().includes('self'));
  const hwCount = hardwareSessions.length;
  const avgBAR = hwCount > 0 ? (hardwareSessions.reduce((a, s) => a + (s.beta_alpha_ratio || 0), 0) / hwCount).toFixed(2) : '0.00';
  const avgConf = total > 0 ? (Math.min(69.8, (sessions.reduce((a, s) => a + Math.min(0.698, s.confidence || 0.698), 0) / total * 100))).toFixed(1) : '69.8';

  const dist = {};
  sessions.forEach(s => { dist[s.detected_state] = (dist[s.detected_state] || 0) + 1; });

  const exportCSV = () => {
    const headers = 'Date,Session_Type,Attention,Alpha,Beta,Theta,BA_Ratio,State,Method,Confidence,Problem_Description\n';
    const rows = sessions.map(s => {
      const isSelf = s.classifier_method?.toLowerCase().includes('self');
      const type = isSelf ? 'Cognitive Self-Assessment' : 'BioAmp Hardware Stream';
      const att = isSelf ? 'N/A' : s.eeg_attention;
      const a = isSelf ? 'N/A' : s.alpha_power;
      const b = isSelf ? 'N/A' : s.beta_power;
      const th = isSelf ? 'N/A' : s.theta_power;
      const bar = isSelf ? 'N/A' : s.beta_alpha_ratio;
      const desc = `"${(s.problem_description || s.feedback_notes || '').replace(/"/g, '""')}"`;
      return `${new Date(s.created_at).toISOString()},${type},${att},${a},${b},${th},${bar},${s.detected_state},${s.classifier_method},${s.confidence},${desc}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gita-neurosync-session-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getVerseForSession = (state) => {
    return GITA_VERSES[state] || GITA_VERSES['EQUILIBRIUM (Sattva)'];
  };

  const getExercisesForSession = (state) => {
    return CLINICAL_EXERCISES[state] || CLINICAL_EXERCISES['EQUILIBRIUM (Sattva)'];
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Loading session history...</div>;

  return (
    <>
      <button className="back-to-dash" onClick={() => navigate('/')}>
        <FiArrowLeft size={16} /> Back to Dashboard
      </button>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="medical-header-badge">
            <FiLayers size={13} /> Diagnostic Archives
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem' }}>Session History & Diagnostic Inspector</h1>
        <p style={{ fontSize: '1.02rem' }}>Click on any session row to inspect comprehensive clinical reports, sensor telemetry, and tailored exercises</p>
      </div>

      <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="dash-stat-card" style={{ padding: '1.5rem' }}>
          <div className="stat-label" style={{ fontSize: '0.84rem' }}>Total Logged Sessions</div>
          <div className="stat-value" style={{ fontSize: '2.35rem' }}>{total}</div>
        </div>
        <div className="dash-stat-card" style={{ padding: '1.5rem' }}>
          <div className="stat-label" style={{ fontSize: '0.84rem' }}>Avg Hardware BAR Ratio</div>
          <div className="stat-value primary" style={{ fontSize: '2.35rem' }}>{avgBAR} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>ratio</span></div>
        </div>
        <div className="dash-stat-card" style={{ padding: '1.5rem' }}>
          <div className="stat-label" style={{ fontSize: '0.84rem' }}>Avg Diagnostic Confidence</div>
          <div className="stat-value accent" style={{ fontSize: '2.35rem' }}>{avgConf}%</div>
        </div>
      </div>

      {Object.keys(dist).length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
          <div className="section-label" style={{ marginBottom: '1rem' }}>CLINICAL STATE DISTRIBUTION</div>
          {Object.entries(dist).map(([state, count]) => (
            <div className="confidence-bar-item" key={state} style={{ marginBottom: '0.85rem' }}>
              <div className="confidence-bar-header" style={{ fontSize: '0.95rem', marginBottom: '5px' }}>
                <span style={{ fontWeight: 600 }}>{state}</span>
                <span style={{ fontWeight: 800 }}>{count} ({total > 0 ? (count / total * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="confidence-bar-track" style={{ height: '8px', borderRadius: '4px' }}>
                <div className="confidence-bar-fill" style={{
                  width: `${total > 0 ? count / total * 100 : 0}%`,
                  background: getBarColor(state),
                  height: '100%',
                  borderRadius: '4px',
                }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Tip: Click any session row to inspect full clinical notes, exercises, or sensor telemetry.
        </span>
        <button className="btn btn-secondary" onClick={exportCSV} disabled={total === 0} style={{ padding: '0.65rem 1.4rem', fontSize: '0.92rem' }}>
          <FiDownload style={{ marginRight: 6 }} /> Export CSV Log
        </button>
      </div>

      {total === 0 ? (
        <div className="card-subtle" style={{ textAlign: 'center', padding: '3.5rem', fontSize: '1.05rem' }}>
          No sessions recorded yet. Start a reading from Hardware Analysis or log a Self-Assessment.
        </div>
      ) : (
        <div className="data-table-wrap" style={{ borderRadius: '16px', overflow: 'hidden', border: '1.5px solid var(--border)', marginBottom: '3rem' }}>
          <table className="data-table">
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>Date & Time</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>Session Type</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>Diagnosed State</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>Alpha (μV)</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>Beta (μV)</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>Beta/Alpha</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>Method</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                const isSelf = s.classifier_method?.toLowerCase().includes('self');
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                    className="clickable-row"
                  >
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600, padding: '1rem 1.25rem', fontSize: '0.95rem' }}>
                      {new Date(s.created_at).toLocaleString().slice(0, 19)}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {isSelf ? (
                        <span style={{ background: 'rgba(76,114,255,0.12)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                          Self-Assessment
                        </span>
                      ) : (
                        <span style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--sage)', padding: '4px 10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                          Hardware Stream
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span className={`state-badge ${getStateClass(s.detected_state)}`} style={{ fontSize: '0.88rem', padding: '4px 12px' }}>
                        {s.detected_state}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.95rem' }}>
                      {isSelf ? (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <strong>{s.alpha_power?.toFixed?.(1) ?? s.alpha_power}</strong>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.95rem' }}>
                      {isSelf ? (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <strong>{s.beta_power?.toFixed?.(1) ?? s.beta_power}</strong>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.95rem' }}>
                      {isSelf ? (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <strong>{s.beta_alpha_ratio?.toFixed?.(2) ?? s.beta_alpha_ratio}</strong>
                      )}
                    </td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', padding: '1rem 1.25rem' }}>
                      {s.classifier_method}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.85rem', padding: '5px 12px' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedSession(s); }}
                      >
                        View Details &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedSession && (() => {
        const isSelf = selectedSession.classifier_method?.toLowerCase().includes('self');
        const verse = getVerseForSession(selectedSession.detected_state);
        const exercises = getExercisesForSession(selectedSession.detected_state);

        const getConcept = () => {
          if (modalLang === 'hi') return verse.concept_hi || verse.concept;
          if (modalLang === 'bn') return verse.concept_bn || verse.concept;
          if (modalLang === 'hl') return verse.concept_hl || verse.concept;
          return verse.concept;
        };

        const getTranslation = () => {
          if (modalLang === 'hi') return verse.translation_hi || verse.translation;
          if (modalLang === 'bn') return verse.translation_bn || verse.translation;
          if (modalLang === 'hl') return verse.translation_hl || verse.translation;
          return verse.translation;
        };

        const getGroundingSteps = () => {
          if (modalLang === 'hi') return verse.groundingSteps_hi || verse.groundingSteps;
          if (modalLang === 'bn') return verse.groundingSteps_bn || verse.groundingSteps;
          if (modalLang === 'hl') return verse.groundingSteps_hl || verse.groundingSteps;
          return verse.groundingSteps;
        };

        const getSanskrit = () => {
          if (modalLang === 'bn' && verse.sanskritBengali) return verse.sanskritBengali;
          return verse.sanskrit;
        };

        let symptomsList = [];
        if (selectedSession.problem_symptoms) {
          try {
            symptomsList = typeof selectedSession.problem_symptoms === 'string'
              ? JSON.parse(selectedSession.problem_symptoms)
              : selectedSession.problem_symptoms;
          } catch {
            symptomsList = selectedSession.problem_symptoms.split(',').map(s => s.trim());
          }
        }

        return (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: '1.5rem',
            }}
            onClick={() => setSelectedSession(null)}
          >
            <div
              className="card"
              style={{
                maxWidth: 960, width: '100%', maxHeight: '90vh', overflowY: 'auto',
                padding: '2.5rem', borderRadius: '20px', background: '#fff',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)', position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '6px' }}>
                    {isSelf ? (
                      <span style={{ background: 'rgba(76,114,255,0.12)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 800 }}>
                        Cognitive Self-Assessment Report
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--sage)', padding: '4px 12px', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 800 }}>
                        BioAmp Hardware Sensor Telemetry
                      </span>
                    )}
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>{selectedSession.detected_state}</h2>
                  <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                    Recorded on {new Date(selectedSession.created_at).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-subtle)', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <button type="button" className={`btn ${modalLang === 'en' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setModalLang('en')} style={{ fontSize: '0.82rem', padding: '3px 8px', borderRadius: '8px' }}>En</button>
                    <button type="button" className={`btn ${modalLang === 'hi' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setModalLang('hi')} style={{ fontSize: '0.82rem', padding: '3px 8px', borderRadius: '8px' }}>हिन्दी</button>
                    <button type="button" className={`btn ${modalLang === 'bn' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setModalLang('bn')} style={{ fontSize: '0.82rem', padding: '3px 8px', borderRadius: '8px' }}>বাংলা</button>
                    <button type="button" className={`btn ${modalLang === 'hl' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setModalLang('hl')} style={{ fontSize: '0.82rem', padding: '3px 8px', borderRadius: '8px' }}>Hinglish</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSession(null)}
                    style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0 6px', lineHeight: 1 }}
                  >
                    &times;
                  </button>
                </div>
              </div>

              {isSelf ? (
                <>
                  <div className="card-subtle" style={{ marginBottom: '1.75rem', background: 'rgba(76,114,255,0.05)', border: '1.5px solid rgba(76,114,255,0.2)', padding: '1.5rem', borderRadius: '16px' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Patient Problem Statement:</strong>
                      <p style={{ margin: 0, fontSize: '1.02rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                        "{selectedSession.problem_description || selectedSession.feedback_notes || 'No description recorded.'}"
                      </p>
                    </div>

                    {symptomsList.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                          Reported Symptoms:
                        </strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {symptomsList.map(s => (
                            <span key={s} style={{ background: 'rgba(76,114,255,0.12)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {(() => {
                    const pAct = modalLang === 'hi' ? verse.physicalActivity_hi || verse.physicalActivity : modalLang === 'bn' ? verse.physicalActivity_bn || verse.physicalActivity : modalLang === 'hl' ? verse.physicalActivity_hl || verse.physicalActivity : verse.physicalActivity;
                    if (!pAct) return null;
                    return (
                      <div className="card" style={{ marginBottom: '1.75rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(76,114,255,0.05))', borderLeft: '6px solid var(--sage)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.5rem', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <FiActivity size={18} color="var(--sage)" />
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              PRESCRIBED PHYSICAL ACTIVITY & SOMATIC MOVEMENT
                            </span>
                          </div>
                          <span style={{ background: 'var(--sage-bg)', border: '1.5px solid var(--sage)', color: 'var(--sage)', padding: '3px 12px', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <FiClock size={13} /> {pAct.duration}
                          </span>
                        </div>
                        <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 800 }}>
                          {pAct.name}
                        </h4>
                        <p style={{ margin: '0 0 10px', fontSize: '0.96rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                          <strong>Instructions:</strong> {pAct.instructions}
                        </p>
                        <div style={{ background: '#fff', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '8px 14px', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                          <strong>Biological & Vagal Benefit:</strong> {pAct.benefit}
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ marginBottom: '1.75rem' }}>
                    <div className="section-label" style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>COGNITIVE & LIFESTYLE EXERCISES</div>
                    <div className="grid-3" style={{ gap: '1rem', marginTop: '0.5rem' }}>
                      <div className="card-subtle" style={{ padding: '1.25rem' }}>
                        <strong style={{ color: 'var(--primary)', fontSize: '0.98rem', display: 'block', marginBottom: '6px' }}>
                          Somatic Breathing
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {exercises.somatic}
                        </p>
                      </div>
                      <div className="card-subtle" style={{ padding: '1.25rem' }}>
                        <strong style={{ color: 'var(--primary)', fontSize: '0.98rem', display: 'block', marginBottom: '6px' }}>
                          Cognitive Reframing
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {exercises.cognitive}
                        </p>
                      </div>
                      <div className="card-subtle" style={{ padding: '1.25rem' }}>
                        <strong style={{ color: 'var(--primary)', fontSize: '0.98rem', display: 'block', marginBottom: '6px' }}>
                          Lifestyle Suggestion
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {exercises.lifestyle}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: '1.75rem' }}>
                  <div className="section-label" style={{ marginBottom: '0.75rem' }}>ACTUAL RECORDED HARDWARE SENSOR TELEMETRY</div>
                  <div className="grid-4" style={{ gap: '1rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                    <div className="metric-card" style={{ padding: '1.25rem' }}>
                      <div className="metric-label" style={{ fontSize: '0.84rem' }}>EEG Attention</div>
                      <div className="metric-value" style={{ fontSize: '1.65rem' }}>{selectedSession.eeg_attention?.toFixed?.(1) ?? selectedSession.eeg_attention}/100</div>
                    </div>
                    <div className="metric-card" style={{ padding: '1.25rem' }}>
                      <div className="metric-label" style={{ fontSize: '0.84rem' }}>Alpha Power (8-13Hz)</div>
                      <div className="metric-value" style={{ color: 'var(--sage)', fontSize: '1.65rem' }}>{selectedSession.alpha_power?.toFixed?.(1) ?? selectedSession.alpha_power} μV</div>
                    </div>
                    <div className="metric-card" style={{ padding: '1.25rem' }}>
                      <div className="metric-label" style={{ fontSize: '0.84rem' }}>Beta Power (13-30Hz)</div>
                      <div className="metric-value" style={{ color: 'var(--accent)', fontSize: '1.65rem' }}>{selectedSession.beta_power?.toFixed?.(1) ?? selectedSession.beta_power} μV</div>
                    </div>
                    <div className="metric-card" style={{ padding: '1.25rem' }}>
                      <div className="metric-label" style={{ fontSize: '0.84rem' }}>Beta/Alpha Ratio (BAR)</div>
                      <div className="metric-value" style={{ fontSize: '1.65rem' }}>{selectedSession.beta_alpha_ratio?.toFixed?.(2) ?? selectedSession.beta_alpha_ratio}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="card" style={{ borderLeft: '5px solid var(--primary)', padding: '1.75rem', marginTop: '1.5rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.15rem' }}>
                    {getConcept()}
                  </span>
                  <span style={{ fontSize: '0.85rem', background: 'var(--bg-subtle)', padding: '3px 10px', borderRadius: '10px', fontWeight: 800 }}>
                    Chapter {verse.chapter}, Verse {verse.verse}
                  </span>
                </div>

                <div className="sanskrit-block" style={{ marginBottom: '10px', fontSize: '1.15rem', lineHeight: '1.8' }}>
                  {getSanskrit().split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
                </div>

                <div className="translation-block" style={{ marginBottom: '12px', fontSize: '0.96rem', lineHeight: '1.6' }}>
                  <strong>{modalLang === 'hi' ? 'सीधा अर्थ:' : modalLang === 'bn' ? 'বঙ্গানুবাদ:' : modalLang === 'hl' ? 'Direct Meaning:' : 'Direct Translation:'}</strong><br />
                  {getTranslation()}
                </div>

                <div className="section-label" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                  {modalLang === 'hi' ? '3-चरणीय स्थिरता अभ्यास' : modalLang === 'bn' ? '৩-পর্যায়ের মানসিক প্রশান্তি অনুশীলন' : '3-STAGE SOMATIC GROUNDING'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {getGroundingSteps().map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.92rem', lineHeight: '1.5' }}>
                      <span style={{ background: 'var(--primary)', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedSession(null)} style={{ padding: '0.75rem 1.75rem', fontSize: '0.98rem' }}>
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

function getBarColor(state) {
  if (!state) return 'var(--primary)';
  const s = state.toLowerCase();
  if (s.includes('anxiety')) return 'var(--red-soft)';
  if (s.includes('depression')) return 'var(--amber-soft)';
  if (s.includes('stress')) return 'var(--blue-soft)';
  return 'var(--green-soft)';
}

function getStateClass(state) {
  if (!state) return 'state-sattva';
  const s = state.toLowerCase();
  if (s.includes('anxiety') || s.includes('visada')) return 'state-visada';
  if (s.includes('depression') || s.includes('tamas')) return 'state-tamas';
  if (s.includes('stress') || s.includes('krodha')) return 'state-krodha';
  return 'state-sattva';
}
