"""Pre-set clinical simulation profiles for Demo mode."""

from typing import Dict

DEMO_PROFILES: Dict[str, Dict[str, float]] = {
    "No Reading (Idle)": dict(
        bpm=0, hrv=0, attention=0, meditation=0,
        alpha=0, beta=0, theta=0, ba_ratio=0,
    ),
    "Anxiety Profile": dict(
        bpm=108, hrv=28, attention=85, meditation=15,
        alpha=8, beta=28, theta=6, ba_ratio=3.2,
    ),
    "Depression Profile": dict(
        bpm=54, hrv=18, attention=25, meditation=22,
        alpha=20, beta=10, theta=30, ba_ratio=0.5,
    ),
    "Stress / Agitation Profile": dict(
        bpm=92, hrv=35, attention=72, meditation=18,
        alpha=14, beta=24, theta=10, ba_ratio=1.7,
    ),
    "Equilibrium Profile": dict(
        bpm=68, hrv=62, attention=55, meditation=74,
        alpha=25, beta=12, theta=14, ba_ratio=0.5,
    ),
}
