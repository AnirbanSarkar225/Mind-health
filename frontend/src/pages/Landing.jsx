import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiCheckCircle, FiArrowRight, FiShield, FiClock, FiUsers, FiActivity, FiZap } from 'react-icons/fi';
import { FaUserDoctor, FaTruckMedical, FaHandHoldingMedical, FaStethoscope, FaCalendarCheck, FaNotesMedical } from 'react-icons/fa6';

const CONDITIONS = [
  { title: 'Acute Anxiety', sanskrit: 'Visada', bio: 'High Beta & Alpha Suppression', color: '#FFE4E6' },
  { title: 'Depressive Lethargy', sanskrit: 'Avasada', bio: 'Theta Surge & Low Arousal', color: '#FFEDD5' },
  { title: 'Stress & Agitation', sanskrit: 'Krodha', bio: 'High Beta/Alpha & Tension', color: '#FECDD3' },
  { title: 'Cognitive Fatigue', sanskrit: 'Klama', bio: 'Attentional Drop & Slow Wave', color: '#E0F2FE' },
  { title: 'Pre-Sleep Arousal', sanskrit: 'Anidra', bio: 'Alpha Suppression at Rest', color: '#FEF3C7' },
  { title: 'Racing Thoughts', sanskrit: 'Chanchalatva', bio: 'Rigid Frontal Beta Bursts', color: '#F3E8FF' },
  { title: 'Sympathetic Surge', sanskrit: 'Bhaya', bio: 'Abrupt Alpha Collapse', color: '#CFFAFE' },
  { title: 'Equilibrium & Flow', sanskrit: 'Sattva', bio: 'Dominant Alpha Coherence', color: '#D1FAE5' },
];

