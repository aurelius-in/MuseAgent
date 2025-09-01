document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  const body = document.body;

  // Ensure the logo is loaded before starting timer for smoother UX
  const logo = document.getElementById('splash-logo');
  const minDurationMs = 3000; // 3 seconds

  const start = performance.now();

  const proceed = () => {
    const elapsed = performance.now() - start;
    const remaining = Math.max(0, minDurationMs - elapsed);
    setTimeout(() => {
      splash.classList.add('hide');
      // After fade-out, enable app UI
      setTimeout(() => body.classList.add('ready'), 400);
    }, remaining);
  };

  if (logo && !logo.complete) {
    logo.addEventListener('load', proceed);
    logo.addEventListener('error', proceed);
  } else {
    proceed();
  }

  // Simple analyze workflow
  const form = document.getElementById('upload-form');
  const input = document.getElementById('file-input');
  const results = document.getElementById('results');
  const grid = document.getElementById('grid');
  const reloadLib = document.getElementById('reload-lib');
  const soundToggle = document.getElementById('sound-toggle');
  const offlineToggle = document.getElementById('offline-toggle');
  const tabAnalyze = document.getElementById('tab-analyze');
  const tabExplore = document.getElementById('tab-explore');
  const tabReports = document.getElementById('tab-reports');
  const panelAnalyze = document.getElementById('panel-analyze');
  const panelExplore = document.getElementById('panel-explore');
  const panelReports = document.getElementById('panel-reports');
  const reportsList = document.getElementById('reports-list');
  const detail = document.getElementById('detail');
  const detailTitle = document.getElementById('detail-title');
  const detailMeta = document.getElementById('detail-meta');
  const detailClose = document.getElementById('detail-close');
  const chartRadar = document.getElementById('chart-radar');
  const chartChroma = document.getElementById('chart-chroma');

  // WebAudio: gentle click sound
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx;
  function playClick() {
    if (!soundToggle || !soundToggle.checked) return;
    audioCtx = audioCtx || new AudioContext();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(660, audioCtx.currentTime);
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.13);
  }

  function openDetail(track) {
    if (!detail) return;
    detailTitle.textContent = track.filename;
    detailMeta.textContent = `BPM ${track.tempo_bpm} • Key ${track.key_guess} • Mood ${track.tags?.mood || ''}`;
    // Draw simple radar and chroma bars
    try {
      import('./charts.js').then(mod => {
        const mfcc = track.features?.mfcc_mean || [];
        mod.drawRadar(chartRadar, mfcc);
        const chroma = track.features?.chroma_mean || [];
        mod.drawBars(chartChroma, chroma);
      }).catch(() => {});
    } catch (_) {}
    detail.classList.add('show');
  }
  if (detailClose) detailClose.addEventListener('click', () => detail.classList.remove('show'));

  async function loadLibrary() {
    if (!grid) return;
    grid.innerHTML = '<span class="muted">Loading library...</span>';
    const j = await (async () => {
      if (offlineToggle && offlineToggle.checked) {
        const res = await fetch('./mock_data.json');
        return res.json();
      } else {
        const res = await fetch('/library');
        return res.json();
      }
    })();
    const tracks = j.tracks || [];
    grid.innerHTML = tracks.map(t => (
      `<div class="card">`+
      (t.spectrogram_png ? `<img src="${t.spectrogram_png}" alt="spec" style="width:100%;height:120px;object-fit:cover;border-radius:10px"/>` : '')+
      `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:.5rem">`+
      `<div style="font-weight:600">${t.filename}</div>`+
      `<span class="badge badge-muted">${t.tempo_bpm} bpm</span>`+
      `</div>`+
      `<div class="muted" style="font-size:.9rem">Key ${t.key_guess} • ${t.tags?.mood || ''}</div>`+
      `<div class="controls" style="margin-top:.5rem">`+
      `<button data-tid="${t.id}" class="detail-btn">Detail</button>`+
      `<button data-tid="${t.id}" class="similar-btn">Similar</button>`+
      `<button data-tid="${t.id}" class="report-btn">Report</button>`+
      `</div>`+
      `</div>`
    )).join('');

    // Bind actions
    grid.querySelectorAll('.detail-btn').forEach(btn => btn.addEventListener('click', (ev) => {
      playClick();
      const tid = ev.currentTarget.getAttribute('data-tid');
      const t = (tracks || []).find(x => x.id === tid);
      if (t) openDetail(t);
    }));

    grid.querySelectorAll('.similar-btn').forEach(btn => btn.addEventListener('click', async (ev) => {
      playClick();
      const tid = ev.currentTarget.getAttribute('data-tid');
      const r = await fetch(`/similar?track_id=${encodeURIComponent(tid)}&k=3`);
      const j = await r.json();
      alert('Top similar:\n' + (j.neighbors || []).map(n => `${n.id} (d=${Number(n.distance).toFixed(2)})\n${n.explanation}`).join('\n\n'));
    }));

    grid.querySelectorAll('.report-btn').forEach(btn => btn.addEventListener('click', async (ev) => {
      playClick();
      const tid = ev.currentTarget.getAttribute('data-tid');
      const r = await fetch('/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ track_id: tid })});
      const j = await r.json();
      if (j.pdf) window.open(j.pdf, '_blank');
    }));
  }
  if (reloadLib) reloadLib.addEventListener('click', () => { playClick(); loadLibrary(); });
  // Initial load
  loadLibrary().catch(() => {});

  // Hash-based tabs
  function setActiveTab(name) {
    [tabAnalyze, tabExplore, tabReports].forEach(el => el && el.classList.remove('active'));
    [panelAnalyze, panelExplore, panelReports].forEach(el => el && el.classList.remove('active'));
    if (name === 'explore') { tabExplore?.classList.add('active'); panelExplore?.classList.add('active'); }
    else if (name === 'reports') { tabReports?.classList.add('active'); panelReports?.classList.add('active'); renderReports(); }
    else { tabAnalyze?.classList.add('active'); panelAnalyze?.classList.add('active'); }
  }
  function onHashChange() {
    const name = (location.hash || '#analyze').replace('#','');
    setActiveTab(name);
  }
  window.addEventListener('hashchange', onHashChange);
  onHashChange();

  async function renderReports() {
    if (!reportsList) return;
    const j = await (async () => {
      if (offlineToggle && offlineToggle.checked) {
        const res = await fetch('./mock_data.json');
        return res.json();
      } else {
        const res = await fetch('/library');
        return res.json();
      }
    })();
    const tracks = j.tracks || [];
    reportsList.innerHTML = tracks.slice(0, 12).map(t => (
      `<div class="card">`+
      `<div style="display:flex;align-items:center;gap:.5rem">`
      `<svg width="20" height="20"><use href="./icons.svg#icon-note"/></svg>`+
      `<div style="font-weight:600">${t.filename}</div>`+
      `</div>`+
      `<div class="muted" style="font-size:.9rem">BPM ${t.tempo_bpm} • Key ${t.key_guess}</div>`+
      `<div class="controls" style="margin-top:.5rem">`+
      `<button data-tid="${t.id}" class="report-btn">Open PDF</button>`+
      `</div>`+
      `</div>`
    )).join('');
    reportsList.querySelectorAll('.report-btn').forEach(btn => btn.addEventListener('click', async (ev) => {
      playClick();
      const tid = ev.currentTarget.getAttribute('data-tid');
      const r = await fetch('/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ track_id: tid })});
      const j = await r.json();
      if (j.pdf) window.open(j.pdf, '_blank');
    }));
  }
  if (form && input && results) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      playClick();
      const files = input.files;
      if (!files || files.length === 0) return;
      const fd = new FormData();
      for (const f of files) fd.append('files', f);
      results.innerHTML = '<span class="muted">Analyzing...</span>';
      try {
        const res = await fetch('/analyze', { method: 'POST', body: fd });
        const json = await res.json();
        const items = json.tracks || [];
        results.innerHTML = items.map(t => (
          `<div class="card" style="margin-top:.5rem">`+
          `<div><b>${t.filename}</b></div>`+
          `<div class="muted">BPM ${t.tempo_bpm} • Key ${t.key_guess}</div>`+
          (t.spectrogram_png ? `<img src="/${t.spectrogram_png.replace(/^\/+/, '')}" alt="spec" style="width:320px;max-width:100%;margin-top:.5rem;border-radius:8px"/>` : '')+
          `<div class="controls" style="margin-top:.5rem">`+
          `<button data-tid="${t.id}" class="similar-btn">Similar</button>`+
          `<button data-tid="${t.id}" class="report-btn">Report PDF</button>`+
          `</div>`+
          `</div>`
        )).join('');

        // Bind similar buttons
        for (const btn of results.querySelectorAll('.similar-btn')) {
          btn.addEventListener('click', async (ev) => {
            const tid = ev.currentTarget.getAttribute('data-tid');
            const r = await fetch(`/similar?track_id=${encodeURIComponent(tid)}&k=3`);
            const j = await r.json();
            alert('Top similar:\n' + (j.neighbors || []).map(n => `${n.id} (d=${n.distance.toFixed(2)})\n${n.explanation}`).join('\n\n'));
          });
        }

        // Bind report buttons
        for (const btn of results.querySelectorAll('.report-btn')) {
          btn.addEventListener('click', async (ev) => {
            const tid = ev.currentTarget.getAttribute('data-tid');
            const r = await fetch('/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ track_id: tid })});
            const j = await r.json();
            if (j.pdf) window.open(j.pdf, '_blank');
          });
        }
      } catch (err) {
        results.innerHTML = `<span class="muted">Error: ${err}</span>`;
      }
    });
  }
});


