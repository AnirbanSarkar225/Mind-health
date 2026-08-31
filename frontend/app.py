"""
Gita-NeuroSync v4.0
AI Mental Health Remediation Platform
PostgreSQL | bcrypt Auth | Email OTP | Multi-User | Hardware Interface | 5-Page Navigation

Run:   python start.py
"""

from __future__ import annotations

import numpy as np
import streamlit as st

from frontend.config.palette import Palette as P

from backend.models.states import MentalState, STATE_INDEX
from backend.models.signals import BioSignals, derive_eeg_powers
from backend.models.verses import GITA_VERSES

from backend.classifiers.rules import classify_rule_based
from backend.classifiers.ml_engine import (
    ML_CONFIDENCE_THRESHOLD,
    init_ml_model,
    classify_ml,
    online_update,
)

from backend.graph.gita_graph import build_knowledge_graph, query_graph_path

from backend.database.schema import create_tables
from backend.database.models import (
    save_session,
    save_problem,
    save_feedback,
    get_user_sessions,
    get_user_stats,
)

from frontend.ui.styles import inject_css
from frontend.ui.gauges import (
    gauge_bpm, gauge_hrv, gauge_attention,
    gauge_meditation, gauge_beta_alpha,
)
from frontend.ui.badges import badge_html, confidence_bars_html
from frontend.ui.waveform import push_history, render_waveform
from frontend.ui.remedy_card import render_remedy_card
from frontend.ui.pathway_display import render_pathway_and_steps
from frontend.ui.problem_input import render_problem_input
from frontend.ui.auth_page import render_auth_page

from backend.hardware.reader import SerialReader, MQTTReader, list_serial_ports


# ==============================================================================
#  PAGE CONFIG
# ==============================================================================

st.set_page_config(
    page_title="Gita-NeuroSync",
    page_icon=None,
    layout="wide",
    initial_sidebar_state="auto",
)


# ==============================================================================
#  DATABASE BOOTSTRAP
# ==============================================================================

if "db_ready" not in st.session_state:
    try:
        create_tables()
        st.session_state["db_ready"] = True
    except Exception as e:
        st.error(f"Database connection failed: {e}")
        st.stop()


# ==============================================================================
#  AUTHENTICATION GATE
# ==============================================================================

is_auth = st.session_state.get("authenticated", False) and st.session_state.get("user", {}).get("email_verified", False)
inject_css(is_authenticated=is_auth)

if not render_auth_page():
    st.stop()

current_user = st.session_state.get("user", {})


# ==============================================================================
#  ML MODEL BOOTSTRAP
# ==============================================================================

if "ml_model" not in st.session_state:
    model, scaler = init_ml_model()
    st.session_state["ml_model"]   = model
    st.session_state["ml_scaler"]  = scaler
    st.session_state["ml_updates"] = 0

model  = st.session_state["ml_model"]
scaler = st.session_state["ml_scaler"]


# ==============================================================================
#  SIDEBAR NAVIGATION (5-Page Architecture)
# ==============================================================================

with st.sidebar:
    st.markdown(
        f'<div class="sidebar-brand">'
        f'<h2>Gita-NeuroSync</h2>'
        f'<p>Chikitsa-Lite &middot; AI Biosignal Remediation</p>'
        f'</div>',
        unsafe_allow_html=True,
    )

    st.markdown(
        f'<div class="sidebar-user-pill">'
        f'User: <strong style="color:{P.TEXT_PRIMARY};">{current_user.get("username", "User")}</strong>'
        f'</div>',
        unsafe_allow_html=True,
    )

    st.markdown('<div class="section-label">NAVIGATION</div>', unsafe_allow_html=True)

    _NAV_OPTIONS = [
        "Dashboard",
        "Hardware & Analysis",
        "Self-Assessment",
        "Session History",
        "My Account",
    ]

    # Handle quick-action navigation overrides from Dashboard buttons
    _nav_override = st.session_state.pop("_nav_override", None)
    if _nav_override and _nav_override in _NAV_OPTIONS:
        st.session_state["nav_radio"] = _nav_override

    nav_selection = st.radio(
        "Navigation",
        _NAV_OPTIONS,
        key="nav_radio",
        label_visibility="collapsed",
    )

    st.markdown("---")
    if st.button("Sign Out", key="sidebar_signout", type="secondary", use_container_width=True):
        for k in ["authenticated", "user", "ml_model", "ml_scaler",
                   "ml_updates", "current_session_id", "hw_reader", "pending_verification_user"]:
            if k == "hw_reader" and st.session_state.get("hw_reader"):
                st.session_state["hw_reader"].stop()
            st.session_state.pop(k, None)
        st.rerun()


# ==============================================================================
#  GLOBAL SIGNAL & HARDWARE RESOLUTION
# ==============================================================================

if "input_mode" not in st.session_state or st.session_state["input_mode"] not in ("Serial USB Port", "WiFi / MQTT"):
    st.session_state["input_mode"] = "Serial USB Port"
