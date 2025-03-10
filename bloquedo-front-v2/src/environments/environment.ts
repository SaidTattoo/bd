// Verificamos si estamos en un entorno con window (navegador) o sin él (servidor)
const isWindowDefined = typeof window !== 'undefined';

// Extender la interfaz Window para TypeScript
declare global {
  interface Window {
    ENV_WEBSOCKET_URL?: string;
  }
}

export const environment = {
  production: false,
  websocket: {
    url: 'http://localhost:3003',
    reconnectAttempts: 5,
    reconnectInterval: 3000
  },
  api: {
    url: 'http://localhost:12091'
  },
  totem: {
    id: 'auto',
    location: 'Default'
  }
};