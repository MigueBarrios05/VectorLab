// ui/resultsPanel.js v5 — Dashboard de resultados inteligente + acordeón de procedimiento matemático
import { COLORS } from '../config.js';
import { fmt }    from '../vectorEngine.js';

let _accordionOpen = false;

export function setupAccordion() {
  const btn = document.getElementById('accord-btn');
  btn?.addEventListener('click', () => {
    _accordionOpen = !_accordionOpen;
    const body  = document.getElementById('accord-body');
    const arrow = btn.querySelector('.accord-arrow');
    if (body)  body.hidden = !_accordionOpen;
    btn.classList.toggle('open', _accordionOpen);
    arrow?.classList.toggle('open', _accordionOpen);
  });
}

export function update(result, state, unit) {
  const emptyEl     = document.getElementById('res-empty');
  const heroEl      = document.getElementById('res-hero');
  const accordBtnEl = document.getElementById('accord-btn');
  const accordBody  = document.getElementById('accord-body');
  const titleEl     = document.getElementById('results-card-title');
  const magEl       = document.getElementById('hero-mag');
  const angEl       = document.getElementById('hero-ang');
  const quadEl      = document.getElementById('hero-quad');
  const retEl       = document.getElementById('hero-retorno');
  const extraEl     = document.getElementById('hero-algebra-extra');

  // Case 1: Active algebra operation result
  if (state.algebraResult) {
    if (emptyEl)     emptyEl.hidden     = true;
    if (heroEl)      heroEl.hidden      = false;
    if (accordBtnEl) accordBtnEl.hidden = false;

    const alg = state.algebraResult;
    const { mode, va, vb, k } = alg;

    if (mode === 'sum') {
      if (titleEl) titleEl.textContent = 'Vector Resultante (Suma A + B)';
      const r = alg.resultVec;
      if (magEl)   magEl.innerHTML     = `${fmt(r.r)}&thinsp;<span class="hero-unit">${unit}</span>`;
      if (angEl)   angEl.innerHTML     = `&theta; = ${fmt(r.theta, 2)}&deg;`;
      if (quadEl)  quadEl.textContent  = `Componentes: (${fmt(r.dx)}, ${fmt(r.dy)}) ${unit}`;
      if (retEl)   retEl.hidden        = true;
      if (extraEl) extraEl.innerHTML   = '';
      _buildSumAccordion(alg, unit);
    } else if (mode === 'sub') {
      if (titleEl) titleEl.textContent = 'Vector Resultante (Resta A \u2212 B)';
      const r = alg.resultVec;
      if (magEl)   magEl.innerHTML     = `${fmt(r.r)}&thinsp;<span class="hero-unit">${unit}</span>`;
      if (angEl)   angEl.innerHTML     = `&theta; = ${fmt(r.theta, 2)}&deg;`;
      if (quadEl)  quadEl.textContent  = `Componentes: (${fmt(r.dx)}, ${fmt(r.dy)}) ${unit}`;
      if (retEl)   retEl.hidden        = true;
      if (extraEl) extraEl.innerHTML   = '';
      _buildSubAccordion(alg, unit);
    } else if (mode === 'scalar') {
      if (titleEl) titleEl.textContent = 'Vector Resultante (Escalar \u00b7 V)';
      const r = alg.resultVec;
      if (magEl)   magEl.innerHTML     = `${fmt(r.r)}&thinsp;<span class="hero-unit">${unit}</span>`;
      if (angEl)   angEl.innerHTML     = `&theta; = ${fmt(r.theta, 2)}&deg;`;
      if (quadEl)  quadEl.textContent  = `Escalar k = ${fmt(k, 3)} | Comp: (${fmt(r.dx)}, ${fmt(r.dy)}) ${unit}`;
      if (retEl)   retEl.hidden        = true;
      if (extraEl) extraEl.innerHTML   = '';
      _buildScalarAccordion(alg, unit);
    } else if (mode === 'dot') {
      if (titleEl) titleEl.textContent = 'Producto Punto (A \u00b7 B)';
      if (magEl)   magEl.innerHTML     = `${fmt(alg.scalar, 4)}`;
      if (angEl)   angEl.innerHTML     = `&theta; entre A y B = <b>${fmt(alg.angle, 2)}&deg;</b>`;
      if (quadEl)  quadEl.textContent  = 'Cantidad Escalar (sin dirección vectorial)';
      if (retEl)   retEl.hidden        = true;
      if (extraEl) extraEl.innerHTML   = `
        <div class="alg-note info">
          Fórmula: &theta; = cos<sup>&minus;1</sup>(A&middot;B / |A||B|)
        </div>`;
      _buildDotAccordion(alg);
    } else if (mode === 'cross') {
      if (titleEl) titleEl.textContent = 'Producto Cruz (A \u00d7 B)';
      const cp = alg.crossResult;
      const magCross = Math.abs(cp.k);
      const dirSign = cp.k >= 0 ? '+k\u0302 (hacia afuera \u2299)' : '&minus;k\u0302 (hacia adentro \u2297)';
      if (magEl)   magEl.innerHTML     = `${fmt(magCross, 4)}&thinsp;<span class="hero-unit">k&#770;</span>`;
      if (angEl)   angEl.innerHTML     = `Direcci&oacute;n: Eje z ${dirSign}`;
      if (quadEl)  quadEl.textContent  = `Vector ortogonal en 3D: (0, 0, ${fmt(cp.k, 4)})`;
      if (retEl)   retEl.hidden        = true;
      if (extraEl) extraEl.innerHTML   = `
        <div class="alg-note warn">Nota: Operaci&oacute;n no conmutativa (A &times; B &ne; B &times; A)</div>
        ${alg.orthoValid ? '<div class="alg-note ortho"><span class="ortho-check">&#10003;</span> Ortogonalidad Validada (R &middot; A = 0)</div>' : ''}
      `;
      _buildCrossAccordion(alg);
    }
    return;
  }

  // Case 2: Multi-vector simulation empty
  if (!result || !state.vectors.length) {
    if (titleEl)     titleEl.textContent = 'Desplazamiento Resultante';
    if (emptyEl)     emptyEl.hidden      = false;
    if (heroEl)      heroEl.hidden       = true;
    if (accordBtnEl) accordBtnEl.hidden  = true;
    if (accordBody)  accordBody.hidden   = true;
    if (extraEl)     extraEl.innerHTML   = '';
    _accordionOpen = false;
    accordBtnEl?.classList.remove('open');
    accordBtnEl?.querySelector('.accord-arrow')?.classList.remove('open');
    return;
  }

  // Case 3: Standard multi-vector sum
  if (titleEl)     titleEl.textContent = 'Desplazamiento Resultante';
  if (emptyEl)     emptyEl.hidden      = true;
  if (heroEl)      heroEl.hidden       = false;
  if (accordBtnEl) accordBtnEl.hidden  = false;
  if (retEl)       retEl.hidden        = false;
  if (extraEl)     extraEl.innerHTML   = '';

  if (magEl)  magEl.innerHTML  = `${fmt(result.mag)}&thinsp;<span class="hero-unit">${unit}</span>`;
  if (angEl)  angEl.innerHTML  = `&theta; = ${fmt(result.ang, 2)}&deg;`;
  if (quadEl) quadEl.textContent = `Cuadrante ${result.quad} | Pos: (${fmt(state.originX + result.Rx)}, ${fmt(state.originY + result.Ry)})`;
  if (retEl)  retEl.innerHTML    = `<b>Vector de retorno (&minus;R):</b> ${fmt(result.retMag)}&thinsp;${unit} a ${fmt(result.retAng, 1)}&deg;`;

  _buildStandardAccordion(result, state, unit);
}

