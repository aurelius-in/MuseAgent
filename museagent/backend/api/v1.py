from fastapi import APIRouter, UploadFile, File
from typing import List

from ..agents import ingestion_agent as ing
from ..agents import feature_agent as feat
from ..agents import embedding_agent as emb
from ..agents import tagging_agent as tag
from ..agents import recommendation_agent as rec
from ..agents import report_agent as rep

router = APIRouter()


@router.get("/healthz")
def healthz():
    return {"ok": True}


TRACKS = {}
INDEX = emb.EmbeddingIndex(dim=1024)


@router.post("/analyze")
async def analyze(files: List[UploadFile] = File(...)):
    results = []
    for f in files:
        wav_path, dur = await ing.load_audio(f)
        fdict = feat.extract_features(wav_path)
        vec, tid = emb.embed_from_file(wav_path)
        INDEX.add(tid, vec)
        tags = tag.tag_from_features(fdict, vec)
        item = {
            "id": tid,
            "filename": f.filename,
            "duration_sec": dur,
            **fdict,
            "embedding_dim": len(vec),
            "tags": tags,
        }
        TRACKS[tid] = item
        results.append(item)
    return {"tracks": results}


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
    return {"pdf": path}


@router.get("/library")
def library():
    return {"tracks": list(TRACKS.values())}


