export async function loadMock() {
  const r = await fetch('./mock_data.json');
  const base = await r.json();
  const tracks = base.tracks || [];
  // Expand to ~24 items by repeating with slight variations
  const out = [];
  const keys = ['C','G','D','A','E','F','Am','Em','Dm','Gm'];
  for (let i = 0; i < 24; i++) {
    const t = tracks[i % tracks.length];
    const tempo = Math.max(60, Math.min(160, (t.tempo_bpm || 120) + ((i%7)-3)*2));
    out.push({
      ...t,
      id: t.id + '-' + i,
      filename: t.filename.replace('.wav','') + '_' + (i+1) + '.wav',
      tempo_bpm: tempo,
      key_guess: keys[i % keys.length],
    });
  }
  return { tracks: out };
}

export function analyzeMock(files){
  // Simulate analyze by returning the first N mock tracks
  return loadMock().then(j => ({ tracks: j.tracks.slice(0, Math.min(files.length || 1, j.tracks.length)) }));
}


