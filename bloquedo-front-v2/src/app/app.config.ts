import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

// Configuración principal de la aplicación
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withViewTransitions()
    ),
    provideHttpClient(withFetch()),
    
    // Habilitar hidratación del cliente para mejor rendimiento
    provideClientHydration()
  ]
};