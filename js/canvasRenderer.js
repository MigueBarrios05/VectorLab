// canvasRenderer.js — Orquestador Canvas 2D con Zoom, Animacion, Auto-Centrado y Algebra Vectorial
import { COLORS, ENTITIES } from './config.js';
import { AVATAR_MAP }       from './avatars.js';
import { fmt }              from './vectorEngine.js';

let canvas, ctx;
const cam = { scale: 1, ox: 0, oy: 0 };

// ── Zoom ──────────────────────────────────────────────────
let zoomFactor = 1;
let _lastState = null, _lastResult = null, _lastAnimPos = null;
let _lastAlgebra = null;

export function getCam()         { return { ...cam }; }
export function getZoomPercent() { return Math.round(zoomFactor * 100); }

export function zoomIn() {
  zoomFactor = Math.min(30, zoomFactor * 1.25);
  _notifyZoom();
  _rerender();
}

export function zoomOut() {
  zoomFactor = Math.max(0.05, zoomFactor / 1.25);
  _notifyZoom();
  _rerender();
}

export function resetZoom() {
  zoomFactor = 1;
  _notifyZoom();
  _rerender();
}

function _notifyZoom() {
  window.dispatchEvent(new CustomEvent('zoom:change', { detail: { percent: getZoomPercent() } }));
}

function _rerender() {
  if (_lastState) render(_lastState, _lastResult, _lastAnimPos);
}

// ── Init ──────────────────────────────────────────────────
export function init(canvasEl) {
  canvas = canvasEl;
  ctx    = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', () => { resize(); _rerender(); });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn(); else zoomOut();
  }, { passive: false });
}

// ── Resize (DPR aware) ────────────────────────────────────
export function resize() {
  if (!canvas) return;
  const dpr  = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = Math.round(rect.width  * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.scale(dpr, dpr);
  canvas._lw = rect.width;
  canvas._lh = rect.height;
}

// ── Coord transforms ──────────────────────────────────────
function w2s(wx, wy) {
  return { x: cam.ox + wx * cam.scale, y: cam.oy - wy * cam.scale };
}

// ── Camera (auto-fit + zoom + side-card offset) ───────────
function computeCamera(state, result) {
  const W  = canvas._lw || canvas.width;
  const H  = canvas._lh || canvas.height;
  const cardW = (W > 720) ? 320 : 0;
  const effW = W - cardW;

  const ox = state.originX || 0, oy = state.originY || 0;
  let minX = ox, maxX = ox, minY = oy, maxY = oy;

  if (_lastAlgebra) {
    const alg = _lastAlgebra;
    minX = Math.min(minX, 0); maxX = Math.max(maxX, 0);
    minY = Math.min(minY, 0); maxY = Math.max(maxY, 0);

    const checkVec = (v) => {
      if (!v) return;
      minX = Math.min(minX, v.dx); maxX = Math.max(maxX, v.dx);
      minY = Math.min(minY, v.dy); maxY = Math.max(maxY, v.dy);
    };

    checkVec(alg.va);
    checkVec(alg.vb);
    checkVec(alg.resultVec);

    if (alg.mode === 'sum' && alg.va && alg.vb) {
      checkVec({ dx: alg.va.dx + alg.vb.dx, dy: alg.va.dy + alg.vb.dy });
    }
  } else {
    const pts = result ? result.positions : [{ x: ox, y: oy }];
    pts.forEach(p => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });
  }

  const rangeX = (maxX - minX) || 1;
  const rangeY = (maxY - minY) || 1;
  const margin = Math.max(rangeX, rangeY) * 0.28;
  const base   = Math.min(effW / (rangeX + 2 * margin), H / (rangeY + 2 * margin));
  cam.scale    = base * zoomFactor;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  cam.ox = effW / 2 - cx * cam.scale;
  cam.oy = H / 2 + cy * cam.scale;
}

// ── Nice grid step ────────────────────────────────────────
function niceStep() {
  const W     = canvas._lw || canvas.width;
  const cardW = (W > 720) ? 320 : 0;
  const effW  = W - cardW;
  const raw   = (effW / cam.scale) / 7;
  const mag   = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  for (const n of [1, 2, 2.5, 5, 10]) { if (n * mag >= raw) return n * mag; }
  return 10 * mag;
}

