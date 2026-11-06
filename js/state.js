// ════════════════════════════════════════════════════
//  state.js — Estado global reactivo mediante Proxy
//  Cualquier mutación dispara los listeners registrados.
// ════════════════════════════════════════════════════
import { INITIAL_STATE } from './config.js';

/** @type {Array<(state: object) => void>} */
const listeners = [];

/**
 * Registra una función que se llama cada vez que el estado muta.
 * @param {(state: object) => void} fn
 */
export function subscribe(fn) {
  listeners.push(fn);
}

function notify() {
  listeners.forEach(fn => fn(state));
}

/**
 * Estado global envuelto en un Proxy.
 * Accede directamente: state.vectors, state.entityId, etc.
 */
export const state = new Proxy({ ...INITIAL_STATE, vectors: [] }, {
  set(target, key, value) {
    target[key] = value;
    notify();
    return true;
  },
});

/**
 * Muta múltiples propiedades con una sola notificación.
 * Evita N disparos en actualizaciones batch.
 * @param {Partial<typeof INITIAL_STATE>} patch
 */
export function patchState(patch) {
  // Silence proxy during batch
  const handler = listeners.splice(0);
  Object.assign(state, patch);
  listeners.push(...handler);
  notify();
}
