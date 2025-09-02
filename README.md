# MuseAgent: Music Intelligence

MuseAgent is a polished, demo‑ready music AI app with a static HTML/CSS/JS frontend and a FastAPI backend. It analyzes tracks, explores a library with smart tools, generates new music (with CPU‑friendly fallbacks), and produces attractive reports — all with an offline PWA mode for instant demos.

![MuseAgent UI](assets/ma-ui.gif)

---

## What’s inside

- Frontend (static): `frontend/`
  - Tabs: Analyze • Explore • Generate • Insights
  - Progressive Web App (PWA) with offline caching and mock data
  - Keyboard shortcuts, toasts, mini visualizations, and tasteful animations
- Backend (FastAPI): `museagent/backend/`
  - Modular agents for ingestion, features, embeddings, tagging, recs, reports, and generation
  - Health/ready/metrics endpoints; optional API key guard; static mounts for assets/data/reports

---

## Features

- Track analysis
  - Drag‑and‑drop, multi‑file upload
  - Librosa feature extraction (MFCCs, chroma, spectral contrast, tonnetz, tempo, key estimate)
  - Optional enrichment agent hooks (e.g., Spotify‑like metadata)
  - Inline charts (radar, chroma bars) once results are available
- Explore library
  - Dense, responsive grid with animated music bars
  - Filters: key, mood, BPM range; live search; favorites; selection mode + batch tagging
  - A/B compare with feature radar; smart playlist (greedy MFCC NN); prompt playlist (rule‑based)
  - Similarity map (naive projection of MFCCs) and nearest‑neighbor modal with heatmaps
  - Per‑card tiny transport, detail, similar, and Report (PDF) buttons
- Insights
  - Left: report list (populated from current library; falls back to mock data offline)
  - Right: detailed “smart” report (e.g., One Dance — Drake) with Feature Radar and Mood Map
  - Per‑report Export PDF
- Generate
  - Describe box + granular controls (genre, mood, key, BPM, duration, creativity, seed, vocals)
  - Engine selector:
    - Hook‑forward (catchy, structured)
    - Verse/Chorus (song form)
    - Loop‑based (groove‑driven)
    - Atmospheric (evolving, ambient)
  - Lyrics prompt + language (English, Spanish, French, Arabic) + rhyme scheme (AABB/ABAB/Free)
  - Online: POST `/generate` (MusicGen if installed; otherwise synth fallback)
  - Offline: instant mock with add‑to‑library
- Demo polish
  - Splash screen with timed transition; logo pulse every 10s
  - Solid purple top bar matching branding; folder‑style tabs
  - Offline/Online toggle (defaults to offline for fast demos)
  - PWA caching; mock data auto‑fallback if backend empty

---

## Architecture & endpoints

Backend mounts and routes (selected):

- Static:
  - `/ui` → `frontend/`
  - `/assets` → branding assets
  - `/data` → analysis artifacts (waveforms/specs/exports)
  - `/reports` → generated PDFs
- Health & metrics:
  - `GET /healthz` → `{ ok }`
  - `GET /readyz` → FAISS readiness and counts
  - `GET /metrics` → simple latency histograms
- Library:
  - `GET /library?page=&per_page=` → paginated items
  - `GET /export?fmt=json|csv` → exports
- Analysis & similarity:
  - `POST /analyze?enrich=&generate=` → analyze uploaded files, optional loop preview
  - `GET /similar?track_id=&k=` → NN search with explanations
- Reports:
  - `POST /report` → returns web path to a one‑page PDF for a track
- Chat (demo):
  - `POST /chat` → rule‑based answers about tempo/key/mood/recs
- Generation:
  - `POST /generate` → JSON body `{ prompt, genre, mood, key, bpm, duration, creativity, seed, engine }`
    - If `audiocraft` MusicGen is installed, uses small model; otherwise synthesizes a harmonic bed

---

## Offline mode (PWA)

- Works entirely offline with `frontend/mock_data.json`
- Toggle “Offline” to demo immediately; Explore/Insights auto‑fallback to mock data if the backend is empty
- Service worker handles asset caching with version bumps

---

## Run locally

Backend (FastAPI):

```bash
# from repo root
uvicorn museagent.backend.app:app --reload --port 8000
# open http://localhost:8000/ui/
```

Optional: Install MusicGen for real audio generation

```bash
pip install audiocraft
# (GPU recommended; CPU works but slower)
```

---

## Workflow & tabs

- Analyze: analyze uploads, see results + simple charts, use tap tempo, key trainer, and quick agents
- Explore: filter/search/sort, compare A/B, similar tracks, playlists, similarity map, exports
- Generate: design a track via Describe + controls; create lyrics; choose engine; add to library
- Insights: browse reports on the left; detailed smart report on the right; export PDF

Online vs Offline:
- Online: frontend calls backend endpoints (`/analyze`, `/generate`, `/report`, …)
- Offline: seeded mock data is used; generation produces a placeholder track with lyrics

---

## Roadmap (optional)

- Cloud engines (Replicate / HF endpoints) behind the same engine picker
- Proper streaming/progress for long generations
- Stems (Demucs) and more visualizations

---

## Author

Oliver A. Ellison  
LinkedIn: https://www.linkedin.com/in/oellison/
