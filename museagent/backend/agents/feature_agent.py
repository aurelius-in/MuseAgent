from typing import Dict, List
import numpy as np
import librosa

from .utils_audio import estimate_key_from_chroma


def extract_features(wav_path: str) -> Dict:
    """Compute tempo, key, and compact feature statistics for API response."""
    y, sr = librosa.load(wav_path, sr=16000, mono=True)
    if y.size == 0:
        y = np.zeros(16000, dtype=np.float32)

    # Tempo
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    tempo_conf = float(min(1.0, len(beats) / (len(y) / sr + 1e-6)))

    # Chroma & Key
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    key_guess = estimate_key_from_chroma(chroma)

    # MFCCs
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_mean: List[float] = [float(x) for x in np.mean(mfcc, axis=1)]
    mfcc_std: List[float] = [float(x) for x in np.std(mfcc, axis=1)]

    # Spectral contrast
    spec_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    spectral_contrast: List[float] = [float(x) for x in np.mean(spec_contrast, axis=1)]

    # Tonnetz
    tonnetz_feat = librosa.feature.tonnetz(y=y, sr=sr)
    tonnetz: List[float] = [float(x) for x in np.mean(tonnetz_feat, axis=1)]

    chroma_mean: List[float] = [float(x) for x in np.mean(chroma, axis=1)]

    return {
        "tempo_bpm": int(round(float(tempo))),
        "tempo_conf": tempo_conf,
        "key_guess": key_guess,
        "features": {
            "mfcc_mean": mfcc_mean,
            "mfcc_std": mfcc_std,
            "chroma_mean": chroma_mean,
            "spectral_contrast": spectral_contrast,
            "tonnetz": tonnetz,
        },
    }