if "use_ml" not in st.session_state:
    st.session_state["use_ml"] = True

hw_reader = st.session_state.get("hw_reader")
if hw_reader and getattr(hw_reader, "reading", None) and hw_reader.reading.connected:
    d = hw_reader.reading.get()
    bpm, hrv = d["bpm"], d["hrv_sdnn"]
    attention, meditation = d["attention"], d["meditation"]
    alpha, beta, theta = d["alpha"], d["beta"], d["theta"]
    ba_ratio = d["ba_ratio"]
else:
    # Hardware disconnected -> Idle zero baseline unless test sliders are actively set
    bpm = st.session_state.get("slider_bpm", 0)
    hrv = st.session_state.get("slider_hrv", 0)
    attention = st.session_state.get("slider_att", 0)
    meditation = st.session_state.get("slider_med", 0)
    ba_ratio = st.session_state.get("slider_ba", 0.0)
    if attention > 0 or meditation > 0 or ba_ratio > 0:
        alpha, beta, theta = derive_eeg_powers(attention, meditation, ba_ratio)
    else:
        alpha, beta, theta = 0.0, 0.0, 0.0

signals = BioSignals(
    bpm=bpm, hrv_sdnn=hrv,
    eeg_attention=attention, eeg_meditation=meditation,
    alpha_power=alpha, beta_power=beta, theta_power=theta,
    beta_alpha_ratio=ba_ratio,
)
push_history(signals)

# Classifier inference & Score resolution
is_idle = (bpm == 0 and hrv == 0 and attention == 0 and meditation == 0)

if is_idle:
    stress_idx = 0.0
    calm_score = 0.0
    final_state = MentalState.EQUILIBRIUM
    method_label = "ML Baseline (Idle)"
    final_conf = 0.50
    ml_proba = np.array([0.25, 0.25, 0.25, 0.25])
else:
    stress_idx = max(0.0, min(100.0, (bpm - 60.0) * 1.5 + (100.0 - meditation) * 0.4))
    calm_score = max(0.0, min(100.0, (meditation * 0.6) + max(0.0, 100.0 - bpm) * 0.4))

    use_ml = st.session_state.get("use_ml", True)
    rule_state = classify_rule_based(signals)

    if use_ml:
        ml_state, ml_conf, ml_proba = classify_ml(model, scaler, signals)
        if ml_conf < ML_CONFIDENCE_THRESHOLD:
            final_state  = rule_state
            method_label = f"Rules (ML {ml_conf:.0%})"
            final_conf   = max(0.50, min(0.85, ml_conf))
        else:
            final_state  = ml_state
            method_label = "ML / SGDClassifier"
            final_conf   = ml_conf
    else:
        final_state  = rule_state
        method_label = "Rule-Based Engine"
        final_conf   = 0.75
        ml_proba     = np.array([0.25, 0.25, 0.25, 0.25])

verse = GITA_VERSES[final_state]


# ==============================================================================
#  VIEW 1: DASHBOARD (Home)
# ==============================================================================

