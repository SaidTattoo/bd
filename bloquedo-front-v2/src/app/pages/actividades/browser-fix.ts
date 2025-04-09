// Este es un parche para solucionar problemas de detección del navegador vs servidor
import { PLATFORM_ID } from '@angular/core';

export function forceClientDetection(platformId: Object): boolean {
  // Si window existe y tiene la propiedad forceClientMode, siempre retorna true
  if (typeof window !== 'undefined' && (window as any).forceClientMode === true) {
    console.log('Forzando modo cliente (browser)');
    return true;
  }
  
  // Verificación estándar
  return typeof window !== 'undefined' && 
         typeof document !== 'undefined' &&
         typeof navigator !== 'undefined';
} 