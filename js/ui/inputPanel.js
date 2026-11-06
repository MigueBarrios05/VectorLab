// ui/inputPanel.js v6 — Entrada minimalista: Suma para N vectores y Álgebra Vectorial
import { makeVectorFromPolar, makeVectorFromCart } from '../vectorEngine.js';
import { OPERATIONS } from '../config.js';

let _root = null;
let _unit = 'km';
let _mode = 'polar'; // 'polar' | 'cart'
let _vecCount = 0;
let _algebraMode = 'sum';

// Cache values for algebra operations
const _cache = {
  vaR: '120', vaTh: '30', vaX: '103.9', vaY: '60.0',
  vbR: '80', vbTh: '90', vbX: '0', vbY: '80.0',
  k: '1.5',
};

export function init(root, mode = 'polar', unit = 'km') {
  _root = root;
  _mode = mode;
  _unit = unit;
  _render();
}

export function setUnit(unit) {
  _unit = unit;
  _root?.querySelectorAll('.mini-unit-mag').forEach(el => el.textContent = unit);
  _root?.querySelectorAll('.mini-unit-cart').forEach(el => el.textContent = unit);
}

export function setMode(mode) {
  _mode = mode;
  _render();
}

export function setAlgebraMode(mode) {
  _algebraMode = mode;
  _render();
}

export function getAlgebraMode() { return _algebraMode; }

export function resetCount() { _vecCount = 0; }
export function incrementCount() { _vecCount++; }

function _isScalar() {
  return _algebraMode === 'scalar';
}

