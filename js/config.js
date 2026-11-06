// config.js — Constantes globales y definición de entidades
export const COLORS = [
  '#2563eb', '#d97706', '#7c3aed', '#059669', '#db2777',
  '#0891b2', '#65a30d', '#dc2626', '#9333ea', '#0284c7',
  '#f59e0b', '#10b981', '#6366f1', '#ef4444', '#14b8a6',
];

export const ENTITIES = {
  vehicle: {
    id: 'vehicle', label: 'Vehículo / Navegación', icon: '✈️',
    unit: 'km', avatarKey: 'airplane',
    preset: [
      { r: 300, theta: 30, label: 'Despegue NE' },
      { r: 200, theta: 90, label: 'Viraje Norte' },
      { r: 450, theta: 135, label: 'Rumbo NO' },
      { r: 150, theta: 270, label: 'Descenso Sur' },
    ],
  },
  person: {
    id: 'person', label: 'Persona / Excursionista', icon: '🧗',
    unit: 'm', avatarKey: 'hiker',
    preset: [
      { r: 120, theta: 0, label: 'Calle Este' },
      { r: 80, theta: 90, label: 'Subida Norte' },
      { r: 60, theta: 45, label: 'Diagonal NE' },
      { r: 100, theta: 180, label: 'Regreso Oeste' },
    ],
  },
  animal: {
    id: 'animal', label: 'Animal /Aves', icon: '🦅',
    unit: 'm', avatarKey: 'bird',
    preset: [
      { r: 40, theta: 60, label: 'Vuelo 1' },
      { r: 25, theta: 120, label: 'Giro 2' },
      { r: 35, theta: 200, label: 'Planeo 3' },
      { r: 20, theta: 300, label: 'Descenso 4' },
    ],
  },
  object: {
    id: 'object', label: 'Objeto / Partícula', icon: '⚙️',
    unit: 'mm', avatarKey: 'wheel',
    preset: [
      { r: 150, theta: 0, label: 'Avance X' },
      { r: 100, theta: 90, label: 'Giro Y+' },
      { r: 200, theta: 225, label: 'Diagonal SO' },
      { r: 80, theta: 315, label: 'Retroceso SE' },
    ],
  },
};

/** Operaciones algebraicas disponibles */
export const OPERATIONS = [
  { id: 'sum',    label: 'Suma (N Vectores)' },
  { id: 'sub',    label: 'Resta' },
  { id: 'scalar', label: 'Multiplicación por Escalar' },
  { id: 'dot',    label: 'Producto Punto' },
  { id: 'cross',  label: 'Producto Cruz' },
];

export const INITIAL_STATE = {
  entityId: 'vehicle',
  inputMode: 'polar',
  originX: 0,
  originY: 0,
  vectors: [],
  result: null,
  algebraMode: 'sum',    // 'sum' | 'sub' | 'scalar' | 'dot' | 'cross'
  algebraResult: null,   // result of algebra operation
};
