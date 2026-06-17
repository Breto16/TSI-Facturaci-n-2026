export const palettes = {
  light: {
    background: '#f5f5f7',
    surface: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#6b7280',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    success: '#16a34a',
    warning: '#facc15',
    danger: '#dc2626',
    info: '#0ea5e9',
    border: '#e5e7eb',
  },
  dark: {
    background: '#121212',
    surface: '#1e1e1e',
    text: '#f5f5f5',
    textSecondary: '#a1a1aa',
    primary: '#3b82f6',
    primaryHover: '#60a5fa',
    success: '#22c55e',
    warning: '#fbbf24',
    danger: '#ef4444',
    info: '#38bdf8',
    border: '#2e2e2e',
  },
};

// Colores de negocio: estados de mesa (sistema de facturación)
export const estadoMesaColors = {
  disponible: '#16a34a',
  ocupada: '#dc2626',
  porPagar: '#facc15',
  dividida: '#0ea5e9',
};


// Para este proyecto, reemplaza GRADIENTS en cada componente con estas constantes
// Viven en src/constants/theme.js para no repetirlas
export const GRADIENTS = {
  forest:  'linear-gradient(135deg, #052c36 0%, #0f785e 100%)',
  azul:    'linear-gradient(135deg, #12122b 0%, #083a9d 100%)',
  purpura: 'linear-gradient(135deg, #240b36 0%, #7f1d2f 100%)',
  naranja: 'linear-gradient(135deg, #4b134f 0%, #842e2e 100%)',
  rojo:    'linear-gradient(135deg, #6d0006 0%, #a31118 100%)',
  bosque:  'linear-gradient(135deg, #0e2f03 0%, #1c530d 100%)',
  rosa:    'linear-gradient(135deg, #957d1e 0%, #e9b31e 100%)',
}

export const MODULO_GRADIENT = {
  mesas:      'forest',
  facturas:   'azul',
  productos:  'naranja',
  personal:   'bosque',
  consultas:  'purpura',
  cierre:     'rojo',
}