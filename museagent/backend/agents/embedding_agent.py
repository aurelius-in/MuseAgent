from __future__ import annotations

from typing import Dict, List, Tuple
import uuid
import numpy as np


class EmbeddingIndex:
    """In-memory placeholder index; replace with FAISS in real implementation."""

    def __init__(self, dim: int = 1024) -> None:
        self.dim = dim
        self._vectors: Dict[str, np.ndarray] = {}

    def add(self, track_id: str, vec: np.ndarray) -> None:
        self._vectors[track_id] = vec.astype(np.float32)

    def topk(self, track_id: str, k: int = 5) -> List[Tuple[str, float]]:
        if track_id not in self._vectors:
            return []
        query = self._vectors[track_id]
        # Simple cosine distance over in-memory vectors
        out: List[Tuple[str, float]] = []
        for tid, v in self._vectors.items():
            if tid == track_id:
                continue
            num = float(np.dot(query, v))
            den = float(np.linalg.norm(query) * np.linalg.norm(v) + 1e-8)
            sim = num / den if den else 0.0
            dist = 1.0 - sim
            out.append((tid, dist))
        out.sort(key=lambda x: x[1])
        return out[:k]


def embed_from_file(wav_path: str) -> Tuple[np.ndarray, str]:
    """Return a zero vector and a generated track id as a placeholder."""
    vector = np.zeros(1024, dtype=np.float32)
    track_id = str(uuid.uuid4())
    return vector, track_id


