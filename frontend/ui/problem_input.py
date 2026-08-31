"""'How are you feeling?' symptom input form."""

from __future__ import annotations

from typing import List, Tuple

import streamlit as st

SYMPTOM_OPTIONS = [
    "Racing thoughts",
    "Low energy / fatigue",
    "Irritability / anger",
    "Restlessness",
    "Sleep difficulties",
    "Difficulty concentrating",
    "Feeling hopeless",
    "Excessive worry",
    "Social withdrawal",
    "Physical tension / headache",
]


def render_problem_input() -> Tuple[str, List[str], int]:
    """
    Render the problem-input section.
    Returns (description, selected_symptoms, discomfort_level).
    """
    st.markdown(
        '<div class="section-label">HOW ARE YOU FEELING?</div>',
        unsafe_allow_html=True,
    )

    description = st.text_area(
        "Describe what you are experiencing",
        placeholder="e.g. I have been feeling very anxious about my exams, "
                    "cannot sleep well, racing thoughts at night...",
        height=90,
        key="problem_desc",
    )

    symptoms = st.multiselect(
        "Select any symptoms you are experiencing",
        SYMPTOM_OPTIONS,
        key="problem_symptoms",
    )

    discomfort = st.slider(
        "Overall discomfort level",
        min_value=1,
        max_value=5,
        value=3,
        help="1 = mild, 5 = severe",
        key="problem_discomfort",
    )

    return description, symptoms, discomfort
