export async function loadMock() {
  const r = await fetch('./mock_data.json');
  return r.json();
}

export function analyzeMock(files){
  // Simulate analyze by returning the mock tracks subset
  return loadMock().then(j => ({ tracks: j.tracks.slice(0, Math.min(files.length, j.tracks.length)) }));
}


