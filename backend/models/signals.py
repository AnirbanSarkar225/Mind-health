"""BioSignals dataclass and EEG power derivation helper."""

from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Tuple

import numpy as np


@dataclass
class BioSignals:
    """Container for a single biosignal reading."""

    bpm: float                # beats per minute
    hrv_sdnn: float           # heart-rate variability in ms
    eeg_attention: float      # 0-100
    eeg_meditation: float     # 0-100
    alpha_power: float        # µV²  (derived / measured)
    beta_power: float         # µV²
    theta_power: float        # µV²
    beta_alpha_ratio: float

    def to_feature_vector(self, feedback_score: float = 3.0) -> np.ndarray:
        """Return the 9-dim feature vector expected by the ML classifier."""
        return np.array([[
            self.bpm,
            self.hrv_sdnn,
            self.eeg_attention,
            self.eeg_meditation,
            self.alpha_power,
            self.beta_power,
            self.theta_power,
            self.beta_alpha_ratio,
            feedback_score,
        ]])


def derive_eeg_powers(
    attention: float,
    meditation: float,
    ba_ratio: float,
) -> Tuple[float, float, float]:
    """
    Derive plausible Alpha / Beta / Theta absolute-power estimates
    from the consumer-grade eSense scores and the β/α ratio.
    """
    alpha = max(1.0, 30.0 * (meditation / 100.0) + random.gauss(0, 1.5))
    beta  = max(1.0, alpha * ba_ratio + random.gauss(0, 1.0))
    theta = max(1.0, 20.0 * (1 - attention / 100.0) + random.gauss(0, 1.5))
    return round(alpha, 1), round(beta, 1), round(theta, 1)
