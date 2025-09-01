from __future__ import annotations

from typing import Dict


def build_pdf(track: Dict, logo_path: str = "assets/ma-logo.png") -> str:
    """Minimal PDF generator placeholder; writes a one-page report.

    Defers heavy imports to runtime so the module imports without dependencies.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    track_id = track.get("id", "unknown")
    out_path = f"museagent/backend/reports/{track_id}.pdf"
    c = canvas.Canvas(out_path, pagesize=A4)
    width, height = A4
    # Header
    c.setFillColorRGB(0.95, 0.9, 0.6)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(40, height - 60, "MuseAgent Analysis Report")
    # Logo
    try:
        c.drawImage(logo_path, 40, height - 160, width=140, preserveAspectRatio=True, mask='auto')
    except Exception:
        pass
    # Body
    c.setFillColorRGB(0.9, 0.9, 0.95)
    c.setFont("Helvetica", 11)
    c.drawString(40, height - 190, f"Track ID: {track_id}")
    c.drawString(40, height - 210, f"Filename: {track.get('filename','')}" )
    c.drawString(40, height - 230, f"Duration (s): {track.get('duration_sec', 0)}")
    c.drawString(40, height - 250, f"Tempo: {track.get('tempo_bpm', 0)} bpm")
    c.drawString(40, height - 270, f"Key: {track.get('key_guess', 'unknown')}")
    c.showPage()
    c.save()
    return out_path


