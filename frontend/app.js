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
  if (form && input && results) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
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


