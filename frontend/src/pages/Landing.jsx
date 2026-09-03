import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import OtpInput from '../components/OtpInput';
import { FiCheckCircle, FiArrowRight, FiHeart, FiShield, FiUsers, FiRefreshCw } from 'react-icons/fi';
import { FaBedPulse, FaTruckMedical, FaHandHoldingMedical, FaNotesMedical, FaHeartPulse } from 'react-icons/fa6';

const SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "science", label: "Science & Stats" },
  { id: "specialists", label: "AI Modules" },
  { id: "conditions", label: "Neuro-States" },
  { id: "pipeline", label: "Pipeline" },
  { id: "auth-section", label: "Get Started" },
];

const CONDITIONS = [
  { title: 'Acute Anxiety', sanskrit: 'Visada', bio: 'High Beta & Tachycardia', color: '#FFE4E6' },
  { title: 'Depressive Lethargy', sanskrit: 'Avasada', bio: 'Theta Surge & Low Vagal', color: '#FFEDD5' },
  { title: 'Stress & Agitation', sanskrit: 'Krodha', bio: 'High Beta/Alpha & Low HRV', color: '#FECDD3' },
  { title: 'Cognitive Fatigue', sanskrit: 'Klama', bio: 'Attentional Drop & Slow Wave', color: '#E0F2FE' },
  { title: 'Pre-Sleep Arousal', sanskrit: 'Anidra', bio: 'Alpha Suppression at Rest', color: '#FEF3C7' },
  { title: 'Racing Thoughts', sanskrit: 'Chanchalatva', bio: 'Rigid Frontal Beta Bursts', color: '#F3E8FF' },
  { title: 'Sympathetic Surge', sanskrit: 'Bhaya', bio: 'Abrupt HRV Collapse', color: '#CFFAFE' },
  { title: 'Equilibrium & Flow', sanskrit: 'Sattva', bio: 'Alpha Coherence & High HRV', color: '#D1FAE5' },
];

