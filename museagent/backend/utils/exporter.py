from __future__ import annotations

import csv
import json
import os
from typing import Dict, Any


EXPORT_DIR = "museagent/backend/data/export"


def ensure_export_dir() -> str:
    os.makedirs(EXPORT_DIR, exist_ok=True)
    return EXPORT_DIR


def export_json(tracks: Dict[str, Any]) -> str:
    ensure_export_dir()
    out_path = os.path.join(EXPORT_DIR, "library.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"tracks": list(tracks.values())}, f)
    return out_path


def export_csv(tracks: Dict[str, Any]) -> str:
    ensure_export_dir()
    out_path = os.path.join(EXPORT_DIR, "library.csv")
    fields = [
        "id",
        "filename",
        "duration_sec",
        "tempo_bpm",
        "tempo_conf",
        "key_guess",
        "embedding_dim",
    ]
    with open(out_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for t in tracks.values():
            row = {k: t.get(k) for k in fields}
            writer.writerow(row)
    return out_path


