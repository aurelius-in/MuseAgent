from typing import Dict


def _bpm_clause(a: int, b: int) -> str:
    if not a or not b:
        return "tempo unavailable"
    diff = abs(a - b)
    closeness = "very close" if diff <= 2 else ("close" if diff <= 5 else f"diff {diff}")
    return f"BPM {a} vs {b} ({closeness})"


def rationale_for_pair(a: Dict, b: Dict) -> str:
    """Generate a readable explanation for similarity."""
    abpm = int(a.get("tempo_bpm", 0))
    bbpm = int(b.get("tempo_bpm", 0))
    akey = a.get("key_guess", "?")
    bkey = b.get("key_guess", "?")
    bpm = _bpm_clause(abpm, bbpm)
    key = "same key" if akey == bkey and akey != "?" else f"key {akey} vs {bkey}"
    mood = a.get("tags", {}).get("mood")
    mood_clause = f"shared mood {mood}" if mood and mood == b.get("tags", {}).get("mood") else "complementary mood"
    return f"{bpm}; {key}; {mood_clause}"


