from fastapi import APIRouter, UploadFile, File
from typing import List

from ..agents import ingestion_agent as ing
from ..agents import feature_agent as feat
from ..agents import embedding_agent as emb
from ..agents import tagging_agent as tag
from ..agents import recommendation_agent as rec
from ..agents import report_agent as rep
import os
import time
from ..utils.library import load_library, save_library

router = APIRouter()


@router.get("/healthz")
def healthz():
    return {"ok": True}


@router.get("/readyz")
def readyz():
    # Consider FAISS or fallback memory index readiness
    ntotal = getattr(INDEX._faiss_index, "ntotal", None) if hasattr(INDEX, "_faiss_index") else None
    vec_count = len(os.listdir(os.path.join("museagent", "backend", "embeddings", "vectors"))) if os.path.exists(os.path.join("museagent", "backend", "embeddings", "vectors")) else 0
    return {"ready": True, "faiss_ntotal": ntotal, "vectors": vec_count}


TRACKS = load_library()
INDEX = emb.EmbeddingIndex(dim=1024)
METRICS = {"requests": 0, "latency_ms": [], "analyze_count": 0}


@router.post("/analyze")
async def analyze(files: List[UploadFile] = File(...)):
    start = time.time(); METRICS["requests"] += 1
    results = []
    for f in files:
        wav_path, dur, wave_png, spec_png, tid = await ing.load_audio(f)
        fdict = feat.extract_features(wav_path)
        vec, _ = emb.embed_from_file(wav_path)
        INDEX.add(tid, vec)
        tags = tag.tag_from_features(fdict, vec)
        # Normalize spectrogram path to web path under /data
        rel_spec = os.path.relpath(spec_png, "museagent/backend/data").replace("\\", "/")
        web_spec = f"/data/{rel_spec}"
        item = {
            "id": tid,
            "filename": f.filename,
            "duration_sec": dur,
            **fdict,
            "embedding_dim": len(vec),
            "tags": tags,
            "spectrogram_png": web_spec,
        }
        TRACKS[tid] = item
        results.append(item)
    METRICS["analyze_count"] += len(results)
    METRICS["latency_ms"].append(int((time.time() - start) * 1000))
    save_library(TRACKS)
    return {"tracks": results}


def warm_start() -> None:
    try:
        INDEX.rebuild()
    except Exception:
        # Fallback to lazy behavior if rebuild fails
        pass


@router.get("/metrics")
def metrics():
    p50 = _percentile(METRICS["latency_ms"], 50)
    p90 = _percentile(METRICS["latency_ms"], 90)
    p99 = _percentile(METRICS["latency_ms"], 99)
    return {
        "requests": METRICS["requests"],
        "analyze_count": METRICS["analyze_count"],
        "latency_ms": {"p50": p50, "p90": p90, "p99": p99},
    }


def _percentile(values, p):
    if not values:
        return 0
    s = sorted(values)
    k = max(0, min(len(s) - 1, int(round((p/100.0) * (len(s)-1)))))
    return s[k]


@router.get("/similar")
def similar(track_id: str, k: int = 5):
    nbrs = INDEX.topk(track_id, k)
    a = TRACKS.get(track_id)
    if not a:
        return {"neighbors": []}
    out = [
        {
            "id": nid,
            "distance": float(d),
            "explanation": rec.rationale_for_pair(a, TRACKS.get(nid, {})),
        }
        for nid, d in nbrs
    ]
    return {"neighbors": out}


@router.post("/report")
def report(payload: dict):
    tid = payload.get("track_id")
    if not tid or tid not in TRACKS:
        return {"pdf": None}
    path = rep.build_pdf(TRACKS[tid], logo_path="assets/ma-logo.png")
    # Return a web path under /reports for the frontend
    web_path = "/reports/" + path.split("/")[-1]
    return {"pdf": web_path}


@router.get("/library")
def library():
    return {"tracks": list(TRACKS.values())}


