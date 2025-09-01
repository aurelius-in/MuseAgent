from typing import Dict


def rationale_for_pair(a: Dict, b: Dict) -> str:
    """Generate a brief explanation for similarity based on placeholder features."""
    abpm = a.get("tempo_bpm", 0)
    bbpm = b.get("tempo_bpm", 0)
    akey = a.get("key_guess", "?")
    bkey = b.get("key_guess", "?")
    bpm_clause = f"BPM {abpm} vs {bbpm}" if abpm and bbpm else "tempo unavailable"
    key_clause = f"key {akey} vs {bkey}" if akey != "?" and bkey != "?" else "key unknown"
    return f"{bpm_clause}; {key_clause}; chroma overlap likely"


