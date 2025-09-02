from __future__ import annotations

from typing import Optional, Tuple, Dict, Any
import os
import math
import numpy as np
import soundfile as sf

try:
    # Optional heavy dependency; only used if installed
    from audiocraft.models import musicgen  # type: ignore
    _HAS_MUSICGEN = True
except Exception:
    _HAS_MUSICGEN = False


def generate_loop(mood: Optional[str] = None, seconds: int = 8, sr: int = 16000) -> str:
    """Placeholder loop generator returning a dummy WAV path.

    In a full implementation, this would synthesize or sample a loop based on mood.
    """
    out_dir = "museagent/backend/data/cache"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"loop_{mood or 'neutral'}_{seconds}s.wav")
    # Defer heavy dependencies; create an empty file as a stub artifact
    with open(out_path, "wb") as f:
        f.write(b"")
    return out_path


def _sine_wave(freq: float, duration: float, sr: int) -> np.ndarray:
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    return np.sin(2 * math.pi * freq * t)


def _chord(freqs: Tuple[float, ...], duration: float, sr: int) -> np.ndarray:
    parts = [_sine_wave(f, duration, sr) for f in freqs]
    x = np.sum(parts, axis=0)
    # soft clip
    x = np.tanh(0.6 * x)
    return x


_KEY_TO_FREQ = {
    "C": 261.63, "C#": 277.18, "D": 293.66, "D#": 311.13, "E": 329.63,
    "F": 349.23, "F#": 369.99, "G": 392.00, "G#": 415.30, "A": 440.00,
    "A#": 466.16, "B": 493.88,
}


def _triad(root_freq: float, minor: bool) -> Tuple[float, float, float]:
    third = root_freq * (2 ** (3/12)) if minor else root_freq * (2 ** (4/12))
    fifth = root_freq * (2 ** (7/12))
    return (root_freq, third, fifth)


def _progression(key: str, mood: Optional[str]) -> Tuple[Tuple[int, bool], ...]:
    # Simple progressions depending on mood
    # tuple of (semitone offset from key, is_minor_triad)
    if mood and any(w in mood.lower() for w in ["dark", "sad", "melanch"]):
        return ((0, True), (5, True), (10, True), (7, True))  # i - iv - vii - v
    return ((0, False), (7, False), (9, False), (5, False))  # I - V - VI - IV


def _offset_freq(root: float, semis: int) -> float:
    return root * (2 ** (semis/12))


def generate_music(
    prompt: str = "",
    *,
    genre: str = "pop",
    mood: str = "happy",
    key: str = "C",
    bpm: int = 110,
    duration: int = 30,
    creativity: float = 0.5,
    seed: int = 0,
    sr: int = 32000,
    engine: str = "melody",
) -> Dict[str, Any]:
    """Generate music to a WAV file and return metadata.

    Tries MusicGen if available; otherwise synthesizes a light harmonic bed.
    Returns a dict with keys: path (filesystem path), web_path (/data/... if under cache), meta, lyrics.
    """
    rng = np.random.default_rng(seed or 0)
    out_dir = os.path.join("museagent", "backend", "data", "cache")
    os.makedirs(out_dir, exist_ok=True)
    safe_gen = genre.replace(" ", "-")
    safe_mood = mood.replace(" ", "-")
    fname = f"gen_{safe_gen}_{safe_mood}_{abs(seed)%100000}_{duration}s.wav"
    out_path = os.path.join(out_dir, fname)

    if _HAS_MUSICGEN and engine in ("melody", "musicgen"):
        try:
            # Choose a small model by default for feasibility
            model = musicgen.MusicGen.get_pretrained("facebook/musicgen-small")
            model.set_generation_params(duration=duration, top_k=250, top_p=0.0, temperature=max(0.1, min(2.0, 1.0 + (creativity-0.5))),)
            desc = prompt or f"{genre} track, {mood} mood, key {key}, bpm {bpm}"
            wav = model.generate([desc], progress=False)
            # audiocraft returns torch tensors list [1, T], convert to numpy
            import torch  # type: ignore
            x = wav[0].detach().cpu().numpy()
            sf.write(out_path, x.T, model.sample_rate)
        except Exception:
            # Fall back to synth if generation fails
            _synthesize(out_path, key, mood, bpm, duration, sr, rng, mode=engine)
    else:
        _synthesize(out_path, key, mood, bpm, duration, sr, rng, mode=engine)

    rel = os.path.relpath(out_path, os.path.join("museagent", "backend", "data")).replace("\\", "/")
    web = f"/data/{rel}"
    return {
        "path": out_path,
        "web_path": web,
        "meta": {"genre": genre, "mood": mood, "key": key, "bpm": bpm, "duration": duration, "creativity": creativity, "seed": seed, "engine": engine},
        "lyrics": generate_lyrics(prompt or f"{mood} {genre}")
    }