function _render() {
  if (!_root) return;

  const opOptions = OPERATIONS.map(op =>
    `<option value="${op.id}"${_algebraMode === op.id ? ' selected' : ''}>${op.label}</option>`
  ).join('');

  let fieldsHTML = '';

  if (_algebraMode === 'sum') {
    // ── MODO SUMA: Ingreso individual dinámico para N vectores ──
    if (_mode === 'polar') {
      fieldsHTML = `
        <div class="mini-input">
          <div class="mini-field">
            <input class="mini-num" id="inp-r" type="number" step="any"
              placeholder="Magnitud" autocomplete="off"/>
            <span class="mini-unit mini-unit-mag">${_unit}</span>
          </div>
          <div class="mini-field">
            <input class="mini-num" id="inp-theta" type="number" step="any"
              placeholder="Ángulo" autocomplete="off"/>
            <span class="mini-unit">&deg;</span>
          </div>
          <button class="btn-circle-add" id="btn-add" title="Añadir vector a la ruta">+</button>
        </div>
      `;
    } else {
      fieldsHTML = `
        <div class="mini-input">
          <div class="mini-field">
            <input class="mini-num" id="inp-x" type="number" step="any"
              placeholder="&Delta;x" autocomplete="off"/>
            <span class="mini-unit mini-unit-cart">${_unit}</span>
          </div>
          <div class="mini-field">
            <input class="mini-num" id="inp-y" type="number" step="any"
              placeholder="&Delta;y" autocomplete="off"/>
            <span class="mini-unit mini-unit-cart">${_unit}</span>
          </div>
          <button class="btn-circle-add" id="btn-add" title="Añadir vector a la ruta">+</button>
        </div>
      `;
    }
  } else if (_isScalar()) {
    // ── MODO ESCALAR: Vector A + Escalar k ──
    if (_mode === 'polar') {
      fieldsHTML = `
        <div class="alg-vec-block">
          <div class="alg-vec-label">Vector</div>
          <div class="mini-input">
            <div class="mini-field">
              <input class="mini-num" id="va-r" type="number" step="any"
                placeholder="Magnitud" value="${_cache.vaR}" autocomplete="off"/>
              <span class="mini-unit mini-unit-mag">${_unit}</span>
            </div>
            <div class="mini-field">
              <input class="mini-num" id="va-theta" type="number" step="any"
                placeholder="Ángulo" value="${_cache.vaTh}" autocomplete="off"/>
              <span class="mini-unit">&deg;</span>
            </div>
          </div>
        </div>

        <div class="alg-vec-block" style="margin-top:8px">
          <div class="alg-vec-label" style="color:var(--accent4, #8b5cf6)">Número Escalar (k)</div>
          <div class="mini-input">
            <div class="mini-field" style="width:100%">
              <input class="mini-num" id="inp-scalar" type="number" step="any"
                placeholder="ej. 2 ó -1.5" value="${_cache.k}" autocomplete="off"/>
            </div>
          </div>
        </div>
        <button class="btn-alg-calc" id="btn-alg-calc">Calcular</button>
      `;
    } else {
      fieldsHTML = `
        <div class="alg-vec-block">
          <div class="alg-vec-label">Vector</div>
          <div class="mini-input">
            <div class="mini-field">
              <input class="mini-num" id="va-x" type="number" step="any"
                placeholder="&Delta;x" value="${_cache.vaX}" autocomplete="off"/>
              <span class="mini-unit mini-unit-cart">${_unit}</span>
            </div>
            <div class="mini-field">
              <input class="mini-num" id="va-y" type="number" step="any"
                placeholder="&Delta;y" value="${_cache.vaY}" autocomplete="off"/>
              <span class="mini-unit mini-unit-cart">${_unit}</span>
            </div>
          </div>
        </div>

        <div class="alg-vec-block" style="margin-top:8px">
          <div class="alg-vec-label" style="color:var(--accent4, #8b5cf6)">Número Escalar (k)</div>
          <div class="mini-input">
            <div class="mini-field" style="width:100%">
              <input class="mini-num" id="inp-scalar" type="number" step="any"
                placeholder="ej. 2 ó -1.5" value="${_cache.k}" autocomplete="off"/>
            </div>
          </div>
        </div>
        <button class="btn-alg-calc" id="btn-alg-calc">Calcular</button>
      `;
    }
  } else {
    // ── OPERACIONES BINARIAS: Resta, Producto Punto, Producto Cruz ──
    if (_mode === 'polar') {
      fieldsHTML = `
        <div class="alg-vec-block">
          <div class="alg-vec-label">Vector A</div>
          <div class="mini-input">
            <div class="mini-field">
              <input class="mini-num" id="va-r" type="number" step="any"
                placeholder="Magnitud" value="${_cache.vaR}" autocomplete="off"/>
              <span class="mini-unit mini-unit-mag">${_unit}</span>
            </div>
            <div class="mini-field">
              <input class="mini-num" id="va-theta" type="number" step="any"
                placeholder="Ángulo" value="${_cache.vaTh}" autocomplete="off"/>
              <span class="mini-unit">&deg;</span>
            </div>
          </div>
        </div>

        <div class="alg-vec-block" style="margin-top:8px">
          <div class="alg-vec-label" style="color:var(--accent-amber, #d97706)">Vector B</div>
          <div class="mini-input">
            <div class="mini-field">
              <input class="mini-num" id="vb-r" type="number" step="any"
                placeholder="Magnitud" value="${_cache.vbR}" autocomplete="off"/>
              <span class="mini-unit mini-unit-mag">${_unit}</span>
            </div>
            <div class="mini-field">
              <input class="mini-num" id="vb-theta" type="number" step="any"
                placeholder="Ángulo" value="${_cache.vbTh}" autocomplete="off"/>
              <span class="mini-unit">&deg;</span>
            </div>
          </div>
        </div>
        <button class="btn-alg-calc" id="btn-alg-calc">Calcular</button>
      `;
    } else {
      fieldsHTML = `
        <div class="alg-vec-block">
          <div class="alg-vec-label">Vector A</div>
          <div class="mini-input">
            <div class="mini-field">
              <input class="mini-num" id="va-x" type="number" step="any"
                placeholder="&Delta;x" value="${_cache.vaX}" autocomplete="off"/>
              <span class="mini-unit mini-unit-cart">${_unit}</span>
            </div>
            <div class="mini-field">
              <input class="mini-num" id="va-y" type="number" step="any"
                placeholder="&Delta;y" value="${_cache.vaY}" autocomplete="off"/>
              <span class="mini-unit mini-unit-cart">${_unit}</span>
            </div>
          </div>
        </div>

        <div class="alg-vec-block" style="margin-top:8px">
          <div class="alg-vec-label" style="color:var(--accent-amber, #d97706)">Vector B</div>
          <div class="mini-input">
            <div class="mini-field">
              <input class="mini-num" id="vb-x" type="number" step="any"
                placeholder="&Delta;x" value="${_cache.vbX}" autocomplete="off"/>
              <span class="mini-unit mini-unit-cart">${_unit}</span>
            </div>
            <div class="mini-field">
              <input class="mini-num" id="vb-y" type="number" step="any"
                placeholder="&Delta;y" value="${_cache.vbY}" autocomplete="off"/>
              <span class="mini-unit mini-unit-cart">${_unit}</span>
            </div>
          </div>
        </div>
        <button class="btn-alg-calc" id="btn-alg-calc">Calcular</button>
      `;
    }
  }

  _root.innerHTML = `
    <div class="op-selector">
      <label class="op-selector-label" for="op-mode">Operación</label>
      <select class="op-dropdown" id="op-mode">${opOptions}</select>
    </div>

    ${fieldsHTML}

    <div class="input-mode-toggle">
      <button class="mode-btn${_mode === 'polar' ? ' active' : ''}" id="m-polar">Polar (r, &theta;)</button>
      <button class="mode-btn${_mode === 'cart' ? ' active' : ''}" id="m-cart">Cartesiano (x, y)</button>
    </div>
  `;

  // ── Wire Events ──
  _root.querySelector('#op-mode')?.addEventListener('change', e => {
    _algebraMode = e.target.value;
    _render();
    _root.dispatchEvent(
      new CustomEvent('algebra:mode', { bubbles: true, detail: { mode: _algebraMode } })
    );
  });

  _root.querySelector('#m-polar')?.addEventListener('click', () => {
    _mode = 'polar';
    _render();
    if (_algebraMode !== 'sum') _submitAlgebraSilently();
  });

  _root.querySelector('#m-cart')?.addEventListener('click', () => {
    _mode = 'cart';
    _render();
    if (_algebraMode !== 'sum') _submitAlgebraSilently();
  });

  if (_algebraMode === 'sum') {
    _root.querySelector('#btn-add')?.addEventListener('click', _submitSum);
    _root.querySelectorAll('.mini-num').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') _submitSum();
      });
    });
  } else {
    _root.querySelector('#btn-alg-calc')?.addEventListener('click', _submitAlgebra);
    _root.querySelectorAll('.mini-num').forEach(inp => {
      inp.addEventListener('input', () => {
        _syncCache();
        _submitAlgebraSilently();
      });
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') _submitAlgebra();
      });
    });
  }
}

