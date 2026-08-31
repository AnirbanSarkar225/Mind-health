"""Mental state enum and index lookups."""

from __future__ import annotations

from enum import Enum
from typing import Dict, List


class MentalState(str, Enum):
    ANXIETY     = "ACUTE ANXIETY (Visada)"
    DEPRESSION  = "DEPRESSION / LETHARGY (Tamas)"
    STRESS      = "STRESS & AGITATION (Krodha)"
    EQUILIBRIUM = "EQUILIBRIUM (Sattva)"


STATE_LABELS: List[str] = [s.value for s in MentalState]

STATE_INDEX: Dict[str, int] = {s.value: i for i, s in enumerate(MentalState)}
