// kinematicGraphs.js — Renderizador de graficas cinematicas
// Dibuja a-t, v-t y x-t en un <canvas> usando solo Canvas 2D API.
// Exporta: renderGraphs(canvas, data) donde data proviene de kinematicData().

const COLORS = {
  at: '#dc2626',  // rojo
  vt: '#2563eb',  // azul
  xt: '#16a34a',  // verde
  grid: 'rgba(148,163,184,0.35)',
  axis: '#374151',
  label: '#6b7280',
  bg: '#ffffff',
  segBorder: 'rgba(220,38,38,0.18)',
};

/**
 * Dibuja las 3 graficas (a-t, v-t, x-t) en el canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {object} data  Salida de kinematicData()
 */
export function renderGraphs(canvas, data) {
  if (!canvas || !data) return;
  const dpr  = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = Math.round(rect.width  * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  const pad    = { top: 12, bot: 30, left: 42, right: 10 };
  const gapX   = 18;
  const panelW = (W - pad.left - pad.right - gapX * 2) / 3;
  const panelH = H - pad.top - pad.bot;

  const panels = [
    { key: 'at', label: 'a vs t  (m/s²)', yKey: 'a', color: COLORS.at },
    { key: 'vt', label: 'v vs t  (m/s)',  yKey: 'v', color: COLORS.vt },
    { key: 'xt', label: 'x vs t  (m)',    yKey: 'x', color: COLORS.xt },
  ];

  panels.forEach((panel, pi) => {
    const ox = pad.left + pi * (panelW + gapX);
    const oy = pad.top;
    _drawPanel(ctx, data[panel.key], ox, oy, panelW, panelH, panel, pad, data.segments);
  });
}

function _drawPanel(ctx, pts, ox, oy, W, H, panel, pad, segments) {
  if (!pts || pts.length === 0) return;

  // Bounds
  const xs = pts.map(p => p.t);
  const ys = pts.map(p => p[panel.yKey]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys, 0), yMax = Math.max(...ys, 0);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const toSX = t  => ox + ((t  - xMin) / xRange) * W;
  const toSY = y  => oy + H - ((y - yMin) / yRange) * H;

  // Clip
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox - 1, oy - 1, W + 2, H + 2);
  ctx.clip();

  // Background
  ctx.fillStyle = '#f8fafd';
  ctx.fillRect(ox, oy, W, H);

  // Segment backgrounds
  if (segments) {
    segments.forEach((seg, i) => {
      const x0 = toSX(seg.t0), x1 = toSX(seg.t1);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(219,234,254,0.35)' : 'rgba(254,243,199,0.35)';
      ctx.fillRect(x0, oy, x1 - x0, H);
    });
  }

  // Grid
  const gridN = 5;
  ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= gridN; i++) {
    const sx = ox + (i / gridN) * W;
    ctx.beginPath(); ctx.moveTo(sx, oy); ctx.lineTo(sx, oy + H); ctx.stroke();
    const sy = oy + (i / gridN) * H;
    ctx.beginPath(); ctx.moveTo(ox, sy); ctx.lineTo(ox + W, sy); ctx.stroke();
  }

  // Zero axis
  const y0 = toSY(0);
  ctx.strokeStyle = 'rgba(55,65,81,0.4)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(ox, y0); ctx.lineTo(ox + W, y0); ctx.stroke();

  // Curve
  ctx.strokeStyle = panel.color; ctx.lineWidth = 2.2;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const sx = toSX(p.t), sy = toSY(p[panel.yKey]);
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  });
  ctx.stroke();

  // Fill under curve
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = panel.color;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const sx = toSX(p.t), sy = toSY(p[panel.yKey]);
    if (i === 0) ctx.moveTo(sx, y0);
    ctx.lineTo(sx, sy);
  });
  ctx.lineTo(toSX(xs[xs.length-1]), y0);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  ctx.restore();

  // Axes labels
  ctx.fillStyle = COLORS.label; ctx.font = '9px monospace';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const val = yMin + (i / ySteps) * yRange;
    const sy  = toSY(val);
    ctx.fillText(_fl(val), ox - 3, sy);
  }

  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const xSteps = 4;
  for (let i = 0; i <= xSteps; i++) {
    const val = xMin + (i / xSteps) * xRange;
    const sx  = toSX(val);
    ctx.fillText(_fl(val), sx, oy + H + 3);
  }

  // Border + title
  ctx.strokeStyle = COLORS.axis; ctx.lineWidth = 1.2;
  ctx.strokeRect(ox, oy, W, H);
  ctx.fillStyle = panel.color; ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(panel.label, ox + 3, oy - 1);

  // Segment markers
  if (segments) {
    ctx.fillStyle = COLORS.axis; ctx.font = '8px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    segments.forEach(seg => {
      const midX = toSX((seg.t0 + seg.t1) / 2);
      ctx.fillText(seg.label || '', midX, oy + 2);
    });
  }
}

function _fl(n) {
  if (Math.abs(n) >= 1000) return (n/1000).toFixed(1)+'k';
  if (Math.abs(n) < 0.01 && n !== 0) return n.toExponential(1);
  return +n.toFixed(2) + '';
}

/**
 * Ajusta el canvas al contenedor en cambio de tamano.
 * Llama despues de cada resize con los datos en cache.
 */
export function resizeGraphCanvas(canvas) {
  if (!canvas) return;
  // El re-render debe hacerlo el llamador con los datos actuales
}
