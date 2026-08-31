"""Landing page with Light SaaS Theme, modern hero, and auth forms."""

from __future__ import annotations
import streamlit as st
from frontend.config.palette import Palette as P
from backend.database.models import (
    register_user,
    authenticate_user,
    store_otp,
    verify_otp,
    mark_email_verified,
)
from backend.database.email_service import generate_otp, send_otp_email_async

# 8 Scientifically measurable and Vedantic-fixable neuro-psychological states
_VERIFIED_CONDITIONS = [
    ("Acute Anxiety",        "Visada",        "High Beta & Tachycardia",         P.PASTEL_PINK),
    ("Depressive Lethargy",  "Avasada",       "Theta Surge & Low Vagal",         P.PASTEL_PEACH),
    ("Stress & Agitation",   "Krodha",        "High Beta/Alpha & Low HRV",       P.PASTEL_CORAL),
    ("Cognitive Fatigue",    "Klama",         "Attentional Drop & Slow Wave",    P.PASTEL_BLUE),
    ("Pre-Sleep Arousal",    "Anidra",        "Alpha Suppression at Rest",       P.PASTEL_AMBER),
    ("Racing Thoughts",      "Chanchalatva",  "Rigid Frontal Beta Bursts",       P.PASTEL_LILAC),
    ("Sympathetic Surge",    "Bhaya",         "Abrupt HRV Collapse",             P.PASTEL_CYAN),
    ("Equilibrium & Flow",   "Sattva",        "Alpha Coherence & High HRV",      P.PASTEL_MINT),
]

