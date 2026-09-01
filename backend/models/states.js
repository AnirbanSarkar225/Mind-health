/**
 * Mental state enum and index lookups.
 * Port of backend/models/states.py
 */

export const MentalState = {
  ANXIETY: 'ACUTE ANXIETY (Visada)',
  DEPRESSION: 'DEPRESSION / LETHARGY (Tamas)',
  STRESS: 'STRESS & AGITATION (Krodha)',
  EQUILIBRIUM: 'EQUILIBRIUM (Sattva)',
};

export const STATE_LABELS = Object.values(MentalState);

export const STATE_INDEX = {};
STATE_LABELS.forEach((label, i) => {
  STATE_INDEX[label] = i;
});

export const STATE_KEYS = Object.keys(MentalState);
