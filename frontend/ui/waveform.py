"""Live telemetry waveform chart with rolling history buffer."""

from __future__ import annotations

from collections import deque
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st

from frontend.config.palette import Palette as P
from backend.models.signals import BioSignals

MAX_HISTORY = 40


def push_history(sig: BioSignals) -> None:
    """Append current biosignal snapshot to the rolling session buffer."""
    buf_t = st.session_state.setdefault("hist_t", deque(maxlen=MAX_HISTORY))

    # If buffer is empty or new, seed with baseline rolling history
    if len(buf_t) == 0:
        for i in range(12):
            # Seed 12 points with slight physiological micro-variations
            np.random.seed(i)
            noise_bpm = float(np.random.uniform(-1.5, 1.5))
            noise_att = float(np.random.uniform(-2.0, 2.0))
            noise_med = float(np.random.uniform(-2.0, 2.0))
            noise_ba  = float(np.random.uniform(-0.05, 0.05))

            st.session_state.setdefault("hist_bpm", deque(maxlen=MAX_HISTORY)).append(max(40.0, sig.bpm + noise_bpm))
            st.session_state.setdefault("hist_hrv", deque(maxlen=MAX_HISTORY)).append(max(5.0, sig.hrv_sdnn))
            st.session_state.setdefault("hist_att", deque(maxlen=MAX_HISTORY)).append(max(0.0, min(100.0, sig.eeg_attention + noise_att)))
            st.session_state.setdefault("hist_med", deque(maxlen=MAX_HISTORY)).append(max(0.0, min(100.0, sig.eeg_meditation + noise_med)))
            st.session_state.setdefault("hist_ba",  deque(maxlen=MAX_HISTORY)).append(max(0.1, sig.beta_alpha_ratio + noise_ba))
            buf_t.append(i)

    # Append current snapshot
    for key, val in [
        ("bpm", sig.bpm),
        ("hrv", sig.hrv_sdnn),
        ("att", sig.eeg_attention),
        ("med", sig.eeg_meditation),
        ("ba",  sig.beta_alpha_ratio),
    ]:
        buf_key = f"hist_{key}"
        st.session_state.setdefault(buf_key, deque(maxlen=MAX_HISTORY))
        st.session_state[buf_key].append(val)

    buf_t.append(len(buf_t))


def render_waveform() -> go.Figure:
    """Multi-trace telemetry waveform (BPM + Attention + Meditation | Beta/Alpha)."""
    t = list(st.session_state.get("hist_t", []))

    # If t is too short, provide a clean fallback
    if len(t) < 2:
        t = list(range(len(st.session_state.get("hist_bpm", [72]))))

    traces = [
        ("bpm", "Heart Rate (BPM)", P.RED_SOFT),
        ("att", "EEG Attention",    P.PRIMARY_LIGHT),
        ("med", "EEG Meditation",   P.SAGE),
    ]

    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.10,
        row_heights=[0.62, 0.38],
        subplot_titles=("Cardio & EEG Telemetry (BPM / Attention / Meditation)", "Beta/Alpha Spectral Ratio"),
    )

    for key, name, color in traces:
        y = list(st.session_state.get(f"hist_{key}", [70]))
        if len(y) < len(t):
            y = y + [y[-1]] * (len(t) - len(y))
        fig.add_trace(go.Scatter(
            x=t[-len(y):], y=y, mode="lines", name=name,
            line={"color": color, "width": 2.2, "shape": "spline"},
        ), row=1, col=1)

    y_ba = list(st.session_state.get("hist_ba", [1.0]))
    if len(y_ba) < len(t):
        y_ba = y_ba + [y_ba[-1]] * (len(t) - len(y_ba))

    fig.add_trace(go.Scatter(
        x=t[-len(y_ba):], y=y_ba, mode="lines+markers", name="Beta/Alpha Ratio",
        line={"color": P.ACCENT, "width": 2, "shape": "spline"},
        marker={"size": 4, "color": P.ACCENT},
    ), row=2, col=1)

    fig.update_layout(
        height=260,
        margin={"t": 28, "b": 10, "l": 40, "r": 15},
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="#1B1B2D",
        legend={
            "orientation": "h", "yanchor": "bottom", "y": 1.02, "x": 0.5, "xanchor": "center",
            "font": {"size": 10, "color": P.TEXT_SECONDARY},
        },
        font={"color": P.TEXT_PRIMARY, "family": "Inter, sans-serif"},
    )

    # Style subplot title annotations
    for annotation in fig['layout']['annotations']:
        annotation['font'] = dict(size=10, color=P.TEXT_SECONDARY)

    fig.update_xaxes(
        showgrid=True, gridcolor="#2A2A42", gridwidth=0.5,
        zeroline=False, showticklabels=False,
    )
    fig.update_yaxes(
        gridcolor="#2A2A42", gridwidth=0.5,
        zeroline=False, tickfont={"size": 9, "color": P.TEXT_SECONDARY},
    )
    return fig
