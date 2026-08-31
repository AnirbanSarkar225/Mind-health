"""Gita Remedy Card and Grounding Steps renderers."""

from __future__ import annotations

import streamlit as st

from frontend.config.palette import Palette as P
from backend.models.verses import GitaVerse


def render_remedy_card(verse: GitaVerse) -> None:
    """Render the full remedy card: Sanskrit shloka, transliteration, and translation."""
    sanskrit_formatted = verse.sanskrit.replace("\n", "<br>")
    translit_formatted = verse.transliteration.replace("\n", "<br>")

    html = (
        f'<div class="remedy-card">'
        f'<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid {P.BORDER}; padding-bottom:10px;">'
        f'<span style="color:{P.PRIMARY}; font-weight:800; font-size:1.05rem;">{verse.concept} ({verse.concept_sanskrit})</span>'
        f'<span style="background:{P.BG_SUBTLE}; border:1px solid {P.BORDER}; border-radius:12px; padding:3px 10px; color:{P.TEXT_SECONDARY}; font-size:0.80rem; font-weight:600;">Chapter {verse.chapter}, Verse {verse.verse}</span>'
        f'</div>'
        f'<div class="sanskrit-block">{sanskrit_formatted}</div>'
        f'<div class="transliteration">{translit_formatted}</div>'
        f'<div class="translation"><strong>Direct Meaning:</strong><br>{verse.translation}</div>'
        f'</div>'
    )
    st.markdown(html, unsafe_allow_html=True)


def render_grounding_steps(verse: GitaVerse) -> None:
    """Render the 3 actionable somatic grounding steps."""
    for i, step_text in enumerate(verse.grounding_steps, 1):
        html = (
            f'<div class="grounding-step">'
            f'<strong style="color:{P.PRIMARY}; margin-right:6px;">Step {i}:</strong> {step_text}'
            f'</div>'
        )
        st.markdown(html, unsafe_allow_html=True)