def _synthesize(out_path: str, key: str, mood: str, bpm: int, duration: int, sr: int, rng: np.random.Generator, *, mode: str = "melody") -> None:
    base = _KEY_TO_FREQ.get(key.replace("m", ""), 261.63)
    minor = key.endswith("m")
    prog = _progression(key, mood)
    sec_per_bar = 60.0 / max(40, min(220, bpm)) * 4
    bar_n = max(1, int(duration / sec_per_bar))
    audio = np.zeros(int(duration * sr), dtype=np.float32)
    t0 = 0
    for i in range(bar_n):
        step = prog[i % len(prog)]
        root = _offset_freq(base, step[0])
        if mode in ("texture", "riffusion"):
            # Evolving drone + filtered noise texture
            tri = (root, _offset_freq(root, 7), _offset_freq(root, 12))
            bar = _chord(tri, sec_per_bar, sr) * 0.4
            # gentle LFO
            lfo = 0.5 + 0.5 * np.sin(2 * math.pi * (0.1 + 0.03 * (i % 3)) * np.linspace(0, sec_per_bar, int(sr * sec_per_bar), endpoint=False))
            bar *= lfo.astype(np.float32)
            # pink-ish noise bursts
            noise = rng.normal(0, 0.08, len(bar)).astype(np.float32)
            bar += noise
        else:
            tri = _triad(root, minor or step[1])
            bar = _chord(tri, sec_per_bar, sr)
        # add gentle attack/decay
        env = np.linspace(0, 1, int(0.02*sr))
        bar[:len(env)] *= env
        bar[-len(env):] *= env[::-1]
        # simple hat on offbeats
        beat_samps = int(sr * 60.0 / max(40, min(220, bpm)))
        for k in range(1, 4):
            idx = int(k * beat_samps)
            if idx+int(0.005*sr) < len(bar):
                noise2 = rng.normal(0, 0.2 if mode == "melody" else 0.35, int(0.005*sr)).astype(np.float32)
                bar[idx:idx+len(noise2)] += noise2
        j0 = int(t0)
        j1 = min(len(audio), j0 + len(bar))
        audio[j0:j1] += bar[:j1-j0]
        t0 += len(bar)
    # normalize
    mx = max(1e-6, float(np.max(np.abs(audio))))
    audio = (audio / mx * 0.7).astype(np.float32)
    sf.write(out_path, audio, sr)


def generate_lyrics(prompt: str) -> str:
    words = [w for w in prompt.split() if w.strip()]
    if not words:
        words = ["midnight", "city", "lights"]
    rng = np.random.default_rng(len(" ".join(words)))
    pool = words + ["heart", "night", "fire", "rise", "dream", "shadow", "ocean"]
    def L(n: int) -> str:
        return " ".join(rng.choice(pool, size=n, replace=True))
    lines = []
    for _ in range(4):
        lines.append(L(4).capitalize())
    lines.append("")
    lines.append("[Chorus]")
    for _ in range(3):
        lines.append(L(5).capitalize())
    return "\n".join(lines)

