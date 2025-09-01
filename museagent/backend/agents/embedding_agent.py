from __future__ import annotations

from typing import Dict, List, Tuple
import os
import json
import uuid
import hashlib
import numpy as np

try:
    import faiss  # type: ignore
except Exception:  # pragma: no cover - runtime optional
    faiss = None  # type: ignore


class EmbeddingIndex:
    """FAISS-backed index with graceful fallback and on-disk persistence.

    - Stores vectors per-track under embeddings/vectors/<track_id>.npy
    - Maintains FAISS index at embeddings/index.faiss when faiss is available
    - Persists id mapping in embeddings/ids.json
    """

    def __init__(self, dim: int = 1024, storage_dir: str = "museagent/backend/embeddings") -> None:
        self.dim = dim
        self.storage_dir = storage_dir
        self.vectors_dir = os.path.join(storage_dir, "vectors")
        self.index_path = os.path.join(storage_dir, "index.faiss")
        self.ids_path = os.path.join(storage_dir, "ids.json")
        os.makedirs(self.vectors_dir, exist_ok=True)

        self.id_to_int: Dict[str, int] = {}
        self.int_to_id: Dict[int, str] = {}
        self._vectors_mem: Dict[str, np.ndarray] = {}

        self.use_faiss = faiss is not None
        self._faiss_index = None
        if self.use_faiss:
            self._faiss_index = faiss.IndexFlatIP(self.dim)

        self._load_state()

    # ----------------------- Public API -----------------------
    def add(self, track_id: str, vec: np.ndarray) -> None:
        vec = vec.astype(np.float32)
        # Persist vector per track
        np.save(os.path.join(self.vectors_dir, f"{track_id}.npy"), vec)

        self._vectors_mem[track_id] = vec
        if track_id not in self.id_to_int:
            new_int = len(self.id_to_int)
            self.id_to_int[track_id] = new_int
            self.int_to_id[new_int] = track_id

        if self.use_faiss and self._faiss_index is not None:
            v = vec / (np.linalg.norm(vec) + 1e-9)
            self._faiss_index.add(v.reshape(1, -1))

        self._save_state()

    def topk(self, track_id: str, k: int = 5) -> List[Tuple[str, float]]:
        if track_id not in self._vectors_mem:
            # Attempt to load from disk lazily
            path = os.path.join(self.vectors_dir, f"{track_id}.npy")
            if os.path.exists(path):
                self._vectors_mem[track_id] = np.load(path).astype(np.float32)
            else:
                return []

        query = self._vectors_mem[track_id]
        q = query / (np.linalg.norm(query) + 1e-9)

        if self.use_faiss and self._faiss_index is not None and self._faiss_index.ntotal > 0:
            D, I = self._faiss_index.search(q.reshape(1, -1), min(k + 1, self._faiss_index.ntotal))
            results: List[Tuple[str, float]] = []
            for idx, dist in zip(I[0].tolist(), D[0].tolist()):
                if idx < 0:
                    continue
                tid = self.int_to_id.get(idx)
                if not tid or tid == track_id:
                    continue
                results.append((tid, float(1.0 - dist)))  # dist ~ 1 - cosine_sim
                if len(results) >= k:
                    break
            return results

        # Fallback: cosine over memory/disk
        out: List[Tuple[str, float]] = []
        for tid in self._list_all_track_ids():
            if tid == track_id:
                continue
            v = self._get_vec(tid)
            num = float(np.dot(q, v) / (np.linalg.norm(v) + 1e-9))
            sim = num
            dist = 1.0 - sim
            out.append((tid, dist))
        out.sort(key=lambda x: x[1])
        return out[:k]

    def rebuild(self) -> None:
        self.id_to_int.clear()
        self.int_to_id.clear()
        self._vectors_mem.clear()
        if self.use_faiss and self._faiss_index is not None:
            self._faiss_index.reset()

        # Load all vectors from disk
        track_ids = self._list_all_track_ids()
        for i, tid in enumerate(track_ids):
            vec = self._get_vec(tid)
            self._vectors_mem[tid] = vec
            self.id_to_int[tid] = i
            self.int_to_id[i] = tid
            if self.use_faiss and self._faiss_index is not None:
                v = vec / (np.linalg.norm(vec) + 1e-9)
                self._faiss_index.add(v.reshape(1, -1))
        self._save_state()

    # ----------------------- Internal ------------------------
    def _list_all_track_ids(self) -> List[str]:
        ids = []
        for name in os.listdir(self.vectors_dir):
            if name.endswith('.npy'):
                ids.append(os.path.splitext(name)[0])
        return ids

    def _get_vec(self, tid: str) -> np.ndarray:
        if tid in self._vectors_mem:
            return self._vectors_mem[tid]
        path = os.path.join(self.vectors_dir, f"{tid}.npy")
        v = np.load(path).astype(np.float32)
        return v

    def _load_state(self) -> None:
        # Load ids
        if os.path.exists(self.ids_path):
            try:
                with open(self.ids_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.id_to_int = {k: int(v) for k, v in data.get('id_to_int', {}).items()}
                    self.int_to_id = {int(k): v for k, v in data.get('int_to_id', {}).items()}
            except Exception:
                self.id_to_int = {}
                self.int_to_id = {}

        # Warm memory for listed ids (lazy load vectors until needed)
        for tid in self._list_all_track_ids():
            self._vectors_mem.setdefault(tid, None)  # type: ignore

        # Load FAISS index if present
        if self.use_faiss and self._faiss_index is not None and os.path.exists(self.index_path):
            try:
                self._faiss_index = faiss.read_index(self.index_path)
            except Exception:
                # Rebuild if corrupted
                self.rebuild()

    def _save_state(self) -> None:
        # Save ids mapping
        try:
            with open(self.ids_path, 'w', encoding='utf-8') as f:
                json.dump({
                    'id_to_int': self.id_to_int,
                    'int_to_id': self.int_to_id,
                }, f)
        except Exception:
            pass

        # Save FAISS index
        if self.use_faiss and self._faiss_index is not None:
            try:
                faiss.write_index(self._faiss_index, self.index_path)
            except Exception:
                pass


def embed_from_file(wav_path: str, dim: int = 1024) -> Tuple[np.ndarray, str]:
    """Deterministic lightweight embedding: RNG seeded by path string.

    Returns (vector, track_id)
    """
    seed = int(hashlib.md5(wav_path.encode('utf-8')).hexdigest()[:8], 16)
    rng = np.random.RandomState(seed)
    vec = rng.randn(dim).astype(np.float32)
    vec = vec / (np.linalg.norm(vec) + 1e-9)
    track_id = str(uuid.uuid4())
    return vec, track_id


