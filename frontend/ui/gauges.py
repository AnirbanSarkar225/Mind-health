"""Plotly radial-gauge builders for biosignal telemetry."""

from __future__ import annotations

from typing import List, Tuple

import plotly.graph_objects as go

from frontend.config.palette import Palette as P


def _gauge(
    value: float,
    title: str,
    lo: float,
    hi: float,
    steps: List[Tuple[float, str]],
    suffix: str = "",
    height: int = 170,
) -> go.Figure:
    """Generic factory for a compact radial gauge."""
    gauge_steps = []
    prev = lo
    for lim, col in steps:
        gauge_steps.append({"range": [prev, lim], "color": col})
        prev = lim

    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=value,
        number={"suffix": suffix,
            "font": {"size": 22, "color": P.TEXT_PRIMARY}},
        title={"text": title,
            "font": {"size": 11, "color": P.TEXT_SECONDARY}},
        gauge={
            "axis": {"range": [lo, hi],
                     "tickfont": {"size": 9, "color": P.TEXT_MUTED}},
            "bar":       {"color": P.PRIMARY, "thickness": 0.25},
            "bgcolor":   P.BG_SUBTLE,
            "borderwidth": 0,
            "bordercolor": "transparent",
            "steps": gauge_steps,
            "threshold": {
                "line": {"color": P.TEXT_PRIMARY, "width": 2},
                "thickness": 0.7,
                "value": value,
            },
        },
    ))
    fig.update_layout(
        height=height,
        margin={"t": 36, "b": 5, "l": 20, "r": 20},
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    return fig


def gauge_bpm(v: float) -> go.Figure:
    return _gauge(v, "Heart Rate", 40, 150, [
        (60, P.SAGE_LIGHT), (80, P.BG_SUBTLE),
        (100, P.PASTEL_PEACH), (150, P.PASTEL_PINK),
    ], " bpm")


def gauge_hrv(v: float) -> go.Figure:
    return _gauge(v, "HRV SDNN", 0, 120, [
        (20, P.PASTEL_PINK),  (40, P.PASTEL_PEACH),
        (70, P.BG_SUBTLE),    (120, P.SAGE_LIGHT),
    ], " ms")


def gauge_attention(v: float) -> go.Figure:
    return _gauge(v, "EEG Attention", 0, 100, [
        (30, P.PASTEL_PEACH), (60, P.BG_SUBTLE), (100, P.SAGE_LIGHT),
    ])


def gauge_meditation(v: float) -> go.Figure:
    return _gauge(v, "EEG Meditation", 0, 100, [
        (30, P.PASTEL_PEACH), (60, P.BG_SUBTLE), (100, P.SAGE_LIGHT),
    ])


def gauge_beta_alpha(v: float) -> go.Figure:
    return _gauge(v, "Beta/Alpha Ratio", 0, 4, [
        (1.0, P.SAGE_LIGHT), (2.0, P.BG_SUBTLE),
        (3.0, P.PASTEL_PEACH),(4.0, P.PASTEL_PINK),
    ])
