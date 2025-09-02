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
  const dropzone = document.getElementById('dropzone');
  const grid = document.getElementById('grid');
  const reloadLib = document.getElementById('reload-lib');
  const soundToggle = document.getElementById('sound-toggle');
  const offlineToggle = document.getElementById('offline-toggle');
  const enrichToggle = document.getElementById('enrich-toggle');
  const generateToggle = document.getElementById('generate-toggle');
  const labelSound = document.getElementById('label-sound');
  const labelOffline = document.getElementById('label-offline');
  const labelEnrich = document.getElementById('label-enrich');
  const labelGenerate = document.getElementById('label-generate');
  const tabAnalyze = document.getElementById('tab-analyze');
  const tabExplore = document.getElementById('tab-explore');
  const tabInsights = document.getElementById('tab-insights');
  const tabGenerate = document.getElementById('tab-generate');
  const tabReports = null;
  const tabMore = null;
  const panelAnalyze = document.getElementById('panel-analyze');
  const panelExplore = document.getElementById('panel-explore');
  const panelInsights = document.getElementById('panel-insights');
  const panelGenerate = document.getElementById('panel-generate');
  const panelReports = null;
  const panelMore = null;
  const reportsList = document.getElementById('reports-list');
  // Explore filters
  const filterKey = document.getElementById('filter-key');
  const filterMood = document.getElementById('filter-mood');
  const filterBpmEnabled = document.getElementById('filter-bpm-enabled');
  const filterBpmMin = document.getElementById('filter-bpm-min');
  const filterBpmMax = document.getElementById('filter-bpm-max');
  const applyFilters = document.getElementById('apply-filters');
  const selectToggle = document.getElementById('select-toggle');
  const tagSelectedBtn = document.getElementById('tag-selected-btn');
  const compareBtn = document.getElementById('compare-btn');
  const smartPlaylistBtn = document.getElementById('smart-playlist-btn');
  const shortcutsBtn = document.getElementById('shortcuts-btn');
  const shortcuts = document.getElementById('shortcuts');
  const shortcutsClose = document.getElementById('shortcuts-close');
  const search = document.getElementById('search');
  const promptPlaylistBtn = document.getElementById('prompt-playlist-btn');
  const mapToggleBtn = document.getElementById('map-toggle-btn');
  const exportSelectedCsvBtn = document.getElementById('export-selected-csv');
  const tapBtn = document.getElementById('tap-btn');
  const tapBpm = document.getElementById('tap-bpm');
  const metroToggle = document.getElementById('metro-toggle');
  const keyTrainer = document.getElementById('key-trainer');
  const agentAutotag = document.getElementById('agent-autotag');
  // Removed mini player controls
  const exportJsonBtn = null;
  const exportCsvBtn = null;
  const dotHealth = document.getElementById('dot-health');
  const dotReady = document.getElementById('dot-ready');
  const ntotalEl = document.getElementById('ntotal');
  const spark = document.getElementById('metrics-spark');
  const toastEl = document.getElementById('toast');
  const detail = document.getElementById('detail');
  const detailTitle = document.getElementById('detail-title');
  const detailMeta = document.getElementById('detail-meta');
  const detailClose = document.getElementById('detail-close');
  const chartRadar = document.getElementById('chart-radar');
  const chartChroma = document.getElementById('chart-chroma');
  const analyzeRadar = document.getElementById('analyze-radar');
  const analyzeChroma = document.getElementById('analyze-chroma');
  // Agents and insights
  const agentDance = document.getElementById('agent-dance');
  const agentAmbient = document.getElementById('agent-ambient');
  const agentSummarize = document.getElementById('agent-summarize');
  const agentOutput = document.getElementById('agent-output');
  const insightsList = document.getElementById('insights-list');
  // Generate elements
  const genForm = document.getElementById('gen-form');
  const genGenre = document.getElementById('gen-genre');
  const genMood = document.getElementById('gen-mood');
  const genKey = document.getElementById('gen-key');
  const genBpm = document.getElementById('gen-bpm');
  const genDuration = document.getElementById('gen-duration');
  const genCreativity = document.getElementById('gen-creativity');
  const genSeed = document.getElementById('gen-seed');
  const genLyricsPrompt = document.getElementById('gen-lyrics-prompt');
  const genDescribe = document.getElementById('gen-describe');
  const genLanguage = document.getElementById('gen-language');
  const genRhyme = document.getElementById('gen-rhyme');
  const genEngine = document.getElementById('gen-engine');
  const genVocals = document.getElementById('gen-vocals');
  const genRandomize = document.getElementById('gen-randomize');
  const genResults = document.getElementById('gen-results');
  // Chat elements
  const chat = document.getElementById('chat');
  const openChat = document.getElementById('open-chat');
  const chatClose = document.getElementById('chat-close');
  const chatLog = document.getElementById('chat-log');
  const chatForm = document.getElementById('chat-form');
  const chatText = document.getElementById('chat-text');
  let lastLibrary = [];
  let selectionMode = false;
  const selectedIds = new Set();
  const favorites = new Set();

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
  // Toggle label syncing
  function syncLabels(){
    if (labelSound && soundToggle) labelSound.textContent = soundToggle.checked ? 'Mute' : 'Sound';
    if (labelOffline && offlineToggle) labelOffline.textContent = offlineToggle.checked ? 'Online' : 'Offline';
    if (labelEnrich && enrichToggle) labelEnrich.textContent = enrichToggle.checked ? 'Enrich' : 'Raw';
    if (labelGenerate && generateToggle) labelGenerate.textContent = generateToggle.checked ? 'Generate' : 'Static';
  }
  [soundToggle, offlineToggle, enrichToggle, generateToggle].forEach(el => el && el.addEventListener('change', syncLabels));
  if (offlineToggle) offlineToggle.addEventListener('change', ()=>{ loadLibrary(1); });
  syncLabels();
  // Header export handlers (works both online/offline)
  if (exportJsonBtn) exportJsonBtn.onclick = async () => {
    try {
      if (offlineToggle && offlineToggle.checked) {
        const res = await fetch('./mock_data.json');
        const j = await res.json();
        const blob = new Blob([JSON.stringify(j, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'library.json'; a.click(); URL.revokeObjectURL(url); toast('Exported JSON');
      } else {
        const r = await fetch('/export?fmt=json'); const j = await r.json(); if (j.path) { window.open(j.path, '_blank'); toast('Exporting JSON'); } else { toast('Export failed'); }
      }
    } catch(_) { toast('Export failed'); }
  };
  if (exportCsvBtn) exportCsvBtn.onclick = async () => {
    try {
      if (offlineToggle && offlineToggle.checked) {
        const res = await fetch('./mock_data.json'); const j = await res.json(); const tracks = j.tracks || [];
        const header = ['id','filename','duration_sec','tempo_bpm','tempo_conf','key_guess','embedding_dim'];
        const rows = tracks.map(t => header.map(h => t[h] ?? '').join(','));
        const blob = new Blob([header.join(',') + '\n' + rows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'library.csv'; a.click(); URL.revokeObjectURL(url); toast('Exported CSV');
      } else {
        const r = await fetch('/export?fmt=csv'); const j = await r.json(); if (j.path) { window.open(j.path, '_blank'); toast('Exporting CSV'); } else { toast('Export failed'); }
      }
    } catch(_) { toast('Export failed'); }
  };
  // Status polling
  async function refreshStatus(){
    try {
      const h = await fetch('/healthz').then(r=>r.json()).catch(()=>({ok:false}));
      if (dotHealth) dotHealth.style.background = h.ok ? '#4caf50' : '#e53935';
    } catch(_){}
    try {
      const r = await fetch('/readyz').then(r=>r.json()).catch(()=>({ready:false}));
      if (dotReady) dotReady.style.background = r.ready ? '#4caf50' : '#e53935';
      if (ntotalEl && typeof r.faiss_ntotal !== 'undefined' && r.faiss_ntotal !== null) ntotalEl.textContent = `ntotal ${r.faiss_ntotal}`;
    } catch(_){}
    try {
      const m = await fetch('/metrics').then(r=>r.json()).catch(()=>null);
      if (m && spark && spark.getContext){
        const ctx = spark.getContext('2d');
        ctx.clearRect(0,0,spark.width,spark.height);
        const vals = [m.latency_ms?.p50||0, m.latency_ms?.p90||0, m.latency_ms?.p99||0];
        const max = Math.max(1, ...vals);
        ctx.fillStyle = 'rgba(242,212,96,0.6)';
        vals.forEach((v,i)=>{ const h = Math.max(2, (v/max) * (spark.height-4)); ctx.fillRect(4 + i*38, spark.height - h - 2, 24, h); });
      }
    } catch(_){}
  }
  setInterval(refreshStatus, 5000);
  refreshStatus();
  // Drag & drop analyze
  if (dropzone && input) {
    dropzone.addEventListener('dragover', (e)=>{ e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', ()=> dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e)=>{ e.preventDefault(); dropzone.classList.remove('dragover'); input.files = e.dataTransfer.files; toast(`${input.files.length} file(s) ready`); });
  }

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = String(message || '');
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 1600);
  }

  async function loadLibrary(page=1) {
    if (!grid) return;
    grid.innerHTML = '<div class="skeleton" style="height:140px"></div>';
    const j = await (async () => {
      if (offlineToggle && offlineToggle.checked) {
        const res = await fetch('./mock_data.json');
        return res.json();
      } else {
        const qs = new URLSearchParams({ page: String(page), per_page: '20' });
        const res = await fetch('/library?' + qs.toString());
        return res.json();
      }
    })();
    let tracks = j.tracks || [];
    // Search by filename or mood
    try {
      const q = (search && search.value || '').toLowerCase().trim();
      if (q) tracks = tracks.filter(t => String(t.filename||'').toLowerCase().includes(q) || String(t.tags?.mood||'').toLowerCase().includes(q));
    } catch(_){ }
    // Apply client-side filters
    try {
      const keyVal = filterKey && filterKey.value || '';
      const moodVal = filterMood && filterMood.value || '';
      const bpmOn = filterBpmEnabled && filterBpmEnabled.checked;
      const bpmMin = Number(filterBpmMin && filterBpmMin.value || 0) || 0;
      const bpmMax = Number(filterBpmMax && filterBpmMax.value || 1000) || 1000;
      tracks = tracks.filter(t => {
        const okKey = !keyVal || t.key_guess === keyVal;
        const okMood = !moodVal || (t.tags && t.tags.mood === moodVal);
        const okBpm = !bpmOn || ((t.tempo_bpm||0) >= bpmMin && (t.tempo_bpm||0) <= bpmMax);
        return okKey && okMood && okBpm;
      });
    } catch(_){}
    lastLibrary = tracks;
    // pagination state
    let pageState = { page, pages: 1, total: tracks.length, slice: tracks };
    try {
      const mod = await import('./pagination.js');
      pageState = mod.paginate(tracks, page, 20);
    } catch(_) {}
    grid.innerHTML = pageState.slice.map((t,i) => (
      `<div class="card ${selectionMode?'selectable':''}" data-tid="${t.id}">`+
      `<div class="eq-mini" aria-hidden="true">`+
      `<span></span><span></span><span></span><span></span>`+
      `<span></span><span></span><span></span><span></span>`+
      `</div>`+
      `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:.5rem">`+
      `<div style="font-weight:600">${t.filename}</div>`+
      `<span class="badge badge-muted">${t.tempo_bpm} bpm</span>`+
      `</div>`+
      `<div class="muted" style="font-size:.9rem">Key ${t.key_guess} • ${t.tags?.mood || ''}</div>`+
      `<div class="controls" style="margin-top:.5rem">`+
      `<button data-tid="${t.id}" class="play-btn" title="Play">▶</button>`+
      `<button data-tid="${t.id}" class="pause-btn" title="Pause">⏸</button>`+
      `<button data-tid="${t.id}" class="prev-btn" title="Rewind">⏮</button>`+
      `<button data-tid="${t.id}" class="next-btn" title="Fast‑forward">⏭</button>`+
      `<button data-tid="${t.id}" class="detail-btn">Detail</button>`+
      `<button data-tid="${t.id}" class="similar-btn">Similar</button>`+
      `<button data-tid="${t.id}" class="report-btn">Report (PDF)</button>`+
      `<button data-tid="${t.id}" class="loop-btn">Loop ▶</button>`+
      `<button data-tid="${t.id}" class="fav-btn ${favorites.has(t.id)?'fav-active':''}">★</button>`+
      `</div>`+
      `</div>`
    )).join('');
    // render pager
    const pager = document.getElementById('pager');
    try {
      const mod = await import('./pagination.js');
      mod.renderPager(pager, pageState, (p)=> loadLibrary(p));
    } catch(_) {}

    // No canvas waveform; using animated EQ bars

    // Bind actions
    if (selectionMode){
      grid.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', (e)=>{
          if (!selectionMode) return;
          const tid = card.getAttribute('data-tid');
          if (selectedIds.has(tid)) { selectedIds.delete(tid); card.classList.remove('selected'); }
          else { selectedIds.add(tid); card.classList.add('selected'); }
        });
      });
    }
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

    // Loop preview
    grid.querySelectorAll('.loop-btn').forEach(btn => btn.addEventListener('click', async (ev) => {
      playClick();
      const tid = ev.currentTarget.getAttribute('data-tid');
      const t = lastLibrary.find(x=>x.id===tid);
      if (!t) return;
      const url = t.loop || t.preview || t.spectrogram_png || null;
      if (!url){ toast('No loop available'); return; }
      try {
        const audio = new Audio(url);
        audio.loop = true; audio.play();
        toast('Playing loop...');
      } catch(_){ toast('Failed to play'); }
    }));

    // Transport per-card (demo: simple beeps using WebAudio)
    function beep(freq, durMs){
      audioCtx = audioCtx || new AudioContext();
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.type='sine'; o.frequency.value = freq; g.gain.value=0.001; g.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (durMs||200)/1000);
      o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + (durMs||200)/1000);
    }
    grid.querySelectorAll('.play-btn').forEach(btn=> btn.addEventListener('click', ()=> beep(660,220)));
    grid.querySelectorAll('.pause-btn').forEach(btn=> btn.addEventListener('click', ()=> beep(330,140)));
    grid.querySelectorAll('.prev-btn').forEach(btn=> btn.addEventListener('click', ()=> beep(440,160)));
    grid.querySelectorAll('.next-btn').forEach(btn=> btn.addEventListener('click', ()=> beep(880,120)));

    // Favorites
    grid.querySelectorAll('.fav-btn').forEach(btn => btn.addEventListener('click', (ev)=>{
      const tid = ev.currentTarget.getAttribute('data-tid');
      if (favorites.has(tid)) { favorites.delete(tid); ev.currentTarget.classList.remove('fav-active'); }
      else { favorites.add(tid); ev.currentTarget.classList.add('fav-active'); }
    }));
  }
  if (reloadLib) reloadLib.addEventListener('click', () => { playClick(); loadLibrary(); });
  if (applyFilters) applyFilters.addEventListener('click', ()=> { playClick(); loadLibrary(1); });
  if (search) search.addEventListener('input', ()=> loadLibrary(1));
  if (selectToggle) selectToggle.addEventListener('click', ()=> { selectionMode = !selectionMode; toast(selectionMode? 'Selection ON' : 'Selection OFF'); loadLibrary(); });
  if (shortcutsBtn && shortcuts) shortcutsBtn.addEventListener('click', ()=> shortcuts.classList.add('show'));
  if (shortcutsClose && shortcuts) shortcutsClose.addEventListener('click', ()=> shortcuts.classList.remove('show'));

  if (tagSelectedBtn) tagSelectedBtn.addEventListener('click', async ()=>{
    if (!selectedIds.size) { toast('Select some tracks first'); return; }
    const mood = prompt('Enter mood tag for selected (e.g., chill, energetic)');
    if (!mood) return;
    lastLibrary.forEach(t=>{ if (selectedIds.has(t.id)) { t.tags = t.tags || {}; t.tags.mood = mood; } });
    toast(`Tagged ${selectedIds.size} track(s) with '${mood}'`);
    loadLibrary();
  });

  if (exportSelectedCsvBtn) exportSelectedCsvBtn.addEventListener('click', ()=>{
    if (!selectedIds.size){ toast('No selection'); return; }
    const header = ['id','filename','tempo_bpm','key_guess'];
    const rows = lastLibrary.filter(t=>selectedIds.has(t.id)).map(t=> header.map(h => t[h] ?? '').join(','));
    const blob = new Blob([header.join(',') + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download='selected.csv'; a.click(); URL.revokeObjectURL(url);
  });

  // Tap tempo and Metronome
  let taps = [];
  if (tapBtn) tapBtn.addEventListener('click', ()=>{
    const now = performance.now(); taps.push(now); if (taps.length > 8) taps.shift();
    if (taps.length >= 2){ const diffs = []; for (let i=1;i<taps.length;i++) diffs.push(taps[i]-taps[i-1]);
      const avg = diffs.reduce((a,b)=>a+b,0)/diffs.length; const bpm = Math.round(60000/avg);
      if (tapBpm) tapBpm.textContent = String(bpm);
      if (metroToggle && metroToggle.checked) startMetronome(bpm);
    }
  });
  let metroTimer=null;
  function startMetronome(bpm){
    stopMetronome();
    const interval = Math.max(150, 60000/Math.max(40, Math.min(240, bpm||120)));
    metroTimer = setInterval(()=>{ playClick(); }, interval);
  }
  function stopMetronome(){ if (metroTimer){ clearInterval(metroTimer); metroTimer=null; } }
  if (metroToggle) metroToggle.addEventListener('change', ()=>{
    const bpm = Number((tapBpm && tapBpm.textContent) || 120) || 120;
    if (metroToggle.checked) startMetronome(bpm); else stopMetronome();
  });

  // Key trainer
  function initKeyTrainer(){
    if (!keyTrainer) return;
    const keys = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    keyTrainer.innerHTML = keys.map(k=>`<button class="kt" data-k="${k}">${k}</button>`).join('');
    keyTrainer.querySelectorAll('button.kt').forEach(btn=> btn.addEventListener('click', ()=> playToneForKey(btn.getAttribute('data-k'))));
  }
  initKeyTrainer();

  // Agent: auto-tag selection (simple rules)
  if (agentAutotag) agentAutotag.addEventListener('click', ()=>{
    if (!selectedIds.size){ toast('Select some tracks'); return; }
    let changed=0; lastLibrary.forEach(t=>{
      if (!selectedIds.has(t.id)) return;
      const bpm = t.tempo_bpm||0; const isMinor = /m$/.test(String(t.key_guess||''));
      const mood = bpm>120 && !isMinor ? 'energetic' : bpm<90 && isMinor ? 'dark' : 'chill';
      t.tags = t.tags || {}; if (t.tags.mood !== mood){ t.tags.mood = mood; changed++; }
    });
    agentOutput.textContent = changed ? `Auto‑tagged mood for ${changed} track(s).` : 'No changes applied.';
    loadLibrary();
  });

  if (compareBtn) compareBtn.addEventListener('click', ()=>{
    if (selectedIds.size !== 2) { toast('Select exactly 2 tracks'); return; }
    const [aId,bId] = Array.from(selectedIds);
    const a = lastLibrary.find(x=>x.id===aId); const b = lastLibrary.find(x=>x.id===bId);
    if (!a || !b) return;
    const modal = document.createElement('div'); modal.className='detail show';
    modal.innerHTML = `
      <div class="detail-inner">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
          <h3 style="margin:0">Compare A/B</h3>
          <button id="cmp-close">Close</button>
        </div>
        <div class="grid">
          <div class="card"><b>${a.filename}</b><div class="muted">BPM ${a.tempo_bpm} • Key ${a.key_guess}</div><canvas id="cmp-a-radar" width="360" height="260"></canvas></div>
          <div class="card"><b>${b.filename}</b><div class="muted">BPM ${b.tempo_bpm} • Key ${b.key_guess}</div><canvas id="cmp-b-radar" width="360" height="260"></canvas></div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    import('./charts.js').then(mod=>{
      mod.drawRadar(document.getElementById('cmp-a-radar'), a.features?.mfcc_mean || []);
      mod.drawRadar(document.getElementById('cmp-b-radar'), b.features?.mfcc_mean || []);
    }).catch(()=>{});
    modal.querySelector('#cmp-close').addEventListener('click', ()=> modal.remove());
  });

  if (smartPlaylistBtn) smartPlaylistBtn.addEventListener('click', ()=>{
    if (!lastLibrary.length) { toast('No tracks loaded'); return; }
    const start = lastLibrary[0];
    const remaining = lastLibrary.slice(1);
    const order = [start];
    let cur = start;
    while (remaining.length){
      let bestIdx = 0, bestD = Infinity;
      for (let i=0;i<remaining.length;i++){
        const d = l2(cur.features.mfcc_mean, remaining[i].features.mfcc_mean);
        if (d < bestD){ bestD = d; bestIdx = i; }
      }
      const next = remaining.splice(bestIdx,1)[0];
      order.push(next); cur = next;
    }
    const modal = document.createElement('div'); modal.className='detail show';
    modal.innerHTML = `
      <div class="detail-inner">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
          <h3 style="margin:0">Smart Playlist</h3>
          <button id="pl-close">Close</button>
        </div>
        <ol id="playlist-ol" style="padding-left:1.2rem"></ol>
      </div>`;
    document.body.appendChild(modal);
    const ol = modal.querySelector('#playlist-ol');
    ol.innerHTML = order.map(t=>`<li>${t.filename} <span class="muted">(${t.tempo_bpm} bpm • ${t.key_guess})</span></li>`).join('');
    modal.querySelector('#pl-close').addEventListener('click', ()=> modal.remove());
  });

  // Prompt-based playlist: simple rule-based filter on tags and tempo
  if (promptPlaylistBtn) promptPlaylistBtn.addEventListener('click', ()=>{
    if (!lastLibrary.length) { toast('No tracks loaded'); return; }
    const p = prompt('Describe the playlist (e.g., "fast energetic minor key")');
    if (!p) return;
    const wantFast = /fast|quick|upbeat|energetic/.test(p.toLowerCase());
    const wantSlow = /slow|chill|ambient|calm/.test(p.toLowerCase());
    const wantMinor = /minor|dark/.test(p.toLowerCase());
    const wantMajor = /major|happy|bright/.test(p.toLowerCase());
    const out = lastLibrary.filter(t => {
      const bpm = t.tempo_bpm||0; const key = String(t.key_guess||''); const mood = String(t.tags?.mood||'').toLowerCase();
      const okFast = !wantFast || bpm >= 120; const okSlow = !wantSlow || bpm <= 90;
      const okMinor = !wantMinor || /m$/.test(key) || /dark/.test(mood);
      const okMajor = !wantMajor || !/m$/.test(key);
      return okFast && okSlow && okMinor && okMajor;
    }).slice(0, 20);
    if (!out.length) { toast('No matches for prompt'); return; }
    const modal = document.createElement('div'); modal.className='detail show';
    modal.innerHTML = `
      <div class="detail-inner">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
          <h3 style="margin:0">Prompt Playlist</h3>
          <button id="pp-close">Close</button>
        </div>
        <ol id="pp-ol" style="padding-left:1.2rem"></ol>
      </div>`;
    document.body.appendChild(modal);
    const ol = modal.querySelector('#pp-ol');
    ol.innerHTML = out.map(t=>`<li>${t.filename} <span class="muted">(${t.tempo_bpm} bpm • ${t.key_guess})</span></li>`).join('');
    modal.querySelector('#pp-close').addEventListener('click', ()=> modal.remove());
  });

  // Similarity map (2D via naive PCA on MFCC means)
  if (mapToggleBtn) mapToggleBtn.addEventListener('click', ()=>{
    const sec = document.getElementById('map-section');
    if (!sec) return;
    sec.style.display = (sec.style.display === 'none' || !sec.style.display) ? 'block' : 'none';
    if (sec.style.display === 'block') drawMap();
  });
  function drawMap(){
    try {
      const canvas = document.getElementById('map-canvas'); if (!canvas) return; const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const feats = lastLibrary.map(t => (t.features?.mfcc_mean || []).slice(0,12));
      if (!feats.length) return;
      // mean center
      const dim = feats[0].length; const mean = new Array(dim).fill(0);
      feats.forEach(v => v.forEach((x,i)=> mean[i]+=x)); mean.forEach((_,i)=> mean[i]/=feats.length);
      const X = feats.map(v => v.map((x,i)=> x-mean[i]));
      // naive 2D projection using first two dims (placeholder for PCA)
      const pts = X.map(v => ({ x:v[0]||0, y:v[1]||0 }));
      // scale to canvas
      const xs = pts.map(p=>p.x), ys = pts.map(p=>p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      const pad = 30;
      function sx(val){ return pad + (val - minX) / (maxX - minX + 1e-6) * (canvas.width - pad*2); }
      function sy(val){ return canvas.height - pad - (val - minY) / (maxY - minY + 1e-6) * (canvas.height - pad*2); }
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0,0,canvas.width,canvas.height);
      lastLibrary.forEach((t,i)=>{
        const x = sx(pts[i].x); const y = sy(pts[i].y);
        ctx.fillStyle = 'rgba(242,212,96,0.9)'; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText(String(t.filename||'').slice(0,18), x+8, y-8);
      });
    } catch(_){ }
  }

  // Insights rendering with mock reports and smart detail
  function renderInsights(){
    const list = document.getElementById('insights-list');
    const detail = document.getElementById('insight-detail');
    if (!list || !detail) return;
    // Build from current library if available; otherwise show defaults
    const items = (lastLibrary && lastLibrary.length ? lastLibrary : [
      { id:'one-dance', filename:'Drake — One Dance', actions:['pdf'] }
    ]);
    list.innerHTML = items.map(t=> `
      <div class="item" data-id="${t.id}">
        <h4>${t.filename || t.title}</h4>
        <div class="controls">
          <button data-tid="${t.id}" class="small play">▶</button>
          <button data-tid="${t.id}" class="small pause">⏸</button>
          <button data-tid="${t.id}" class="small prev">⏮</button>
          <button data-tid="${t.id}" class="small next">⏭</button>
          <button data-act="pdf" data-id="${t.id}">Export PDF</button>
        </div>
      </div>`).join('');

    function showDetail(id){
      if (id === 'one-dance') {
        detail.innerHTML = `
          <div class="card">
            <h3 style="margin:0 0 .25rem 0">One Dance — Drake</h3>
            <div class="muted">Smart Analysis (Feature Radar)</div>
            <div style="margin-top:.6rem;display:flex;justify-content:center">
              <canvas id="ins-radar" width="420" height="300" style="max-width:100%"></canvas>
            </div>
            <div class="card" style="margin-top:.6rem">
              <h4 style="margin:0 0 .25rem 0">Energy vs Valence (Mood Map)</h4>
              <canvas id="ins-mood" width="560" height="280" style="width:100%;max-width:560px;display:block;margin:0 auto"></canvas>
              <div class="muted" style="text-align:center;margin-top:.25rem;font-size:.85rem">Dots show library tracks (highlight = One Dance)</div>
            </div>
            <div style="margin-top:.6rem">
              <h4>Summary</h4>
              <p>One Dance blends dancehall, afrobeats, and house influences with a steady four-on-the-floor rhythm around ~104 bpm. Harmony centres on a minor tonal area with sparse voicings, syncopated keys, and a deep bass groove. Vocals use repetitive, hook-driven phrases and call‑and‑response textures.</p>
              <h4>Chord Structure & Harmony</h4>
              <ul>
                <li>Key: B minor (relative D major colour in hooks)</li>
                <li>Common loop: Bm – D – A – F#m (vi – I – V – iii in D)</li>
                <li>Voicings: short, sustained synth pads; low‑passed keys; occasional suspensions</li>
                <li>Bass: repetitive ostinato locking tight with kick pattern</li>
              </ul>
              <h4>Rhythm & Style</h4>
              <ul>
                <li>Tempo: ~104 bpm; swing‑lite offbeats; syncopated hats</li>
                <li>Afrobeats/dancehall accents with modern pop/house production polish</li>
              </ul>
              <h4>AI Evaluations</h4>
              <ul>
                <li>Danceability: Very high — consistent groove and minimal harmonic friction</li>
                <li>Energy: Moderate — emphasis on groove over aggression</li>
                <li>Valence: Medium — minor harmony balanced by warm timbres</li>
                <li>Hook Strength: High — repetitive melodic motifs and rhythm</li>
              </ul>
              <h4>Production Notes</h4>
              <ul>
                <li>Side‑chained bass/kick interaction; subtle saturation on low mids</li>
                <li>Short plate/room reverbs; mono‑compatible percussion; wide pads</li>
              </ul>
            </div>
          </div>`;
        try {
          // Draw labeled radar with meaningful axes
          const radarCanvas = document.getElementById('ins-radar');
          const labels = ['Danceability','Energy','Valence','Acousticness','Speechiness','Instrumentalness','Liveness'];
          const values = [0.9, 0.65, 0.55, 0.35, 0.08, 0.1, 0.2];
          if (radarCanvas && radarCanvas.getContext){
            const ctx = radarCanvas.getContext('2d');
            const w = radarCanvas.width, h = radarCanvas.height; const cx = w/2, cy = h/2 + 10; const r = Math.min(w,h)*0.35;
            ctx.clearRect(0,0,w,h);
            ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.fillStyle = 'rgba(242,212,96,0.15)'; ctx.lineWidth = 1;
            const N = labels.length;
            // grid rings
            for (let ring=1; ring<=4; ring++){
              const rr = (r*ring)/4; ctx.beginPath(); for(let i=0;i<N;i++){ const a = -Math.PI/2 + (i/N)*Math.PI*2; const x = cx + rr*Math.cos(a); const y = cy + rr*Math.sin(a); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.closePath(); ctx.stroke();
            }
            // axes + labels
            ctx.fillStyle = 'rgba(234,231,242,0.9)'; ctx.font = '12px Montserrat, sans-serif';
            for (let i=0;i<N;i++){
              const a = -Math.PI/2 + (i/N)*Math.PI*2; const x = cx + r*Math.cos(a); const y = cy + r*Math.sin(a);
              ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.stroke();
              const lx = cx + (r+18)*Math.cos(a); const ly = cy + (r+18)*Math.sin(a);
              ctx.textAlign = Math.cos(a) > 0.2 ? 'left' : Math.cos(a) < -0.2 ? 'right' : 'center';
              ctx.textBaseline = Math.abs(Math.sin(a)) < 0.2 ? 'middle' : (Math.sin(a) > 0 ? 'top' : 'alphabetic');
              ctx.fillText(labels[i], lx, ly);
            }
            // polygon
            ctx.beginPath();
            for (let i=0;i<N;i++){
              const a = -Math.PI/2 + (i/N)*Math.PI*2; const rr = r * Math.max(0, Math.min(1, values[i]));
              const x = cx + rr*Math.cos(a); const y = cy + rr*Math.sin(a);
              if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            }
            ctx.closePath(); ctx.fillStyle = 'rgba(242,212,96,0.22)'; ctx.fill(); ctx.strokeStyle='rgba(242,212,96,0.8)'; ctx.stroke();
          }
          // Mood map (multi-point): plot library energy/valence with highlight and simple mood heuristics
          const mood = document.getElementById('ins-mood');
          if (mood && mood.getContext){
            const ctx = mood.getContext('2d'); const w=mood.width, h=mood.height; ctx.clearRect(0,0,w,h);
            // axes
            ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(40,h-30); ctx.lineTo(w-20,h-30); ctx.stroke(); ctx.beginPath(); ctx.moveTo(40,h-30); ctx.lineTo(40,20); ctx.stroke();
            ctx.fillStyle='rgba(234,231,242,0.8)'; ctx.font='12px Montserrat,sans-serif'; ctx.fillText('Energy →', w-90, h-12);
            ctx.save(); ctx.translate(18, 40); ctx.rotate(-Math.PI/2); ctx.fillText('Valence →', 0,0); ctx.restore();
            // helpers
            function px(e){ return 40 + e * (w-60); }
            function py(v){ return (h-30) - v * (h-60); }
            // approximate energy/valence from tempo, key, and mood tag
            function estimatePoint(t){
              const tempo = Number(t.tempo_bpm||0);
              let energy = Math.min(1, Math.max(0.05, tempo/200));
              const moodTag = String(t.tags?.mood||'').toLowerCase();
              if (/energetic|upbeat|anthemic/.test(moodTag)) energy = Math.min(1, energy + 0.15);
              if (/calm|ambient|chill|tranquil/.test(moodTag)) energy = Math.max(0, energy - 0.15);
              const isMinor = /m$/.test(String(t.key_guess||''));
              let valence = isMinor ? 0.4 : 0.65;
              if (/happy|bright/.test(moodTag)) valence = Math.min(1, valence + 0.2);
              if (/dark|sad|melanch/.test(moodTag)) valence = Math.max(0, valence - 0.2);
              return { e: energy, v: valence };
            }
            // plot all library items if available
            const all = (lastLibrary||[]);
            all.slice(0,120).forEach(t=>{
              const { e, v } = estimatePoint(t);
              const x = px(e), y = py(v);
              ctx.fillStyle = 'rgba(255,255,255,0.28)';
              ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
            });
            // highlight One Dance
            const tempo = 104; const energy = Math.min(1, Math.max(0, tempo/200));
            const isMinor = true; const valence = isMinor ? 0.45 : 0.7;
            const x = px(energy); const y = py(valence);
            ctx.fillStyle='rgba(255,80,80,0.95)'; ctx.beginPath(); ctx.arc(x,y,7,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle='rgba(255,80,80,0.9)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,7,0,Math.PI*2); ctx.stroke();
            ctx.fillStyle='rgba(255,80,80,0.95)'; ctx.fillText('One Dance', x+10, y-10);
          }
        } catch(_) {}
      } else if (id === 'library-overview') {
        detail.innerHTML = `<div class="card"><h3 style="margin:0 0 .25rem 0">Library Overview</h3><p class="muted">Top keys, moods, and tempo distribution across your library.</p></div>`;
      } else if (id === 'mood-trends') {
        detail.innerHTML = `<div class="card"><h3 style="margin:0 0 .25rem 0">Mood Trends</h3><p class="muted">Recent mood changes and outliers detected by the tagging agent.</p></div>`;
      }
    }

    list.querySelectorAll('.item').forEach(el => el.addEventListener('click', ()=> showDetail(el.getAttribute('data-id'))));
    list.querySelectorAll('button').forEach(btn => btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const act = btn.getAttribute('data-act');
      const id = btn.getAttribute('data-id');
      if (act === 'pdf') { window.open('/report', '_blank'); toast('Exporting PDF (mock)'); }
    }));
    // tiny transport
    function beep(freq, durMs){
      audioCtx = audioCtx || new AudioContext();
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.type='sine'; o.frequency.value = freq; g.gain.value=0.001; g.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (durMs||180)/1000);
      o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + (durMs||180)/1000);
    }
    list.querySelectorAll('.play').forEach(b=> b.addEventListener('click', ()=> beep(660,200)));
    list.querySelectorAll('.pause').forEach(b=> b.addEventListener('click', ()=> beep(330,140)));
    list.querySelectorAll('.prev').forEach(b=> b.addEventListener('click', ()=> beep(440,160)));
    list.querySelectorAll('.next').forEach(b=> b.addEventListener('click', ()=> beep(880,120)));
    showDetail('one-dance');
  }

  // Removed mini player behavior

  // Lightweight agentic helpers (rule-based)
  function renderList(selector, items){
    const el = document.querySelector(selector);
    if (!el) return;
    el.innerHTML = items.map(s=>`<li>${s}</li>`).join('');
  }
  function summarizeLibrary(){
    const n = lastLibrary.length;
    const avgTempo = Math.round((lastLibrary.reduce((a,t)=>a+(t.tempo_bpm||0),0) / (n||1))||0);
    const keys = {};
    lastLibrary.forEach(t=>{ const k=t.key_guess; if(k) keys[k]=(keys[k]||0)+1; });
    const topKey = Object.entries(keys).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'unknown';
    const moods = {}; lastLibrary.forEach(t=>{ const m=t.tags?.mood; if(m) moods[m]=(moods[m]||0)+1; });
    const topMoods = Object.entries(moods).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([m,c])=>`${m} (${c})`).join(', ');
    return `Tracks: ${n}. Avg tempo: ${avgTempo} bpm. Common key: ${topKey}. Top moods: ${topMoods || 'n/a'}.`;
  }
  function pickDanceable(){
    const ok = lastLibrary.filter(t => (t.tempo_bpm||0) >= 110 && (t.tempo_bpm||0) <= 135 && !/m$/.test(String(t.key_guess||'')));
    return ok.slice(0, 15);
  }
  function pickAmbient(){
    const ok = lastLibrary.filter(t => (t.tempo_bpm||0) <= 90 && (/m$/.test(String(t.key_guess||'')) || /chill|ambient|dark/i.test(String(t.tags?.mood||''))));
    return ok.slice(0, 15);
  }
  function refreshInsights(){
    const items = [];
    if (lastLibrary.length){
      const tempos = lastLibrary.map(t=>t.tempo_bpm||0).sort((a,b)=>a-b);
      const mid = tempos[Math.floor(tempos.length/2)]||0;
      items.push(`Median tempo: ${mid} bpm`);
      const keys = {}; lastLibrary.forEach(t=>{ const k=t.key_guess; if(k) keys[k]=(keys[k]||0)+1; });
      const rare = Object.entries(keys).sort((a,b)=>a[1]-b[1])[0]?.[0]; if (rare) items.push(`Rarest key: ${rare}`);
      const moodCounts = {}; lastLibrary.forEach(t=>{ const m=t.tags?.mood; if(m) moodCounts[m]=(moodCounts[m]||0)+1; });
      const topMood = Object.entries(moodCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]; if (topMood) items.push(`Dominant mood: ${topMood}`);
    }
    renderList('#insights-list', items);
  }
  if (agentDance) agentDance.addEventListener('click', ()=>{
    const picks = pickDanceable();
    agentOutput.textContent = picks.length ? `Danceable set (${picks.length}): `+picks.map(t=>t.filename).join(', ') : 'No suitable tracks found.';
  });
  if (agentAmbient) agentAmbient.addEventListener('click', ()=>{
    const picks = pickAmbient();
    agentOutput.textContent = picks.length ? `Ambient set (${picks.length}): `+picks.map(t=>t.filename).join(', ') : 'No suitable tracks found.';
  });
  if (agentSummarize) agentSummarize.addEventListener('click', ()=>{
    agentOutput.textContent = summarizeLibrary();
  });

  // Tone preview on detail key
  function playToneForKey(key){
    const map = {C:261.63,'C#':277.18,Db:277.18,D:293.66,'D#':311.13,Eb:311.13,E:329.63,F:349.23,'F#':369.99,Gb:369.99,G:392.00,'G#':415.30,Ab:415.30,A:440.00,'A#':466.16,Bb:466.16,B:493.88,Am:440.00,Em:329.63,Dm:293.66,Gm:392.00};
    const f = map[key] || 440.0;
    audioCtx = audioCtx || new AudioContext();
    const o = audioCtx.createOscillator(); const g=audioCtx.createGain();
    o.type='sine'; o.frequency.setValueAtTime(f, audioCtx.currentTime);
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.42);
  }
  // Initial load
  loadLibrary().catch(() => {});

  // Chat assistant wiring
  function appendChat(role, text){
    if (!chatLog) return;
    const div = document.createElement('div');
    div.className = 'chat-msg ' + (role === 'user' ? 'user' : 'bot');
    div.textContent = String(text||'');
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  if (openChat && chat) openChat.addEventListener('click', () => { chat.classList.add('show'); if (chatText) chatText.focus(); });
  if (chatClose && chat) chatClose.addEventListener('click', () => chat.classList.remove('show'));
  if (chatForm) chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = (chatText && chatText.value || '').trim();
    if (!q) return;
    appendChat('user', q); if (chatText) chatText.value = '';
    try {
      let reply;
      if (offlineToggle && offlineToggle.checked){
        // Offline: rule-based on current library
        reply = offlineChat(q, lastLibrary);
      } else {
        const r = await fetch('/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: q }) });
        const j = await r.json();
        reply = j.reply || '...';
      }
      appendChat('bot', reply);
    } catch(err){ appendChat('bot', 'Error answering your question.'); }
  });

  function offlineChat(q, tracks){
    q = String(q||'').toLowerCase();
    const avg = (xs)=> xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : 0;
    if (!tracks || !tracks.length) return 'Library is empty in offline mode.';
    if (q.includes('tempo') || q.includes('bpm')){
      const vals = tracks.map(t=>Number(t.tempo_bpm||0)).filter(Boolean);
      const a = avg(vals).toFixed(0);
      const maxT = tracks.reduce((m,t)=> (t.tempo_bpm||0)>(m.tempo_bpm||0)?t:m, tracks[0]);
      const minT = tracks.reduce((m,t)=> (t.tempo_bpm||0)<(m.tempo_bpm||0)?t:m, tracks[0]);
      return `Average tempo ~${a} bpm. Fastest: ${maxT.filename} (${maxT.tempo_bpm} bpm). Slowest: ${minT.filename} (${minT.tempo_bpm} bpm).`;
    }
    if (q.includes('key')){
      const counts = {}; tracks.forEach(t=>{ const k=t.key_guess; if(k) counts[k]=(counts[k]||0)+1; });
      const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
      return top ? `Most common key is ${top[0]}.` : 'No key info available.';
    }
    if (q.includes('mood') || q.includes('genre') || q.includes('tag')){
      const counts = {}; tracks.forEach(t=>{ const m=t.tags?.mood; if(m) counts[m]=(counts[m]||0)+1; });
      const top3 = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([m,c])=>`${m} (${c})`).join(', ');
      return top3 ? `Top moods: ${top3}.` : 'No mood tags yet.';
    }
    if (q.includes('recommend') || q.includes('similar') || q.includes('like')){
      const base = tracks[0];
      const dists = tracks.slice(1).map(x=>({ t:x, d:l2(base.features.mfcc_mean, x.features.mfcc_mean) })).sort((a,b)=>a.d-b.d).slice(0,3);
      return dists.length ? `Try: ${dists.map(x=>x.t.filename).join(', ')}.` : 'Need more tracks to recommend.';
    }
    const vals = tracks.map(t=>Number(t.tempo_bpm||0)).filter(Boolean);
    return `Library has ${tracks.length} track(s). Avg tempo ~${avg(vals).toFixed(0)} bpm. Ask about tempo, key, mood, or say recommend.`;
  }

  // Hash-based tabs
  function setActiveTab(name) {
    [tabAnalyze, tabExplore, tabInsights, tabGenerate].forEach(el => { if (el){ el.classList.remove('active'); el.setAttribute('aria-selected','false'); }});
    [panelAnalyze, panelExplore, panelInsights, panelGenerate].forEach(el => el && el.classList.remove('active'));
    if (name === 'explore') { if (tabExplore){ tabExplore.classList.add('active'); tabExplore.setAttribute('aria-selected','true'); } panelExplore?.classList.add('active'); }
    else if (name === 'insights') { if (tabInsights){ tabInsights.classList.add('active'); tabInsights.setAttribute('aria-selected','true'); } panelInsights?.classList.add('active'); renderInsights(); }
    else if (name === 'generate') { if (tabGenerate){ tabGenerate.classList.add('active'); tabGenerate.setAttribute('aria-selected','true'); } panelGenerate?.classList.add('active'); }
    else { if (tabAnalyze){ tabAnalyze.classList.add('active'); tabAnalyze.setAttribute('aria-selected','true'); } panelAnalyze?.classList.add('active'); }
  }
  function onHashChange() {
    const name = (location.hash || '#analyze').replace('#','');
    setActiveTab(name);
  }
  window.addEventListener('hashchange', onHashChange);
  onHashChange();

  // Generation logic (offline mock)
  function generateLyrics(prompt, lang, rhyme){
    const themes = (prompt||'').split(/[,\s]+/).filter(Boolean).slice(0,6);
    const lines = [];
    function L(words){ return words[Math.floor(Math.random()*words.length)]; }
    const ends = ['light','night','fire','desire','higher','wire','alone','home','tone','unknown'];
    for (let v=0; v<2; v++){
      lines.push(`${L(themes)||'Midnight'} ${L(['city','ocean','neon','summer','shadow'])} ${L(['glow','flow','call','slow'])}`);
      lines.push(`${L(['we','i','you'])} ${L(['chase','feel','hear','ride'])} the ${L(['beat','waves','rhythm','echo'])} tonight`);
      lines.push(`${L(['hold','keep','breathe','stay'])} me ${L(['closer','tighter','softer','near'])}`);
      lines.push(`till the ${L(['morning','sunrise','daylight'])} ${L(['comes','arrives','returns'])}`);
      lines.push('');
    }
    lines.push('[Chorus]');
    lines.push(`${L(['dance','run','rise'])} with me through the ${L(['night','fire','storm'])}`);
    lines.push(`${L(['hearts','hands','voices'])} in ${L(['time','sync','line'])}, we burn so ${L(['bright','high','true'])}`);
    lines.push(`${L(['don\'t','never'])} let go, take me ${L(['higher','home','over'])}`);
    lines.push('');
    return lines.join('\n');
  }
  function randomizeGen(){
    if (genGenre) genGenre.value = ['pop','hiphop','edm','rnb','rock','ambient','classical'][Math.floor(Math.random()*7)];
    if (genMood) genMood.value = ['happy','energetic','chill','dark','melancholic'][Math.floor(Math.random()*5)];
    if (genKey) genKey.value = ['C','G','D','A','E','F','Am','Em','Dm','Gm'][Math.floor(Math.random()*10)];
    if (genBpm) genBpm.value = String(80 + Math.floor(Math.random()*81));
    if (genDuration) genDuration.value = String(15 + Math.floor(Math.random()*91));
    if (genCreativity) genCreativity.value = String((Math.random()).toFixed(2));
    if (genSeed) genSeed.value = String(Math.floor(Math.random()*1000000));
  }
  if (genRandomize) genRandomize.addEventListener('click', ()=> randomizeGen());
  if (genForm && genResults) genForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    genResults.innerHTML = '<div class="skeleton" style="height:120px"></div>';
    const meta = {
      genre: genGenre?.value, mood: genMood?.value, key: genKey?.value,
      bpm: Number(genBpm?.value||110), duration: Number(genDuration?.value||30),
      creativity: Number(genCreativity?.value||0.5), seed: Number(genSeed?.value||0),
      vocals: genVocals?.value || 'vocal'
    };
    const lyrics = generateLyrics(genLyricsPrompt?.value||'', genLanguage?.value||'en', genRhyme?.value||'AABB');
    // Online try backend /generate, else offline mock
    let resolved = null;
    if (offlineToggle && !offlineToggle.checked) {
      try {
        const r = await fetch('/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: (genDescribe?.value||genLyricsPrompt?.value||''), engine: genEngine?.value || 'melody', ...meta }) });
        resolved = await r.json();
      } catch(_) {}
    }
    const nowId = 'gen-' + String(Date.now());
    const audioUrl = resolved?.web_path || '/assets/ma-logo.png';
    const mock = { id: nowId, filename: `${meta.genre}-${meta.mood}-gen-${nowId}.mp3`, tempo_bpm: meta.bpm, key_guess: meta.key, tags:{ mood: meta.mood }, preview: audioUrl, features:{ mfcc_mean:[0.1,0.12,0.09,0.07,0.12,0.1,0.09] } };
    genResults.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
          <b>Generated Track</b>
          <div class="row">
            <button id="gen-add-lib">Add to Library</button>
            <button id="gen-dl-wav">Download WAV</button>
            <button id="gen-dl-mp3">Download MP3</button>
          </div>
        </div>
        <div class="muted">${mock.filename} • ${meta.bpm} bpm • Key ${meta.key}</div>
        <div class="controls" style="margin-top:.5rem">
          <button id="gen-play">Play ▶</button>
          <button id="gen-pause">Pause ⏸</button>
        </div>
        <div class="card" style="margin-top:.6rem">
          <h4 style="margin:0 0 .25rem 0">Lyrics</h4>
          <pre style="white-space:pre-wrap">${resolved?.lyrics || lyrics}</pre>
        </div>
      </div>`;
    const playBtn = document.getElementById('gen-play');
    const pauseBtn = document.getElementById('gen-pause');
    const addBtn = document.getElementById('gen-add-lib');
    const dlWav = document.getElementById('gen-dl-wav');
    const dlMp3 = document.getElementById('gen-dl-mp3');
    let currentAudio = null;
    playBtn?.addEventListener('click', ()=>{ try { if (currentAudio) currentAudio.pause(); currentAudio = new Audio(audioUrl); currentAudio.play(); } catch(_) {} });
    pauseBtn?.addEventListener('click', ()=>{ try { currentAudio && currentAudio.pause(); } catch(_) {} });
    addBtn?.addEventListener('click', ()=>{
      lastLibrary.push(mock); toast('Added generated track to library');
    });
    function fakeDownload(name){ const blob = new Blob(['Generated placeholder'], {type:'text/plain'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url); }
    dlWav?.addEventListener('click', ()=> fakeDownload('track.wav'));
    dlMp3?.addEventListener('click', ()=> fakeDownload('track.mp3'));
  });
  // Keyboard nav, selection, tagging, playlist, chat
  window.addEventListener('keydown', (e) => {
    const activeModal = document.querySelector('.detail.show');
    if (e.key === 'Escape' && activeModal) {
      activeModal.remove();
      return;
    }
    const targetTag = (e.target && e.target.tagName) || '';
    const inInput = ['INPUT','TEXTAREA'].includes(targetTag);
    // Tab navigation with Ctrl + arrows
    if (e.ctrlKey) {
      const tabs = ['analyze','explore','insights'];
      const name = (location.hash || '#analyze').replace('#','');
      const idx = tabs.indexOf(name);
      if (e.key === 'ArrowRight') { const n = tabs[(idx+1)%tabs.length]; location.hash = '#' + n; }
      if (e.key === 'ArrowLeft') { const n = tabs[(idx-1+tabs.length)%tabs.length]; location.hash = '#' + n; }
      return;
    }
    if (inInput) return;
    if (e.key.toLowerCase() === 's') { selectionMode = !selectionMode; toast(selectionMode? 'Selection ON' : 'Selection OFF'); loadLibrary(); }
    if (e.key.toLowerCase() === 'a' && selectionMode) {
      document.querySelectorAll('#grid .card').forEach(card=>{ const tid=card.getAttribute('data-tid'); selectedIds.add(tid); card.classList.add('selected'); });
      toast('Selected all');
    }
    if (e.key.toLowerCase() === 't') { tagSelectedBtn?.click(); }
    if (e.key.toLowerCase() === 'p') { smartPlaylistBtn?.click(); }
    if (e.key === '/') { e.preventDefault(); openChat?.click(); }
  });

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
    // Build sidebar + select first detail
    const sidebar = document.getElementById('reports-sidebar');
    const detailMeta = document.getElementById('report-meta');
    if (sidebar) sidebar.innerHTML = tracks.map((t,idx)=>`<a href="#" class="report-item ${idx===0?'active':''}" data-tid="${t.id}">${t.filename}</a>`).join('');
    function selectReport(tid){
      const t = tracks.find(x=>x.id===tid) || tracks[0];
      if (!t) return;
      document.querySelectorAll('.report-item').forEach(el=> el.classList.remove('active'));
      const cur = document.querySelector(`.report-item[data-tid="${tid}"]`);
      if (cur) cur.classList.add('active');
      if (detailMeta) detailMeta.textContent = `BPM ${t.tempo_bpm} • Key ${t.key_guess} • Mood ${t.tags?.mood||''}`;
      try { import('./charts.js').then(mod => {
        mod.drawBars(document.getElementById('reports-dist'), t.features?.chroma_mean || []);
        mod.drawRadar(document.getElementById('reports-keys'), t.features?.mfcc_mean || []);
        // Simple mood map: plot (energy vs valence) approximated from tempo and major/minor
        const canvas = document.getElementById('reports-map');
        if (canvas && canvas.getContext){
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0,0,canvas.width,canvas.height);
          // axes
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.beginPath(); ctx.moveTo(20, canvas.height-20); ctx.lineTo(canvas.width-20, canvas.height-20); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(20, canvas.height-20); ctx.lineTo(20, 20); ctx.stroke();
          // point
          const energy = Math.min(1, Math.max(0, (t.tempo_bpm||120)/200));
          const isMinor = /m$/.test(String(t.key_guess||''));
          const valence = isMinor ? 0.35 : 0.7;
          const x = 20 + energy * (canvas.width - 40);
          const y = (canvas.height - 20) - valence * (canvas.height - 40);
          ctx.fillStyle = 'rgba(242,212,96,0.9)';
          ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillText('Energy →', canvas.width-70, canvas.height-8);
          ctx.save(); ctx.translate(8, 40); ctx.rotate(-Math.PI/2); ctx.fillText('Valence →', 0,0); ctx.restore();
        }
      }); } catch(_){ }
    }
    if (sidebar){
      sidebar.querySelectorAll('.report-item').forEach(a => a.addEventListener('click', (e)=>{ e.preventDefault(); selectReport(a.getAttribute('data-tid')); }));
      if (tracks[0]) selectReport(tracks[0].id);
    }
    // The export buttons remain
    document.querySelectorAll('.report-btn').forEach(btn => btn.addEventListener('click', async (ev) => {
      playClick();
      const tid = ev.currentTarget.getAttribute('data-tid');
      if (offlineToggle && offlineToggle.checked){ toast('Offline demo: report disabled'); return; }
      const r = await fetch('/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ track_id: tid })});
      const j = await r.json();
      if (j.pdf) { window.open(j.pdf, '_blank'); toast('Opening report...'); } else { toast('Report unavailable'); }
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
        const a = document.createElement('a'); a.href = url; a.download = 'library.json'; a.click(); URL.revokeObjectURL(url); toast('Exported JSON');
      } else {
        const r = await fetch('/export?fmt=json'); const j = await r.json(); if (j.path) { window.open(j.path, '_blank'); toast('Exporting JSON'); } else { toast('Export failed'); }
      }
    };
    if (exportCsvBtn) exportCsvBtn.onclick = async () => {
      playClick();
      if (offlineToggle && offlineToggle.checked) {
        const header = ['id','filename','duration_sec','tempo_bpm','tempo_conf','key_guess','embedding_dim'];
        const rows = tracks.map(t => header.map(h => t[h] ?? '').join(','));
        const blob = new Blob([header.join(',') + '\n' + rows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'library.csv'; a.click(); URL.revokeObjectURL(url); toast('Exported CSV');
      } else {
        const r = await fetch('/export?fmt=csv'); const j = await r.json(); if (j.path) { window.open(j.path, '_blank'); toast('Exporting CSV'); } else { toast('Export failed'); }
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
          `<div class="muted">BPM ${t.tempo_bpm} • Key ${t.key_guess} <button class="tone-btn" data-key="${t.key_guess}" style="margin-left:.5rem">Tone</button></div>`+
          (t.spectrogram_png ? `<img src="${t.spectrogram_png}" alt="spec" style="width:320px;max-width:100%;margin-top:.5rem;border-radius:8px"/>` : '')+
          `<div class="controls" style="margin-top:.5rem">`+
          `<button data-tid="${t.id}" class="similar-btn">Similar</button>`+
          `<button data-tid="${t.id}" class="report-btn">Report (PDF)</button>`+
          `</div>`+
          `</div>`
        )).join('');

        try {
          const mod = await import('./charts.js');
          const first = items[0];
          if (first) {
            mod.drawRadar(analyzeRadar, first.features?.mfcc_mean || []);
            mod.drawBars(analyzeChroma, first.features?.chroma_mean || []);
          }
        } catch(_){}

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

        // Bind tone preview buttons
        results.querySelectorAll('.tone-btn').forEach(btn => btn.addEventListener('click', (ev)=>{
          const k = ev.currentTarget.getAttribute('data-key');
          playToneForKey(k);
        }));
      } catch (err) {
        results.innerHTML = `<span class="muted">Error: ${err}</span>`;
      }
    });
  }
});


