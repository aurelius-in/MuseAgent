from typing import Tuple
from fastapi import UploadFile


async def load_audio(file: UploadFile, target_sr: int = 16000) -> Tuple[str, float]:
    """Stub ingestion: save path placeholder and duration.

    Returns
    -------
    (normalized_wav_path, duration_sec)
    """
    # In a future edit, decode, resample, trim silence, normalize, and cache
    # For now, just return a placeholder path derived from filename
    normalized_path = f"data/cache/{file.filename}.wav"
    duration_sec = 0.0
    return normalized_path, duration_sec


