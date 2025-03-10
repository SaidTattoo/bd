import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Activity, EnergyValidation } from '../interface/activity.interface';
import { Observable, of, throwError, switchMap, map, timeout } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TotemService } from '../../services/totem.service';
import { isPlatformBrowser } from '@angular/common';
import { SocketService } from '../../../services/socket.service';


@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  private isBrowser: boolean;
  private readonly REQUEST_TIMEOUT = 8000; // 8 segundos de timeout para peticiones HTTP

  constructor(
    private http: HttpClient,
    private totemService: TotemService,
    private socketService: SocketService,
    @Inject(PLATFORM_ID) platformId: Object
  ) { 
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getActivities(): Observable<Activity[]> {
    // Durante SSR, devolver un array vacío para evitar bloqueos
    if (!this.isBrowser) {
      console.log('SSR: Devolviendo actividades mock');
      return of([]);
    }
    
    return this.http.get<Activity[]>(`${environment.api.url}/activities`).pipe(
      timeout(this.REQUEST_TIMEOUT),
      map(response => Array.isArray(response) ? response : []),
      catchError(this.handleError)
    );
  }

  getActivity(id: string): Observable<Activity> {
    // Durante SSR, devolver una actividad mock para evitar bloqueos
    if (!this.isBrowser) {
      console.log('SSR: Devolviendo actividad mock para ID:', id);
      return of({
        _id: id,
   
        name: 'Cargando actividad...',
        description: 'La información completa se cargará en el navegador',
        isBlocked: false,
        blockType: '',
        createdAt: new Date().toISOString(),
        status: 'pendiente',
        energyOwners: [],
        lockers: [],
        equipments: [],
        pendingNewEnergyOwner: false,
        selectedNewOwner: ''
      } as Activity);
    }
    
    return this.http.get<Activity>(`${environment.api.url}/activities/${id}`).pipe(
      timeout(this.REQUEST_TIMEOUT),
      catchError(this.handleError)
    );
  }

  validateEnergy(activityId: string, validation: EnergyValidation): Observable<any> {
    console.log('Enviando validación al servidor:', { activityId, validation });
    return this.http.post<any>(
      `${environment.api.url}/activities/${activityId}/validate-energy`, 
      validation
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      catchError(this.handleError)
    );
  }
  removeEnergyOwner(activityId: string, data: any): Observable<Activity> {
   return this.http.post<Activity>(
      `${environment.api.url}/activities/${activityId}/remove-energy-owner`,
      data
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      catchError(this.handleError)
    );
  }
  private handleError(error: HttpErrorResponse) {
    console.error('Se produjo un error:', error);
    console.error('Status:', error.status);
    console.error('URL:', error.url);
    
    let errorMessage = 'Ocurrió un error en la solicitud';

    if (error.status === 404) {
      errorMessage = 'Recurso no encontrado';
    } else if (error.error && typeof window !== 'undefined' && error.error instanceof ErrorEvent) {
      // Error del lado del cliente solo en navegador
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      // Error del servidor o estructura de error desconocida
      errorMessage = `Error ${error.status}: ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }


    /**router.delete('/:id/casillero/:casilleroId', removeEquipmentFromCasillero); */

    removeEquipmentFromCasillero(totemId: string, casilleroId: string): Observable<Activity> {
      return this.http.delete<Activity>(`${environment.api.url}/totem/${totemId}/casillero/${casilleroId}`).pipe(
        catchError(this.handleError)
      );
    }

    pendingStatusActivity(activityId: string , userSelected:any): Observable<Activity> {
      return this.http.get<Activity>(`${environment.api.url}/activities/${activityId}/pending-new-energy-owner/${userSelected}`).pipe(
        catchError(this.handleError)
      );
    }

    asignarSupervisorAduenoEnergia(activityId: string, data: any): Observable<Activity> {
      return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/assign-supervisor`, data).pipe(
        catchError(this.handleError)
      );
    }
    asignarDuenoDeEnergia(activityId: string, data: any): Observable<Activity> {
      console.log('Asignando dueño de energía:', { activityId, data });
      return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/energy-owners`, data).pipe(
        map(response => {
          console.log('Dueño de energía asignado exitosamente:', response);
          // Notify the socket service after successful assignment
          if (this.socketService) {
            this.socketService.emit('energy-owner-changed', { 
              activityId,
              energyOwnerId: data.userId
            });
          }
          return response;
        }),
        catchError(this.handleError)
      );
    }
    cambiarDuenoDeEnergia(activityId: string, data: any): Observable<Activity> {
      console.log('Cambiando dueño de energía:', { activityId, data });
      return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/change-energy-owner`, data).pipe(
        map(response => {
          console.log('Dueño de energía cambiado exitosamente:', response);
          // Notify the socket service after successful change
          if (this.socketService) {
            this.socketService.emit('energy-owner-changed', { 
              activityId,
              energyOwnerId: data.selectedOwner
            });
          }
          return response;
        }),
        catchError(this.handleError)
      );
    }
    asignarTrabajadorAsupervisor(activityId: string, data: any): Observable<Activity> {
      return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/assign-worker`, data).pipe(
        catchError(this.handleError)
      );
    }

    changeEnergyOwner(activityId: string, data:any): Observable<Activity> {
        return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/assign-worker`, data).pipe(
          catchError(this.handleError));
    }


     deleteActivity(activityId: string){
      return this.http.delete<Activity>(`${environment.api.url}/activities/${activityId}`).pipe(
      catchError(this.handleError)
    );
    }

    blockActivity(activityId: string): Observable<Activity> {
      return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/block`, {}).pipe(
        catchError(this.handleError)
      );
    }

    /* {
  "method": "POST",
  "url": "/activities/64f7c3e12b3b1a4567890123/desbloquear",

}
  desbloqueo de actividad, puede ser supervisor, duenoenergia y trabajador
*/

    unlockActivity(activityId: string, data: any): Observable<Activity> {
      // Primero obtenemos la actividad para tener el ID del casillero
      return this.getActivity(activityId).pipe(
        switchMap(activity => {
          // Buscamos el casillero ocupado
          const lockerId = activity.lockers?.find(locker => locker.status === 'ocupado')?._id;
          
          // Procedemos con el desbloqueo
          return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/desbloquear`, data).pipe(
            switchMap(response => {
              if (!lockerId) {
                console.warn('No se encontró casillero ocupado para la actividad:', activityId);
                return of(response);
              }

              // Limpiamos y desbloqueamos el casillero usando TotemService
              return this.totemService.clearLocker(this.totemService.getTotemId(), lockerId).pipe(
                switchMap(() => {
                  // Después de limpiar el casillero, actualizamos su estado a disponible
                  return this.totemService.updateLockerStatus(this.totemService.getTotemId(), lockerId, 'disponible').pipe(
                    // Finalmente reiniciamos el estado de los equipos
                    switchMap(() => this.resetEquipmentStatus(activityId)),
                    map(() => response)
                  );
                })
              );
            })
          );
        }),
        catchError(this.handleError)
      );
    }

    resetEquipmentStatus(activityId: string): Observable<any> {
      return this.http.post<any>(`${environment.api.url}/activities/${activityId}/reset-equipment`, {}).pipe(
        catchError(this.handleError)
      );
    }

    clearLockerAfterUnlock(activityId: string, lockerId: string): Observable<any> {
      // Usamos el método getTotemId del TotemService
      const totemId = this.totemService.getTotemId();
      
      // Verificamos si tenemos un totemId válido
      if (!totemId) {
        console.error('No hay un tótem configurado para esta operación');
        return throwError(() => new Error('No hay un tótem configurado'));
      }
      
      return this.totemService.clearLocker(totemId, lockerId).pipe(
        catchError(error => {
          // Si falla al limpiar el casillero, intentamos al menos actualizar su estado
          return this.totemService.updateLockerStatus(totemId, lockerId, 'disponible').pipe(
            catchError(err => {
              console.error('Error al limpiar y actualizar el casillero:', err);
              return throwError(() => err);
            })
          );
        })
      );
    }

    desbloquearSupervisor(activityId: string, data: any): Observable<Activity> {
      console.log('Service - desbloquearSupervisor called with:', { 
        activityId, 
        data,
        url: `${environment.api.url}/activities/${activityId}/desbloquear-supervisor`
      });
      return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/desbloquear-supervisor`, data)
        .pipe(
          map(response => {
            console.log('Service - desbloquearSupervisor response:', response);
            return response;
          }),
          catchError(error => {
            console.error('Service - desbloquearSupervisor error:', error);
            console.error('Error status:', error.status);
            console.error('Error message:', error.message);
            console.error('Error details:', error.error);
            return this.handleError(error);
          })
        );
    }

    desbloquearTrabajador(activityId: string, data: any): Observable<Activity> {
      console.log('Service - desbloquearTrabajador called with:', { activityId, data });
      return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/desbloquear-trabajador`, data).pipe(
        catchError(this.handleError)
      );
    }

    desbloquearDuenoEnergia(activityId: string, data: any): Observable<Activity> {
      console.log('Service - desbloquearDuenoEnergia called with:', { 
        activityId, 
        data,
        url: `${environment.api.url}/activities/${activityId}/desbloquear-dueno-energia`
      });
      return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/desbloquear-dueno-energia`, data)
        .pipe(
          map(response => {
            console.log('Service - desbloquearDuenoEnergia response:', response);
            return response;
          }),
          catchError(error => {
            console.error('Service - desbloquearDuenoEnergia error:', error);
            console.error('Error status:', error.status);
            console.error('Error message:', error.message);
            console.error('Error details:', error.error);
            return this.handleError(error);
          })
        );
    }

}
