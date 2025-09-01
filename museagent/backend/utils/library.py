from __future__ import annotations

import json
import os
from typing import Dict, Any


LIB_PATH = "museagent/backend/data/library.json"


def load_library() -> Dict[str, Any]:
    if not os.path.exists(LIB_PATH):
        return {}
    try:
        with open(LIB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict):
                return data
    except Exception:
        pass
    return {}


def save_library(tracks: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(LIB_PATH), exist_ok=True)
    try:
        with open(LIB_PATH, "w", encoding="utf-8") as f:
            json.dump(tracks, f)
    except Exception:
        pass