function _syncCache() {
  const vaR = _root.querySelector('#va-r');
  const vaTh = _root.querySelector('#va-theta');
  const vaX = _root.querySelector('#va-x');
  const vaY = _root.querySelector('#va-y');
  const vbR = _root.querySelector('#vb-r');
  const vbTh = _root.querySelector('#vb-theta');
  const vbX = _root.querySelector('#vb-x');
  const vbY = _root.querySelector('#vb-y');
  const scl = _root.querySelector('#inp-scalar');

  if (vaR) _cache.vaR = vaR.value;
  if (vaTh) _cache.vaTh = vaTh.value;
  if (vaX) _cache.vaX = vaX.value;
  if (vaY) _cache.vaY = vaY.value;
  if (vbR) _cache.vbR = vbR.value;
  if (vbTh) _cache.vbTh = vbTh.value;
  if (vbX) _cache.vbX = vbX.value;
  if (vbY) _cache.vbY = vbY.value;
  if (scl) _cache.k = scl.value;
}

function _submitSum() {
  _vecCount++;
  const label = `Tramo ${_vecCount}`;
  let vec;

  if (_mode === 'polar') {
    const rEl = _root.querySelector('#inp-r');
    const thEl = _root.querySelector('#inp-theta');
    const r = parseFloat(rEl?.value);
    const theta = parseFloat(thEl?.value);
    if (isNaN(r) || isNaN(theta)) {
      _vecCount--;
      _flashError('#inp-r');
      return;
    }
    vec = makeVectorFromPolar(r, theta, label);
    if (rEl) rEl.value = '';
    if (thEl) thEl.value = '';
    rEl?.focus();
  } else {
    const xEl = _root.querySelector('#inp-x');
    const yEl = _root.querySelector('#inp-y');
    const dx = parseFloat(xEl?.value);
    const dy = parseFloat(yEl?.value);
    if (isNaN(dx) || isNaN(dy)) {
      _vecCount--;
      _flashError('#inp-x');
      return;
    }
    vec = makeVectorFromCart(dx, dy, label);
    if (xEl) xEl.value = '';
    if (yEl) yEl.value = '';
    xEl?.focus();
  }

  _root.dispatchEvent(
    new CustomEvent('vector:add', { bubbles: true, detail: { vector: vec } })
  );
}