// ── Draw grid ─────────────────────────────────────────────
function drawGrid() {
  const step = niceStep();
  const W = canvas._lw || canvas.width;
  const H = canvas._lh || canvas.height;
  const wL = (0 - cam.ox) / cam.scale, wR = (W - cam.ox) / cam.scale;
  const wB = (cam.oy - H) / cam.scale, wT = (cam.oy - 0) / cam.scale;
  const sX = Math.floor(wL / step) * step, sY = Math.floor(wB / step) * step;

  ctx.save();
  ctx.strokeStyle = 'rgba(148,163,184,0.35)'; ctx.lineWidth = 1;
  for (let x = sX; x <= wR + step; x += step) {
    const sx = w2s(x, 0).x;
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
  }
  for (let y = sY; y <= wT + step; y += step) {
    const sy = w2s(0, y).y;
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
  }
  const axO = w2s(0, 0);
  ctx.fillStyle = 'rgba(100,116,139,0.6)'; ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  for (let x = sX; x <= wR + step; x += step) {
    if (Math.abs(x) < step * 0.01) continue;
    const sx = w2s(x, 0).x;
    ctx.fillText(_fl(x), sx, Math.min(Math.max(axO.y + 3, 12), H - 4));
  }
  ctx.textAlign = 'right';
  for (let y = sY; y <= wT + step; y += step) {
    if (Math.abs(y) < step * 0.01) continue;
    ctx.fillText(_fl(y), Math.min(Math.max(axO.x - 4, 4), W - 4), w2s(0, y).y + 3);
  }
  ctx.restore();
  return step;
}

function _fl(n) {
  if (Math.abs(n) >= 1e6)  return (n/1e6).toFixed(1)+'M';
  if (Math.abs(n) >= 1000) return (n/1000).toFixed(1)+'k';
  if (Math.abs(n) < 0.01 && n !== 0) return n.toExponential(1);
  return Number(n.toFixed(4)).toString();
}

