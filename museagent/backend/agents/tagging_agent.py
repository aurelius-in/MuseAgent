from typing import Dict, Any
import numpy as np


def tag_from_features(features: Dict[str, Any], embedding: np.ndarray) -> Dict[str, Any]:
    """Simple rule-based tags using tempo and key.

    - tempo > 125 → energetic; < 90 → calm; else → moderate
    - minor key (endswith 'm') → moody
    """
    tempo = int(features.get("tempo_bpm", 0))
    key = str(features.get("key_guess", ""))
    if tempo > 125:
        mood = "energetic"
    elif tempo < 90:
        mood = "calm"
    else:
        mood = "moderate"
    if key.endswith("m"):
        mood = "moody" if mood != "energetic" else mood
    return {"mood": mood, "genre": "unknown", "instrumentation": ["unknown"]}


