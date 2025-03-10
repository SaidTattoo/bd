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

// Intentamos obtener las URLs desde el objeto window global
const envWindow: EnvWindow = typeof window !== 'undefined' ? window as EnvWindow : {} as EnvWindow;

// Función para obtener URL base de WebSocket
function getWebSocketUrl(): string {
  // Primero intentamos obtener la URL del entorno
  if (envWindow.ENV_WEBSOCKET_URL) {
    return envWindow.ENV_WEBSOCKET_URL;
  }
  
  // URL para Docker: usar el nombre del servicio server
  return 'http://server:3003';
}

// Función para obtener URL base de API
function getApiUrl(): string {
  // Primero intentamos obtener la URL del entorno
  if (envWindow.ENV_API_URL) {
    return envWindow.ENV_API_URL;
  }
  
  // URL para Docker: usar el nombre del servicio backend
  return 'http://backend:12091';
}

export const environment = {
  production: true,
  websocket: {
    url: getWebSocketUrl(),
    reconnectAttempts: 5,
    reconnectInterval: 3000
  },
  api: {
    url: getApiUrl()
  },
  totem: {
    id: envWindow.TOTEM_ID || 'auto', // 'auto' significa que se usará el ID generado por Socket.io
    locationName: envWindow.LOCATION_NAME || 'Principal'
  }
};