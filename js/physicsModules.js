// physicsModules.js — Motor de fisica ampliado (funciones puras)
// Todos los calculos son puros: entrada numerica, salida objeto de resultado.
// Sin efectos secundarios ni dependencias de DOM.

// ── Utilidades ────────────────────────────────────────────
const R2D = 180 / Math.PI;
const D2R = Math.PI / 180;
function f(n, d = 3) { return isNaN(n) || !isFinite(n) ? NaN : +n.toFixed(d); }

/**
 * Resuelve ecuacion cuadratica a*t^2 + b*t + c = 0
 * @returns {{ t1, t2, disc } | null}
 */
export function solveQuadratic(a, b, c) {
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  return { t1: (-b + sq) / (2 * a), t2: (-b - sq) / (2 * a), disc, a, b, c };
}

/**
 * Error porcentual: |( real - teo ) / real| * 100
 */
export function percentError(real, theoretical) {
  if (real === 0) return Infinity;
  return f(Math.abs((real - theoretical) / real) * 100, 2);
}

// ── 1. Tiro parabolico ────────────────────────────────────
/**
 * @param {{ v0: number, thetaDeg: number, g?: number, yi?: number }}
 * @returns resultado con trayectoria pts[]
 */
export function projectileMotion({ v0, thetaDeg, g = 9.8, yi = 0 }) {
  const theta = thetaDeg * D2R;
  const v0x   = v0 * Math.cos(theta);
  const v0y   = v0 * Math.sin(theta);

  // 0 = yi + v0y*t - 0.5g*t^2  =>  0.5g*t^2 - v0y*t - yi = 0
  const q = solveQuadratic(0.5 * g, -v0y, -yi);
  if (!q) return null;
  const tFlight = q.t1 > 0 ? q.t1 : q.t2;

  const tAtHMax = v0y / g;
  const hMax    = yi + v0y * tAtHMax - 0.5 * g * tAtHMax * tAtHMax;
  const range   = v0x * tFlight;

  // 100 puntos de trayectoria
  const pts = [];
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * tFlight;
    pts.push({ t: f(t, 3), x: f(v0x * t, 3), y: f(yi + v0y * t - 0.5 * g * t * t, 3) });
  }

  return {
    v0x: f(v0x), v0y: f(v0y),
    tFlight: f(tFlight), tAtHMax: f(tAtHMax),
    hMax: f(hMax), range: f(range),
    vxAtAny: f(v0x),           // Vx es constante
    vyAtHMax: 0,               // Vy = 0 en punto mas alto
    gConstant: g,
    pts,
    alerts: [
      'En h_max: Vy = 0 m/s, pero la aceleracion sigue siendo g = ' + g + ' m/s^2 (↓)',
      'El tiempo de subida es igual al de bajada cuando yi = yf',
      'Vx se mantiene constante durante todo el vuelo',
    ],
  };
}

// ── 2. Intercepcion (caida libre + MRU horizontal) ────────
/**
 * Objeto cae desde altura h (reposo). Movil avanza a vx.
 * Calcula el tiempo de caida y la posicion horizontal de intercepcion.
 */
export function freeFallInterception({ h, vx, g = 9.8 }) {
  const t = Math.sqrt(2 * h / g);
  const x = vx * t;
  return {
    t: f(t), x: f(x),
    h, vx, g,
    formula_t: 'h = (1/2)g*t^2  =>  t = sqrt(2h/g) = ' + f(t) + ' s',
    formula_x: 'x = vx * t = ' + f(vx) + ' * ' + f(t) + ' = ' + f(x) + ' m',
  };
}

// ── 3. Velocidad heredada ─────────────────────────────────
/**
 * Objeto soltado desde vehiculo en movimiento (hereda Vi vertical).
 * Resuelve: 0 = yi + vi*t - (1/2)g*t^2
 */
export function inheritedVelocity({ yi, vi, g = 9.8 }) {
  // Reorganizado: (1/2)g*t^2 - vi*t - yi = 0
  const q = solveQuadratic(0.5 * g, -vi, -yi);
  if (!q) return null;
  const t = q.t1 > 0 ? q.t1 : q.t2;
  const pts = [];
  for (let i = 0; i <= 50; i++) {
    const tt = (i / 50) * t;
    pts.push({ t: f(tt, 3), y: f(yi + vi * tt - 0.5 * g * tt * tt, 3) });
  }
  return {
    t: f(t),
    yi, vi, g,
    quadEq: '-(1/2)(' + g + ')t^2 + ' + vi + '*t + ' + yi + ' = 0',
    q,
    pts,
  };
}

// ── 4. Sistema acoplado caida libre + sonido ──────────────
/**
 * h = (1/2)g*tc^2  (caida)
 * h = vs*ts        (sonido)
 * tc + ts = tTotal
 * => g/(2vs)*tc^2 + tc - tTotal = 0
 */
export function freeFallSound({ tTotal, vs = 336, g = 9.8 }) {
  const a = g / (2 * vs), b = 1, c = -tTotal;
  const q = solveQuadratic(a, b, c);
  if (!q) return null;
  const tc    = q.t1 > 0 ? q.t1 : q.t2;
  const ts    = tTotal - tc;
  const hReal = 0.5 * g * tc * tc;
  const hTeo  = 0.5 * g * tTotal * tTotal;
  const error = percentError(hReal, hTeo);
  return {
    tc: f(tc), ts: f(ts, 4),
    hReal: f(hReal), hTeo: f(hTeo),
    error,
    vs, g, tTotal,
    quadEq: f(a, 4) + '*tc^2 + tc - ' + tTotal + ' = 0',
    q,
  };
}

// ── 5. Graficas cinematicas por tramos ────────────────────
/**
 * A partir de segmentos [{ a, dt, label }] e icondiciones iniciales,
 * genera los puntos para las graficas a-t, v-t, x-t.
 * @param {Array<{a:number, dt:number, label?:string}>} segments
 * @param {{ v0: number, x0: number }} init
 * @returns {{ at: [], vt: [], xt: [], segments: [] }}
 */
export function kinematicData(segments, { v0 = 0, x0 = 0 } = {}) {
  const at = [], vt = [], xt = [];
  let t = 0, v = v0, x = x0;
  const enriched = [];

  for (const seg of segments) {
    const { a, dt, label = '' } = seg;
    const t0  = t, v0s = v, x0s = x;
    const steps = Math.max(2, Math.ceil(dt * 20)); // 20 muestras/s

    for (let i = 0; i <= steps; i++) {
      const tau = (i / steps) * dt;
      const tc  = t0 + tau;
      const vc  = v0s + a * tau;
      const xc  = x0s + v0s * tau + 0.5 * a * tau * tau;
      at.push({ t: f(tc, 3), a: f(a, 3) });
      vt.push({ t: f(tc, 3), v: f(vc, 3) });
      xt.push({ t: f(tc, 3), x: f(xc, 3) });
    }

    const vf = v0s + a * dt;
    const xf = x0s + v0s * dt + 0.5 * a * dt * dt;
    enriched.push({ a, dt, label, t0: f(t0), t1: f(t0 + dt), v0: f(v0s), vf: f(vf), x0: f(x0s), xf: f(xf) });
    t += dt; v = vf; x = xf;
  }

  return { at, vt, xt, segments: enriched, tTotal: f(t), vFinal: f(v), xFinal: f(x) };
}