// ── Accordion builders ─────────────────────────────────────
function _buildStandardAccordion(result, state, unit) {
  const body = document.getElementById('accord-body');
  if (!body) return;

  const rows = state.vectors.map((v, i) => {
    const color = COLORS[i % COLORS.length];
    const lbl = v.label.length > 14 ? v.label.slice(0, 12) + '...' : v.label;
    return `
      <div class="desg-row">
        <span class="desg-dot" style="background:${color}"></span>
        <span class="desg-num">${i + 1}</span>
        <span class="desg-lbl" title="${v.label}">${lbl}</span>
        <span class="desg-dx">${fmt(v.dx)}</span>
        <span class="desg-dy">${fmt(v.dy)}</span>
      </div>`;
  }).join('');

  body.innerHTML = `
    <div class="desg-table">
      <div class="desg-header">
        <span></span><span>#</span><span>Tramo</span>
        <span style="text-align:right">&Delta;x (r&middot;cos&theta;)</span>
        <span style="text-align:right">&Delta;y (r&middot;sen&theta;)</span>
      </div>
      ${rows}
    </div>
    <div class="desg-sum">
      <span class="desg-sum-rx">R<sub>x</sub> = &Sigma;&Delta;x = ${fmt(result.Rx)} ${unit}</span>
      <span class="desg-sum-ry">R<sub>y</sub> = &Sigma;&Delta;y = ${fmt(result.Ry)} ${unit}</span>
    </div>
    <div class="desg-formula">
      &bull; <b>Descomposici&oacute;n:</b> V<sub>x</sub> = V&middot;cos(&theta;), &nbsp; V<sub>y</sub> = V&middot;sen(&theta;)<br>
      &bull; <b>Magnitud:</b> |R| = &radic;(R<sub>x</sub>&sup2; + R<sub>y</sub>&sup2;) = &radic;(${fmt(result.Rx)}&sup2; + ${fmt(result.Ry)}&sup2;) = <b>${fmt(result.mag)} ${unit}</b><br>
      &bull; <b>Direcci&oacute;n:</b> &theta; = atan2(R<sub>y</sub>, R<sub>x</sub>) = <b>${fmt(result.ang, 2)}&deg;</b>
    </div>
    <div class="desg-retorno">
      Retorno al origen (&minus;R): <b>${fmt(result.retMag)} ${unit} a ${fmt(result.retAng, 1)}&deg;</b>
    </div>
  `;
}

