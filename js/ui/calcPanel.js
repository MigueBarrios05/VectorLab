// ui/calcPanel.js — Panel de Calculadoras Fisicas
// Renderiza formularios para cada modulo de fisica ampliado.
// Emite CustomEvent 'calc:result' con { type, data } para el orquestador.

import {
  projectileMotion, freeFallInterception,
  inheritedVelocity, freeFallSound, kinematicData, percentError,
} from '../physicsModules.js';

let _root = null;
let _activeCalc = 'projectile';

export function init(root) {
  _root = root;
  _render();
}

function _render() {
  if (!_root) return;
  _root.innerHTML = `
    <div class="calc-tabs">
      ${[
        ['projectile', 'Tiro Parabolico'],
        ['freefall',   'Caida Libre + MRU'],
        ['inherited',  'Velocidad Heredada'],
        ['sound',      'Caida + Sonido'],
        ['graphs',     'Graficas a-t/v-t/x-t'],
        ['error',      '% Error'],
      ].map(([id,lbl]) =>
        `<button class="ctab-btn${_activeCalc===id?' active':''}" data-calc="${id}">${lbl}</button>`
      ).join('')}
    </div>
    <div id="calc-form"></div>
    <div id="calc-result" class="calc-result-box"></div>
  `;
  _root.querySelectorAll('.ctab-btn').forEach(btn => {
    btn.addEventListener('click', () => { _activeCalc = btn.dataset.calc; _render(); });
  });
  _buildForm();
}

function _buildForm() {
  const f = _root.querySelector('#calc-form');
  if (!f) return;
  switch (_activeCalc) {
    case 'projectile': _formProjectile(f); break;
    case 'freefall':   _formFreefall(f);   break;
    case 'inherited':  _formInherited(f);  break;
    case 'sound':      _formSound(f);      break;
    case 'graphs':     _formGraphs(f);     break;
    case 'error':      _formError(f);      break;
  }
}

// ── Helpers ────────────────────────────────────────────────
function _field(id, label, placeholder, value = '') {
  return `<div class="field-group">
    <label>${label}</label>
    <input class="num-input" id="${id}" type="number" step="any" placeholder="${placeholder}" value="${value}"/>
  </div>`;
}
function _btn(label) { return `<button class="vec-add-btn calc-run-btn">${label}</button>`; }

function _showResult(html) {
  const r = _root.querySelector('#calc-result');
  if (r) r.innerHTML = html;
}

function _resRow(label, val, cls='') {
  return `<div class="result-row"><span class="result-label">${label}</span><span class="result-val ${cls}">${val}</span></div>`;
}

// ── 1. Tiro parabolico ─────────────────────────────────────
function _formProjectile(f) {
  f.innerHTML = `
    <div class="vec-input-grid">
      ${_field('p-v0', 'Velocidad inicial V0 (m/s)', '20', '20')}
      ${_field('p-theta', 'Angulo theta (grados)', '45', '45')}
      ${_field('p-g', 'Gravedad g (m/s²)', '9.8', '9.8')}
      ${_field('p-yi', 'Altura inicial yi (m)', '0', '0')}
    </div>
    ${_btn('Calcular Tiro Parabolico')}
  `;
  f.querySelector('.calc-run-btn').addEventListener('click', () => {
    const v0 = +f.querySelector('#p-v0').value;
    const th = +f.querySelector('#p-theta').value;
    const g  = +f.querySelector('#p-g').value   || 9.8;
    const yi = +f.querySelector('#p-yi').value  || 0;
    const r  = projectileMotion({ v0, thetaDeg: th, g, yi });
    if (!r) return _showResult('<p class="calc-err">No hay solucion real para esos parametros.</p>');
    _showResult(`
      <div class="result-section">Tiro Parabolico</div>
      ${_resRow('V0x (horizontal)',   r.v0x + ' m/s',    'highlight')}
      ${_resRow('V0y (vertical)',     r.v0y + ' m/s',    'highlight')}
      ${_resRow('Tiempo de vuelo',    r.tFlight + ' s',  'green')}
      ${_resRow('Tiempo en h_max',    r.tAtHMax + ' s',  '')}
      ${_resRow('Altura maxima',      r.hMax + ' m',     'orange')}
      ${_resRow('Alcance horizontal', r.range + ' m',    'green')}
      <div class="calc-alert"><b>Alerta teorica:</b> En h_max: Vy = 0 m/s, pero g = ${g} m/s² sigue activo (↓). Vx = ${r.v0x} m/s constante.</div>
    `);
    _dispatch('projectile', { ...r, pts: undefined });
    _dispatchGraph(r.pts.map(p => ({ t: p.t, x: p.x, y: p.y })));
  });
}

