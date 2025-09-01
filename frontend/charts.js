export function drawRadar(canvas, values, color = 'rgba(242,212,96,0.75)') {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const n = Math.max(3, values.length);
  const cx = canvas.width / 2, cy = canvas.height / 2, r = Math.min(cx, cy) - 20;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const v = values[i] ?? 0;
    const mag = 0.5 + 0.5 * (v / (Math.max(1, Math.abs(v))));
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(ang) * r * mag;
    const y = cy + Math.sin(ang) * r * mag;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.stroke();
}

export function drawBars(canvas, values, a='rgba(242,212,96,0.9)', b='rgba(106,143,139,0.9)') {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const n = Math.max(1, values.length);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const maxv = Math.max(...values, 1);
  const w = canvas.width / n;
  for (let i = 0; i < n; i++) {
    const h = (canvas.height - 20) * (values[i] / maxv);
    ctx.fillStyle = (i % 2 === 0) ? a : b;
    ctx.fillRect(i * w + 8, canvas.height - 10 - h, w - 12, h);
  }
}


