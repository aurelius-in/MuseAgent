from typing import Tuple
from fastapi import UploadFile
import os
import uuid
import io
import numpy as np
import soundfile as sf
import librosa
import matplotlib.pyplot as plt


def _ensure_dirs() -> str:
    root = "museagent/backend/data/cache"
    os.makedirs(root, exist_ok=True)
    return root


def _save_wave_png(y: np.ndarray, sr: int, out_png: str) -> None:
    plt.figure(figsize=(8, 2), dpi=150)
    plt.plot(np.linspace(0, len(y) / sr, num=len(y)), y, color="#F2D460")
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(out_png, bbox_inches="tight", pad_inches=0)
    plt.close()


def _save_spec_png(y: np.ndarray, sr: int, out_png: str) -> None:
    S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=96)
    Sdb = librosa.power_to_db(S, ref=np.max)
    plt.figure(figsize=(6, 3), dpi=150)
    plt.imshow(Sdb, aspect="auto", origin="lower", cmap="magma")
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(out_png, bbox_inches="tight", pad_inches=0)
    plt.close()


async def load_audio(file: UploadFile, target_sr: int = 16000) -> Tuple[str, float]:
    """Decode, resample to mono target_sr, trim silence, normalize, and cache WAV+PNGs.

    Returns
    -------
    (normalized_wav_path, duration_sec)
    """
    cache_root = _ensure_dirs()
    raw_bytes = await file.read()
    original_name = file.filename or "upload.wav"
    track_id = str(uuid.uuid4())
    base = os.path.splitext(os.path.basename(original_name))[0]
    base = f"{track_id}_{base}"
    raw_path = os.path.join(cache_root, f"{base}_orig")
    with open(raw_path, "wb") as f:
        f.write(raw_bytes)

    # Decode via librosa (robust across formats)
    with io.BytesIO(raw_bytes) as bio:
        y, sr = librosa.load(bio, sr=target_sr, mono=True)

    # Trim leading/trailing silence
    y, _ = librosa.effects.trim(y, top_db=30)
    if y.size == 0:
        y = np.zeros(target_sr, dtype=np.float32)

    # Peak normalize to -1..1 with headroom
    peak = np.max(np.abs(y)) + 1e-9
    y = 0.99 * (y / peak)

    duration_sec = float(len(y) / target_sr)

    # Persist normalized wav
    wav_path = os.path.join(cache_root, f"{base}.wav")
    sf.write(wav_path, y, target_sr, subtype="PCM_16")

    # Save thumbnails (waveform & spectrogram)
    wave_png = os.path.join(cache_root, f"{base}-wave.png")
    spec_png = os.path.join(cache_root, f"{base}-spec.png")
    _save_wave_png(y, target_sr, wave_png)
    _save_spec_png(y, target_sr, spec_png)

    return wav_path, duration_sec