// ── 2. Caida libre + MRU ───────────────────────────────────
function _formFreefall(f) {
  f.innerHTML = `
    <div class="vec-input-grid">
      ${_field('ff-h', 'Altura de caida h (m)', '3', '3')}
      ${_field('ff-vx', 'Velocidad horizontal vx (m/s)', '10', '10')}
      ${_field('ff-g', 'Gravedad g (m/s²)', '9.8', '9.8')}
    </div>
    ${_btn('Calcular Intercepcion')}
  `;
  f.querySelector('.calc-run-btn').addEventListener('click', () => {
    const h  = +f.querySelector('#ff-h').value;
    const vx = +f.querySelector('#ff-vx').value;
    const g  = +f.querySelector('#ff-g').value || 9.8;
    const r  = freeFallInterception({ h, vx, g });
    _showResult(`
      <div class="result-section">Intercepcion Bidimensional</div>
      ${_resRow('Tiempo de caida t', r.t + ' s', 'highlight')}
      ${_resRow('Distancia horizontal x', r.x + ' m', 'green')}
      <div class="calc-formula"><code>h = (1/2)g·t²  =>  t = √(2h/g)</code></div>
      <div class="calc-formula"><code>x = vx · t = ${vx} × ${r.t} = ${r.x} m</code></div>
    `);
    _dispatch('freefall', r);
  });
}

// ── 3. Velocidad heredada ──────────────────────────────────
function _formInherited(f) {
  f.innerHTML = `
    <div class="vec-input-grid">
      ${_field('ih-yi', 'Altura inicial yi (m)', '21', '21')}
      ${_field('ih-vi', 'Velocidad inicial Vi (m/s, sube +, baja -)', '5', '5')}
      ${_field('ih-g',  'Gravedad g (m/s²)', '9.8', '9.8')}
    </div>
    ${_btn('Calcular Tiempo de Vuelo')}
  `;
  f.querySelector('.calc-run-btn').addEventListener('click', () => {
    const yi = +f.querySelector('#ih-yi').value;
    const vi = +f.querySelector('#ih-vi').value;
    const g  = +f.querySelector('#ih-g').value || 9.8;
    const r  = inheritedVelocity({ yi, vi, g });
    if (!r) return _showResult('<p class="calc-err">Sin solucion real.</p>');
    _showResult(`
      <div class="result-section">Velocidad Heredada</div>
      ${_resRow('Tiempo de vuelo', r.t + ' s', 'green')}
      <div class="calc-formula"><code>${r.quadEq}</code></div>
      <div class="calc-alert">El objeto hereda Vi = ${vi} m/s del vehiculo (no parte del reposo).</div>
    `);
    _dispatch('inherited', r);
  });
}

// ── 4. Caida libre + sonido ────────────────────────────────
function _formSound(f) {
  f.innerHTML = `
    <div class="vec-input-grid">
      ${_field('sd-tT', 'Tiempo total registrado tT (s)', '2.4', '2.4')}
      ${_field('sd-vs', 'Velocidad del sonido vs (m/s)', '336', '336')}
      ${_field('sd-g',  'Gravedad g (m/s²)', '9.8', '9.8')}
    </div>
    ${_btn('Calcular Profundidad Real')}
  `;
  f.querySelector('.calc-run-btn').addEventListener('click', () => {
    const tT = +f.querySelector('#sd-tT').value;
    const vs = +f.querySelector('#sd-vs').value || 336;
    const g  = +f.querySelector('#sd-g').value  || 9.8;
    const r  = freeFallSound({ tTotal: tT, vs, g });
    if (!r) return _showResult('<p class="calc-err">Sin solucion real.</p>');
    _showResult(`
      <div class="result-section">Sistema Acoplado Caida + Sonido</div>
      ${_resRow('Tiempo de caida tc', r.tc + ' s',        'highlight')}
      ${_resRow('Tiempo del sonido ts', r.ts + ' s',      '')}
      ${_resRow('Profundidad REAL', r.hReal + ' m',       'green')}
      ${_resRow('Prof. si ignoras sonido', r.hTeo + ' m', 'orange')}
      ${_resRow('Error matematico %', r.error + ' %',     'purple')}
      <div class="calc-formula"><code>${r.quadEq}</code></div>
    `);
    _dispatch('sound', r);
  });
}