function _buildSumAccordion(alg, unit) {
  const body = document.getElementById('accord-body');
  if (!body) return;
  const { va, vb, resultVec: r } = alg;

  body.innerHTML = `
    <div class="desg-formula">
      <b>Suma Anal&iacute;tica A + B</b><br>
      A = (${fmt(va.dx)}, ${fmt(va.dy)}) ${unit} &nbsp; [${fmt(va.r)} a ${fmt(va.theta, 1)}&deg;]<br>
      B = (${fmt(vb.dx)}, ${fmt(vb.dy)}) ${unit} &nbsp; [${fmt(vb.r)} a ${fmt(vb.theta, 1)}&deg;]<br><br>
      R<sub>x</sub> = A<sub>x</sub> + B<sub>x</sub> = ${fmt(va.dx)} + ${fmt(vb.dx)} = <b>${fmt(r.dx)} ${unit}</b><br>
      R<sub>y</sub> = A<sub>y</sub> + B<sub>y</sub> = ${fmt(va.dy)} + ${fmt(vb.dy)} = <b>${fmt(r.dy)} ${unit}</b><br><br>
      |R| = &radic;(R<sub>x</sub>&sup2; + R<sub>y</sub>&sup2;) = <b>${fmt(r.r)} ${unit}</b><br>
      &theta; = atan2(R<sub>y</sub>, R<sub>x</sub>) = <b>${fmt(r.theta, 2)}&deg;</b>
    </div>
  `;
}

function _buildSubAccordion(alg, unit) {
  const body = document.getElementById('accord-body');
  if (!body) return;
  const { va, vb, resultVec: r } = alg;

  body.innerHTML = `
    <div class="desg-formula">
      <b>Resta Anal&iacute;tica (Invirtiendo signos de B)</b><br>
      A = (${fmt(va.dx)}, ${fmt(va.dy)}) ${unit}<br>
      B = (${fmt(vb.dx)}, ${fmt(vb.dy)}) ${unit} &implies; &minus;B = (${fmt(-vb.dx)}, ${fmt(-vb.dy)}) ${unit}<br><br>
      R<sub>x</sub> = A<sub>x</sub> &minus; B<sub>x</sub> = ${fmt(va.dx)} &minus; (${fmt(vb.dx)}) = <b>${fmt(r.dx)} ${unit}</b><br>
      R<sub>y</sub> = A<sub>y</sub> &minus; B<sub>y</sub> = ${fmt(va.dy)} &minus; (${fmt(vb.dy)}) = <b>${fmt(r.dy)} ${unit}</b><br><br>
      |R| = &radic;((${fmt(r.dx)})&sup2; + (${fmt(r.dy)})&sup2;) = <b>${fmt(r.r)} ${unit}</b><br>
      &theta; = atan2(R<sub>y</sub>, R<sub>x</sub>) = <b>${fmt(r.theta, 2)}&deg;</b>
    </div>
  `;
}

function _buildScalarAccordion(alg, unit) {
  const body = document.getElementById('accord-body');
  if (!body) return;
  const { va, k, resultVec: r } = alg;

  body.innerHTML = `
    <div class="desg-formula">
      <b>Multiplicaci&oacute;n por Escalar (k = ${fmt(k, 3)})</b><br>
      Vector original V = (${fmt(va.dx)}, ${fmt(va.dy)}) ${unit} [|V| = ${fmt(va.r)} ${unit}]<br><br>
      kV = (k &middot; V<sub>x</sub>, k &middot; V<sub>y</sub>)<br>
      kV = (${fmt(k, 3)} &times; ${fmt(va.dx)}, ${fmt(k, 3)} &times; ${fmt(va.dy)})<br>
      kV = <b>(${fmt(r.dx)}, ${fmt(r.dy)}) ${unit}</b><br><br>
      |kV| = |k| &middot; |V| = ${fmt(Math.abs(k), 3)} &times; ${fmt(va.r)} = <b>${fmt(r.r)} ${unit}</b><br>
      &theta; = ${fmt(r.theta, 2)}&deg;
    </div>
  `;
}

