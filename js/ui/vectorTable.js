// ui/vectorTable.js v4 — Lista compacta y desplazable de trayectos
import { COLORS } from '../config.js';
import { fmt }    from '../vectorEngine.js';

let _root = null;

export function init(root) {
  _root = root;
  _render([], '');
}

export function update(vectors, unit = '') {
  _render(vectors, unit);
}

function _render(vectors, unit) {
  if (!_root) return;

  if (!vectors.length) {
    _root.innerHTML = `<div class="vec-list-empty">Sin vectores. Agrega uno arriba con el botón +</div>`;
    return;
  }

  _root.innerHTML = vectors.map((v, i) => {
    const color = COLORS[i % COLORS.length];
    const lbl   = v.label.length > 16 ? v.label.slice(0, 14) + '...' : v.label;
    return `
      <div class="vec-list-item" data-index="${i}">
        <div class="vli-dot" style="background:${color}"></div>
        <div class="vli-info">
          <span class="vli-label">${lbl}</span>
          <span class="vli-vals">${fmt(v.r)}&thinsp;${unit} &nbsp;&bull;&nbsp; ${fmt(v.theta, 1)}&deg; &nbsp;(&Delta;x: ${fmt(v.dx)}, &Delta;y: ${fmt(v.dy)})</span>
        </div>
        <button class="vli-del" data-index="${i}" title="Eliminar trayecto">
          <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 4h10M5.5 4V2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V4M3 4l.8 9a1 1 0 0 0 1 .9h4.4a1 1 0 0 0 1-.9L11 4"
              stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.5 7v4M8.5 7v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');

  _root.querySelectorAll('.vli-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index, 10);
      _root.dispatchEvent(
        new CustomEvent('vector:remove', { bubbles: true, detail: { index } })
      );
    });
  });
}
