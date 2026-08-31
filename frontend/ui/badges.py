"""State badge and ML confidence-bar HTML renderers."""

from __future__ import annotations

import numpy as np

from frontend.config.palette import Palette as P
from backend.models.states import MentalState


_BADGE = {
    MentalState.ANXIETY:     {"bg": P.RED_SOFT,   "fg": "#fff"},
    MentalState.DEPRESSION:  {"bg": P.BLUE_SOFT,  "fg": "#fff"},
    MentalState.STRESS:      {"bg": P.AMBER_SOFT, "fg": "#fff"},
    MentalState.EQUILIBRIUM: {"bg": P.GREEN_SOFT, "fg": "#fff"},
}


def badge_html(
    state: MentalState,
    method: str,
    confidence: float,
) -> str:
    b = _BADGE[state]
    conf_pct = f"{confidence * 100:.0f}%"
    return (
        f'<div style="text-align:center; padding:16px 20px; border-radius:16px; '
        f'background:{b["bg"]}; color:{b["fg"]}; '
        f'box-shadow: {P.SHADOW_MD}; '
        f'font-weight:700; font-size:1.2rem; margin:6px 0; letter-spacing:0.5px;">'
        f'{state.value}'
        f'</div>'
        f'<div style="text-align:center; margin-top:8px; font-size:0.85rem; color:{P.TEXT_SECONDARY}; font-weight:600;">'
        f'{method} &middot; Confidence: <strong style="color:{P.PRIMARY};">{conf_pct}</strong>'
        f'</div>'
    )


_BAR_COLORS = [P.RED_SOFT, P.BLUE_SOFT, P.AMBER_SOFT, P.GREEN_SOFT]
_SHORT_NAMES = ["Anxiety", "Depression", "Stress", "Equilibrium"]


def confidence_bars_html(proba: np.ndarray) -> str:
    html = ""
    for i, (label, col) in enumerate(zip(_SHORT_NAMES, _BAR_COLORS)):
        pct = proba[i] * 100
        html += (
            f'<div style="margin:8px 0;">'
            f'<div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:600; color:{P.TEXT_SECONDARY}; margin-bottom:4px;">'
            f'<span>{label}</span><span style="font-weight:700; color:{P.TEXT_PRIMARY};">{pct:.1f}%</span>'
            f'</div>'
            f'<div style="background:{P.BG_SUBTLE}; border-radius:8px; height:8px; overflow:hidden;">'
            f'<div style="width:{pct:.1f}%; height:100%; border-radius:8px; background:{col}; transition: width 0.5s ease;"></div>'
            f'</div>'
            f'</div>'
        )
    return f'<div style="padding:4px 0;">{html}</div>'