function _readVector(prefix) {
  if (_mode === 'polar') {
    const r = parseFloat(_root.querySelector('#' + prefix + '-r')?.value);
    const theta = parseFloat(_root.querySelector('#' + prefix + '-theta')?.value);
    if (isNaN(r) || isNaN(theta)) return null;
    return makeVectorFromPolar(r, theta, prefix === 'va' ? 'Vector A' : 'Vector B');
  } else {
    const dx = parseFloat(_root.querySelector('#' + prefix + '-x')?.value);
    const dy = parseFloat(_root.querySelector('#' + prefix + '-y')?.value);
    if (isNaN(dx) || isNaN(dy)) return null;
    return makeVectorFromCart(dx, dy, prefix === 'va' ? 'Vector A' : 'Vector B');
  }
}

function _submitAlgebra() {
  _syncCache();
  const va = _readVector('va');
  if (!va) { _flashError('#va-r, #va-x'); return; }

  if (_isScalar()) {
    const k = parseFloat(_root.querySelector('#inp-scalar')?.value);
    if (isNaN(k)) { _flashError('#inp-scalar'); return; }
    _root.dispatchEvent(
      new CustomEvent('algebra:calc', { bubbles: true, detail: { mode: _algebraMode, va, k } })
    );
  } else {
    const vb = _readVector('vb');
    if (!vb) { _flashError('#vb-r, #vb-x'); return; }
    _root.dispatchEvent(
      new CustomEvent('algebra:calc', { bubbles: true, detail: { mode: _algebraMode, va, vb } })
    );
  }
}

function _submitAlgebraSilently() {
  _syncCache();
  const va = _readVector('va');
  if (!va) return;

  if (_isScalar()) {
    const k = parseFloat(_root.querySelector('#inp-scalar')?.value);
    if (isNaN(k)) return;
    _root.dispatchEvent(
      new CustomEvent('algebra:calc', { bubbles: true, detail: { mode: _algebraMode, va, k } })
    );
  } else {
    const vb = _readVector('vb');
    if (!vb) return;
    _root.dispatchEvent(
      new CustomEvent('algebra:calc', { bubbles: true, detail: { mode: _algebraMode, va, vb } })
    );
  }
}

function _flashError(sel) {
  const selectors = sel.split(',').map(s => s.trim());
  for (const s of selectors) {
    const el = _root?.querySelector(s);
    if (!el) continue;
    el.classList.add('error');
    el.focus();
    setTimeout(() => el.classList.remove('error'), 600);
  }
}