// ── 5. Graficas cinematicas ────────────────────────────────
let _graphSegments = [];

function _formGraphs(f) {
  _graphSegments = _graphSegments.length ? _graphSegments : [
    { a: 2.0, dt: 10, label: 'Tramo 1' },
    { a: 0.0, dt: 5,  label: 'Tramo 2' },
    { a:-3.0, dt: 5,  label: 'Tramo 3' },
  ];
  const segsHTML = _graphSegments.map((s, i) => `
    <div class="seg-row" data-idx="${i}">
      <span style="font-size:10px;color:#6b7280;min-width:18px">#${i+1}</span>
      <input class="num-input seg-a" type="number" step="any" placeholder="a" value="${s.a}" style="width:60px" title="Aceleracion (m/s²)"/>
      <input class="num-input seg-dt" type="number" step="any" placeholder="Dt" value="${s.dt}" style="width:54px" title="Duracion (s)"/>
      <input class="num-input seg-lbl" type="text" placeholder="etiqueta" value="${s.label}" style="flex:1" />
      <button class="del-btn seg-del" data-idx="${i}">x</button>
    </div>
  `).join('');
  f.innerHTML = `
    <div class="vec-input-grid">
      ${_field('gr-v0', 'V inicial V0 (m/s)', '0', '0')}
      ${_field('gr-x0', 'X inicial X0 (m)',   '0', '0')}
    </div>
    <div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px">Segmentos (a, Delta t):</div>
    <div id="seg-list">${segsHTML}</div>
    <button class="btn-sec" id="seg-add" style="margin:6px 0 8px">+ Agregar Segmento</button>
    ${_btn('Generar Graficas')}
  `;

  f.querySelectorAll('.seg-del').forEach(btn => {
    btn.addEventListener('click', () => { _graphSegments.splice(+btn.dataset.idx, 1); _formGraphs(f); });
  });
  f.querySelector('#seg-add').addEventListener('click', () => {
    _graphSegments.push({ a: 0, dt: 5, label: 'Tramo ' + (_graphSegments.length + 1) });
    _formGraphs(f);
  });
  f.querySelector('.calc-run-btn').addEventListener('click', () => {
    // Leer segmentos desde DOM
    const rows = f.querySelectorAll('.seg-row');
    _graphSegments = Array.from(rows).map(row => ({
      a:     parseFloat(row.querySelector('.seg-a').value)   || 0,
      dt:    parseFloat(row.querySelector('.seg-dt').value)  || 1,
      label: row.querySelector('.seg-lbl').value.trim() || 'Tramo',
    }));
    const v0 = +f.querySelector('#gr-v0').value || 0;
    const x0 = +f.querySelector('#gr-x0').value || 0;
    const data = kinematicData(_graphSegments, { v0, x0 });
    _showResult(`
      <div class="result-section">Resumen Cinematico</div>
      ${_resRow('Tiempo total',    data.tTotal + ' s', '')}
      ${_resRow('Velocidad final', data.vFinal + ' m/s', 'highlight')}
      ${_resRow('Posicion final',  data.xFinal + ' m',  'green')}
    `);
    _dispatch('graphs', data);
  });
}

// ── 6. Error porcentual ────────────────────────────────────
function _formError(f) {
  f.innerHTML = `
    <div class="vec-input-grid">
      ${_field('er-real', 'Valor REAL (medido)', '', '')}
      ${_field('er-teo',  'Valor TEORICO (calculado)', '', '')}
    </div>
    ${_btn('Calcular % Error')}
  `;
  f.querySelector('.calc-run-btn').addEventListener('click', () => {
    const real = +f.querySelector('#er-real').value;
    const teo  = +f.querySelector('#er-teo').value;
    const err  = percentError(real, teo);
    _showResult(`
      <div class="result-section">Error Matematico</div>
      ${_resRow('Valor real',     real, '')}
      ${_resRow('Valor teorico',  teo,  '')}
      ${_resRow('% Error',        err.toFixed(2) + ' %', 'purple')}
      <div class="calc-formula"><code>|( ${real} - ${teo} ) / ${real}| * 100 = ${err.toFixed(2)} %</code></div>
    `);
  });
}

// ── Dispatch helpers ───────────────────────────────────────
function _dispatch(type, data) {
  _root.dispatchEvent(new CustomEvent('calc:result', { bubbles: true, detail: { type, data } }));
}
function _dispatchGraph(pts) {
  _root.dispatchEvent(new CustomEvent('calc:trajectory', { bubbles: true, detail: { pts } }));
}
