// main.js v5 — Orquestador: layout flotante, zoom, animación cinemática y álgebra vectorial
import { ENTITIES }                              from './config.js';
import { state, patchState, subscribe }          from './state.js';
import { compute, makeVectorFromPolar, makeVectorFromCart,
         vectorSubtract, scalarMultiply,
         dotProduct, crossProduct, angleBetween, fmt } from './vectorEngine.js';
import { init as initRenderer, render,
         resize, zoomIn, zoomOut, resetZoom,
         getZoomPercent, renderAlgebra }         from './canvasRenderer.js';
import { init as initEntity, setActive }         from './ui/entitySelector.js';
import { init as initInput, setUnit,
         resetCount, incrementCount }            from './ui/inputPanel.js';
import { init as initTable, update as updateTable } from './ui/vectorTable.js';
import { update as updateResults, setupAccordion } from './ui/resultsPanel.js';
import { init as initCalcPanel }                 from './ui/calcPanel.js';
import { renderGraphs }                          from './kinematicGraphs.js';

// ── DOM refs ──────────────────────────────────────────────
const canvasEl      = document.getElementById('canvas-el');
const graphsCanvas  = document.getElementById('graphs-canvas');
const entityGrid    = document.getElementById('entity-grid');
const inputPanelEl  = document.getElementById('input-panel');
const tableWrap     = document.getElementById('vector-list') || document.getElementById('vector-table-wrap');
const scaleInfo     = document.getElementById('scale-info');
const originXEl     = document.getElementById('origin-x');
const originYEl     = document.getElementById('origin-y');
const canvasTitle   = document.getElementById('canvas-title');
const zoomLabelEl   = document.getElementById('zoom-label');
const calcRoot      = document.getElementById('calc-panel-root');

// ── Init componentes ──────────────────────────────────────
initRenderer(canvasEl);
initEntity(entityGrid, state.entityId);
initInput(inputPanelEl, state.inputMode, ENTITIES[state.entityId].unit);
initTable(tableWrap);
setupAccordion();
if (calcRoot) initCalcPanel(calcRoot);

// ── Reactive subscription ─────────────────────────────────
subscribe((s) => {
  const result = compute(s);
  if (!anim.playing && !s.algebraResult) render(s, result, null);
  updateTable(s.vectors, ENTITIES[s.entityId]?.unit ?? '');
  updateResults(result, s, ENTITIES[s.entityId]?.unit ?? '');
  if (canvasTitle) {
    const e = ENTITIES[s.entityId];
    canvasTitle.textContent = e ? (e.icon + ' ' + e.label) : '';
  }
  if (scaleInfo) scaleInfo.textContent = ENTITIES[s.entityId]?.unit ?? '';
});

// ── Preset loader ─────────────────────────────────────────
function loadPreset(entityId) {
  const vecs = (ENTITIES[entityId]?.preset ?? [])
    .map((p, i) => makeVectorFromPolar(p.r, p.theta, p.label ?? ('Tramo ' + (i + 1))));
  resetCount();
  vecs.forEach(() => incrementCount());
  resetAnim();
  patchState({ entityId, vectors: [...vecs], algebraResult: null });
  renderAlgebra(null);
}

// ── Events: trayectorias ──────────────────────────────────
document.addEventListener('entity:change', e => {
  setActive(e.detail.entityId);
  setUnit(ENTITIES[e.detail.entityId].unit);
  resetAnim();
  loadPreset(e.detail.entityId);
});

document.addEventListener('vector:add', e => {
  incrementCount();
  resetAnim();
  patchState({ vectors: [...state.vectors, e.detail.vector], algebraResult: null });
  renderAlgebra(null);
});

document.addEventListener('vector:remove', e => {
  const vecs = [...state.vectors];
  vecs.splice(e.detail.index, 1);
  resetAnim();
  patchState({ vectors: vecs, algebraResult: null });
  renderAlgebra(null);
});