const MODULES = [
  { name: 'Cortical Analyzer', specialty: 'Alpha/Beta Coherence ML', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=150&auto=format&fit=crop', available: true },
  { name: 'Vagal Tone Engine', specialty: 'HRV SDNN Processing', img: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=150&auto=format&fit=crop', available: true },
  { name: 'Vedantic Mapper', specialty: 'Sanskrit NLP Bridge', img: 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?q=80&w=150&auto=format&fit=crop', available: true },
  { name: 'Neuro-Adaptive DB', specialty: 'Online Weight Updates', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=150&auto=format&fit=crop', available: true },
];

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export default function Landing() {
  const { login, register, verifyOTP, needsVerification, user } = useAuth();
  const [authTab, setAuthTab] = useState('login');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  // Scroll Progress Bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Track active section for floating nav dots
  useEffect(() => {
    const handleScroll = () => {
      const viewportCenter = window.innerHeight / 2;
      let closest = 0;
      let minDistance = Infinity;

      SECTIONS.forEach((sec, idx) => {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closest = idx;
          }
        }
      });
      setActiveSection(closest);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.length < 6) return;
    setError('');
    setLoading(true);
    try {
      await verifyOTP(otpCode);
      setAuthTab('login');
      setSuccessMsg('✓ Account created and email verified! Please sign in with your credentials.');
    } catch (err) {
      setError(err.message || 'Verification failed.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setError('');
    setResendStatus('');
    try {
      await api.resendOTP();
      setResendStatus('✓ A new 6-digit code has been sent to your email.');
      setTimeout(() => setResendStatus(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    }
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (needsVerification) {
    return (
      <div className="landing-inner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ maxWidth: 460, width: '100%', margin: '2rem auto', textAlign: 'center', background: 'var(--bg-white)', padding: '2.5rem 2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 1.25rem', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
            <FiShield />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Verify Your Email</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
            Enter the 6-digit verification code sent to <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>
          </p>

          <form onSubmit={handleVerify}>
            <OtpInput
              length={6}
              mode="numeric"
              onChange={setOtpCode}
              onComplete={async (val) => {
                setOtpCode(val);
                setError('');
                setLoading(true);
                try {
                  await verifyOTP(val);
                  setAuthTab('login');
                  setSuccessMsg('✓ Account created and email verified! Please sign in with your credentials.');
                } catch (err) {
                  setError(err.message || 'Verification failed.');
                }
                setLoading(false);
              }}
              status={error ? "error" : resendStatus ? "success" : "idle"}
              errorMessage={error}
              successMessage={resendStatus}
              autoFocus
            />

            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={loading || otpCode.length < 6}
              style={{ marginTop: '1.25rem' }}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle' }}
            >
              <FiRefreshCw size={12} /> Resend OTP
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-inner">
      {/* ── Top Scroll Progress Bar ────────────────────────── */}
      <motion.div
        style={{
          scaleX,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #4C72FF 0%, #34D399 100%)',
          transformOrigin: '0%',
          zIndex: 9999,
          boxShadow: '0 0 8px rgba(76, 114, 255, 0.4)',
        }}
      />

      {/* ── Side Floating Section Nav Dots ─────────────────── */}
      <nav
        aria-label="Section Navigation"
        style={{
          position: 'fixed',
          right: '1.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center',
        }}
        className="floating-landing-nav"
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            background: 'linear-gradient(180deg, transparent 0%, rgba(76, 114, 255, 0.25) 50%, transparent 100%)',
            transform: 'translateX(-50%)',
            zIndex: -1,
          }}
        />
        {SECTIONS.map((sec, idx) => (
          <div key={sec.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => scrollTo(sec.id)}
              aria-label={`Scroll to ${sec.label}`}
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                border: activeSection === idx ? '2px solid #4C72FF' : '2px solid rgba(107, 114, 128, 0.35)',
                background: activeSection === idx ? '#4C72FF' : '#ffffff',
                cursor: 'pointer',
                padding: 0,
                transform: activeSection === idx ? 'scale(1.3)' : 'scale(1)',
                boxShadow: activeSection === idx ? '0 0 10px rgba(76, 114, 255, 0.5)' : 'none',
                transition: 'all 0.25s ease',
              }}
            />
          </div>
        ))}
      </nav>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="navbar">
        <motion.div
          className="navbar-logo"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FiHeart /> Gita-NeuroSync
        </motion.div>
        <div className="nav-links">
          <a href="#hero" className="active">Home</a>
          <a href="#science">Science</a>
          <a href="#specialists">Specialists</a>
          <a href="#about">About</a>
        </div>
        <motion.div
          className="auth-buttons"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button className="btn btn-dark btn-sm" onClick={() => { setAuthTab('login'); scrollTo('auth-section'); }}>Login</button>
          <button className="btn btn-outline btn-sm" onClick={() => { setAuthTab('register'); scrollTo('auth-section'); }}>Sign Up <FiArrowRight /></button>
        </motion.div>
      </nav>

      {/* ── 1. Hero Section ────────────────────────────────── */}
      <section id="hero" className="hero-section">
        <motion.div
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div className="hero-badge" variants={fadeIn}>
            <FiCheckCircle /> AI-Powered Biosignal Intelligence
          </motion.div>
          <motion.h1 variants={fadeIn}>
            Your health is<br />our priority
          </motion.h1>
          <motion.p variants={fadeIn}>
            Quantitative, real-time, confidential neuro-psychological assessment. Cognitive and emotional imbalances are measurable — and actionable remediation is possible with Vedantic wisdom.
          </motion.p>
          <motion.div className="hero-actions" variants={fadeIn}>
            <button className="btn btn-primary" onClick={() => scrollTo('auth-section')}>
              Book Assessment
            </button>
            <a href="#science" className="hero-social">→ Learn More</a>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-image"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          whileHover={{ scale: 1.015 }}
        >
          <div className="floating-badge top-right">Neuro-Psychology</div>
          <img src="https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=2070&auto=format&fit=crop" alt="AI Brain Network" />
        </motion.div>
      </section>

      {/* ── 2. Stats Section ───────────────────────────────── */}
      <section id="science" className="stats-section">
        <motion.div
          className="stats-text"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeIn}
        >
          <h3>Expert Care <span className="highlight">✦</span></h3>
          <h2>Medical consultation<br />and Premium care</h2>
          <p>We provide world-class neuro-psychological assessment with our expert team. Personalized care utilizing advanced biosignal technology and Vedantic wisdom.</p>
          <div className="progress-container">
            <div className="progress-label">
              <span className="progress-dot"></span> Assessment Accuracy 69.8%
            </div>
            <div className="progress-bar-track">
              <motion.div
                className="progress-bar-fill"
                initial={{ width: 0 }}
                whileInView={{ width: '69.8%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="stats-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
        >
          {[
            { icon: FiUsers, title: 'Adaptive ML', desc: 'Gaussian Naive Bayes & Rule Engines' },
            { icon: FaBedPulse, title: '8 Measurable States', desc: 'EEG, ECG, HRV Telemetry' },
            { icon: FaTruckMedical, title: 'Real-Time Analysis', desc: '24/7 Hardware Monitoring' },
            { icon: FaHandHoldingMedical, title: '100% Data Privacy', desc: 'Encrypted & Confidential' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                className="stat-card"
                variants={fadeIn}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
              >
                <div className="icon-circle"><Icon /></div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── 3. AI Modules Section ──────────────────────────── */}
      <div id="specialists" className="section-label" style={{textAlign:'center',marginBottom:'1.5rem'}}>AI INTELLIGENCE MODULES</div>
      <motion.section
        className="doctors-list"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={staggerContainer}
      >
        {MODULES.map((mod, i) => (
          <motion.div
            className="doctor-mini-card"
            key={i}
            variants={fadeIn}
            whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
          >
            <img src={mod.img} alt={mod.name} />
            <div className="doc-info">
              <h5>{mod.name}</h5>
              <span>{mod.specialty}</span>
            </div>
            <span className={`status-badge available`}>
              Online
            </span>
          </motion.div>
        ))}
      </motion.section>

      {/* ── 4. Conditions Grid ─────────────────────────────── */}
      <motion.div
        id="conditions"
        style={{textAlign:'center', marginBottom:'2rem'}}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeIn}
      >
        <div className="section-label" style={{color:'var(--secondary)'}}>CONDITIONS</div>
        <h2>Neuro-States We Measure & Remediate</h2>
        <p style={{maxWidth:600,margin:'0.5rem auto 0'}}>Biomedically verifiable through real-time EEG, ECG/Pulse, and HRV telemetry</p>
      </motion.div>

      <motion.div
        className="conditions-grid"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={staggerContainer}
      >
        {CONDITIONS.map((c, i) => (
          <motion.div
            className="condition-card"
            key={i}
            style={{backgroundColor: c.color}}
            variants={fadeIn}
            whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
          >
            <div className="condition-title">{c.title}</div>
            <div className="condition-sub">{c.sanskrit}</div>
            <span className="condition-pill">{c.bio}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* ── 5. AI Pipeline Section ─────────────────────────── */}
      <section className="bottom-section" id="pipeline">
        <div className="bottom-cards">
          <motion.div
            className="info-card gradient-bg"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeIn}
            whileHover={{ y: -4 }}
          >
            <h3>Algorithmic neuro-state mapping tailored to you</h3>
            <p>Experience precision psychophysiology. Our local Gaussian ML and Vedantic rule engine analyzes your real-time EEG/HRV telemetry to provide targeted scriptural grounding.</p>
          </motion.div>
          <motion.div
            className="image-card"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeIn}
            whileHover={{ scale: 1.02 }}
          >
            <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2080&auto=format&fit=crop" alt="Abstract AI Network" />
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeIn}
        >
          <h3 style={{marginBottom:'1.5rem'}}>Real-time AI Pipeline</h3>
          <div className="process-steps">
            {[FaBedPulse, FaHeartPulse, FiCheckCircle, FaNotesMedical, FiShield].map((Icon, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                <motion.div
                  className="process-step active"
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.15 }}
                >
                  <Icon />
                </motion.div>
                {idx < 4 && <div className="step-line"></div>}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div className="card-subtle" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{color:'var(--primary)'}}>●</span> Hardware Telemetry Ingestion (WebSocket)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{color:'var(--sage)'}}>●</span> Spectral Coherence & HRV Processing</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{color:'var(--primary)'}}>●</span> Gaussian Naive Bayes Classification</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{color:'var(--sage)'}}>●</span> Vedantic Matrix Resolution</div>
            </div>
          </div>

          <button className="btn btn-primary btn-block" onClick={() => scrollTo('auth-section')}>
            Initialize Engine
          </button>
        </motion.div>
      </section>

      {/* ── 6. Auth / Get Started Section ──────────────────── */}
      <motion.div
        id="auth-section"
        style={{textAlign:'center', marginTop:'3rem', marginBottom:'2rem'}}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeIn}
      >
        <h2>Get Started</h2>
        <p>Sign in or create an account to access your personalised dashboard</p>
      </motion.div>

      <motion.div
        className="auth-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeIn}
      >
        <div className="auth-tabs">
          <button className={`auth-tab ${authTab === 'login' ? 'active' : ''}`} onClick={() => { setAuthTab('login'); setError(''); setSuccessMsg(''); }}>Sign In</button>
          <button className={`auth-tab ${authTab === 'register' ? 'active' : ''}`} onClick={() => { setAuthTab('register'); setError(''); setSuccessMsg(''); }}>Create Account</button>
        </div>

        {error && <div className="form-error">{error}</div>}
        {successMsg && (
          <div className="form-success" style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#065F46',
            padding: '0.85rem 1.1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '1.25rem',
            textAlign: 'center',
          }}>
            {successMsg}
          </div>
        )}

        {authTab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email or Username</label>
              <input
                className="form-control"
                type="text"
                placeholder="name@example.com or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="section-label">ACCOUNT DETAILS</div>
            <div className="form-group">
              <label>Email Address</label>
              <input className="form-control" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-control" type="text" placeholder="Jane Doe" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Create Password</label>
              <input className="form-control" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </motion.div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="footer" id="about">
        <div className="footer-brand">Gita-NeuroSync</div>
        Confidential, encrypted, and biomedical psychophysiology architecture<br />
        © 2026 Mind Diagnostics · All Rights Reserved
      </div>
    </div>
  );
}