// ── Draw axes ─────────────────────────────────────────────
function drawAxes() {
  const W = canvas._lw || canvas.width, H = canvas._lh || canvas.height;
  const o = w2s(0, 0);
  ctx.save();
  ctx.strokeStyle = 'rgba(37,99,235,0.4)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, o.y); ctx.lineTo(W, o.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(o.x, 0); ctx.lineTo(o.x, H); ctx.stroke();
  ctx.fillStyle = '#2563eb';
  ctx.beginPath(); ctx.arc(o.x, o.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(37,99,235,0.75)'; ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText('x \u2192', W - 6, o.y - 4);
  ctx.textAlign = 'left';  ctx.textBaseline = 'top';
  ctx.fillText('\u2191 y', o.x + 4, 6);
  ctx.restore();
}

// ── Arrow primitive ───────────────────────────────────────
function drawArrow(x1, y1, x2, y2, color, lw, dashed) {
  if (Math.hypot(x2 - x1, y2 - y1) < 1) return;
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw;
  if (dashed) ctx.setLineDash([8, 5]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.setLineDash([]);
  const a = Math.atan2(y2 - y1, x2 - x1), sz = Math.min(14, Math.max(7, lw * 3.2));
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - sz * Math.cos(a - 0.4), y2 - sz * Math.sin(a - 0.4));
  ctx.lineTo(x2 - sz * Math.cos(a + 0.4), y2 - sz * Math.sin(a + 0.4));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ── Multi-vector simulation drawing ───────────────────────
function drawVectors(vectors, positions, animPos) {
  const maxFull = animPos != null ? animPos.segIndex : vectors.length;
  for (let i = 0; i < maxFull; i++) {
    const s0 = w2s(positions[i].x, positions[i].y);
    const s1 = w2s(positions[i + 1].x, positions[i + 1].y);
    drawArrow(s0.x, s0.y, s1.x, s1.y, COLORS[i % COLORS.length], 2.5, false);
  }
  if (animPos != null && animPos.segIndex < vectors.length && animPos.t > 0.001) {
    const i = animPos.segIndex;
    const p0 = positions[i], p1 = positions[i + 1];
    const px = { x: p0.x + (p1.x - p0.x) * animPos.t, y: p0.y + (p1.y - p0.y) * animPos.t };
    const s0 = w2s(p0.x, p0.y), s1 = w2s(px.x, px.y);
    drawArrow(s0.x, s0.y, s1.x, s1.y, COLORS[i % COLORS.length], 2.5, false);
  }
}

function drawResultant(ox, oy, r) {
  const s0 = w2s(ox, oy), s1 = w2s(ox + r.Rx, oy + r.Ry);
  drawArrow(s0.x, s0.y, s1.x, s1.y, '#22c55e', 4, false);
}

function drawReturnVector(ox, oy, r) {
  const s0 = w2s(ox + r.Rx, oy + r.Ry), s1 = w2s(ox, oy);
  drawArrow(s0.x, s0.y, s1.x, s1.y, '#ef4444', 2, true);
}

function drawLabels(vectors, positions, ox, oy, result, animPos) {
  const maxL = animPos != null ? animPos.segIndex : vectors.length;
  ctx.save();
  for (let i = 0; i < maxL; i++) {
    const p0 = positions[i], p1 = positions[i + 1];
    const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
    const sm = w2s(mx, my);
    const color = COLORS[i % COLORS.length];
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(sm.x, sm.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(i + 1, sm.x, sm.y);
    const ang  = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const offX = Math.cos(ang - Math.PI / 2) * 16;
    const offY = -Math.sin(ang - Math.PI / 2) * 16;
    const lbl  = vectors[i].label.length > 14 ? vectors[i].label.slice(0, 12) + '...' : vectors[i].label;
    ctx.fillStyle = color; ctx.font = '9px sans-serif'; ctx.textBaseline = 'top';
    ctx.fillText(lbl, sm.x + offX, sm.y + offY);
  }
  const so = w2s(ox, oy);
  ctx.fillStyle = '#2563eb'; ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText('O(' + fmt(ox, 1) + ', ' + fmt(oy, 1) + ')', so.x + 8, so.y - 4);
  if (animPos == null) {
    const sf = w2s(ox + result.Rx, oy + result.Ry);
    ctx.fillStyle = '#22c55e';
    ctx.fillText('R(' + fmt(ox + result.Rx, 1) + ', ' + fmt(oy + result.Ry, 1) + ')', sf.x + 8, sf.y - 4);
  }
  ctx.restore();
}

function drawAvatar(entityId, positions, animPos) {
  const entity = ENTITIES[entityId];
  if (!entity) return;
  const drawFn = AVATAR_MAP[entity.avatarKey];
  if (!drawFn) return;
  let pos, angle;
  if (animPos != null && animPos.segIndex < positions.length - 1) {
    const i = animPos.segIndex;
    const p0 = positions[i], p1 = positions[i + 1];
    pos   = { x: p0.x + (p1.x - p0.x) * animPos.t, y: p0.y + (p1.y - p0.y) * animPos.t };
    angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  } else {
    const last = positions[positions.length - 1];
    const prev = positions[Math.max(0, positions.length - 2)];
    pos   = last;
    angle = Math.atan2(last.y - prev.y, last.x - prev.x);
  }
  const s = w2s(pos.x, pos.y);
  drawFn(ctx, s.x, s.y, angle);
}

// ── Vector Algebra Visualizations ─────────────────────────
function drawAlgebraVectors(alg) {
  if (!alg) return;
  const { mode, va, vb, resultVec, k, crossResult, angle } = alg;
  const o = w2s(0, 0);

  if (mode === 'sum') {
    // Vector A (blue) from origin
    if (va) {
      const sA = w2s(va.dx, va.dy);
      drawArrow(o.x, o.y, sA.x, sA.y, '#2563eb', 3, false);
      _badge(sA.x, sA.y, 'A', '#2563eb');

      // Vector B (amber) drawn head-to-tail from head of A
      if (vb) {
        const sAB = w2s(va.dx + vb.dx, va.dy + vb.dy);
        drawArrow(sA.x, sA.y, sAB.x, sAB.y, '#d97706', 3, false);
        _badge(sAB.x, sAB.y, 'B', '#d97706');

        // Also draw B from origin dashed for clarity
        const sB = w2s(vb.dx, vb.dy);
        drawArrow(o.x, o.y, sB.x, sB.y, '#d97706', 1.5, true);

        // Resultant R = A + B (bold green)
        drawArrow(o.x, o.y, sAB.x, sAB.y, '#22c55e', 4.5, false);
        _badge((o.x + sAB.x)/2 + 10, (o.y + sAB.y)/2, 'R = A + B', '#22c55e');
      }
    }
  } else if (mode === 'sub') {
    // Vector A (blue) from origin
    if (va) {
      const sA = w2s(va.dx, va.dy);
      drawArrow(o.x, o.y, sA.x, sA.y, '#2563eb', 3, false);
      _badge(sA.x, sA.y, 'A', '#2563eb');

      if (vb) {
        // Vector B from origin
        const sB = w2s(vb.dx, vb.dy);
        drawArrow(o.x, o.y, sB.x, sB.y, '#d97706', 2.5, false);
        _badge(sB.x, sB.y, 'B', '#d97706');

        // -B dashed from head of A
        const sR = w2s(va.dx - vb.dx, va.dy - vb.dy);
        drawArrow(sA.x, sA.y, sR.x, sR.y, '#f59e0b', 2, true);

        // Resultant R = A - B (green)
        drawArrow(o.x, o.y, sR.x, sR.y, '#22c55e', 4.5, false);
        _badge(sR.x, sR.y, 'R = A \u2212 B', '#22c55e');
      }
    }
  } else if (mode === 'scalar') {
    if (va) {
      const sA = w2s(va.dx, va.dy);
      // Original vector A
      drawArrow(o.x, o.y, sA.x, sA.y, '#2563eb', 2.5, false);
      _badge(sA.x, sA.y, 'V', '#2563eb');

      // Scaled vector k * V
      if (resultVec) {
        const sR = w2s(resultVec.dx, resultVec.dy);
        drawArrow(o.x, o.y, sR.x, sR.y, '#22c55e', 4, false);
        _badge(sR.x, sR.y, `${fmt(k, 2)} \u00b7 V`, '#22c55e');
      }
    }
  } else if (mode === 'dot') {
    // Vector A (blue) and Vector B (amber)
    // NO new vector rendered! Show angle arc
    if (va && vb) {
      const sA = w2s(va.dx, va.dy);
      const sB = w2s(vb.dx, vb.dy);
      drawArrow(o.x, o.y, sA.x, sA.y, '#2563eb', 3, false);
      drawArrow(o.x, o.y, sB.x, sB.y, '#d97706', 3, false);
      _badge(sA.x, sA.y, 'A', '#2563eb');
      _badge(sB.x, sB.y, 'B', '#d97706');

      // Angle arc between A and B
      const angA = Math.atan2(va.dy, va.dx);
      const angB = Math.atan2(vb.dy, vb.dx);
      const arcR = Math.max(25, Math.min(55, cam.scale * Math.min(va.r, vb.r) * 0.35));

      ctx.save();
      ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Canvas y is flipped, so angle is -ang
      ctx.arc(o.x, o.y, arcR, -angA, -angB, angA > angB);
      ctx.stroke();

      const midAng = (angA + angB) / 2;
      const lx = o.x + Math.cos(-midAng) * (arcR + 18);
      const ly = o.y + Math.sin(-midAng) * (arcR + 18);
      ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`\u03b8 = ${fmt(angle, 1)}\u00b0`, lx, ly);
      ctx.restore();
    }
  } else if (mode === 'cross') {
    // Producto Cruz: Vector A, Vector B, Parallelogram area, and 3D Perpendicular Projection!
    if (va && vb && crossResult) {
      const sA  = w2s(va.dx, va.dy);
      const sB  = w2s(vb.dx, vb.dy);
      const sAB = w2s(va.dx + vb.dx, va.dy + vb.dy);

      // 1. Shaded parallelogram showing area = |A x B|
      ctx.save();
      ctx.fillStyle = 'rgba(139, 92, 246, 0.12)';
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(sA.x, sA.y);
      ctx.lineTo(sAB.x, sAB.y);
      ctx.lineTo(sB.x, sB.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 2. Draw Vector A and Vector B
      drawArrow(o.x, o.y, sA.x, sA.y, '#2563eb', 3, false);
      drawArrow(o.x, o.y, sB.x, sB.y, '#d97706', 3, false);
      _badge(sA.x, sA.y, 'A', '#2563eb');
      _badge(sB.x, sB.y, 'B', '#d97706');

      // 3. Oblique 3D isometric projection of perpendicular vector k * k_hat
      const kVal = crossResult.k;
      const obAng = -Math.PI * 0.75; // -135° oblique isometric angle
      const projLen = Math.min(160, Math.max(50, Math.abs(kVal) * cam.scale * 0.05 + 50));
      const dirMult = kVal >= 0 ? 1 : -1;
      const pX = o.x + Math.cos(obAng) * projLen * dirMult;
      const pY = o.y + Math.sin(obAng) * projLen * dirMult;

      // Oblique guide axis line (dashed)
      ctx.save();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(o.x - Math.cos(obAng) * projLen * dirMult * 0.5, o.y - Math.sin(obAng) * projLen * dirMult * 0.5);
      ctx.lineTo(pX, pY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Perpendicular vector projection arrow (bold purple)
      drawArrow(o.x, o.y, pX, pY, '#8b5cf6', 4, false);
      _badge(pX, pY, `R = A \u00d7 B (${fmt(kVal, 2)} k\u0302)`, '#8b5cf6');

      // 4. Circle symbol at origin (dot or cross for out-of-page / into-page)
      ctx.save();
      const rCirc = 14;
      const circX = o.x - 30;
      const circY = o.y + 30;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(circX, circY, rCirc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      if (kVal >= 0) {
        // Dot: vector pointing out of screen (+z)
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath(); ctx.arc(circX, circY, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('+z (hacia afuera \u2299)', circX + rCirc + 6, circY);
      } else {
        // Cross: vector pointing into screen (-z)
        ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(circX - 5, circY - 5); ctx.lineTo(circX + 5, circY + 5);
        ctx.moveTo(circX + 5, circY - 5); ctx.lineTo(circX - 5, circY + 5);
        ctx.stroke();
        ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = '#8b5cf6';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('&minus;z (hacia adentro \u2297)', circX + rCirc + 6, circY);
      }
      ctx.restore();
    }
  }

  // Draw Origin marker
  ctx.save();
  ctx.fillStyle = '#0f172a'; ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText('O(0, 0)', o.x - 6, o.y + 6);
  ctx.restore();
}

function _badge(x, y, text, color) {
  ctx.save();
  ctx.font = 'bold 10px sans-serif';
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 4, y - 16, tw + 10, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 9, y - 7);
  ctx.restore();
}

// ── Render Algebra ────────────────────────────────────────
export function renderAlgebra(algResult) {
  _lastAlgebra = algResult;
  _rerender();
}

// ── RENDER (entry point) ──────────────────────────────────
export function render(state, result, animPos) {
  if (!canvas) return;
  _lastState = state; _lastResult = result; _lastAnimPos = animPos;
  const W = canvas._lw || canvas.width, H = canvas._lh || canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);
  computeCamera(state, result);
  drawGrid();
  drawAxes();

  if (_lastAlgebra) {
    drawAlgebraVectors(_lastAlgebra);
  } else if (result && state.vectors.length > 0) {
    if (animPos == null) {
      drawResultant(state.originX, state.originY, result);
      drawReturnVector(state.originX, state.originY, result);
    }
    drawVectors(state.vectors, result.positions, animPos);
    drawLabels(state.vectors, result.positions, state.originX, state.originY, result, animPos);
    drawAvatar(state.entityId, result.positions, animPos);
  }
}