originXEl?.addEventListener('input', () => { resetAnim(); patchState({ originX: parseFloat(originXEl.value) || 0 }); });
originYEl?.addEventListener('input', () => { resetAnim(); patchState({ originY: parseFloat(originYEl.value) || 0 }); });

document.getElementById('btn-clear')?.addEventListener('click',  () => {
  resetCount();
  resetAnim();
  patchState({ vectors: [], algebraResult: null });
  renderAlgebra(null);
});

document.getElementById('btn-preset')?.addEventListener('click', () => loadPreset(state.entityId));

// ── Algebra mode events ───────────────────────────────────
document.addEventListener('algebra:mode', e => {
  const mode = e.detail.mode;
  const vecListSec = document.getElementById('section-vector-list');

  if (mode === 'sum') {
    patchState({ algebraMode: 'sum', algebraResult: null });
    renderAlgebra(null);
    if (vecListSec) vecListSec.style.display = '';
    const r = compute(state);
    if (!anim.playing) render(state, r, null);
  } else {
    patchState({ algebraMode: mode, algebraResult: null });
    renderAlgebra(null);
    if (vecListSec) vecListSec.style.display = 'none';
    // Auto-calc default values for chosen algebra operation
    setTimeout(() => {
      document.getElementById('btn-alg-calc')?.click();
    }, 10);
  }
});

document.addEventListener('algebra:calc', e => {
  const { mode, va, vb, k } = e.detail;
  const unit = ENTITIES[state.entityId]?.unit ?? '';
  let algResult = { mode, va, vb, k, unit };

  if (mode === 'sum') {
    algResult.resultVec = makeVectorFromCart(va.dx + vb.dx, va.dy + vb.dy, 'A + B');
    patchState({ algebraMode: 'sum', algebraResult: algResult });
  } else if (mode === 'sub') {
    algResult.resultVec = vectorSubtract(va, vb);
    patchState({ algebraMode: 'sub', algebraResult: algResult });
  } else if (mode === 'scalar') {
    algResult.resultVec = scalarMultiply(va, k);
    algResult.k = k;
    patchState({ algebraMode: 'scalar', algebraResult: algResult });
  } else if (mode === 'dot') {
    algResult.scalar = dotProduct(va, vb);
    algResult.angle  = angleBetween(va, vb);
    patchState({ algebraMode: 'dot', algebraResult: algResult });
  } else if (mode === 'cross') {
    algResult.crossResult = crossProduct(va, vb);
    // Silent orthogonality evaluation: (0, 0, k) · (Ax, Ay, 0) = 0
    const dotRA = 0 * va.dx + 0 * va.dy + algResult.crossResult.k * 0;
    algResult.orthoValid = Math.abs(dotRA) < 1e-9;
    patchState({ algebraMode: 'cross', algebraResult: algResult });
  }

  renderAlgebra(algResult);
});

// ── Zoom controls ─────────────────────────────────────────
function _updateZoomLabel(pct) {
  if (zoomLabelEl) zoomLabelEl.textContent = (pct || getZoomPercent()) + '%';
}
window.addEventListener('zoom:change', e => _updateZoomLabel(e.detail?.percent));

document.getElementById('btn-zoom-in')?.addEventListener('click', () => { zoomIn(); _updateZoomLabel(); });
document.getElementById('btn-zoom-out')?.addEventListener('click', () => { zoomOut(); _updateZoomLabel(); });
document.getElementById('btn-zoom-reset')?.addEventListener('click', () => { resetZoom(); _updateZoomLabel(); });

// ── Resize ────────────────────────────────────────────────
window.addEventListener('resize', () => {
  resize();
  const r = compute(state);
  if (!anim.playing && !state.algebraResult) render(state, r, null);
  if (graphsCanvas && _lastGraphData) renderGraphs(graphsCanvas, _lastGraphData);
});