def render_auth_page() -> bool:
    """
    Landing page + auth flow.
    Returns True if user is fully authenticated and email-verified.
    """
    if st.session_state.get("authenticated"):
        user = st.session_state.get("user", {})
        if user.get("email_verified"):
            return True

    pending_user = st.session_state.get("pending_verification_user")
    if pending_user:
        return _render_otp_verification(pending_user)

    # Injecting massive custom HTML for the Landing Page layout to bypass Streamlit's structural limits
    st.markdown(f"""
    <style>
        /* Scoped CSS for the landing page */
        .lp-navbar {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 32px;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            border-radius: 50px;
            box-shadow: {P.SHADOW};
            margin-bottom: 40px;
            border: 1px solid {P.BORDER};
        }}
        .lp-logo {{
            font-size: 1.25rem;
            font-weight: 800;
            color: {P.PRIMARY};
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .lp-nav-links {{ display: flex; gap: 24px; }}
        .lp-nav-links a {{
            text-decoration: none;
            color: {P.TEXT_SECONDARY};
            font-weight: 600;
            font-size: 0.95rem;
            transition: color 0.2s;
        }}
        .lp-nav-links a:hover {{ color: {P.TEXT_PRIMARY}; }}
        
        .lp-hero {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: center;
            padding: 40px;
            background: linear-gradient(135deg, {P.BG_PRIMARY} 0%, {P.BG_DARK_SEC} 100%);
            border-radius: 40px;
            margin-bottom: 60px;
        }}
        .lp-hero-text h1 {{
            font-size: 3rem;
            font-weight: 800;
            color: {P.TEXT_PRIMARY};
            line-height: 1.1;
            margin-bottom: 20px;
            letter-spacing: -1px;
        }}
        .lp-hero-text p {{
            font-size: 1.1rem;
            color: {P.TEXT_SECONDARY};
            line-height: 1.6;
            margin-bottom: 32px;
        }}
        .lp-hero-image {{
            background: {P.BG_CARD};
            border-radius: 50%;
            padding: 20px;
            box-shadow: {P.SHADOW_MD};
        }}
        .lp-hero-image img {{
            width: 100%;
            border-radius: 50%;
            object-fit: cover;
        }}

        .lp-stats {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            margin-bottom: 60px;
        }}
        .lp-stat-card {{
            background: {P.BG_CARD};
            border: 1px solid {P.BORDER};
            border-radius: 24px;
            padding: 24px;
            text-align: center;
            box-shadow: {P.SHADOW};
        }}
        .lp-stat-card h3 {{
            font-size: 2rem;
            font-weight: 800;
            color: {P.PRIMARY};
            margin-bottom: 8px;
        }}
        .lp-stat-card p {{
            font-size: 0.95rem;
            color: {P.TEXT_SECONDARY};
            font-weight: 600;
        }}

        .lp-section-title {{
            text-align: center;
            margin-bottom: 40px;
        }}
        .lp-section-title h2 {{
            font-size: 2.2rem;
            font-weight: 800;
            color: {P.TEXT_PRIMARY};
        }}
        .lp-section-title p {{
            font-size: 1rem;
            color: {P.TEXT_SECONDARY};
            margin-top: 10px;
        }}

        .lp-conditions-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            margin-bottom: 80px;
        }}
        .lp-condition-card {{
            border-radius: 24px;
            padding: 24px;
            box-shadow: {P.SHADOW};
            transition: transform 0.3s ease;
        }}
        .lp-condition-card:hover {{ transform: translateY(-5px); box-shadow: {P.SHADOW_MD}; }}
        .lp-condition-title {{
            font-weight: 800;
            font-size: 1.1rem;
            color: {P.TEXT_DARK};
            margin-bottom: 4px;
        }}
        .lp-condition-sub {{
            font-size: 0.85rem;
            font-weight: 600;
            font-style: italic;
            color: {P.TEXT_SECONDARY};
            margin-bottom: 16px;
        }}
        .lp-condition-pill {{
            background: rgba(255,255,255,0.6);
            border-radius: 50px;
            padding: 6px 12px;
            font-size: 0.75rem;
            font-weight: 700;
            color: {P.TEXT_DARK};
            display: inline-block;
        }}
        
        @media (max-width: 960px) {{
            .lp-hero {{ grid-template-columns: 1fr; padding: 24px; text-align: center; }}
            .lp-stats {{ grid-template-columns: repeat(2, 1fr); }}
            .lp-conditions-grid {{ grid-template-columns: repeat(2, 1fr); }}
            .lp-nav-links {{ display: none; }}
        }}
        @media (max-width: 540px) {{
            .lp-stats {{ grid-template-columns: 1fr; }}
            .lp-conditions-grid {{ grid-template-columns: 1fr; }}
        }}
    </style>

    <!-- Navbar -->
    <div class="lp-navbar">
        <div class="lp-logo">Gita-NeuroSync</div>
        <div class="lp-nav-links">
            <a href="#">Home</a>
            <a href="#">Science</a>
            <a href="#">Remediation</a>
            <a href="#">About</a>
        </div>
        <div style="font-weight:600; color:{P.PRIMARY}; font-size:0.9rem;">Client Portal</div>
    </div>

    <!-- Hero -->
    <div class="lp-hero">
        <div class="lp-hero-text">
            <div style="font-size: 0.8rem; font-weight:700; color:{P.PRIMARY}; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px;">AI Biosignal Intelligence</div>
            <h1>Make Sense of Your Neuro-Psychology</h1>
            <p>Quantitative, real-time, confidential, and grounded in psychophysiology. Cognitive and emotional imbalances are measurable — and actionable remediation is possible with Vedantic wisdom.</p>
        </div>
        <div class="lp-hero-image">
            <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop" alt="Medical Professional">
        </div>
    </div>

    <!-- Stats -->
    <div class="lp-stats">
        <div class="lp-stat-card"><h3>98%</h3><p>Measurement Accuracy</p></div>
        <div class="lp-stat-card"><h3>8</h3><p>Measurable States</p></div>
        <div class="lp-stat-card"><h3>100%</h3><p>Data Privacy</p></div>
        <div class="lp-stat-card"><h3>24/7</h3><p>Monitoring Capable</p></div>
    </div>

    <!-- Neuro States Section -->
    <div class="lp-section-title">
        <div style="font-size: 0.8rem; font-weight:700; color:{P.SECONDARY}; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Conditions</div>
        <h2>Neuro-States We Measure & Remediate</h2>
        <p>Biomedically verifiable through real-time EEG, ECG/Pulse, and HRV telemetry</p>
    </div>
    """, unsafe_allow_html=True)

    # Render conditions cards using python loop
    cards_html = "".join([
        f'<div class="lp-condition-card" style="background-color: {color};">'
        f'<div class="lp-condition-title">{title}</div>'
        f'<div class="lp-condition-sub">{sanskrit}</div>'
        f'<div class="lp-condition-pill">{bio}</div>'
        f'</div>'
        for title, sanskrit, bio, color in _VERIFIED_CONDITIONS
    ])
    st.markdown(f'<div class="lp-conditions-grid">{cards_html}</div>', unsafe_allow_html=True)

    # Auth Section Header
    st.markdown(f"""
    <div class="lp-section-title" style="margin-top:40px;">
        <h2>Get Started</h2>
        <p>Sign in or create an account to access your personalised dashboard</p>
    </div>
    """, unsafe_allow_html=True)

    # Streamlit native forms for authentication
    _, col_auth, _ = st.columns([1, 1.25, 1])

    with col_auth:
        if "login_success_msg" in st.session_state:
            st.success(st.session_state.pop("login_success_msg"))

        tab_login, tab_register = st.tabs(["Sign In", "Create Account"])

        with tab_login:
            _render_login_form()

        with tab_register:
            _render_register_form()

    # Footer
    st.markdown(f"""
    <div style="text-align:center; margin-top:80px; padding:40px 24px; color:{P.TEXT_MUTED}; font-size:0.85rem; border-top: 1px solid {P.BORDER};">
        <div style="font-weight:800; font-size:1.2rem; color:{P.TEXT_PRIMARY}; margin-bottom:12px;">Gita-NeuroSync</div>
        Confidential, encrypted, and biomedical psychophysiology architecture<br><br>
        &copy; 2026 Mind Diagnostics &middot; All Rights Reserved
    </div>
    """, unsafe_allow_html=True)

    return False


