"""Compact vertical remedy pathway + grounding steps as one unified card."""

from __future__ import annotations

import streamlit as st

from frontend.config.palette import Palette as P
from backend.models.states import MentalState
from backend.models.verses import GITA_VERSES, GitaVerse

_STATE_BG = {
    MentalState.ANXIETY:     P.RED_SOFT,
    MentalState.DEPRESSION:  P.BLUE_SOFT,
    MentalState.STRESS:      P.AMBER_SOFT,
    MentalState.EQUILIBRIUM: P.GREEN_SOFT,
}


def render_pathway_and_steps(state: MentalState) -> None:
    """Render the pathway trajectory + grounding steps as one unified card."""
    verse = GITA_VERSES[state]
    bg = _STATE_BG[state]

    steps_html = ""
    for i, step_text in enumerate(verse.grounding_steps, 1):
        steps_html += (
            f'<div style="background:{P.BG_PRIMARY}; border:1px solid {P.BORDER}; '
            f'border-radius:12px; '
            f'padding:14px 18px; margin:8px 0; font-size:0.95rem; line-height:1.5; '
            f'color:{P.TEXT_PRIMARY}; display:flex; align-items:center; gap:12px;">'
            f'<span style="color:{P.PRIMARY}; font-size:1.5rem; line-height:1;">&bull;</span>'
            f'<span><strong style="color:{P.PRIMARY}; margin-right:4px;">Step {i}:</strong> {step_text}</span>'
            f'</div>'
        )

    html = (
        f'<div style="background:{P.BG_CARD}; border:1px solid {P.BORDER}; '
        f'border-radius:24px; padding:32px; text-align:center; box-shadow:{P.SHADOW_MD};">'
        # Trajectory header
        f'<div style="font-size:0.8rem; font-weight:700; color:{P.PRIMARY}; '
        f'text-transform:uppercase; letter-spacing:1.5px; margin-bottom:12px;">'
        f'Remediation Trajectory</div>'
        # State badge -> concept -> verse (inline compact flow)
        f'<div style="display:inline-block; background:{bg}; color:#FFFFFF; '
        f'padding:6px 16px; border-radius:50px; font-weight:700; font-size:0.9rem;">'
        f'{state.value}</div>'
        f'<div style="color:{P.PRIMARY}; font-size:1.1rem; margin:6px 0;">&#8595;</div>'
        f'<div style="background:{P.SAGE_BG}; border:1px solid {P.SAGE}; border-radius:16px; '
        f'padding:10px 18px; margin:0 auto; max-width:280px; display:inline-block;">'
        f'<span style="font-weight:700; color:{P.TEXT_PRIMARY}; font-size:0.95rem;">{verse.concept}</span>'
        f' <span style="color:{P.TEXT_SECONDARY}; font-size:0.85rem;">({verse.concept_sanskrit})</span>'
        f'</div>'
        f'<div style="color:{P.PRIMARY}; font-size:1.1rem; margin:6px 0;">&#8595;</div>'
        f'<div style="display:inline-block; background:{P.BG_SUBTLE}; border:1px solid {P.BORDER}; '
        f'border-radius:12px; padding:6px 16px;">'
        f'<span style="font-weight:700; color:{P.PRIMARY}; font-size:0.85rem;">'
        f'Ch. {verse.chapter}, V. {verse.verse}</span>'
        f'</div>'
        # Divider
        f'<div style="border-top:1px solid {P.BORDER}; margin:24px 0;"></div>'
        # Section label
        f'<div style="font-size:0.8rem; font-weight:700; color:{P.PRIMARY}; '
        f'text-transform:uppercase; letter-spacing:1.5px; margin-bottom:12px; text-align:left;">'
        f'Somatic Grounding Steps</div>'
        # Steps
        f'<div style="text-align:left;">{steps_html}</div>'
        f'</div>'
    )
    st.markdown(html, unsafe_allow_html=True)