const MODULES = [
  { name: 'Cortical Analyzer', specialty: 'Alpha/Beta Coherence ML', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=150&auto=format&fit=crop', available: true },
  { name: 'Spectral Power Engine', specialty: 'BioAmp FFT Band Processing', img: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=150&auto=format&fit=crop', available: true },
  { name: 'Vedantic Mapper', specialty: 'Sanskrit NLP Bridge', img: 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?q=80&w=150&auto=format&fit=crop', available: true },
  { name: 'Neuro-Adaptive DB', specialty: 'Online Weight Updates', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=150&auto=format&fit=crop', available: true },
];

export default function Landing() {
  const { login, register, verifyOTP, needsVerification, user } = useAuth();
  const [authTab, setAuthTab] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOTP(otpCode);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="landing-container">
      {/* Top Bar */}
      <div className="top-notice-bar">
        <span>BIOAMP EXG PILL INTEGRATION: Pure EEG Frontal Telemetry & Shloka Grounding</span>
        <button className="btn btn-secondary btn-sm" onClick={() => document.getElementById('auth-section')?.scrollIntoView({behavior:'smooth'})}>
          Launch Portal <FiArrowRight />
        </button>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span> Real-time EEG Biosignal Grounding
          </div>
          <h1>
            Neural State Remediation via Ancient Vedantic Logic
          </h1>
          <p className="hero-subtext">
            Gita-NeuroSync maps frontal EEG oscillations to timeless psychological pathways in the Bhagavad Gita, delivering real-time cognitive equilibrium.
          </p>

          <div className="hero-cta-group">
            <button className="btn btn-primary" onClick={() => document.getElementById('auth-section')?.scrollIntoView({behavior:'smooth'})}>
              Get Started Now <FiArrowRight />
            </button>
            <button className="btn btn-secondary" onClick={() => document.getElementById('conditions')?.scrollIntoView({behavior:'smooth'})}>
              Explore Conditions
            </button>
          </div>

          <div className="features-inline">
            <div className="feature-item"><FiCheckCircle className="check-icon" /> Pure EEG Frontal Telemetry</div>
            <div className="feature-item"><FiCheckCircle className="check-icon" /> Dynamic Online Recalibration</div>
            <div className="feature-item"><FiCheckCircle className="check-icon" /> Local Private Processing</div>
          </div>
        </div>

        {/* Doctor Card Hero Visual */}
        <div className="hero-image-wrap">
          <div className="doctor-card-hero">
            <img 
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=600&auto=format&fit=crop" 
              alt="Neural AI Specialist" 
              className="doc-hero-img"
            />
            <div className="doc-overlay-card">
              <div className="doc-name">Sattva Engine</div>
              <div className="doc-role">Frontal Cortical Analyzer</div>
              <div className="doc-rating">★ 4.9 · Real-time Biosignal Stream</div>
            </div>
            <div className="doc-floating-tag">
              <span className="status-dot-pulse"></span> Active EEG Stream
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="stats-section">
        <div className="stats-header-card">
          <div>
            <h3>Empowering Cognitive Balance</h3>
            <p>Direct EEG bio-amplification paired with Sanskrit remediation</p>
          </div>
          <div className="accuracy-progress">
            <div className="accuracy-label">
              <span className="progress-dot"></span> Dynamic Model Accuracy 86.0%+
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{width:'86%'}}></div>
            </div>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="icon-circle"><FiUsers /></div>
            <h4>Adaptive ML</h4>
            <p>Gaussian Naive Bayes & Rule Engines</p>
          </div>
          <div className="stat-card">
            <div className="icon-circle"><FiActivity /></div>
            <h4>8 Measurable States</h4>
            <p>Pure EEG Brainwave Telemetry</p>
          </div>
          <div className="stat-card">
            <div className="icon-circle"><FiZap /></div>
            <h4>Real-Time Analysis</h4>
            <p>24/7 BioAmp EEG Monitoring</p>
          </div>
          <div className="stat-card">
            <div className="icon-circle"><FaHandHoldingMedical /></div>
            <h4>100% Data Privacy</h4>
            <p>Encrypted & Local Confidential</p>
          </div>
        </div>
      </section>

      {/* Modules */}
      <div id="specialists" className="section-label" style={{textAlign:'center',marginBottom:'1.5rem'}}>AI INTELLIGENCE MODULES</div>
      <section className="doctors-list">
        {MODULES.map((mod, i) => (
          <div className="doctor-mini-card" key={i}>
            <img src={mod.img} alt={mod.name} />
            <div className="doc-info">
              <h5>{mod.name}</h5>
              <span>{mod.specialty}</span>
            </div>
            <span className={`status-badge available`}>
              Online
            </span>
          </div>
        ))}
      </section>

      {/* Conditions */}
      <div id="conditions" style={{textAlign:'center', marginBottom:'2rem'}}>
        <div className="section-label" style={{color:'var(--secondary)'}}>CONDITIONS</div>
        <h2>Neuro-States We Measure & Remediate</h2>
        <p style={{maxWidth:600,margin:'0.5rem auto 0'}}>Biomedically verifiable through real-time BioAmp EEG brainwave telemetry</p>
      </div>
      <div className="conditions-grid">
        {CONDITIONS.map((c, i) => (
          <div className="condition-card" key={i} style={{backgroundColor: c.color}}>
            <div className="condition-title">{c.title}</div>
            <div className="condition-sub">{c.sanskrit}</div>
            <span className="condition-pill">{c.bio}</span>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <section className="bottom-section" id="about">
        <div className="bottom-cards">
          <div className="info-card gradient-bg">
            <h3>Algorithmic neuro-state mapping tailored to you</h3>
            <p>Experience precision psychophysiology. Our local Gaussian ML and Vedantic rule engine analyzes your real-time EEG telemetry to provide targeted scriptural grounding.</p>
          </div>
          <div className="image-card">
            <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2080&auto=format&fit=crop" alt="Abstract AI Network" />
          </div>
        </div>
        <div>
          <h3 style={{marginBottom:'1.5rem'}}>Real-time AI Pipeline</h3>
          <div className="process-steps">
            <div className="process-step active"><FiActivity /></div>
            <div className="step-line"></div>
            <div className="process-step active"><FiZap /></div>
            <div className="step-line"></div>
            <div className="process-step active"><FiCheckCircle /></div>
            <div className="step-line"></div>
            <div className="process-step active"><FaNotesMedical /></div>
            <div className="step-line"></div>
            <div className="process-step active"><FiShield /></div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div className="card-subtle" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{color:'var(--primary)'}}>●</span> Hardware Telemetry Ingestion (BioAmp Serial / WS)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{color:'var(--sage)'}}>●</span> Spectral FFT Band Decomposition (Alpha, Beta, Theta)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{color:'var(--primary)'}}>●</span> Gaussian Naive Bayes Classification & Safety Gate</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{color:'var(--sage)'}}>●</span> Vedantic Matrix Resolution & Somatic Grounding</div>
            </div>
          </div>

          <button className="btn btn-primary btn-block" onClick={() => document.getElementById('auth-section')?.scrollIntoView({behavior:'smooth'})}>
            Initialize Engine
          </button>
        </div>
      </section>

      {/* Auth Section */}
      <div id="auth-section" style={{textAlign:'center', marginTop:'3rem', marginBottom:'2rem'}}>
        <div className="section-label" style={{color:'var(--secondary)'}}>ACCESS PORTAL</div>
        <h2>{needsVerification ? 'Verify Your Email' : authTab === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
        <p style={{color:'var(--text-secondary)'}}>
          {needsVerification ? 'Enter the 6-digit OTP code sent to your email (Developer bypass: 000000)' : 'Access your neuro-psychological dashboard, telemetry history, and Vedantic grounding'}
        </p>
      </div>

      <div className="auth-card" style={{maxWidth:440,margin:'0 auto 4rem'}}>
        {error && <div className="form-error">{error}</div>}

        {needsVerification ? (
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label>Enter 6-Digit OTP Code</label>
              <input 
                type="text" 
                placeholder="e.g. 000000" 
                maxLength={6}
                value={otpCode} 
                onChange={(e) => setOtpCode(e.target.value)} 
                required 
                style={{textAlign:'center',letterSpacing:'0.3rem',fontSize:'1.3rem',fontWeight:700}}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP & Enter'}
            </button>
          </form>
        ) : (
          <>
            <div className="auth-tabs">
              <button 
                type="button"
                className={`auth-tab ${authTab === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthTab('login'); setError(''); }}
              >
                Sign In
              </button>
              <button 
                type="button"
                className={`auth-tab ${authTab === 'register' ? 'active' : ''}`}
                onClick={() => { setAuthTab('register'); setError(''); }}
              >
                Register
              </button>
            </div>

            {authTab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label>Username</label>
                  <input type="text" placeholder="e.g. Arjuna" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Register'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
