// Verificamos si estamos en un entorno con window (navegador) o sin él (servidor)
const isWindowDefined = typeof window !== 'undefined';

// Extender la interfaz Window para TypeScript
declare global {
  interface Window {
    ENV_WEBSOCKET_URL?: string;
    ENV_API_URL?: string;
    TOTEM_ID?: string;
  }
}

// Función para obtener el TOTEM_ID desde las variables de entorno
function getTotemId(): string {
  if (isWindowDefined && window.TOTEM_ID) {
    return window.TOTEM_ID;
  }
  return '6733d60513b741865c51aa1c'; // Fallback al ID fijo
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
    id: getTotemId(),
    location: 'Default'
  }
};