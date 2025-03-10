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

// Función para obtener URL base de WebSocket
function getWebSocketUrl(): string {
  if (isWindowDefined && window.ENV_WEBSOCKET_URL) {
    return window.ENV_WEBSOCKET_URL;
  }
  
  // URL primaria: servidor local en desarrollo, servidor WebSocket en producción
  return 'http://server:3003';
}

// Función para obtener URL base de API
function getApiUrl(): string {
  if (isWindowDefined && window.ENV_API_URL) {
    return window.ENV_API_URL;
  }
  
  // Usar nombres de servicio Docker para comunicación entre contenedores
  return 'http://backend:12091';
}

// Función para obtener el TOTEM_ID desde las variables de entorno
function getTotemId(): string {
  if (isWindowDefined && window.TOTEM_ID) {
    return window.TOTEM_ID;
  }
  
  // En desarrollo local, usar un ID por defecto
  return '6733d60513b741865c51aa1c';
}

export const environment = {
  production: false,
  websocket: {
    url: getWebSocketUrl(),
    reconnectAttempts: 5,
    reconnectInterval: 3000
  },
  api: {
    url: getApiUrl()
  },
  totem: {
    id: getTotemId(),
    location: 'Default'
  }
};