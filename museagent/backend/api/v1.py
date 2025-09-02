from fastapi import APIRouter, UploadFile, File
from typing import List
import re

from ..agents import ingestion_agent as ing
from ..agents import feature_agent as feat
from ..agents import embedding_agent as emb
from ..agents import tagging_agent as tag
from ..agents import recommendation_agent as rec
from ..agents import report_agent as rep
from ..agents import spotify_agent as spot
from ..agents import generation_agent as gen
import os
import time
from ..utils.library import load_library, save_library
from ..utils.exporter import export_json, export_csv

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
async def analyze(files: List[UploadFile] = File(...), enrich: bool = False, generate: bool = False):
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
        artwork = None
        if enrich:
            try:
                meta = spot.enrich_metadata(f.filename)
                artwork = meta.get("artwork") if meta else None
            except Exception:
                artwork = None
        loop_path = None
        if generate:
            try:
                loop_path = gen.generate_loop(tags.get("mood"))
            except Exception:
                loop_path = None
        item = {
            "id": tid,
            "filename": f.filename,
            "duration_sec": dur,
            **fdict,
            "embedding_dim": len(vec),
            "tags": tags,
            "spectrogram_png": web_spec,
            "artwork": artwork,
            "loop": loop_path,
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


@router.post("/generate")
def generate(payload: dict):
    """Generate music via MusicGen if available, else synth placeholder.

    Expects JSON with: prompt, genre, mood, key, bpm, duration, creativity, seed
    Returns: { path, web_path, meta, lyrics }
    """
    prompt = str(payload.get("prompt") or "")
    genre = str(payload.get("genre") or "pop")
    mood = str(payload.get("mood") or "happy")
    key = str(payload.get("key") or "C")
    bpm = int(payload.get("bpm") or 110)
    duration = int(payload.get("duration") or 30)
    creativity = float(payload.get("creativity") or 0.5)
    seed = int(payload.get("seed") or 0)
    engine = str(payload.get("engine") or "melody")
    out = gen.generate_music(
        prompt,
        genre=genre, mood=mood, key=key,
        bpm=bpm, duration=duration, creativity=creativity, seed=seed, engine=engine,
    )
    return out


@router.get("/library")
def library(page: int = 1, per_page: int = 50):
    vals = list(TRACKS.values())
    per_page = max(1, min(200, per_page))
    page = max(1, page)
    start = (page - 1) * per_page
    end = start + per_page
    return {"tracks": vals[start:end], "page": page, "per_page": per_page, "total": len(vals)}


@router.get("/export")
def export(fmt: str = "json"):
    if fmt == "csv":
        path = export_csv(TRACKS)
    else:
        path = export_json(TRACKS)
    # Return web path if under data
    rel = os.path.relpath(path, "museagent/backend/data").replace("\\", "/")
    return {"path": f"/data/{rel}"}



@router.post("/chat")
def chat(payload: dict):
    """Lightweight rule-based music Q&A over the current library or a specific track.
    This is designed to work offline without external LLMs.
    """
    msg = str(payload.get("message") or "").strip()
    if not msg:
        return {"reply": "Ask me about tempo, key, mood, tags, or recommendations."}
    q = msg.lower()
    tid = payload.get("track_id")

    def fmt_bpm(x):
        try:
            return f"{float(x):.0f} bpm"
        except Exception:
            return str(x)

    tracks = list(TRACKS.values())
    if not tracks:
        return {"reply": "Your library is empty. Try analyzing a few tracks first."}

    # Optional focus on a single track
    t = TRACKS.get(tid) if tid else None

    # Helpers
    def avg(items):
        vals = [float(x.get("tempo_bpm", 0)) for x in items if x.get("tempo_bpm")]
        return sum(vals) / len(vals) if vals else 0.0

    def top_key(items):
        counts = {}
        for x in items:
            k = x.get("key_guess")
            if k:
                counts[k] = counts.get(k, 0) + 1
        if not counts:
            return None, 0
        k, c = max(counts.items(), key=lambda kv: kv[1])
        return k, c

    def top_moods(items, n=3):
        counts = {}
        for x in items:
            m = (x.get("tags") or {}).get("mood")
            if m:
                counts[m] = counts.get(m, 0) + 1
        return sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:n]

    # Intent detection
    if any(w in q for w in ["tempo", "bpm", "speed"]):
        if t:
            tbpm = t.get("tempo_bpm")
            conf = t.get("tempo_conf")
            return {"reply": f"'{t.get('filename')}' is around {fmt_bpm(tbpm)} (confidence {conf:.2f} if available)."}
        else:
            a = avg(tracks)
            fastest = max(tracks, key=lambda x: x.get("tempo_bpm", 0))
            slowest = min(tracks, key=lambda x: x.get("tempo_bpm", 0))
            return {"reply": f"Average tempo is {fmt_bpm(a)}. Fastest: {fastest.get('filename')} at {fmt_bpm(fastest.get('tempo_bpm'))}. Slowest: {slowest.get('filename')} at {fmt_bpm(slowest.get('tempo_bpm'))}."}

    if "key" in q:
        if t:
            k = t.get("key_guess")
            return {"reply": f"'{t.get('filename')}' appears to be in {k or 'an unknown key' }."}
        k, c = top_key(tracks)
        if not k:
            return {"reply": "I couldn't infer keys yet. Analyze a few tracks first."}
        return {"reply": f"Most common key is {k} across {c} track(s)."}

    if any(w in q for w in ["mood", "genre", "tag"]):
        if t:
            mood = (t.get("tags") or {}).get("mood")
            return {"reply": f"'{t.get('filename')}' mood tag: {mood or 'unknown'}."}
        tops = top_moods(tracks)
        if not tops:
            return {"reply": "No mood tags yet. Analyze tracks to generate tags."}
        summ = ", ".join([f"{m} ({c})" for m, c in tops])
        return {"reply": f"Top moods: {summ}."}

    if any(w in q for w in ["recommend", "similar", "nearest", "like"]):
        base = t or (tracks[0] if tracks else None)
        if not base:
            return {"reply": "No reference track available for recommendations."}
        try:
            nbrs = INDEX.topk(base.get("id"), 3)
            out = []
            for nid, d in nbrs:
                if nid == base.get("id"):
                    continue
                other = TRACKS.get(nid)
                if other:
                    out.append(f"{other.get('filename')} (d={float(d):.2f})")
            if out:
                return {"reply": f"You might like: {', '.join(out)}."}
        except Exception:
            pass
        return {"reply": "I couldn't compute recommendations yet. Try analyzing more tracks first."}

    # Fallback: simple stats
    a = avg(tracks)
    k, _ = top_key(tracks)
    moods = top_moods(tracks)
    mood_txt = ", ".join([m for m,_ in moods]) if moods else "unknown"
    return {"reply": f"Library has {len(tracks)} track(s). Avg tempo {fmt_bpm(a)}. Common key {k or 'unknown'}. Top moods: {mood_txt}. Ask about tempo, key, mood, or say 'recommend'."}

