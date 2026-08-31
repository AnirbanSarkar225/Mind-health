"""
Online ML classifier — SGDClassifier with StandardScaler.

Provides:
  - Bootstrap synthetic data generation for warm-start.
  - `init_ml_model()` to create and pre-train the model.
  - `classify_ml()` for inference with confidence.
  - `online_update()` for real-time `partial_fit` from user feedback.
"""

from __future__ import annotations

from typing import Tuple

import numpy as np
from sklearn.linear_model import SGDClassifier
from sklearn.preprocessing import StandardScaler

from backend.models.signals import BioSignals
from backend.models.states import MentalState, STATE_INDEX

# Confidence threshold below which the app falls back to rule-based logic.
ML_CONFIDENCE_THRESHOLD = 0.65


# ──────────────────────────────────────────────────────────────────────────────
# Bootstrap data
# ──────────────────────────────────────────────────────────────────────────────

def _generate_bootstrap_data(
    n_per_class: int = 60,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Synthetic labelled data to warm-start the model.
    Feature order: [bpm, hrv, att, med, alpha, beta, theta, ba, feedback].
    """
    rng = np.random.RandomState(42)

    class_params = {
        MentalState.ANXIETY: {
            "mean": [105, 25, 80, 18,  9, 28,  7, 3.0, 4.5],
            "std":  [ 12,  8, 10,  8,  3,  6,  3, 0.6, 0.5],
        },
        MentalState.DEPRESSION: {
            "mean": [ 54, 18, 28, 24, 20, 10, 28, 0.5, 4.0],
            "std":  [  6,  6, 10,  8,  5,  4,  6, 0.3, 0.7],
        },
        MentalState.STRESS: {
            "mean": [ 90, 32, 70, 20, 14, 24, 12, 1.8, 3.8],
            "std":  [  8,  8, 12,  8,  4,  5,  4, 0.4, 0.6],
        },
        MentalState.EQUILIBRIUM: {
            "mean": [ 68, 58, 52, 72, 24, 12, 14, 0.5, 1.5],
            "std":  [  8, 12, 12, 10,  5,  4,  5, 0.2, 0.5],
        },
    }

    X_parts, y_parts = [], []
    for state, params in class_params.items():
        X_cls = rng.normal(params["mean"], params["std"],
                           size=(n_per_class, 9))
        X_cls = np.clip(X_cls, 0, None)
        y_cls = np.full(n_per_class, STATE_INDEX[state.value])
        X_parts.append(X_cls)
        y_parts.append(y_cls)

    X = np.vstack(X_parts)
    y = np.concatenate(y_parts)
    idx = rng.permutation(len(y))
    return X[idx], y[idx]


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def init_ml_model() -> Tuple[SGDClassifier, StandardScaler]:
    """Create, warm-start, and return *(model, scaler)*."""
    scaler = StandardScaler()
    model = SGDClassifier(
        loss="log_loss",
        penalty="l2",
        alpha=1e-4,
        max_iter=1,
        warm_start=True,
        random_state=42,
    )

    X_boot, y_boot = _generate_bootstrap_data(n_per_class=60)
    X_scaled = scaler.fit_transform(X_boot)

    classes = np.arange(len(MentalState))
    for _ in range(15):
        model.partial_fit(X_scaled, y_boot, classes=classes)

    return model, scaler


def classify_ml(
    model: SGDClassifier,
    scaler: StandardScaler,
    sig: BioSignals,
    feedback_score: float = 3.0,
) -> Tuple[MentalState, float, np.ndarray]:
    """
    Returns *(predicted_state, confidence, class_probabilities)*.
    """
    X = sig.to_feature_vector(feedback_score)
    X_scaled = scaler.transform(X)
    proba = model.predict_proba(X_scaled)[0]
    pred_idx = int(np.argmax(proba))
    confidence = float(proba[pred_idx])
    state = list(MentalState)[pred_idx]
    return state, confidence, proba


def online_update(
    model: SGDClassifier,
    scaler: StandardScaler,
    sig: BioSignals,
    true_state: MentalState,
    feedback_score: float,
) -> None:
    """Execute `partial_fit` with the user-confirmed label."""
    X = sig.to_feature_vector(feedback_score)
    X_scaled = scaler.transform(X)
    y = np.array([STATE_INDEX[true_state.value]])
    classes = np.arange(len(MentalState))
    model.partial_fit(X_scaled, y, classes=classes)
