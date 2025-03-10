import { HttpClient } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { Observable, catchError, throwError, tap, of, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TotemService {
  private isBrowser: boolean;
  private readonly REQUEST_TIMEOUT = 8000; // 8 segundos de timeout
 
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) { 
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getTotems(id: string, force: boolean = false): Observable<any[]> {
    // Durante SSR, devolver un array vacío para evitar bloqueos
    if (!this.isBrowser) {
      console.log('SSR: Devolviendo casilleros mock');
      return of([]);
    }
    
    const timestamp = new Date().getTime();
    const url = `${environment.api.url}/totem/${id}?t=${timestamp}${force ? '&force=true' : ''}`;
    
    console.log(`Solicitando datos al endpoint: ${url}`);
    
    return this.http.get<any>(url)
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(error => {
          console.error('Error al obtener datos del totem:', error);
          return throwError(() => error);
        })
      );
  }

  assignLocker(data: any, totemId: string, casilleroId: string) {
    // No realizar operaciones durante SSR
    if (!this.isBrowser) {
      console.log('SSR: Operación assignLocker simulada');
      return of({success: true});
    }
    
    console.log('Enviando datos al endpoint:', {
      url: `${environment.api.url}/totem/${totemId}/casillero/${casilleroId}`,
      data
    });
    
    return this.http.post(`${environment.api.url}/totem/${totemId}/casillero/${casilleroId}`, data)
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(error => {
          console.error('Error al asignar casillero:', error);
          return throwError(() => error);
        })
      );
  }
  clearAllLockers(totemId: string) {
    return this.http.delete(`${environment.api.url}/totem/${totemId}/casilleros`);
  }
  clearLocker(totemId: string, lockerId: string) {
    return this.http.delete(`${environment.api.url}/totem/${totemId}/casillero/${lockerId}`);
  }
  updateLockerStatus(totemId: string, lockerId: string, status: string): Observable<any> {
    return this.http.post<any>(
      `${environment.api.url}/totem/${totemId}/casillero/${lockerId}/update-status`, 
      { status }
    ).pipe(
      catchError(error => {
        console.error('Error al actualizar estado del casillero:', error);
        return throwError(() => new Error('Error al actualizar estado del casillero'));
      })
    );
  }
  /* router.post('/:id/casillero/:casilleroId/abrir', openCasillero);
 */

  openCasillero(totemId: string, lockerId: string): Observable<any> {
    return this.http.post(`${environment.api.url}/totem/${totemId}/casillero/${lockerId}/abrir`, {});
  }
  encenderLuz(): Observable<any> {
    return this.http.post(`http://localhost:5000/led`, {state: true});
  }
  apagarLuz(): Observable<any> {
    return this.http.post(`http://localhost:5000/led`, {state: false});
  }

  getAllTotems(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.api.url}/totem`);
  }

  /**
   * Obtiene un casillero específico de un tótem
   * @param totemId ID del tótem
   * @param lockerId ID del casillero
   * @returns Observable con los datos del casillero
   */
  getLockerDetails(totemId: string, lockerId: string): Observable<any> {
    const url = `${environment.api.url}/totem/${totemId}/casillero/${lockerId}`;
    console.log(`Solicitando detalles del casillero: ${url}`);
    
    return this.http.get<any>(url)
      .pipe(
        catchError(error => {
          console.error('Error al obtener detalles del casillero:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Método alternativo para asignar equipos a un casillero intentando un enfoque diferente
   * @param data Datos a enviar incluyendo equipos y activityId
   * @param totemId ID del tótem
   * @param lockerId ID del casillero
   * @returns Observable con la respuesta del servidor
   */
  assignEquipmentToLocker(equipmentIds: string[], activityId: string, totemId: string, lockerId: string): Observable<any> {
    const payload = {
      equipos: equipmentIds,
      activityId: activityId,
      status: 'ocupado',
      direct_update: true  // Intentamos indicar al backend que es una actualización directa
    };
    
    console.log('Enviando petición directa al endpoint para asignar equipos:');
    console.log(`URL: ${environment.api.url}/totem/${totemId}/casillero/${lockerId}`);
    console.log('Payload:', payload);
    
    // Usar la ruta que existe en el backend
    return this.http.post<any>(
      `${environment.api.url}/totem/${totemId}/casillero/${lockerId}`, 
      payload
    ).pipe(
      tap(response => console.log('Respuesta exitosa del servidor:', response)),
      catchError(error => {
        console.error('Error al asignar equipos:', error);
        return throwError(() => error);
      })
    );
  }
  openAllLockers(totemId: string) {
    return this.http.post(`${environment.api.url}/totem/${totemId}/casillero/:casilleroId/abrir-todos`, {});
  }
}

