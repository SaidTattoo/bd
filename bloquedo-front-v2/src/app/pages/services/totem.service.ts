import { HttpClient } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { Observable, catchError, throwError, tap, of, timeout, map } from 'rxjs';
import { SocketService } from '../../services/socket.service';

@Injectable({
  providedIn: 'root'
})
export class TotemService {
  private isBrowser: boolean;
  private readonly REQUEST_TIMEOUT = 8000; // 8 segundos de timeout
 
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object,
    private socketService: SocketService
  ) { 
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // Método para obtener el ID del tótem (environment o localStorage)
  getTotemId(): string {
    if (!this.isBrowser) return environment.totem.id || '';
    
    const savedTotemId = localStorage.getItem('totemId');
    const envTotemId = environment.totem.id;
    
    // Preferir el ID guardado en localStorage si es válido
    if (savedTotemId && savedTotemId !== 'undefined' && savedTotemId !== 'null') {
      return savedTotemId;
    }
    
    // Si no hay ID guardado, usar el de environment si es válido
    if (envTotemId && envTotemId !== 'undefined' && envTotemId !== 'null') {
      return envTotemId;
    }
    
    // Si no hay ningún ID válido, devolver cadena vacía
    return '';
  }
  
  // Método para guardar el ID del tótem
  saveTotemId(id: string): void {
    if (!this.isBrowser) return;
    
    localStorage.setItem('totemId', id);
    
    // Actualizamos también el ID en el servicio de Socket
    this.socketService.updateTotemId(id);
    
    console.log('ID del tótem guardado:', id);
  }
  
  // Método para verificar si hay un tótem configurado
  hasConfiguredTotem(): boolean {
    if (!this.isBrowser) return !!environment.totem.id;
    
    const savedTotemId = localStorage.getItem('totemId');
    const envTotemId = environment.totem.id;
    
    // Verificar si alguno de los IDs es válido
    const hasValidId = !!(
      (savedTotemId && savedTotemId !== 'undefined' && savedTotemId !== 'null') ||
      (envTotemId && envTotemId !== 'undefined' && envTotemId !== 'null')
    );
    
    console.log('TotemService.hasConfiguredTotem:', {
      savedTotemId,
      envTotemId,
      hasValidId
    });
    
    return hasValidId;
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
    if (!this.isBrowser) {
      console.log('SSR: Devolviendo lista vacía de tótems');
      return of([]);
    }
    
    return this.http.get<any[]>(`${environment.api.url}/totem`).pipe(
      map(response => Array.isArray(response) ? response : []),
      catchError(error => {
        console.error('Error al obtener todos los tótems:', error);
        return of([]);
      })
    );
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

  createTotem(totemData: { name: string, description: string, casilleros: any[] }): Observable<any> {
    // No realizar operaciones durante SSR
    if (!this.isBrowser) {
      console.log('SSR: Operación createTotem simulada');
      return of({success: true});
    }
    
    console.log('Creando nuevo tótem:', totemData);
    return this.http.post<any>(`${environment.api.url}/totem`, totemData).pipe(
      tap(response => {
        console.log('Tótem creado exitosamente:', response);
        if (response && response._id) {
          this.saveTotemId(response._id);
        }
      }),
      catchError(error => {
        console.error('Error al crear el tótem:', error);
        return throwError(() => error);
      })
    );
  }
}

