from fastapi import APIRouter, UploadFile, File
from typing import List

router = APIRouter()


@router.get("/healthz")
def healthz():
    return {"ok": True}


@router.post("/analyze")
async def analyze(files: List[UploadFile] = File(...)):
    # Placeholder minimal contract for early wiring
    return {"tracks": []}


@router.get("/similar")
def similar(track_id: str, k: int = 5):
    return {"neighbors": []}


@router.post("/report")
def report(payload: dict):
    return {"pdf": "reports/placeholder.pdf"}


@router.get("/library")
def library():
    return {"tracks": []}


