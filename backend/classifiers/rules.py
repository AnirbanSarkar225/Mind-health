"""Deterministic rule-based mental-state classifier (fallback engine)."""

from backend.models.signals import BioSignals
from backend.models.states import MentalState


def classify_rule_based(sig: BioSignals) -> MentalState:
    """
    Threshold classifier per the SIH clinical specification.

    Priority order ensures deterministic output:
      1. ACUTE ANXIETY — BPM > 95 OR β/α > 2.0
      2. DEPRESSION    — BPM < 60 AND Meditation < 35
      3. STRESS        — Meditation < 30 AND BPM > 85
      4. EQUILIBRIUM   — default
    """
    if sig.bpm > 95 or sig.beta_alpha_ratio > 2.0:
        return MentalState.ANXIETY
    if sig.bpm < 60 and sig.eeg_meditation < 35:
        return MentalState.DEPRESSION
    if sig.eeg_meditation < 30 and sig.bpm > 85:
        return MentalState.STRESS
    return MentalState.EQUILIBRIUM
