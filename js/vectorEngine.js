// ════════════════════════════════════════════════════
//  vectorEngine.js — Motor físico/matemático PURO
//  Todas las funciones son puras (sin efectos secundarios).
//  Entrada: arrays/números. Salida: objetos de resultado.
// ════════════════════════════════════════════════════

/**
 * Descompone un vector polar en componentes cartesianas.
 * @param {number} r      Magnitud (cualquier unidad)
 * @param {number} theta  Ángulo en grados (positivo/negativo)
 * @returns {{ dx: number, dy: number }}
 */
export function decomposePolar(r, theta) {
  const rad = theta * Math.PI / 180;
  return { dx: r * Math.cos(rad), dy: r * Math.sin(rad) };
}

/**
 * Construye un objeto vector a partir de componentes cartesianas.
 * @param {number} dx
 * @param {number} dy
 * @param {string} label
 * @returns {{ dx, dy, r, theta, label }}
 */
export function makeVectorFromCart(dx, dy, label = '') {
  const r     = Math.sqrt(dx * dx + dy * dy);
  const theta = Math.atan2(dy, dx) * 180 / Math.PI;
  return { dx, dy, r, theta, label };
}

/**
 * Construye un objeto vector a partir de coordenadas polares.
 * @param {number} r
 * @param {number} theta  Grados
 * @param {string} label
 * @returns {{ dx, dy, r, theta, label }}
 */
export function makeVectorFromPolar(r, theta, label = '') {
  const { dx, dy } = decomposePolar(r, theta);
  return { dx, dy, r, theta, label };
}

/**
 * Calcula el cuadrante del vector resultante.
 * @param {number} x
 * @param {number} y
 * @returns {string}
 */
export function getQuadrant(x, y) {
  if (Math.abs(x) < 1e-9 && Math.abs(y) < 1e-9) return 'Origen';
  if (x > 0  && y >= 0) return 'I (NE)';
  if (x <= 0 && y > 0)  return 'II (NO)';
  if (x < 0  && y <= 0) return 'III (SO)';
  return 'IV (SE)';
}

/**
 * Motor principal: calcula la resultante a partir del estado.
 */
export function compute({ vectors, originX, originY }) {
  if (!vectors || vectors.length === 0) return null;

  let Rx = 0, Ry = 0;
  const positions = [{ x: originX, y: originY }];

  for (const v of vectors) {
    Rx += v.dx;
    Ry += v.dy;
    positions.push({ x: originX + Rx, y: originY + Ry });
  }

  const mag = Math.sqrt(Rx * Rx + Ry * Ry);

  // Ángulo normalizado [0, 360)
  let ang = Math.atan2(Ry, Rx) * 180 / Math.PI;
  if (ang < 0) ang += 360;

  const quad = getQuadrant(Rx, Ry);

  // Vector de retorno
  const retMag = mag;
  let retAng = ang + 180;
  if (retAng >= 360) retAng -= 360;

  return { Rx, Ry, mag, ang, quad, positions, retMag, retAng };
}

// ═══════════════════════════════════════════════════════
//  ÁLGEBRA VECTORIAL
// ═══════════════════════════════════════════════════════

/**
 * Resta de vectores: A - B
 * @param {{ dx, dy }} a
 * @param {{ dx, dy }} b
 * @returns {{ dx, dy, r, theta, label }}
 */
export function vectorSubtract(a, b) {
  return makeVectorFromCart(a.dx - b.dx, a.dy - b.dy, 'A \u2212 B');
}

/**
 * Multiplicación de un vector por un escalar.
 * @param {{ dx, dy }} v
 * @param {number} k
 * @returns {{ dx, dy, r, theta, label }}
 */
export function scalarMultiply(v, k) {
  return makeVectorFromCart(v.dx * k, v.dy * k, k + ' \u00b7 V');
}

/**
 * Producto punto de dos vectores 2D (resultado escalar).
 * @param {{ dx, dy }} a
 * @param {{ dx, dy }} b
 * @returns {number}
 */
export function dotProduct(a, b) {
  return a.dx * b.dx + a.dy * b.dy;
}

/**
 * Producto cruz de dos vectores 2D.
 * En 2D el producto cruz produce un escalar (componente z).
 * Se extiende a 3D asumiendo z=0:
 *   i*(ay*bz - az*by) - j*(ax*bz - az*bx) + k*(ax*by - ay*bx)
 *   = k * (ax*by - ay*bx)
 *
 * @param {{ dx, dy }} a
 * @param {{ dx, dy }} b
 * @returns {{ k: number, vec: { dx, dy, r, theta, label } }}
 *   k   = componente escalar en z (magnitud del vector resultante)
 *   vec = vector resultante (0, 0, k) proyectado — se muestra como vector con magnitud |k|
 */
export function crossProduct(a, b) {
  const k = a.dx * b.dy - a.dy * b.dx;
  // El resultado apunta en ẑ, pero para visualización 2D
  // representamos como un vector perpendicular con magnitud |k|
  const vec = makeVectorFromCart(0, 0, 'A \u00d7 B');
  vec.r = Math.abs(k);
  vec.crossZ = k;
  return { k, vec };
}

/**
 * Ángulo entre dos vectores usando arccos(dot / |A||B|).
 * @param {{ dx, dy }} a
 * @param {{ dx, dy }} b
 * @returns {number} Ángulo en grados [0, 180]
 */
export function angleBetween(a, b) {
  const magA = Math.sqrt(a.dx * a.dx + a.dy * a.dy);
  const magB = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
  if (magA < 1e-12 || magB < 1e-12) return 0;
  const cosTheta = Math.max(-1, Math.min(1, dotProduct(a, b) / (magA * magB)));
  return Math.acos(cosTheta) * 180 / Math.PI;
}

/**
 * Verifica si dos vectores son ortogonales (producto punto ≈ 0).
 * @param {{ dx, dy }} a
 * @param {{ dx, dy }} b
 * @returns {boolean}
 */
export function isOrthogonal(a, b) {
  return Math.abs(dotProduct(a, b)) < 1e-6;
}

/**
 * Formatea un número para display con máximo `dec` decimales.
 * @param {number} n
 * @param {number} [dec=2]
 * @returns {string}
 */
export function fmt(n, dec = 2) {
  if (n === undefined || n === null || isNaN(n)) return '\u2014';
  return Number(n.toFixed(dec))
    .toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: dec });
}
