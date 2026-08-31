import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiCheckCircle, FiArrowRight, FiHeart, FiShield, FiUsers } from 'react-icons/fi';
import { FaBedPulse, FaTruckMedical, FaHandHoldingMedical, FaNotesMedical, FaHeartPulse } from 'react-icons/fa6';

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

export default function Landing() {
  const { login, register, verifyOTP, needsVerification, user } = useAuth();
  const [authTab, setAuthTab] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  if (needsVerification) {
    return (
      <div style={{ maxWidth: 420, margin: '4rem auto', textAlign: 'center' }}>
        <h2>Verify Your Email</h2>
        <p style={{ marginBottom: '2rem' }}>We've sent a 6-digit code to <strong>{user?.email}</strong></p>
        <form onSubmit={handleVerify}>
          {error && <div className="form-error">{error}</div>}
          <div className="form-group">
            <input className="form-control" type="text" maxLength={6} placeholder="Enter 6-digit OTP"
              value={otpCode} onChange={(e) => setOtpCode(e.target.value)} style={{textAlign:'center',fontSize:'1.5rem',letterSpacing:'8px'}} />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <FiHeart /> Gita-NeuroSync
        </div>
        <div className="nav-links">
          <a href="#" className="active">Home</a>
          <a href="#conditions">Science</a>
          <a href="#specialists">Specialists</a>
          <a href="#about">About</a>
        </div>
        <div className="auth-buttons">
          <button className="btn btn-dark btn-sm" onClick={() => { setAuthTab('login'); document.getElementById('auth-section')?.scrollIntoView({behavior:'smooth'}); }}>Login</button>
          <button className="btn btn-outline btn-sm" onClick={() => { setAuthTab('register'); document.getElementById('auth-section')?.scrollIntoView({behavior:'smooth'}); }}>Sign Up <FiArrowRight /></button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <FiCheckCircle /> AI-Powered Biosignal Intelligence
          </div>
          <h1>Your health is<br />our priority</h1>
          <p>Quantitative, real-time, confidential neuro-psychological assessment. Cognitive and emotional imbalances are measurable — and actionable remediation is possible with Vedantic wisdom.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => document.getElementById('auth-section')?.scrollIntoView({behavior:'smooth'})}>
              Book Assessment
            </button>
            <a href="#" className="hero-social">→ Learn More</a>
          </div>
        </div>
        <div className="hero-image">
          <div className="floating-badge top-right">Neuro-Psychology</div>
          <img src="https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=2070&auto=format&fit=crop" alt="AI Brain Network" />
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-text">
          <h3>Expert Care <span className="highlight">✦</span></h3>
          <h2>Medical consultation<br />and Premium care</h2>
          <p>We provide world-class neuro-psychological assessment with our expert team. Personalized care utilizing advanced biosignal technology and Vedantic wisdom.</p>
          <div className="progress-container">
            <div className="progress-label">
              <span className="progress-dot"></span> Assessment Accuracy 85.34%
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{width:'85.34%'}}></div>
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
            <div className="icon-circle"><FaBedPulse /></div>
            <h4>8 Measurable States</h4>
            <p>EEG, ECG, HRV Telemetry</p>
          </div>
          <div className="stat-card">
            <div className="icon-circle"><FaTruckMedical /></div>
            <h4>Real-Time Analysis</h4>
            <p>24/7 Hardware Monitoring</p>
          </div>
          <div className="stat-card">
            <div className="icon-circle"><FaHandHoldingMedical /></div>
            <h4>100% Data Privacy</h4>
            <p>Encrypted & Confidential</p>
          </div>
        </div>
      </section>

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

      <div id="conditions" style={{textAlign:'center', marginBottom:'2rem'}}>
        <div className="section-label" style={{color:'var(--secondary)'}}>CONDITIONS</div>
        <h2>Neuro-States We Measure & Remediate</h2>
        <p style={{maxWidth:600,margin:'0.5rem auto 0'}}>Biomedically verifiable through real-time EEG, ECG/Pulse, and HRV telemetry</p>
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

      <section className="bottom-section" id="about">
        <div className="bottom-cards">
          <div className="info-card gradient-bg">
            <h3>Algorithmic neuro-state mapping tailored to you</h3>
            <p>Experience precision psychophysiology. Our local Gaussian ML and Vedantic rule engine analyzes your real-time EEG/HRV telemetry to provide targeted scriptural grounding.</p>
          </div>
          <div className="image-card">
            <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2080&auto=format&fit=crop" alt="Abstract AI Network" />
          </div>
        </div>
        <div>
          <h3 style={{marginBottom:'1.5rem'}}>Real-time AI Pipeline</h3>
          <div className="process-steps">
            <div className="process-step active"><FaBedPulse /></div>
            <div className="step-line"></div>
            <div className="process-step active"><FaHeartPulse /></div>
            <div className="step-line"></div>
            <div className="process-step active"><FiCheckCircle /></div>
            <div className="step-line"></div>
            <div className="process-step active"><FaNotesMedical /></div>
            <div className="step-line"></div>
            <div className="process-step active"><FiShield /></div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div className="card-subtle" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{color:'var(--primary)'}}>●</span> Hardware Telemetry Ingestion (WebSocket)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{color:'var(--sage)'}}>●</span> Spectral Coherence & HRV Processing</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{color:'var(--primary)'}}>●</span> Gaussian Naive Bayes Classification</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{color:'var(--sage)'}}>●</span> Vedantic Matrix Resolution</div>
            </div>
          </div>

          <button className="btn btn-primary btn-block" onClick={() => document.getElementById('auth-section')?.scrollIntoView({behavior:'smooth'})}>
            Initialize Engine
          </button>
        </div>
      </section>

      <div id="auth-section" style={{textAlign:'center', marginTop:'3rem', marginBottom:'2rem'}}>
        <h2>Get Started</h2>
        <p>Sign in or create an account to access your personalised dashboard</p>
      </div>

      <div className="auth-section">
        <div className="auth-tabs">
          <button className={`auth-tab ${authTab === 'login' ? 'active' : ''}`} onClick={() => { setAuthTab('login'); setError(''); }}>Sign In</button>
          <button className={`auth-tab ${authTab === 'register' ? 'active' : ''}`} onClick={() => { setAuthTab('register'); setError(''); }}>Create Account</button>
        </div>

        {error && <div className="form-error">{error}</div>}

        {authTab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-control" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
      </div>

      <div className="footer">
        <div className="footer-brand">Gita-NeuroSync</div>
        Confidential, encrypted, and biomedical psychophysiology architecture<br />
        © 2026 Mind Diagnostics · All Rights Reserved
      </div>
    </>
  );
}