function _buildDotAccordion(alg) {
  const body = document.getElementById('accord-body');
  if (!body) return;
  const { va, vb, scalar, angle } = alg;

  body.innerHTML = `
    <div class="desg-formula">
      <b>Producto Punto A &middot; B (Suma del producto de componentes)</b><br>
      A = (${fmt(va.dx)}, ${fmt(va.dy)}, 0)<br>
      B = (${fmt(vb.dx)}, ${fmt(vb.dy)}, 0)<br><br>
      A &middot; B = A<sub>x</sub>B<sub>x</sub> + A<sub>y</sub>B<sub>y</sub> + A<sub>z</sub>B<sub>z</sub><br>
      = (${fmt(va.dx)})(${fmt(vb.dx)}) + (${fmt(va.dy)})(${fmt(vb.dy)}) + (0)(0)<br>
      = ${fmt(va.dx * vb.dx, 4)} + ${fmt(va.dy * vb.dy, 4)}<br>
      = <b>${fmt(scalar, 4)}</b><br><br>
      <b>C&aacute;lculo del &Aacute;ngulo &theta; entre vectores:</b><br>
      |A| = &radic;(${fmt(va.dx)}&sup2; + ${fmt(va.dy)}&sup2;) = ${fmt(va.r, 4)}<br>
      |B| = &radic;(${fmt(vb.dx)}&sup2; + ${fmt(vb.dy)}&sup2;) = ${fmt(vb.r, 4)}<br>
      cos(&theta;) = (A &middot; B) / (|A| &middot; |B|) = ${fmt(scalar, 4)} / (${fmt(va.r, 4)} &times; ${fmt(vb.r, 4)})<br>
      &theta; = cos<sup>&minus;1</sup>(${fmt(scalar / (va.r * vb.r || 1), 5)}) = <b>${fmt(angle, 2)}&deg;</b>
    </div>
  `;
}

function _buildCrossAccordion(alg) {
  const body = document.getElementById('accord-body');
  if (!body) return;
  const { va, vb, crossResult: cp } = alg;

  body.innerHTML = `
    <div class="desg-formula">
      <b>Producto Cruz A &times; B (Determinante matriz 3&times;3)</b><br>
      Incrustando en 3D con componentes z = 0:<br><br>
      <div style="font-family:monospace;padding:6px 12px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;display:inline-block">
        | &icirc;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &jcirc;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; k&#770; |<br>
        | ${fmt(va.dx, 2).padStart(6)} ${fmt(va.dy, 2).padStart(6)} ${'0'.padStart(4)} |<br>
        | ${fmt(vb.dx, 2).padStart(6)} ${fmt(vb.dy, 2).padStart(6)} ${'0'.padStart(4)} |
      </div><br><br>
      Desarrollo por cofactores en la primera fila:<br>
      = &icirc;(A<sub>y</sub>&middot;0 &minus; 0&middot;B<sub>y</sub>) &minus; &jcirc;(A<sub>x</sub>&middot;0 &minus; 0&middot;B<sub>x</sub>) + k&#770;(A<sub>x</sub>B<sub>y</sub> &minus; A<sub>y</sub>B<sub>x</sub>)<br>
      = 0&icirc; &minus; 0&jcirc; + (${fmt(va.dx)} &times; ${fmt(vb.dy)} &minus; ${fmt(va.dy)} &times; ${fmt(vb.dx)}) k&#770;<br>
      = (${fmt(va.dx * vb.dy, 4)} &minus; ${fmt(va.dy * vb.dx, 4)}) k&#770;<br>
      = <b>${fmt(cp.k, 4)} k&#770;</b><br><br>
      <b>Autocomprobaci&oacute;n silenciosa de ortogonalidad:</b><br>
      R &middot; A = (0)(A<sub>x</sub>) + (0)(A<sub>y</sub>) + (${fmt(cp.k, 2)})(0) = <b>0</b> &nbsp; <span style="color:#166534;font-weight:700">&#10003; Ortogonal</span><br>
      R &middot; B = (0)(B<sub>x</sub>) + (0)(B<sub>y</sub>) + (${fmt(cp.k, 2)})(0) = <b>0</b> &nbsp; <span style="color:#166534;font-weight:700">&#10003; Ortogonal</span><br><br>
      <b>Propiedad no conmutativa:</b><br>
      B &times; A = &minus;(A &times; B) = <b>${fmt(-cp.k, 4)} k&#770;</b>
    </div>
  `;
}
