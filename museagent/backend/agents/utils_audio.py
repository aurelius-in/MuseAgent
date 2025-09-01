from __future__ import annotations

import numpy as np


_KRUMHANSL_MAJOR = np.array(
    [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], dtype=np.float32
)
_KRUMHANSL_MINOR = np.array(
    [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17], dtype=np.float32
)
_PITCH_CLASS_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def _roll_array(a: np.ndarray, k: int) -> np.ndarray:
    return np.concatenate([a[-k:], a[:-k]]) if k else a


def estimate_key_from_chroma(chroma: np.ndarray) -> str:
    """Estimate key using correlation of average chroma with major/minor templates.

    Returns labels like 'C', 'Gm'.
    """
    if chroma.size == 0:
        return "C"
    v = np.mean(chroma, axis=1)
    v = v / (np.linalg.norm(v) + 1e-9)
    best_key = "C"
    best_score = -1e9
    for i in range(12):
        maj = np.dot(v, _roll_array(_KRUMHANSL_MAJOR, i))
        min_ = np.dot(v, _roll_array(_KRUMHANSL_MINOR, i))
        if maj >= min_:
            if maj > best_score:
                best_score = maj
                best_key = _PITCH_CLASS_NAMES[i]
        else:
            if min_ > best_score:
                best_score = min_
                best_key = _PITCH_CLASS_NAMES[i] + "m"
    return best_key


