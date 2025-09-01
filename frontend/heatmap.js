export function drawChromaHeatmap(canvas, a, b) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const N = 12;
  const A = (a && a.length === N) ? a : new Array(N).fill(0);
  const B = (b && b.length === N) ? b : new Array(N).fill(0);
  const maxA = Math.max(...A, 1), maxB = Math.max(...B, 1);
  const cell = Math.floor(Math.min(canvas.width, canvas.height) / N);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const v = (A[i]/maxA) * (B[j]/maxB);
      const y = Math.floor(255 * v);
      // Brand-aligned magma-like purple/yellow scale
      const r = Math.min(255, 30 + y);
      const g = Math.min(255, 20 + Math.floor(y*0.8));
      const bl = Math.min(255, 60 + Math.floor(y*0.2));
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.fillRect(j*cell, i*cell, cell, cell);
    }
  }
}


