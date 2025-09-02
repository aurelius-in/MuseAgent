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
  const enrichToggle = document.getElementById('enrich-toggle');
  const generateToggle = document.getElementById('generate-toggle');
  const tabAnalyze = document.getElementById('tab-analyze');
  const tabExplore = document.getElementById('tab-explore');
  const tabReports = document.getElementById('tab-reports');
  const tabMore = document.getElementById('tab-more');
  const panelAnalyze = document.getElementById('panel-analyze');
  const panelExplore = document.getElementById('panel-explore');
  const panelReports = document.getElementById('panel-reports');
  const panelMore = document.getElementById('panel-more');
  const reportsList = document.getElementById('reports-list');
  const exportJsonBtn = document.getElementById('export-json');
  const exportCsvBtn = document.getElementById('export-csv');
  const detail = document.getElementById('detail');
  const detailTitle = document.getElementById('detail-title');
  const detailMeta = document.getElementById('detail-meta');
  const detailClose = document.getElementById('detail-close');
  const chartRadar = document.getElementById('chart-radar');
  const chartChroma = document.getElementById('chart-chroma');
  let lastLibrary = [];

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

  async function loadLibrary(page=1) {
    if (!grid) return;
    grid.innerHTML = '<div class="skeleton" style="height:140px"></div>';
    const j = await (async () => {
      if (offlineToggle && offlineToggle.checked) {
        const res = await fetch('./mock_data.json');
        return res.json();
      } else {
        const qs = new URLSearchParams({ page: String(page), per_page: '8' });
        const res = await fetch('/library?' + qs.toString());
        return res.json();
      }
    })();
    const tracks = j.tracks || [];
    lastLibrary = tracks;
    // pagination state
    let pageState = { page, pages: 1, total: tracks.length, slice: tracks };
    try {
      const mod = await import('./pagination.js');
      pageState = mod.paginate(tracks, page, 8);
    } catch(_) {}
    grid.innerHTML = pageState.slice.map(t => (
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
    // render pager
    const pager = document.getElementById('pager');
    try {
      const mod = await import('./pagination.js');
      mod.renderPager(pager, pageState, (p)=> loadLibrary(p));
    } catch(_) {}

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
      if (offlineToggle && offlineToggle.checked) {
        // Offline: compute naive nearest by MFCC L2
        const ref = lastLibrary.find(x => x.id === tid) || lastLibrary[0];
        const dists = lastLibrary.filter(x => x.id !== tid).map(x => ({ id: x.id, d: l2(ref.features.mfcc_mean, x.features.mfcc_mean), a: ref, b: x }));
        dists.sort((a,b)=>a.d-b.d);
        showSimilarModal(dists.slice(0,3));
      } else {
        const r = await fetch(`/similar?track_id=${encodeURIComponent(tid)}&k=3`);
        const j = await r.json();
        showSimilarModal((j.neighbors||[]).map(n => ({ id:n.id, d:n.distance, a:lastLibrary.find(x=>x.id===tid), b:lastLibrary.find(x=>x.id===n.id) })));
      }
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
    [tabAnalyze, tabExplore, tabReports, tabMore].forEach(el => { if (el){ el.classList.remove('active'); el.setAttribute('aria-selected','false'); }});
    [panelAnalyze, panelExplore, panelReports, panelMore].forEach(el => el && el.classList.remove('active'));
    if (name === 'explore') { if (tabExplore){ tabExplore.classList.add('active'); tabExplore.setAttribute('aria-selected','true'); } panelExplore?.classList.add('active'); maybeSplit('explore'); }
    else if (name === 'reports') { if (tabReports){ tabReports.classList.add('active'); tabReports.setAttribute('aria-selected','true'); } panelReports?.classList.add('active'); renderReports(); maybeSplit('reports'); }
    else if (name === 'more') { if (tabMore){ tabMore.classList.add('active'); tabMore.setAttribute('aria-selected','true'); } panelMore?.classList.add('active'); }
    else { if (tabAnalyze){ tabAnalyze.classList.add('active'); tabAnalyze.setAttribute('aria-selected','true'); } panelAnalyze?.classList.add('active'); }
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
      `<button data-tid="${t.id}" class="preview-btn">Preview</button>`+
      `<button data-tid="${t.id}" class="report-btn">Open PDF</button>`+
      `</div>`+
      `</div>`
    )).join('');
    reportsList.querySelectorAll('.report-btn').forEach(btn => btn.addEventListener('click', async (ev) => {
      playClick();
      const tid = ev.currentTarget.getAttribute('data-tid');
      if (offlineToggle && offlineToggle.checked){ alert('PDF reports are unavailable in offline demo.'); return; }
      const r = await fetch('/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ track_id: tid })});
      const j = await r.json();
      if (j.pdf) window.open(j.pdf, '_blank');
    }));

    reportsList.querySelectorAll('.preview-btn').forEach(btn => btn.addEventListener('click', async (ev) => {
      playClick();
      const tid = ev.currentTarget.getAttribute('data-tid');
      if (offlineToggle && offlineToggle.checked){ alert('PDF preview is unavailable in offline demo.'); return; }
      const r = await fetch('/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ track_id: tid })});
      const j = await r.json();
      if (j.pdf) showPdfModal(j.pdf);
    }));

    if (exportJsonBtn) exportJsonBtn.onclick = async () => {
      playClick();
      if (offlineToggle && offlineToggle.checked) {
        const blob = new Blob([JSON.stringify({ tracks }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'library.json'; a.click(); URL.revokeObjectURL(url);
      } else {
        const r = await fetch('/export?fmt=json'); const j = await r.json(); if (j.path) window.open(j.path, '_blank');
      }
    };
    if (exportCsvBtn) exportCsvBtn.onclick = async () => {
      playClick();
      if (offlineToggle && offlineToggle.checked) {
        const header = ['id','filename','duration_sec','tempo_bpm','tempo_conf','key_guess','embedding_dim'];
        const rows = tracks.map(t => header.map(h => t[h] ?? '').join(','));
        const blob = new Blob([header.join(',') + '\n' + rows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'library.csv'; a.click(); URL.revokeObjectURL(url);
      } else {
        const r = await fetch('/export?fmt=csv'); const j = await r.json(); if (j.path) window.open(j.path, '_blank');
      }
    };
  }

  function showPdfModal(url){
    const modal = document.createElement('div');
    modal.className = 'detail show';
    modal.innerHTML = `
      <div class="detail-inner">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
          <h3 style="margin:0">Report Preview</h3>
          <div class="row">
            <a href="${url}" target="_blank"><button>Open in Tab</button></a>
            <button id="pdf-close">Close</button>
          </div>
        </div>
        <iframe src="${url}" style="width:100%;height:70vh;border:none;border-radius:10px;background:white"></iframe>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#pdf-close').addEventListener('click', ()=> modal.remove());
  }

  // If a panel overflows viewport notably, move overflow content to More tab
  function maybeSplit(which){
    try {
      const panel = which === 'explore' ? panelExplore : panelReports;
      const more = panelMore;
      if (!panel || !more) return;
      const tooTall = panel.scrollHeight > window.innerHeight * 1.5;
      const moreTabVisible = tabMore && !tabMore.classList.contains('hidden');
      if (tooTall && !moreTabVisible){
        tabMore?.classList.remove('hidden');
        // Move secondary grids to more
        const moveIds = which === 'explore' ? ['grid'] : ['reports-list'];
        moveIds.forEach(id => {
          const el = document.getElementById(id);
          if (el){
            const placeholder = document.getElementById(id + '-more');
            if (placeholder){ placeholder.innerHTML = el.outerHTML; el.innerHTML = ''; }
          }
        });
      }
    } catch(_){}
  }

  // Similar modal with heatmap
  function l2(a,b){ let s=0; for(let i=0;i<Math.min(a.length,b.length);i++){ const d=(a[i]-b[i]); s+=d*d;} return Math.sqrt(s); }
  function showSimilarModal(items){
    const modal = document.createElement('div');
    modal.className = 'detail show';
    modal.innerHTML = `
      <div class="detail-inner">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
          <h3 style="margin:0">Top Similar</h3>
          <button id="sim-close">Close</button>
        </div>
        <div id="sim-list" class="grid"></div>
      </div>`;
    document.body.appendChild(modal);
    const list = modal.querySelector('#sim-list');
    list.innerHTML = items.map(it => `
      <div class="card">
        <div class="muted" style="margin-bottom:.5rem">distance ${Number(it.d).toFixed(2)}</div>
        <canvas width="240" height="240" class="hover-float"></canvas>
      </div>`).join('');
    import('./heatmap.js').then(mod => {
      list.querySelectorAll('canvas').forEach((c,i)=>{
        const it = items[i];
        const a = it.a?.features?.chroma_mean || [];
        const b = it.b?.features?.chroma_mean || [];
        mod.drawChromaHeatmap(c, a, b);
      });
    }).catch(()=>{});
    modal.querySelector('#sim-close').addEventListener('click', ()=> modal.remove());
  }
  if (form && input && results) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      playClick();
      const files = input.files;
      if (!files || files.length === 0) return;
      const fd = new FormData();
      for (const f of files) fd.append('files', f);
      results.innerHTML = '<div class="skeleton" style="height:80px"></div>';
      try {
        const json = await (async ()=>{
          if (offlineToggle && offlineToggle.checked){
            const mod = await import('./offline.js');
            return mod.analyzeMock(files);
          } else {
            const qs = new URLSearchParams();
            if (enrichToggle && enrichToggle.checked) qs.set('enrich','true');
            if (generateToggle && generateToggle.checked) qs.set('generate','true');
            const res = await fetch('/analyze' + (qs.toString()?`?${qs}`:''), { method: 'POST', body: fd });
            return res.json();
          }
        })();
        const items = json.tracks || [];
        results.innerHTML = items.map(t => (
          `<div class="card" style="margin-top:.5rem">`+
          `<div><b>${t.filename}</b></div>`+
          `<div class="muted">BPM ${t.tempo_bpm} • Key ${t.key_guess}</div>`+
          (t.spectrogram_png ? `<img src="${t.spectrogram_png}" alt="spec" style="width:320px;max-width:100%;margin-top:.5rem;border-radius:8px"/>` : '')+
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
            if (offlineToggle && offlineToggle.checked){
              const ref = lastLibrary.find(x => x.id === tid) || lastLibrary[0];
              const dists = lastLibrary.filter(x => x.id !== tid).map(x => ({ id: x.id, d: l2(ref.features.mfcc_mean, x.features.mfcc_mean), a: ref, b: x }));
              dists.sort((a,b)=>a.d-b.d);
              showSimilarModal(dists.slice(0,3));
            } else {
              const r = await fetch(`/similar?track_id=${encodeURIComponent(tid)}&k=3`);
              const j = await r.json();
              showSimilarModal((j.neighbors||[]).map(n => ({ id:n.id, d:n.distance, a:lastLibrary.find(x=>x.id===tid), b:lastLibrary.find(x=>x.id===n.id) })));
            }
          });
        }

        // Bind report buttons
        for (const btn of results.querySelectorAll('.report-btn')) {
          btn.addEventListener('click', async (ev) => {
            const tid = ev.currentTarget.getAttribute('data-tid');
            if (offlineToggle && offlineToggle.checked){ alert('PDF reports are unavailable in offline demo.'); }
            else {
              const r = await fetch('/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ track_id: tid })});
              const j = await r.json();
              if (j.pdf) window.open(j.pdf, '_blank');
            }
          });
        }
      } catch (err) {
        results.innerHTML = `<span class="muted">Error: ${err}</span>`;
      }
    });
  }
});


