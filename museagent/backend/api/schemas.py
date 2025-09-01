from __future__ import annotations

from pydantic import BaseModel
from typing import List, Dict, Any


class TrackFeatures(BaseModel):
    mfcc_mean: List[float]
    mfcc_std: List[float]
    chroma_mean: List[float]
    spectral_contrast: List[float]
    tonnetz: List[float]


class TrackItem(BaseModel):
    id: str
    filename: str
    duration_sec: float
    tempo_bpm: int
    tempo_conf: float
    key_guess: str
    features: TrackFeatures
    embedding_dim: int
    tags: Dict[str, Any]


