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
  const tabAnalyze = document.getElementById('tab-analyze');
  const tabExplore = document.getElementById('tab-explore');
  const tabReports = document.getElementById('tab-reports');
  const tabMore = document.getElementById('tab-more');
  const panelAnalyze = document.getElementById('panel-analyze');
  const panelExplore = document.getElementById('panel-explore');
  const panelReports = document.getElementById('panel-reports');
  const panelMore = document.getElementById('panel-more');
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
  // Mini player controls
  const player = document.getElementById('player');
  const playerTitle = document.getElementById('player-title');
  const playerBar = document.getElementById('player-bar');
  const playerPlay = document.getElementById('player-play');
  const playerPrev = document.getElementById('player-prev');
  const playerNext = document.getElementById('player-next');
  let playerIdx = 0; let playerTimer = null; let playing = false;
  const exportJsonBtn = document.getElementById('export-json');
  const exportCsvBtn = document.getElementById('export-csv');
  const toastEl = document.getElementById('toast');
  const detail = document.getElementById('detail');
  const detailTitle = document.getElementById('detail-title');
  const detailMeta = document.getElementById('detail-meta');
  const detailClose = document.getElementById('detail-close');
  const chartRadar = document.getElementById('chart-radar');
  const chartChroma = document.getElementById('chart-chroma');
  const analyzeRadar = document.getElementById('analyze-radar');
  const analyzeChroma = document.getElementById('analyze-chroma');
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
        const qs = new URLSearchParams({ page: String(page), per_page: '8' });
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
      pageState = mod.paginate(tracks, page, 8);
    } catch(_) {}
    grid.innerHTML = pageState.slice.map((t,i) => (
      `<div class="card ${selectionMode?'selectable':''}" data-tid="${t.id}">`+
      `<canvas class="wave-mini" width="320" height="56" data-seed="${(i+1)*17}"></canvas>`+
      `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:.5rem">`+
      `<div style="font-weight:600">${t.filename}</div>`+
      `<span class="badge badge-muted">${t.tempo_bpm} bpm</span>`+
      `</div>`+
      `<div class="muted" style="font-size:.9rem">Key ${t.key_guess} • ${t.tags?.mood || ''}</div>`+
      `<div class="controls" style="margin-top:.5rem">`+
      `<button data-tid="${t.id}" class="detail-btn">Detail</button>`+
      `<button data-tid="${t.id}" class="similar-btn">Similar</button>`+
      `<button data-tid="${t.id}" class="report-btn">Report PDF</button>`+
      `</div>`+
      `</div>`
    )).join('');
    // render pager
    const pager = document.getElementById('pager');
    try {
      const mod = await import('./pagination.js');
      mod.renderPager(pager, pageState, (p)=> loadLibrary(p));
    } catch(_) {}

    // Draw mini waveforms
    grid.querySelectorAll('.wave-mini').forEach((cv) => {
      try {
        const ctx = cv.getContext('2d');
        const w = cv.width, h = cv.height; ctx.clearRect(0,0,w,h);
        const seed = Number(cv.getAttribute('data-seed')||1);
        ctx.strokeStyle = 'rgba(242,212,96,0.9)'; ctx.lineWidth = 2; ctx.beginPath();
        const y0 = h/2; ctx.moveTo(0, y0);
        for (let x=0; x<w; x++) {
          const t = (x / w) * Math.PI * (3.5 + (seed%7)*0.2);
          const amp = Math.sin(t) * 0.6 + Math.sin(t*0.37 + seed) * 0.4;
          const y = y0 + amp * (h*0.28);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      } catch(_){ }
    });

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

  // Mini player behavior (demo: cycles through visible list)
  function setPlayer(idx){
    const cards = Array.from(document.querySelectorAll('#grid .card'));
    if (!cards.length) return;
    playerIdx = (idx + cards.length) % cards.length;
    const card = cards[playerIdx];
    const tid = card.getAttribute('data-tid');
    const t = lastLibrary.find(x=>x.id===tid) || lastLibrary[playerIdx] || {};
    if (playerTitle) playerTitle.textContent = t.filename || '—';
  }
  function tick(){
    if (!playing || !playerBar) return;
    const num = parseFloat(playerBar.style.width || '0') || 0;
    const next = (num + 1) % 100; playerBar.style.width = next + '%';
  }
  if (playerPlay) playerPlay.addEventListener('click', ()=>{
    playing = !playing; playerPlay.textContent = playing ? '⏸' : '▶';
    if (playerTimer) { clearInterval(playerTimer); playerTimer = null; }
    if (playing) playerTimer = setInterval(tick, 200);
  });
  if (playerPrev) playerPrev.addEventListener('click', ()=>{ setPlayer(playerIdx-1); });
  if (playerNext) playerNext.addEventListener('click', ()=>{ setPlayer(playerIdx+1); });
  setPlayer(0);

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
      const tabs = ['analyze','explore','reports'];
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
          `<button data-tid="${t.id}" class="report-btn">Report PDF</button>`+
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


