from typing import Dict, List


def extract_features(wav_path: str) -> Dict:
    """Return a minimal feature dict placeholder matching API contract keys."""
    mfcc_mean: List[float] = [0.0] * 13
    mfcc_std: List[float] = [0.0] * 13
    chroma_mean: List[float] = [0.0] * 12
    spectral_contrast: List[float] = [0.0] * 7
    tonnetz: List[float] = [0.0] * 6
    return {
        "tempo_bpm": 0,
        "tempo_conf": 0.0,
        "key_guess": "C",
        "features": {
            "mfcc_mean": mfcc_mean,
            "mfcc_std": mfcc_std,
            "chroma_mean": chroma_mean,
            "spectral_contrast": spectral_contrast,
            "tonnetz": tonnetz,
        },
    }