# ══════════════════════════════════════════════════════════════════════════════
#  FORM RENDERERS (Unchanged Logic, utilizing Global CSS)
# ══════════════════════════════════════════════════════════════════════════════

def _render_login_form() -> None:
    with st.form("login_form"):
        email = st.text_input("Email", placeholder="name@example.com")
        password = st.text_input("Password", type="password")
        submit = st.form_submit_button("Sign In", use_container_width=True, type="primary")

        if submit:
            if not email or not password:
                st.error("Please provide both email and password.")
            else:
                user = authenticate_user(email, password)
                if user:
                    if user.get("email_verified"):
                        st.session_state["authenticated"] = True
                        st.session_state["user"] = user
                        st.session_state["login_success_msg"] = "Welcome back!"
                        st.rerun()
                    else:
                        st.session_state["pending_verification_user"] = user
                        new_otp = generate_otp()
                        store_otp(user["email"], new_otp)
                        send_otp_email_async(user["email"], new_otp)
                        st.rerun()
                else:
                    st.error("Invalid credentials. Please try again.")

def _render_register_form() -> None:
    with st.form("register_form"):
        st.markdown('<div class="section-label">ACCOUNT DETAILS</div>', unsafe_allow_html=True)
        email = st.text_input("Email Address", placeholder="name@example.com")
        username = st.text_input("Full Name", placeholder="Jane Doe")
        password = st.text_input("Create Password", type="password")
        submit = st.form_submit_button("Create Account", use_container_width=True, type="primary")

        if submit:
            if not email or not username or not password:
                st.error("All fields are required.")
            else:
                success, msg_or_user = register_user(email, username, password)
                if success:
                    st.session_state["pending_verification_user"] = msg_or_user
                    st.rerun()
                else:
                    st.error(msg_or_user)

def _render_otp_verification(user: dict) -> bool:
    st.markdown(f"""
    <div class="hero-dark" style="margin-top: 40px;">
        <h2 style="color:{P.TEXT_PRIMARY};">Verify Your Email</h2>
        <p style="color:{P.TEXT_SECONDARY};">We've sent a 6-digit code to <strong>{user['email']}</strong></p>
    </div>
    """, unsafe_allow_html=True)

    _, col, _ = st.columns([1, 1, 1])
    with col:
        with st.form("otp_form"):
            otp_input = st.text_input("Enter 6-digit OTP", max_chars=6)
            submit = st.form_submit_button("Verify Email", use_container_width=True, type="primary")

            if submit:
                if verify_otp(user["email"], otp_input):
                    mark_email_verified(user["email"])
                    user["email_verified"] = True
                    st.session_state["authenticated"] = True
                    st.session_state["user"] = user
                    st.session_state.pop("pending_verification_user", None)
                    st.session_state["login_success_msg"] = "Email verified! Welcome."
                    st.rerun()
                else:
                    st.error("Invalid or expired OTP. Please try again.")

        if st.button("Cancel", type="secondary", use_container_width=True):
            st.session_state.pop("pending_verification_user", None)
            st.rerun()
    return False
