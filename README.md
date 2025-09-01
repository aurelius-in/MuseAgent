# MuseAgent: Music Intelligence

MuseAgent is a lightweight yet powerful **music AI application** designed to showcase machine learning, signal processing, and intelligent agent-based design in the music/audio domain.  
It demonstrates how modular AI agents can ingest, analyze, classify, recommend, and even generate music insights — aligning directly with modern music ML needs.

---

## ✨ Features

### Core Audio Analysis
- **Audio ingestion**: Supports MP3, WAV, FLAC; converts to mono 16kHz for consistency.  
- **Waveform & spectrogram visualization**: Generates plots for each track.  
- **Tempo & beat detection**: Extract BPM using Librosa.  
- **Key detection**: Estimate musical key via chroma features.  
- **Feature extraction**: MFCCs, spectral contrast, chroma, tonnetz, tempo, pitch.  
- **Silence trimming & normalization**: Clean audio for consistent analysis.

### Embeddings & Classification
- **Pretrained embeddings**: Supports YAMNet (TFHub), VGGish, PANNs (PyTorch).  
- **Custom embeddings**: Extendable for client-specific datasets.  
- **Tagging agent**: Assigns mood, genre, and instrumentation classes.  
- **Explainable outputs**: Includes rationales (e.g., tempo, chroma similarity) for predictions.

### Recommendation System
- **Nearest-neighbor search**: FAISS index over embeddings.  
- **Playlist generation**: Build playlists of similar tracks.  
- **Cross-modal queries**: Search by “mood” or “tempo range”.  
- **Explainability**: Shows feature overlaps driving similarity.

### Generative AI
- **Loop generation**: Variational Autoencoder (VAE) or Diffusion-based audio models for short loops.  
- **Conditioned generation**: Generate loops by mood tag (e.g., “ambient”, “energetic”).  
- **MIDI generation**: Optional symbolic output for integration into DAWs.

### Reporting & APIs
- **PDF reports**: One-page intelligence report with:  
  - Track metadata  
  - Key/tempo/features  
  - Top mood/genre tags  
  - Spectrogram  
  - Similar tracks + rationale  
- **Spotify/Last.fm API integration**: Enrich track metadata.  
- **Export CSV/JSON**: For downstream ML pipelines.

### UI / Frontend
- **Streamlit demo UI**:  
  - Upload multiple tracks  
  - Analyze + view features  
  - View spectrograms & tags  
  - “Find Similar” button for recommendations  
  - “Export Report” button for PDFs  
- **Optional React/MUI frontend**: For production integration.

### MLOps & Deployment
- **FastAPI backend** with modular agent endpoints.  
- **Dockerized environment**: Portable and easy to deploy.  
- **MLflow logging**: Tracks experiments, features, and tags.  
- **Extensible architecture**: Agents can be swapped, stacked, or extended.

---

## 🗂 File Structure
```
museagent/
  backend/
    app.py
    ingestion_agent.py
    feature_agent.py
    embedding_agent.py
    tagging_agent.py
    recommendation_agent.py
    report_agent.py
    generation_agent.py
    models/
  ui/
    app.py
  data/
  embeddings/
  reports/
  requirements.txt
  README.md
```

---

## 🚀 Quickstart

### 1. Clone repo
```bash
git clone https://github.com/yourusername/museagent.git
cd museagent
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Start backend (FastAPI)
```bash
uvicorn backend.app:app --reload --port 8000
```

### 4. Start frontend (Streamlit)
```bash
streamlit run ui/app.py
```

### 5. Upload and explore
- Upload MP3/WAV files in the UI  
- View features, spectrograms, and tags  
- Generate recommendations  
- Export PDF reports  

---

## 🔧 Tech Stack
- **Python**: 3.10+  
- **FastAPI**: API framework  
- **Streamlit**: UI framework  
- **Librosa**: Audio feature extraction  
- **PyTorch / TensorFlow**: Embeddings and generative models  
- **FAISS**: Recommendation nearest-neighbor search  
- **ReportLab**: PDF report generation  
- **Spotify API (Spotipy)**: Metadata enrichment  
- **MLflow (optional)**: Experiment tracking  

---

## 🌟 Why MuseAgent?

MuseAgent demonstrates a **complete pipeline** for music ML applications: ingestion → analysis → embedding → tagging → recommendation → reporting → generation.  
It’s modular, explainable, and production-ready — making it easy to adapt for tasks like music recommendation, audio tagging, editorial support, or creative generation.

---

## 📄 License
MIT License

---

## 👤 Author
Oliver A. Ellison  
Machine Learning Engineer – Music & Audio Domain  
LinkedIn: https://www.linkedin.com/in/oellison/  
Calendly: https://calendly.com/oliveraellison/15min  