if nav_selection == "Dashboard":
    st.markdown(
        f'<div style="margin-bottom:22px;">'
        f'<h1 style="color:{P.TEXT_PRIMARY}; font-size:1.9rem; font-weight:800; margin:0 0 4px 0;">'
        f'Welcome, {current_user.get("username", "User")}</h1>'
        f'<p style="color:{P.TEXT_SECONDARY}; font-size:0.88rem; margin:0;">'
        f'Your AI-powered neuro-psychological dashboard -- overview and quick actions</p>'
        f'</div>',
        unsafe_allow_html=True,
    )

    # ── Summary Stats Row ─────────────────────────────────────────────────
    user_stats = get_user_stats(current_user.get("id", ""))
    last_session_str = "No sessions yet"
    if user_stats["last_session_at"]:
        last_session_str = str(user_stats["last_session_at"])[:19]

    col_s1, col_s2, col_s3, col_s4 = st.columns(4)

    col_s1.markdown(
        f'<div style="background:{P.BG_SUBTLE}; border:1px solid {P.BORDER}; border-radius:12px; padding:18px; text-align:center;">'
        f'<div style="color:{P.TEXT_SECONDARY}; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Total Sessions</div>'
        f'<div style="color:{P.TEXT_PRIMARY}; font-size:2.0rem; font-weight:800; margin:6px 0;">{user_stats["total_sessions"]}</div>'
        f'</div>',
        unsafe_allow_html=True,
    )
    col_s2.markdown(
        f'<div style="background:{P.BG_SUBTLE}; border:1px solid {P.BORDER}; border-radius:12px; padding:18px; text-align:center;">'
        f'<div style="color:{P.TEXT_SECONDARY}; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Current State</div>'
        f'<div style="color:{P.PRIMARY_LIGHT}; font-size:1.15rem; font-weight:800; margin:6px 0;">{final_state.value}</div>'
        f'<div style="color:{P.TEXT_MUTED}; font-size:0.74rem;">{method_label}</div>'
        f'</div>',
        unsafe_allow_html=True,
    )
    col_s3.markdown(
        f'<div style="background:{P.BG_SUBTLE}; border:1px solid {P.BORDER}; border-radius:12px; padding:18px; text-align:center;">'
        f'<div style="color:{P.TEXT_SECONDARY}; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Most Frequent State</div>'
        f'<div style="color:{P.ACCENT_LIGHT}; font-size:1.15rem; font-weight:800; margin:6px 0;">{user_stats["most_frequent_state"]}</div>'
        f'</div>',
        unsafe_allow_html=True,
    )
    col_s4.markdown(
        f'<div style="background:{P.BG_SUBTLE}; border:1px solid {P.BORDER}; border-radius:12px; padding:18px; text-align:center;">'
        f'<div style="color:{P.TEXT_SECONDARY}; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; font-weight:700;">ML Training Updates</div>'
        f'<div style="color:{P.TEXT_PRIMARY}; font-size:2.0rem; font-weight:800; margin:6px 0;">{st.session_state.get("ml_updates", 0)}</div>'
        f'</div>',
        unsafe_allow_html=True,
    )

    # ── Quick Insight Row ─────────────────────────────────────────────────
    st.markdown("---")
    col_insight_l, col_insight_r = st.columns(2)

    with col_insight_l:
        st.markdown('<div class="section-label">LATEST READING SNAPSHOT</div>', unsafe_allow_html=True)
        st.markdown(badge_html(final_state, method_label, final_conf), unsafe_allow_html=True)

        m1, m2 = st.columns(2)
        m1.metric("Stress Index", f"{stress_idx:.0f}/100")
        m2.metric("Calm Score", f"{calm_score:.0f}/100")

    with col_insight_r:
        st.markdown('<div class="section-label">ACTIVITY SUMMARY</div>', unsafe_allow_html=True)
        st.markdown(
            f'<div style="background:{P.BG_SUBTLE}; border:1px solid {P.BORDER}; border-radius:12px; padding:18px; line-height:2.0;">'
            f'<div style="color:{P.TEXT_SECONDARY}; font-size:0.85rem;">'
            f'<strong style="color:{P.TEXT_PRIMARY};">Last Session:</strong> {last_session_str}<br>'
            f'<strong style="color:{P.TEXT_PRIMARY};">Avg Heart Rate:</strong> {user_stats["avg_bpm"]:.1f} bpm<br>'
            f'<strong style="color:{P.TEXT_PRIMARY};">Avg Meditation Score:</strong> {user_stats["avg_meditation"]:.1f}/100<br>'
            f'<strong style="color:{P.TEXT_PRIMARY};">Feedback Contributions:</strong> {user_stats["total_feedback"]}'
            f'</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

    # ── Quick Action Buttons ──────────────────────────────────────────────
    st.markdown("---")
    st.markdown('<div class="section-label">QUICK ACTIONS</div>', unsafe_allow_html=True)
    qa1, qa2, qa3 = st.columns(3)
    with qa1:
        if st.button("Start New Reading", type="primary", use_container_width=True, key="qa_hw"):
            st.session_state["_nav_override"] = "Hardware & Analysis"
            st.rerun()
    with qa2:
        if st.button("View Session History", type="secondary", use_container_width=True, key="qa_hist"):
            st.session_state["_nav_override"] = "Session History"
            st.rerun()
    with qa3:
        if st.button("Log Self-Assessment", type="secondary", use_container_width=True, key="qa_sa"):
            st.session_state["_nav_override"] = "Self-Assessment"
            st.rerun()


# ==============================================================================
#  VIEW 2: HARDWARE & ANALYSIS (Unified Reading + Remedy)
# ==============================================================================

elif nav_selection == "Hardware & Analysis":
    st.markdown(
        f'<div style="margin-bottom:18px;">'
        f'<h1 style="color:{P.TEXT_PRIMARY}; font-size:1.8rem; font-weight:800; margin:0 0 2px 0;">'
        f'Hardware & Analysis</h1>'
        f'<p style="color:{P.TEXT_SECONDARY}; font-size:0.86rem; margin:0;">'
        f'Connect biosignal hardware, view live telemetry, and receive AI-powered Vedantic remediation</p>'
        f'</div>',
        unsafe_allow_html=True,
    )

    # ── Hardware & Source Control Card ────────────────────────────────────
    with st.expander("Hardware Interface & Signal Source", expanded=True):
        c_mode, c_ctrl, c_status = st.columns([1.1, 1.6, 1.3])

        with c_mode:
            st.session_state["input_mode"] = st.radio(
                "Hardware Interface",
                ["Serial USB Port", "WiFi / MQTT"],
                index=["Serial USB Port", "WiFi / MQTT"].index(st.session_state["input_mode"]) if st.session_state["input_mode"] in ["Serial USB Port", "WiFi / MQTT"] else 0,
            )

        with c_ctrl:
            if st.session_state["input_mode"] == "Serial USB Port":
                col_p, col_b = st.columns([1.5, 1])
                available_ports = list_serial_ports()
                with col_p:
                    sel_port = st.selectbox("COM Port", available_ports) if available_ports else st.text_input("COM Port", value="COM3")
                with col_b:
                    sel_baud = st.selectbox("Baud Rate", [9600, 115200, 57600], index=0)

                col_conn, col_disc = st.columns(2)
                with col_conn:
                    if st.button("Connect USB", type="primary", use_container_width=True):
                        reader = SerialReader(sel_port, sel_baud)
                        reader.start()
                        st.session_state["hw_reader"] = reader
                        st.toast(f"Connecting to {sel_port}...")
                        st.rerun()
                with col_disc:
                    if st.session_state.get("hw_reader") and st.button("Disconnect", type="secondary", use_container_width=True):
                        st.session_state["hw_reader"].stop()
                        st.session_state.pop("hw_reader", None)
                        st.toast("Hardware disconnected.")
                        st.rerun()

            elif st.session_state["input_mode"] == "WiFi / MQTT":
                col_brk, col_top = st.columns(2)
                with col_brk:
                    broker_ip = st.text_input("Broker IP", value="localhost")
                with col_top:
                    mqtt_topic = st.text_input("MQTT Topic", value="neurosync/signals")

                col_mconn, col_mdisc = st.columns(2)
                with col_mconn:
                    if st.button("Connect WiFi", type="primary", use_container_width=True):
                        reader = MQTTReader(broker=broker_ip, topic=mqtt_topic)
                        reader.start()
                        st.session_state["hw_reader"] = reader
                        st.toast(f"Subscribing to {mqtt_topic}...")
                        st.rerun()
                with col_mdisc:
                    if st.session_state.get("hw_reader") and st.button("Disconnect", type="secondary", use_container_width=True):
                        st.session_state["hw_reader"].stop()
                        st.session_state.pop("hw_reader", None)
                        st.toast("MQTT disconnected.")
                        st.rerun()

        with c_status:
            hw_reader = st.session_state.get("hw_reader")
            if hw_reader:
                if hw_reader.error:
                    st.error(f"Error: {hw_reader.error}")
                elif getattr(hw_reader, "reading", None) and hw_reader.reading.connected:
                    st.markdown(
                        f'<div style="background:rgba(82,183,136,0.15); border:1px solid {P.SAGE}; '
                        f'border-radius:10px; padding:12px; text-align:center;">'
                        f'<div style="color:{P.SAGE_LIGHT}; font-weight:700; font-size:0.9rem;">[STREAMING] Live Hardware Active</div>'
                        f'<div style="color:{P.TEXT_SECONDARY}; font-size:0.78rem; margin-top:4px;">'
                        f'Packets: <strong>{hw_reader.reading.packet_count}</strong> | Sync Active</div>'
                        f'</div>',
                        unsafe_allow_html=True,
                    )
                else:
                    st.markdown(
                        f'<div style="background:rgba(233,196,106,0.15); border:1px solid {P.ACCENT}; '
                        f'border-radius:10px; padding:12px; text-align:center;">'
                        f'<div style="color:{P.ACCENT_LIGHT}; font-weight:700; font-size:0.9rem;">[WAITING] Awaiting Hardware Packets</div>'
                        f'<div style="color:{P.TEXT_SECONDARY}; font-size:0.78rem; margin-top:4px;">'
                        f'Listening on port...</div>'
                        f'</div>',
                        unsafe_allow_html=True,
                    )
            else:
                st.markdown(
                    f'<div style="background:{P.BG_INPUT}; border:1px solid {P.BORDER}; '
                    f'border-radius:10px; padding:12px; text-align:center;">'
                    f'<div style="color:{P.TEXT_MUTED}; font-weight:600; font-size:0.88rem;">[OFFLINE] Hardware Disconnected</div>'
                    f'<div style="color:{P.TEXT_SECONDARY}; font-size:0.78rem; margin-top:4px;">Click Connect above to stream</div>'
                    f'</div>',
                    unsafe_allow_html=True,
                )

        # Intelligence engine toggle inside hardware config
        st.markdown("---")
        col_ml, col_ml_info = st.columns([1, 2])
        with col_ml:
            st.session_state["use_ml"] = st.toggle("ML Classifier", value=st.session_state.get("use_ml", True), help="Toggle online SGDClassifier vs Rule-based fallback")
        with col_ml_info:
            st.caption(f"Engine: {'ML / SGDClassifier' if st.session_state.get('use_ml', True) else 'Rule-Based'} | Training Updates: {st.session_state.get('ml_updates', 0)}")

        hw_connected = bool(hw_reader and getattr(hw_reader, "reading", None) and hw_reader.reading.connected)
        if not hw_connected:
            with st.expander("Manual Calibration Sliders (Test Override)", expanded=False):
                st.caption("Adjust biosignal sliders manually if hardware sensor is not physically attached:")
                s1, s2, s3, s4, s5 = st.columns(5)
                with s1: st.session_state["slider_bpm"] = st.slider("Heart Rate (BPM)", 0, 150, st.session_state.get("slider_bpm", 0))
                with s2: st.session_state["slider_hrv"] = st.slider("HRV SDNN (ms)", 0, 120, st.session_state.get("slider_hrv", 0))
                with s3: st.session_state["slider_att"] = st.slider("EEG Attention", 0, 100, st.session_state.get("slider_att", 0))
                with s4: st.session_state["slider_med"] = st.slider("EEG Meditation", 0, 100, st.session_state.get("slider_med", 0))
                with s5: st.session_state["slider_ba"]  = st.slider("Beta/Alpha Ratio", 0.0, 4.0, st.session_state.get("slider_ba", 0.0), 0.1)

    # ── Biosignal Telemetry Gauges ────────────────────────────────────────
    st.markdown('<div class="section-label" style="margin-top:16px;">TELEMETRY METRICS</div>', unsafe_allow_html=True)
    g1, g2, g3, g4, g5 = st.columns(5)
    with g1: st.plotly_chart(gauge_bpm(bpm),              use_container_width=True, key="hw_g_bpm")
    with g2: st.plotly_chart(gauge_hrv(hrv),              use_container_width=True, key="hw_g_hrv")
    with g3: st.plotly_chart(gauge_attention(attention),   use_container_width=True, key="hw_g_att")
    with g4: st.plotly_chart(gauge_meditation(meditation), use_container_width=True, key="hw_g_med")
    with g5: st.plotly_chart(gauge_beta_alpha(ba_ratio),  use_container_width=True, key="hw_g_ba")

    # ── Assessment & Live Waveform ────────────────────────────────────────
    st.markdown('<div class="section-label" style="margin-top:20px;">ASSESSMENT & TELEMETRY WAVEFORM</div>', unsafe_allow_html=True)
    col_assess, col_wf = st.columns([1, 1.3])

    with col_assess:
        st.markdown(badge_html(final_state, method_label, final_conf), unsafe_allow_html=True)

        m1, m2 = st.columns(2)
        m1.metric("Stress Index", f"{stress_idx:.0f}/100")
        m2.metric("Calm Score",   f"{calm_score:.0f}/100")

        st.markdown('<div class="section-label" style="margin-top:12px;">ML CLASS PROBABILITIES</div>', unsafe_allow_html=True)
        st.markdown(confidence_bars_html(ml_proba), unsafe_allow_html=True)

    with col_wf:
        st.markdown('<div class="section-label">LIVE TELEMETRY STREAM (ROLLING BUFFER)</div>', unsafe_allow_html=True)
        st.plotly_chart(render_waveform(), use_container_width=True, key="hw_wf_chart")

    # ── Gita Remediation Section ──────────────────────────────────────────
    st.markdown("---")
    st.markdown(
        f'<div style="margin-bottom:18px;">'
        f'<h2 style="color:{P.TEXT_PRIMARY}; font-size:1.5rem; font-weight:800; margin:0 0 2px 0;">'
        f'Gita Remediation & Vedantic Wisdom</h2>'
        f'<p style="color:{P.TEXT_SECONDARY}; font-size:0.86rem; margin:0;">'
        f'Personalised philosophical grounding and Sanskrit prescriptions for {final_state.value}</p>'
        f'</div>',
        unsafe_allow_html=True,
    )

    # Diagnostic Summary Bar
    st.markdown(
        f'<div style="background:{P.BG_SUBTLE}; border:1px solid {P.BORDER}; border-left:4px solid {P.PRIMARY}; '
        f'border-radius:12px; padding:14px 20px; display:flex; justify-content:space-between; align-items:center; '
        f'margin-bottom:22px; flex-wrap:wrap; gap:12px;">'
        f'<div>'
        f'<span style="font-size:0.75rem; color:{P.TEXT_SECONDARY}; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Target Neuro-State</span>'
        f'<div style="color:{P.TEXT_PRIMARY}; font-size:1.2rem; font-weight:800; margin-top:2px;">{final_state.value}</div>'
        f'</div>'
        f'<div style="text-align:right;">'
        f'<span style="background:rgba(42,157,143,0.15); border:1px solid {P.PRIMARY}; color:{P.PRIMARY_LIGHT}; '
        f'padding:4px 12px; border-radius:16px; font-size:0.80rem; font-weight:700;">{method_label} &middot; {final_conf:.0%} Confidence</span>'
        f'</div>'
        f'</div>',
        unsafe_allow_html=True,
    )

    # 2-Column Remedy Layout
    col_left, col_right = st.columns([1.25, 1])

    with col_left:
        st.markdown('<div class="section-label">PRESCRIPTION SHLOKA & MEANING</div>', unsafe_allow_html=True)
        render_remedy_card(verse)

    with col_right:
        st.markdown('<div class="section-label">PATHWAY & SOMATIC GROUNDING</div>', unsafe_allow_html=True)
        render_pathway_and_steps(final_state)


# ==============================================================================
#  VIEW 3: SELF-ASSESSMENT & CHECK-IN
# ==============================================================================

elif nav_selection == "Self-Assessment":
    st.markdown(
        f'<div style="margin-bottom:18px;">'
        f'<h1 style="color:{P.TEXT_PRIMARY}; font-size:1.8rem; font-weight:800; margin:0 0 2px 0;">'
        f'Self-Assessment & Model Training</h1>'
        f'<p style="color:{P.TEXT_SECONDARY}; font-size:0.86rem; margin:0;">'
        f'Log your subjective symptoms and provide feedback to incrementally train the AI classifier</p>'
        f'</div>',
        unsafe_allow_html=True,
    )

    col_symp, col_train = st.columns([1.1, 1])

    with col_symp:
        problem_desc, problem_symptoms, problem_discomfort = render_problem_input()

    with col_train:
        st.markdown('<div class="section-label">CLASSIFIER CHECK-IN & CONFIRMATION</div>', unsafe_allow_html=True)
        st.markdown(
            f'<div style="background:{P.BG_SUBTLE}; border:1px solid {P.BORDER}; border-radius:14px; padding:22px;">'
            f'<div style="color:{P.TEXT_PRIMARY}; font-size:0.95rem; margin-bottom:14px;">'
            f'Current Detected State: <strong style="color:{P.PRIMARY_LIGHT};">{final_state.value}</strong>'
            f'<br><span style="font-size:0.82rem; color:{P.TEXT_SECONDARY};">Confirm or correct this assessment below to train the machine learning model.</span></div>',
            unsafe_allow_html=True,
        )

        actual_label = st.selectbox(
            "Your actual mental state:",
            [s.value for s in MentalState],
            index=STATE_INDEX[final_state.value],
            key="sa_actual_state",
        )
        discomfort_rating = st.slider(
            "Subjective Discomfort Level (1-5)",
            1, 5, 3,
            key="sa_discomfort_slider",
        )

        if st.button("Confirm & Train Model", type="primary", use_container_width=True):
            actual_state = MentalState(actual_label)
            online_update(model, scaler, signals, actual_state, float(discomfort_rating))
            st.session_state["ml_updates"] += 1

            try:
                sid = save_session(
                    user_id=current_user["id"],
                    bpm=bpm, hrv=hrv, attention=attention, meditation=meditation,
                    alpha=alpha, beta=beta, theta=theta, ba_ratio=ba_ratio,
                    state=final_state.value, method=method_label, confidence=final_conf,
                )
                if problem_desc.strip() or problem_symptoms:
                    save_problem(
                        user_id=current_user["id"],
                        session_id=sid,
                        description=problem_desc,
                        symptoms=problem_symptoms,
                        discomfort_level=problem_discomfort,
                    )
                save_feedback(
                    user_id=current_user["id"],
                    session_id=sid,
                    confirmed_state=actual_label,
                    discomfort_level=discomfort_rating,
                )
            except Exception:
                pass

            st.toast(f"Model updated successfully (Update #{st.session_state['ml_updates']})")
            st.rerun()

        st.markdown('</div>', unsafe_allow_html=True)


# ==============================================================================
#  VIEW 4: SESSION HISTORY
# ==============================================================================

elif nav_selection == "Session History":
    st.markdown(
        f'<div style="margin-bottom:18px;">'
        f'<h1 style="color:{P.TEXT_PRIMARY}; font-size:1.8rem; font-weight:800; margin:0 0 2px 0;">'
        f'Session History & Telemetry Records</h1>'
        f'<p style="color:{P.TEXT_SECONDARY}; font-size:0.86rem; margin:0;">'
        f'Historical database log of your past biosignal readings and assessments</p>'
        f'</div>',
        unsafe_allow_html=True,
    )

    try:
        sessions = get_user_sessions(current_user["id"], limit=50)
        if sessions:
            import pandas as pd
            df = pd.DataFrame(sessions)

            col_m1, col_m2, col_m3 = st.columns(3)
            col_m1.metric("Total Logged Sessions", len(df))
            col_m2.metric("Average Heart Rate", f"{df['bpm'].mean():.1f} bpm")
            col_m3.metric("Average Meditation Score", f"{df['eeg_meditation'].mean():.1f}/100")

            st.markdown('<div class="section-label" style="margin-top:20px;">DETAILED TELEMETRY TABLE</div>', unsafe_allow_html=True)
            display_cols = [
                "created_at", "bpm", "hrv_sdnn", "eeg_attention",
                "eeg_meditation", "beta_alpha_ratio",
                "detected_state", "confidence",
            ]
            display_cols = [c for c in display_cols if c in df.columns]
            st.dataframe(df[display_cols], use_container_width=True)

            # State distribution chart
            if "detected_state" in df.columns:
                st.markdown('<div class="section-label" style="margin-top:20px;">STATE DISTRIBUTION</div>', unsafe_allow_html=True)
                import plotly.express as px
                state_counts = df["detected_state"].value_counts().reset_index()
                state_counts.columns = ["State", "Count"]
                fig = px.bar(
                    state_counts, x="State", y="Count",
                    color="State",
                    color_discrete_sequence=[P.RED_SOFT, P.BLUE_SOFT, P.AMBER_SOFT, P.GREEN_SOFT],
                )
                fig.update_layout(
                    plot_bgcolor="rgba(0,0,0,0)",
                    paper_bgcolor="rgba(0,0,0,0)",
                    font=dict(color=P.TEXT_SECONDARY),
                    showlegend=False,
                    height=300,
                    margin=dict(l=20, r=20, t=20, b=40),
                )
                st.plotly_chart(fig, use_container_width=True, key="hist_state_chart")

            # Export
            csv_data = df[display_cols].to_csv(index=False).encode('utf-8')
            st.download_button(
                label="Download Telemetry History as CSV",
                data=csv_data,
                file_name=f"neurosync_telemetry_{current_user.get('username', 'user')}.csv",
                mime="text/csv",
            )
        else:
            st.info("No recorded sessions found in the database. Head over to Self-Assessment to log your first session!")
    except Exception as e:
        st.error(f"Could not load session records: {e}")


# ==============================================================================
#  VIEW 5: MY ACCOUNT (Google-style Profile Page)
# ==============================================================================

elif nav_selection == "My Account":
    st.markdown(
        f'<div style="margin-bottom:22px;">'
        f'<h1 style="color:{P.TEXT_PRIMARY}; font-size:1.8rem; font-weight:800; margin:0 0 2px 0;">'
        f'My Account</h1>'
        f'<p style="color:{P.TEXT_SECONDARY}; font-size:0.86rem; margin:0;">'
        f'Manage your profile, review account activity, and access security settings</p>'
        f'</div>',
        unsafe_allow_html=True,
    )

    user_stats = get_user_stats(current_user.get("id", ""))

    # ── Profile Header ────────────────────────────────────────────────────
    username = current_user.get("username", "User")
    email = current_user.get("email", "")
    initial = username[0].upper() if username else "U"
    verified_badge = (
        f'<span style="background:rgba(82,183,136,0.2); color:{P.SAGE_LIGHT}; '
        f'padding:3px 10px; border-radius:12px; font-size:0.74rem; font-weight:700; margin-left:8px;">Verified</span>'
    ) if current_user.get("email_verified") else (
        f'<span style="background:rgba(224,122,95,0.2); color:{P.RED_SOFT}; '
        f'padding:3px 10px; border-radius:12px; font-size:0.74rem; font-weight:700; margin-left:8px;">Unverified</span>'
    )

    st.markdown(
        f'<div style="background:{P.BG_SUBTLE}; border:1px solid {P.BORDER}; border-radius:16px; '
        f'padding:28px; display:flex; align-items:center; gap:24px; margin-bottom:24px;">'
        f'<div style="width:72px; height:72px; border-radius:50%; background:{P.PRIMARY}; '
        f'display:flex; align-items:center; justify-content:center; flex-shrink:0;">'
        f'<span style="color:#FFFFFF; font-size:2.0rem; font-weight:800;">{initial}</span>'
        f'</div>'
        f'<div>'
        f'<div style="color:{P.TEXT_PRIMARY}; font-size:1.4rem; font-weight:800;">{username}{verified_badge}</div>'
        f'<div style="color:{P.TEXT_SECONDARY}; font-size:0.88rem; margin-top:2px;">{email}</div>'
        f'<div style="color:{P.TEXT_MUTED}; font-size:0.78rem; margin-top:4px;">'
        f'Member since {str(current_user.get("created_at", ""))[:10]}</div>'
        f'</div>'
        f'</div>',
        unsafe_allow_html=True,
    )

    # ── Cards Grid ────────────────────────────────────────────────────────
    col_info, col_activity = st.columns(2)

    with col_info:
        st.markdown('<div class="section-label">PERSONAL INFORMATION</div>', unsafe_allow_html=True)
        st.markdown(
            f'<div style="background:{P.BG_SUBTLE}; border:1px solid {P.BORDER}; border-radius:12px; '
            f'padding:20px; line-height:2.2;">'
            f'<div style="color:{P.TEXT_SECONDARY}; font-size:0.85rem;">'
            f'<strong style="color:{P.TEXT_PRIMARY};">Username:</strong> {username}<br>'
            f'<strong style="color:{P.TEXT_PRIMARY};">Email:</strong> {email}<br>'
            f'<strong style="color:{P.TEXT_PRIMARY};">Email Status:</strong> '
            f'{"Verified" if current_user.get("email_verified") else "Pending Verification"}<br>'
            f'<strong style="color:{P.TEXT_PRIMARY};">Account Created:</strong> {str(current_user.get("created_at", ""))[:19]}<br>'
            f'<strong style="color:{P.TEXT_PRIMARY};">User ID:</strong> <code style="font-size:0.72rem;">{str(current_user.get("id", ""))[:8]}...</code>'
            f'</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

    with col_activity:
        st.markdown('<div class="section-label">ACCOUNT ACTIVITY</div>', unsafe_allow_html=True)
        last_at = user_stats["last_session_at"]
        last_str = str(last_at)[:19] if last_at else "No sessions yet"
        st.markdown(
            f'<div style="background:{P.BG_SUBTLE}; border:1px solid {P.BORDER}; border-radius:12px; '
            f'padding:20px; line-height:2.2;">'
            f'<div style="color:{P.TEXT_SECONDARY}; font-size:0.85rem;">'
            f'<strong style="color:{P.TEXT_PRIMARY};">Total Sessions:</strong> {user_stats["total_sessions"]}<br>'
            f'<strong style="color:{P.TEXT_PRIMARY};">Last Session:</strong> {last_str}<br>'
            f'<strong style="color:{P.TEXT_PRIMARY};">Most Frequent State:</strong> '
            f'<span style="color:{P.PRIMARY_LIGHT}; font-weight:700;">{user_stats["most_frequent_state"]}</span><br>'
            f'<strong style="color:{P.TEXT_PRIMARY};">ML Feedback Given:</strong> {user_stats["total_feedback"]}<br>'
            f'<strong style="color:{P.TEXT_PRIMARY};">Avg Confidence:</strong> {user_stats["avg_confidence"]:.0%}'
            f'</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

    # ── Security & Privacy Card ───────────────────────────────────────────
    st.markdown("---")
    st.markdown('<div class="section-label">SECURITY & PRIVACY</div>', unsafe_allow_html=True)
    st.markdown(
        f'<div style="background:{P.BG_SUBTLE}; border:1px solid {P.BORDER}; border-radius:12px; '
        f'padding:20px; font-size:0.85rem; color:{P.TEXT_SECONDARY}; line-height:1.8;">'
        f'<div style="display:flex; flex-wrap:wrap; gap:28px;">'
        f'<div style="flex:1; min-width:260px;">'
        f'<strong style="color:{P.PRIMARY_LIGHT};">Authentication:</strong><br>'
        f'Password hashed with <code>bcrypt</code> (10 computational rounds).<br>'
        f'Email verified via 6-digit OTP dispatched to your inbox.'
        f'</div>'
        f'<div style="flex:1; min-width:260px;">'
        f'<strong style="color:{P.PRIMARY_LIGHT};">Data Protection:</strong><br>'
        f'All queries parameterized (SQL injection immune).<br>'
        f'User data isolated via UUID v4 foreign keys with cascading deletes.'
        f'</div>'
        f'<div style="flex:1; min-width:260px;">'
        f'<strong style="color:{P.PRIMARY_LIGHT};">Transport:</strong><br>'
        f'TLS-encrypted database connections.<br>'
        f'HTTPS-only API communication on cloud deployment.'
        f'</div>'
        f'</div>'
        f'</div>',
        unsafe_allow_html=True,
    )

    # ── Data Management ───────────────────────────────────────────────────
    st.markdown("---")
    st.markdown('<div class="section-label">DATA MANAGEMENT</div>', unsafe_allow_html=True)
    col_dl, col_signout = st.columns(2)

    with col_dl:
        try:
            sessions = get_user_sessions(current_user["id"], limit=500)
            if sessions:
                import pandas as pd
                df = pd.DataFrame(sessions)
                csv = df.to_csv(index=False).encode("utf-8")
                st.download_button(
                    label="Download All My Data (CSV)",
                    data=csv,
                    file_name=f"neurosync_data_{username}.csv",
                    mime="text/csv",
                    use_container_width=True,
                )
            else:
                st.info("No data to download yet. Start a reading to generate data.")
        except Exception:
            st.info("No data to download yet.")

    with col_signout:
        if st.button("Sign Out of Account", type="secondary", use_container_width=True, key="profile_signout"):
            for k in ["authenticated", "user", "ml_model", "ml_scaler",
                       "ml_updates", "current_session_id", "hw_reader", "pending_verification_user"]:
                if k == "hw_reader" and st.session_state.get("hw_reader"):
                    st.session_state["hw_reader"].stop()
                st.session_state.pop(k, None)
            st.rerun()


# ==============================================================================
#  FOOTER
# ==============================================================================

st.markdown(
    f'<div style="text-align:center; color:{P.TEXT_MUTED}; font-size:0.78rem; '
    f'padding:28px 0 10px 0; border-top:1px solid {P.BORDER}; margin-top:40px;">'
    f"Gita-NeuroSync v4.0 &middot; Smart India Hackathon Prototype &middot; "
    f"PostgreSQL &middot; bcrypt &middot; Multi-User &middot; Live Hardware Telemetry"
    f"</div>",
    unsafe_allow_html=True,
)
