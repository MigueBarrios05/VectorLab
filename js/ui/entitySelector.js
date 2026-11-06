// ════════════════════════════════════════════════════
//  ui/entitySelector.js
//  Renderiza los 4 botones de entidad y emite
//  el CustomEvent 'entity:change' al hacer clic.
// ════════════════════════════════════════════════════
import { ENTITIES } from '../config.js';

const UNIT_LABELS = { vehicle:'km', person:'m', animal:'m / cm', robot:'m / mm' };

let _container = null;
let _activeId  = 'vehicle';

/**
 * Inicializa el selector en el contenedor dado.
 * @param {HTMLElement} container
 * @param {string} initialEntity  ID de la entidad activa
 */
export function init(container, initialEntity = 'vehicle') {
  _container = container;
  _activeId  = initialEntity;
  _render();
}

/** Actualiza el estado activo (sin disparar evento, sólo UI). */
export function setActive(entityId) {
  _activeId = entityId;
  _render();
}

function _render() {
  if (!_container) return;
  _container.innerHTML = Object.values(ENTITIES).map(e => `
    <button
      class="entity-btn${e.id === _activeId ? ' active' : ''}"
      data-entity="${e.id}"
      title="${e.label}">
      <span class="eicon">${e.icon}</span>
      <span class="elabel">${e.label}</span>
      <span class="eunit">Unidad: ${UNIT_LABELS[e.id]}</span>
    </button>
  `).join('');

  _container.querySelectorAll('.entity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeId = btn.dataset.entity;
      _render();
      _container.dispatchEvent(
        new CustomEvent('entity:change', { bubbles: true, detail: { entityId: _activeId } })
      );
    });
  });
}
