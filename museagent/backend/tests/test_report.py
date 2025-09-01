from museagent.backend.agents.report_agent import build_pdf


def test_build_pdf_path(tmp_path):
    track = {"id": "test", "filename": "x.wav", "duration_sec": 0, "tempo_bpm": 0, "key_guess": "C"}
    pdf = build_pdf(track, logo_path="assets/ma-logo.png")
    assert pdf.endswith(".pdf")


