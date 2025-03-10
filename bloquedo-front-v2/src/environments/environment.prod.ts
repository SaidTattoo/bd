// Este archivo será reemplazado durante la construcción para producción
// Las variables se inyectarán desde el contenedor Docker o se usarán valores por defecto

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.

interface EnvWindow extends Window {
  ENV_WEBSOCKET_URL?: string;
  ENV_API_URL?: string;
  TOTEM_ID?: string;
  LOCATION_NAME?: string;
}

// Obtener variables de entorno inyectadas por Docker, si existen
const envWindow = window as EnvWindow;

// Función para obtener la URL del servidor WebSocket
function getWebSocketUrl(): string {
  // Si hay una URL definida, usarla
  if (envWindow.ENV_WEBSOCKET_URL) {
    return envWindow.ENV_WEBSOCKET_URL;
  }
  
  // Si no, construirla con base en la ubicación actual (asumiendo que el servidor
  // WebSocket está en el mismo host pero en el puerto 3003)
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const host = window.location.hostname;
  return `${protocol}//${host}:3003`;
}

// Función para obtener la URL de la API
function getApiUrl(): string {
  if (envWindow.ENV_API_URL) {
    return envWindow.ENV_API_URL;
  }
  return `${window.location.protocol}//${window.location.hostname}:12091`;
}

export const environment = {
  production: true,
  websocket: {
    // Usar la variable de entorno inyectada o la URL por defecto
    url: envWindow.ENV_WEBSOCKET_URL || 'http://localhost:3003',
    reconnectAttempts: 5,
    reconnectInterval: 3000,
  },
  api: {
    // Usar la variable de entorno inyectada o la URL por defecto
    url: envWindow.ENV_API_URL || 'http://localhost:12091',
  },
  // Configuración del tótem
  totem: {
    id: envWindow.TOTEM_ID || 'auto', // 'auto' significa que se usará el ID generado por Socket.io
    location: envWindow.LOCATION_NAME || 'Sin ubicación',
  }
};