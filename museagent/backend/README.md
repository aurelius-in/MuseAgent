# MuseAgent Backend (Laptop Demo)

Run locally:

1. python -m venv .venv && .venv\Scripts\activate
2. pip install -r museagent/backend/requirements.txt
3. uvicorn museagent.backend.app:app --reload --port 8000
4. Open http://localhost:8000/ui/ for the branded UI

Endpoints:
- GET /healthz — basic health
- GET /readyz — readiness (faiss_ntotal, vectors)
- POST /analyze — upload files[] (multipart)
- GET /similar?track_id=...&k=5 — neighbors
- POST /report — returns { pdf: "/reports/<id>.pdf" }
- GET /library — stored tracks

Notes:
- Warm-start rebuilds the embedding index on boot.
- Reports under /reports; assets under /assets; thumbnails under /data.
- ENV sample: museagent/backend/ENV.sample