// ── Calculadoras & graficas ───────────────────────────────
let _lastGraphData = null;
document.addEventListener('calc:result', e => {
  if (e.detail?.type === 'graphs') {
    _lastGraphData = e.detail.data;
    const panel = document.getElementById('graphs-panel');
    if (panel) {
      panel.hidden = false;
      const tb = document.getElementById('btn-toggle-graphs');
      if (tb) tb.textContent = 'Ocultar Gráficas';
    }
    if (graphsCanvas && _lastGraphData) renderGraphs(graphsCanvas, _lastGraphData);
  }
});

// ═══ ANIMATION PLAYER ═════════════════════════════════════
const anim = { playing: false, segIndex: 0, t: 0, rafId: null, lastTime: null, complete: false };

function _getSpeed() { return parseFloat(document.getElementById('speed-slider')?.value ?? 1); }

function playAnim() {
  if (!state.vectors.length) return;
  if (anim.playing) { pauseAnim(); return; }
  if (anim.complete || anim.segIndex >= state.vectors.length) _resetAnimState();
  anim.playing = true; anim.complete = false; anim.lastTime = null;
  anim.rafId = requestAnimationFrame(_animFrame);
  _updatePlayerUI();
}

function pauseAnim() {
  anim.playing = false;
  if (anim.rafId) { cancelAnimationFrame(anim.rafId); anim.rafId = null; }
  _updatePlayerUI();
}

function stopAnim() {
  anim.playing = false;
  if (anim.rafId) { cancelAnimationFrame(anim.rafId); anim.rafId = null; }
}

function resetAnim() {
  stopAnim(); _resetAnimState();
  const r = compute(state);
  if (r) render(state, r, null);
  _updateProgress(0); _updatePlayerUI();
}

function _resetAnimState() { anim.segIndex = 0; anim.t = 0; anim.complete = false; anim.lastTime = null; }

function _animFrame(ts) {
  if (!anim.playing) return;
  if (!anim.lastTime) anim.lastTime = ts;
  const dt = Math.min((ts - anim.lastTime) / 1000, 0.1);
  anim.lastTime = ts;
  anim.t += dt * _getSpeed();
  const result = compute(state);
  if (!result || !state.vectors.length) { stopAnim(); return; }

  if (anim.t >= 1) {
    anim.t = 1;
    render(state, result, { segIndex: anim.segIndex, t: 1 });
    _updateProgress((anim.segIndex + 1) / state.vectors.length);
    anim.segIndex++;
    anim.t = 0;
    if (anim.segIndex >= state.vectors.length) {
      render(state, result, null);
      anim.complete = true; anim.playing = false; anim.rafId = null;
      _updateProgress(1); _updatePlayerUI();
      return;
    }
  } else {
    render(state, result, { segIndex: anim.segIndex, t: anim.t });
    _updateProgress((anim.segIndex + anim.t) / state.vectors.length);
  }
  anim.rafId = requestAnimationFrame(_animFrame);
}

function _updateProgress(p) {
  const bar = document.getElementById('anim-bar');
  if (bar) bar.style.width = (Math.min(1, p) * 100).toFixed(1) + '%';
}

function _updatePlayerUI() {
  const btn = document.getElementById('btn-play');
  if (!btn) return;
  btn.textContent = anim.playing ? 'Pausar' : 'Reproducir';
  if (anim.playing) btn.classList.add('play-active');
  else btn.classList.remove('play-active');
}

document.getElementById('btn-play')?.addEventListener('click',      playAnim);
document.getElementById('btn-stop-anim')?.addEventListener('click', resetAnim);

document.getElementById('speed-slider')?.addEventListener('input', () => {
  const v = parseFloat(document.getElementById('speed-slider').value);
  const lbl = document.getElementById('speed-val');
  if (lbl) lbl.textContent = v.toFixed(1) + 'x';
});

// ── Startup ───────────────────────────────────────────────
loadPreset('vehicle');
