import { Injectable } from '@angular/core';
import { Activity, EnergyValidation } from '../interface/activity.interface';
import { Observable, of, throwError, switchMap, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TotemService } from '../../services/totem.service';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  private readonly TOTEM_ID = '6733d60513b741865c51aa1c'; // ID fijo del totem

  constructor(
    private http: HttpClient,
    private totemService: TotemService
  ) { }

  getActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${environment.api.url}/activities`).pipe(
      map(response => Array.isArray(response) ? response : []),
      catchError(this.handleError)
    );
  }

  getActivity(id: string): Observable<Activity> {
    return this.http.get<Activity>(`${environment.api.url}/activities/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  validateEnergy(activityId: string, validation: EnergyValidation): Observable<any> {
    console.log('Enviando validación al servidor:', { activityId, validation });
    return this.http.post<any>(`${environment.api.url}/activities/${activityId}/validate-energy`, validation);
  }
  removeEnergyOwner(activityId: string, data: any): Observable<Activity> {
   return this.http.post<Activity>(
      `${environment.api.url}/activities/${activityId}/remove-energy-owner`,
      data
    ).pipe(
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
      return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/energy-owners`, data).pipe(
        catchError(this.handleError)
      );
    }
    cambiarDuenoDeEnergia(activityId: string, data: any): Observable<Activity> {
      return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/change-energy-owner`, data).pipe(
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
              return this.totemService.clearLocker(this.TOTEM_ID, lockerId).pipe(
                switchMap(() => {
                  // Después de limpiar el casillero, actualizamos su estado a disponible
                  return this.totemService.updateLockerStatus(this.TOTEM_ID, lockerId, 'disponible').pipe(
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
      return this.http.post<any>(
        `${environment.api.url}/activities/${activityId}/clear-locker`, 
        { lockerId }
      ).pipe(
        catchError(this.handleError)
      );
    }

    desbloquearSupervisor(activityId: string, data: any): Observable<Activity> {
      return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/desbloquear-supervisor`, data).pipe(
        catchError(this.handleError)
      );
    }

    desbloquearTrabajador(activityId: string, data: any): Observable<Activity> {
      return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/desbloquear-trabajador`, data).pipe(
        catchError(this.handleError)
      );
    }

    desbloquearDuenoEnergia(activityId: string, data: any): Observable<Activity> {
      return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/desbloquear-dueno-energia`, data).pipe(
        catchError(this.handleError)
      );
    }

}
