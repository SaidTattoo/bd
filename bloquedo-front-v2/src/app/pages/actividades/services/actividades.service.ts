import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Activity, EnergyValidation } from '../interface/activity.interface';
import { Observable, of, throwError, switchMap, map, timeout, forkJoin } from 'rxjs';
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
    console.log('ActivityService inicializado en browser:', this.isBrowser);
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
        assignedLockers: [],
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
  assignLockerToActivity(activityId: string, data: { lockerId: string, totemId: string }): Observable<any> {
    return this.http.post(`${environment.api.url}/activities/${activityId}/assign-locker`, data).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en assignLockerToActivity:', error);
        // No transformamos el error, lo dejamos pasar para que el componente pueda
        // acceder a error.error.mensaje directamente
        return throwError(() => error);
      })
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
      console.log('Service - unlockActivity called with:', { 
        activityId, 
        data, 
        url: `${environment.api.url}/activities/${activityId}/desbloquear`
      });
      
      // Primero obtener la actividad para conseguir los casilleros asignados antes de desbloquear
      return this.getActivity(activityId).pipe(
        switchMap(activity => {
          // Almacenar información de los casilleros para usarla después de desbloquear
          const assignedLockers = activity.assignedLockers || [];
          console.log('Casilleros asignados antes de desbloquear:', assignedLockers);
          
          // Realizar la solicitud de desbloqueo al backend
          return this.http.post<any>(`${environment.api.url}/activities/${activityId}/desbloquear`, data)
            .pipe(
              switchMap(response => {
                console.log('Service - unlockActivity response:', response);
                
                // Procesar casilleros después del desbloqueo
                // Primero verificamos si la respuesta incluye info de casilleros actualizados
                if (response.lockersUpdated && response.lockersUpdated.length > 0) {
                  console.log('Casilleros actualizados por el backend:', response.lockersUpdated);
                  
                  // El backend ya se encargó de actualizar los casilleros, no necesitamos hacer más
                  return of(response);
                } else if (assignedLockers.length > 0 && this.isBrowser) {
                  // El backend no actualizó los casilleros, debemos hacerlo nosotros
                  console.log('Backend no actualizó casilleros, lo hacemos desde el frontend');
                  
                  // Obtener totemId de donde sea posible
                  let totemId = this.totemService.getTotemId();
                  
                  if (!totemId) {
                    try {
                      totemId = localStorage.getItem('totemId') as string;
                      if (!totemId) {
                        const possibleKeys = ['totem_id', 'totemID', 'currentTotemId', 'currentTotem', 'TOTEM_ID'];
                        for (const key of possibleKeys) {
                          const value = localStorage.getItem(key);
                          if (value) {
                            totemId = value;
                            break;
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Error al acceder a localStorage:', error);
                    }
                  }
                  
                  if (totemId) {
                    console.log('TotemId obtenido para operaciones de casillero:', totemId);
                    
                    // Crear operaciones para actualizar cada casillero
                    const lockerOperations: Observable<any>[] = [];
                    
                    // Para cada casillero asignado antes de desbloquear
                    assignedLockers.forEach(locker => {
                      // 1. Abrir el casillero físicamente
                      lockerOperations.push(
                        this.openLocker(totemId, locker.lockerId).pipe(
                          catchError(error => {
                            console.warn('Error al abrir casillero (continuando):', error);
                            return of(null);
                          })
                        )
                      );
                      
                      // 2. Limpiar el casillero (quitar equipos asociados)
                      lockerOperations.push(
                        this.totemService.clearLocker(totemId, locker.lockerId).pipe(
                          catchError(error => {
                            console.warn('Error al limpiar casillero (continuando):', error);
                            return of(null);
                          })
                        )
                      );
                      
                      // 3. Actualizar el estado del casillero a disponible
                      lockerOperations.push(
                        this.totemService.updateLockerStatus(totemId, locker.lockerId, 'disponible').pipe(
                          catchError(error => {
                            console.warn('Error al actualizar estado del casillero (continuando):', error);
                            return of(null);
                          })
                        )
                      );
                    });
                    
                    // Ejecutar todas las operaciones en paralelo
                    if (lockerOperations.length > 0) {
                      return forkJoin(lockerOperations).pipe(
                        map(() => {
                          console.log('Operaciones de casillero completadas desde el frontend');
                          
                          // Notificar a través del socket que se han liberado casilleros
                          this.notifyLockerRelease(assignedLockers.map(l => l.lockerId));
                          
                          return response;
                        }),
                        catchError(error => {
                          console.error('Error al procesar casilleros desde el frontend:', error);
                          return of(response); // Devolver la respuesta original aunque falle el procesamiento de casilleros
                        })
                      );
                    }
                  }
                }
                
                // Si no hay casilleros o no se pueden procesar, simplemente devolver la respuesta
                return of(response);
              }),
              catchError(error => {
                console.error('Service - unlockActivity error:', error);
                return this.handleError(error);
              })
            );
        })
      );
    }
    
    /**
     * Notifica a través del websocket que uno o varios casilleros han sido liberados
     * para actualizar la interfaz de otros clientes conectados
     * 
     * @param lockerIds IDs de los casilleros liberados
     */
    private notifyLockerRelease(lockerIds: string[]): void {
      try {
        if (this.socketService && lockerIds.length > 0) {
          console.log('Enviando notificación websocket de liberación de casilleros:', lockerIds);
          this.socketService.emit('lockers-released', {
            lockerIds: lockerIds,
            releasedBy: 'usuario_app',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error al enviar notificación de liberación de casilleros:', error);
      }
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
      
      // Primero obtener la actividad para conseguir el ID del casillero
      return this.getActivity(activityId).pipe(
        switchMap(activity => {
          // Almacenar información del casillero para usarla después de desbloquear
          let lockerId = null;
          
          // Intentar encontrar el casillero ocupado
          if (activity.lockers && Array.isArray(activity.lockers)) {
            const occupiedLocker = activity.lockers.find(locker => 
              locker.status === 'ocupado');
            if (occupiedLocker) {
              lockerId = occupiedLocker._id;
              console.log('Casillero encontrado para desbloqueo:', lockerId);
            }
          }
          
          // Realizar la solicitud de desbloqueo al backend
          return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/desbloquear-supervisor`, data)
            .pipe(
              switchMap(response => {
                console.log('Service - desbloquearSupervisor response:', response);
                
                // Si tenemos un casillero, intentar abrirlo físicamente y marcarlo como disponible
                if (lockerId && this.isBrowser) {
                  // Obtener totemId de donde sea posible
                  let totemId = this.totemService.getTotemId();
                  
                  if (!totemId) {
                    try {
                      totemId = localStorage.getItem('totemId') as string;
                      if (!totemId) {
                        const possibleKeys = ['totem_id', 'totemID', 'currentTotemId', 'currentTotem', 'TOTEM_ID'];
                        for (const key of possibleKeys) {
                          const value = localStorage.getItem(key);
                          if (value) {
                            totemId = value;
                            break;
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Error al acceder a localStorage:', error);
                    }
                  }
                  
                  if (totemId) {
                    console.log('TotemId obtenido para operaciones de casillero:', totemId);
                    
                    // Crear conjunto de operaciones a realizar con el casillero
                    const lockerOperations: Observable<any>[] = [
                      // 1. Abrir el casillero físicamente
                      this.openLocker(totemId, lockerId).pipe(
                        catchError(error => {
                          console.warn('Error al abrir casillero (continuando):', error);
                          return of(null);
                        })
                      ),
                      
                      // 2. Limpiar el casillero (quitar equipos asociados)
                      this.totemService.clearLocker(totemId, lockerId).pipe(
                        catchError(error => {
                          console.warn('Error al limpiar casillero (continuando):', error);
                          return of(null);
                        })
                      ),
                      
                      // 3. Actualizar el estado del casillero a disponible
                      this.totemService.updateLockerStatus(totemId, lockerId, 'disponible').pipe(
                        catchError(error => {
                          console.warn('Error al actualizar estado del casillero (continuando):', error);
                          return of(null);
                        })
                      )
                    ];
                    
                    // Ejecutar todas las operaciones en paralelo
                    return forkJoin(lockerOperations).pipe(
                      map(() => {
                        console.log('Casillero procesado exitosamente. Ahora está disponible.');
                        return response;
                      }),
                      catchError(error => {
                        console.error('Error al procesar el casillero:', error);
                        return of(response); // Devolver la respuesta original aunque falle el procesamiento del casillero
                      })
                    );
                  }
                }
                
                return of(response);
              }),
              catchError(error => {
                console.error('Service - desbloquearSupervisor error:', error);
                console.error('Error status:', error.status);
                console.error('Error message:', error.message);
                console.error('Error details:', error.error);
                return this.handleError(error);
              })
            );
        })
      );
    }

    desbloquearTrabajador(activityId: string, data: any): Observable<Activity> {
      console.log('Service - desbloquearTrabajador called with:', { 
        activityId, 
        data,
        url: `${environment.api.url}/activities/${activityId}/desbloquear-trabajador`
      });
      
      // Primero obtener la actividad para conseguir el ID del casillero
      return this.getActivity(activityId).pipe(
        switchMap(activity => {
          // Almacenar información del casillero para usarla después de desbloquear
          let lockerId = null;
          
          // Intentar encontrar el casillero ocupado
          if (activity.lockers && Array.isArray(activity.lockers)) {
            const occupiedLocker = activity.lockers.find(locker => 
              locker.status === 'ocupado');
            if (occupiedLocker) {
              lockerId = occupiedLocker._id;
              console.log('Casillero encontrado para desbloqueo:', lockerId);
            }
          }
          
          // Realizar la solicitud de desbloqueo al backend
          return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/desbloquear-trabajador`, data)
            .pipe(
              switchMap(response => {
                console.log('Service - desbloquearTrabajador response:', response);
                
                // Si tenemos un casillero, intentar abrirlo físicamente y marcarlo como disponible
                if (lockerId && this.isBrowser) {
                  // Obtener totemId de donde sea posible
                  let totemId = this.totemService.getTotemId();
                  
                  if (!totemId) {
                    try {
                      totemId = localStorage.getItem('totemId') as string;
                      if (!totemId) {
                        const possibleKeys = ['totem_id', 'totemID', 'currentTotemId', 'currentTotem', 'TOTEM_ID'];
                        for (const key of possibleKeys) {
                          const value = localStorage.getItem(key);
                          if (value) {
                            totemId = value;
                            break;
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Error al acceder a localStorage:', error);
                    }
                  }
                  
                  if (totemId) {
                    console.log('TotemId obtenido para operaciones de casillero:', totemId);
                    
                    // Crear conjunto de operaciones a realizar con el casillero
                    const lockerOperations: Observable<any>[] = [
                      // 1. Abrir el casillero físicamente
                      this.openLocker(totemId, lockerId).pipe(
                        catchError(error => {
                          console.warn('Error al abrir casillero (continuando):', error);
                          return of(null);
                        })
                      ),
                      
                      // 2. Limpiar el casillero (quitar equipos asociados)
                      this.totemService.clearLocker(totemId, lockerId).pipe(
                        catchError(error => {
                          console.warn('Error al limpiar casillero (continuando):', error);
                          return of(null);
                        })
                      ),
                      
                      // 3. Actualizar el estado del casillero a disponible
                      this.totemService.updateLockerStatus(totemId, lockerId, 'disponible').pipe(
                        catchError(error => {
                          console.warn('Error al actualizar estado del casillero (continuando):', error);
                          return of(null);
                        })
                      )
                    ];
                    
                    // Ejecutar todas las operaciones en paralelo
                    return forkJoin(lockerOperations).pipe(
                      map(() => {
                        console.log('Casillero procesado exitosamente. Ahora está disponible.');
                        return response;
                      }),
                      catchError(error => {
                        console.error('Error al procesar el casillero:', error);
                        return of(response); // Devolver la respuesta original aunque falle el procesamiento del casillero
                      })
                    );
                  }
                }
                
                return of(response);
              }),
              catchError(error => {
                console.error('Service - desbloquearTrabajador error:', error);
                console.error('Error status:', error.status);
                console.error('Error message:', error.message);
                console.error('Error details:', error.error);
                return this.handleError(error);
              })
            );
        })
      );
    }

    desbloquearDuenoEnergia(activityId: string, data: any): Observable<Activity> {
      console.log('Service - desbloquearDuenoEnergia called with:', { 
        activityId, 
        data,
        url: `${environment.api.url}/activities/${activityId}/desbloquear-dueno-energia`
      });
      
      // Primero obtener la actividad para conseguir el ID del casillero
      return this.getActivity(activityId).pipe(
        switchMap(activity => {
          // Almacenar información del casillero para usarla después de desbloquear
          let lockerId = null;
          
          // Intentar encontrar el casillero ocupado
          if (activity.lockers && Array.isArray(activity.lockers)) {
            const occupiedLocker = activity.lockers.find(locker => 
              locker.status === 'ocupado');
            if (occupiedLocker) {
              lockerId = occupiedLocker._id;
              console.log('Casillero encontrado para desbloqueo:', lockerId);
            }
          }
          
          // Realizar la solicitud de desbloqueo al backend
          return this.http.post<Activity>(`${environment.api.url}/activities/${activityId}/desbloquear-dueno-energia`, data)
            .pipe(
              switchMap(response => {
                console.log('Service - desbloquearDuenoEnergia response:', response);
                
                // Si tenemos un casillero, intentar abrirlo físicamente y marcarlo como disponible
                if (lockerId && this.isBrowser) {
                  // Obtener totemId de donde sea posible
                  let totemId = this.totemService.getTotemId();
                  
                  if (!totemId) {
                    try {
                      totemId = localStorage.getItem('totemId') as string;
                      if (!totemId) {
                        const possibleKeys = ['totem_id', 'totemID', 'currentTotemId', 'currentTotem', 'TOTEM_ID'];
                        for (const key of possibleKeys) {
                          const value = localStorage.getItem(key);
                          if (value) {
                            totemId = value;
                            break;
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Error al acceder a localStorage:', error);
                    }
                  }
                  
                  if (totemId) {
                    console.log('TotemId obtenido para operaciones de casillero:', totemId);
                    
                    // Crear conjunto de operaciones a realizar con el casillero
                    const lockerOperations: Observable<any>[] = [
                      // 1. Abrir el casillero físicamente
                      this.openLocker(totemId, lockerId).pipe(
                        catchError(error => {
                          console.warn('Error al abrir casillero (continuando):', error);
                          return of(null);
                        })
                      ),
                      
                      // 2. Limpiar el casillero (quitar equipos asociados)
                      this.totemService.clearLocker(totemId, lockerId).pipe(
                        catchError(error => {
                          console.warn('Error al limpiar casillero (continuando):', error);
                          return of(null);
                        })
                      ),
                      
                      // 3. Actualizar el estado del casillero a disponible
                      this.totemService.updateLockerStatus(totemId, lockerId, 'disponible').pipe(
                        catchError(error => {
                          console.warn('Error al actualizar estado del casillero (continuando):', error);
                          return of(null);
                        })
                      )
                    ];
                    
                    // Ejecutar todas las operaciones en paralelo
                    return forkJoin(lockerOperations).pipe(
                      map(() => {
                        console.log('Casillero procesado exitosamente. Ahora está disponible.');
                        return response;
                      }),
                      catchError(error => {
                        console.error('Error al procesar el casillero:', error);
                        return of(response); // Devolver la respuesta original aunque falle el procesamiento del casillero
                      })
                    );
                  }
                }
                
                return of(response);
              }),
              catchError(error => {
                console.error('Service - desbloquearDuenoEnergia error:', error);
                console.error('Error status:', error.status);
                console.error('Error message:', error.message);
                console.error('Error details:', error.error);
                return this.handleError(error);
              })
            );
        })
      );
    }

    /**
     * Finaliza completamente una actividad: resetea los equipos y libera el casillero asociado.
     * Se llama cuando se ha desbloqueado el último dueño de energía.
     * 
     * @param activityId ID de la actividad a finalizar
     * @returns Observable con la actividad actualizada
     */
    finalizeActivity(activityId: string): Observable<any> {
      console.log('Service - Finalizando actividad:', activityId);
      
      // Primero obtener la actividad para conseguir el ID del casillero
      return this.getActivity(activityId).pipe(
        switchMap(activity => {
          // Verificar si hay casilleros asignados
          let lockerId = null;
          
          if (activity && activity.assignedLockers && activity.assignedLockers.length > 0) {
            // Tomar el primer casillero asignado
            const assignedLocker = activity.assignedLockers[0];
            lockerId = assignedLocker.lockerId;
            console.log('Casillero asignado encontrado:', lockerId);
          }
          
          // Intentar obtener el totemId
          let totemId = this.totemService.getTotemId();
          
          // Si no lo obtenemos del servicio, intentar obtenerlo de otras fuentes
          if (!totemId && this.isBrowser) {
            try {
              totemId = localStorage.getItem('totemId') as string;
              
              if (!totemId) {
                const possibleKeys = ['totem_id', 'totemID', 'currentTotemId', 'currentTotem', 'TOTEM_ID'];
                for (const key of possibleKeys) {
                  const value = localStorage.getItem(key);
                  if (value) {
                    totemId = value;
                    break;
                  }
                }
              }
            } catch (error) {
              console.error('Error al acceder a localStorage:', error);
            }
          }
          
          // Si tenemos totemId y lockerId, incluir la operación de limpiar el casillero
          const operations: Observable<any>[] = [];
          
          // Paso 1: Finalizar la actividad en el backend
          operations.push(
            this.http.post<any>(`${environment.api.url}/activities/${activityId}/finalize`, {})
              .pipe(
                catchError(error => {
                  console.error('Error al finalizar actividad en el backend:', error);
                  return throwError(() => ({ 
                    error: true, 
                    message: 'No se pudo finalizar la actividad en el servidor' 
                  }));
                })
              )
          );
          
          // Paso 2: Si tenemos totemId y lockerId, incluir operaciones de casillero
          if (totemId && lockerId) {
            console.log('Agregando operaciones de casillero a la finalización:', { totemId, lockerId });
            
            // Abrir el casillero físicamente
            operations.push(
              this.openLocker(totemId, lockerId).pipe(
                catchError(error => {
                  console.warn('Error al abrir casillero (continuando con la finalización):', error);
                  return of(null);
                })
              )
            );
            
            // Limpiar el casillero (quitar equipos asociados)
            operations.push(
              this.totemService.clearLocker(totemId, lockerId).pipe(
                catchError(error => {
                  console.warn('Error al limpiar casillero (continuando con la finalización):', error);
                  return of(null);
                })
              )
            );
            
            // Actualizar el estado del casillero a disponible
            operations.push(
              this.totemService.updateLockerStatus(totemId, lockerId, 'disponible').pipe(
                catchError(error => {
                  console.warn('Error al actualizar estado del casillero (continuando con la finalización):', error);
                  return of(null);
                })
              )
            );
          }
          
          // Ejecutar todas las operaciones en paralelo
          return forkJoin(operations).pipe(
            map(results => {
              // El primer resultado corresponde a la respuesta del endpoint de finalización
              const finalizationResponse = results[0];
              
              // Crear un objeto de respuesta unificado
              return {
                ...finalizationResponse,
                success: true,
                lockerId: lockerId,
                message: 'Actividad finalizada correctamente'
              };
            }),
            catchError(error => {
              console.error('Error al finalizar actividad:', error);
              return of({
                success: false,
                message: error.message || 'Error desconocido al finalizar la actividad'
              });
            })
          );
        })
      );
    }

    /**
     * Abre un casillero específico mediante el endpoint dedicado
     * @param totemId ID del tótem
     * @param lockerId ID del casillero
     * @returns Observable con la respuesta del servidor
     */
    openLocker(totemId: string, lockerId: string): Observable<any> {
      console.log('Abriendo casillero con endpoint dedicado:', { totemId, lockerId });
      return this.http.post<any>(`${environment.api.url}/totem/${totemId}/casillero/${lockerId}/abrir`, {}).pipe(
        catchError(error => {
          console.error('Error al abrir casillero:', error);
          return throwError(() => error);
        })
      );
    }

    /**
     * Libera un casillero manualmente utilizando todas las formas posibles.
     * Este método puede usarse como último recurso cuando la liberación automática falla.
     * 
     * @param lockerId ID del casillero a liberar
     * @returns Observable con el resultado de la operación
     */
    manuallyReleaseLocker(lockerId: string): Observable<any> {
      console.log('Intentando liberación manual de casillero:', lockerId);
      
      if (!this.isBrowser) {
        return throwError(() => new Error('No se puede liberar casilleros en modo SSR'));
      }
      
      // Intentar obtener el totemId de múltiples fuentes
      let totemId = this.totemService.getTotemId();
      
      // Intentar obtener del localStorage si no está disponible desde el servicio
      if (!totemId) {
        try {
          totemId = localStorage.getItem('totemId') as string;
          console.log('TotemId obtenido desde localStorage para liberación manual:', totemId);
        } catch (error) {
          console.error('Error al acceder a localStorage:', error);
        }
      }
      
      // Si aún no tenemos totemId, buscar en otras posibles ubicaciones de storage
      if (!totemId) {
        try {
          // Intentar otras keys comunes donde podría estar el totemId
          const possibleKeys = ['totem_id', 'totemID', 'currentTotemId', 'currentTotem'];
          for (const key of possibleKeys) {
            const value = localStorage.getItem(key);
            if (value) {
              totemId = value;
              console.log(`TotemId encontrado en localStorage con key "${key}":`, totemId);
              break;
            }
          }
        } catch (error) {
          console.error('Error al buscar totemId en localStorage alternativo:', error);
        }
      }
      
      if (!totemId) {
        console.warn('No se pudo encontrar totemId para liberación manual');
        // Intentar liberación sin totemId usando solo el lockerId
        return this.http.post<any>(`${environment.api.url}/lockers/${lockerId}/release`, {}).pipe(
          catchError(error => {
            console.error('Error al liberar casillero sin totemId:', error);
            return throwError(() => error);
          })
        );
      }
      
      // Crear un array de operaciones para intentar liberar el casillero de múltiples formas
      const operations: Observable<any>[] = [
        // 1. Limpiar el casillero
        this.totemService.clearLocker(totemId, lockerId).pipe(
          catchError(error => {
            console.warn('Error en clearLocker durante liberación manual:', error);
            return of(null); // Continuar a pesar del error
          })
        ),
        
        // 2. Actualizar estado a disponible
        this.totemService.updateLockerStatus(totemId, lockerId, 'disponible').pipe(
          catchError(error => {
            console.warn('Error en updateLockerStatus durante liberación manual:', error);
            return of(null); // Continuar a pesar del error
          })
        ),
        
        // 3. Usar endpoint específico para abrir el casillero
        this.openLocker(totemId, lockerId).pipe(
          catchError(error => {
            console.warn('Error al abrir casillero durante liberación manual:', error);
            return of(null); // Continuar a pesar del error
          })
        ),
        
        // 4. Usar endpoint específico de liberación si existe
        this.http.post<any>(`${environment.api.url}/totem/${totemId}/casillero/${lockerId}/liberar`, {}).pipe(
          catchError(error => {
            console.warn('Error en endpoint de liberación específico:', error);
            return of(null); // Continuar a pesar del error
          })
        )
      ];
      
      // Ejecutar todas las operaciones y devolver resultado combinado
      return forkJoin(operations).pipe(
        map(results => {
          console.log('Resultados de liberación manual:', results);
          // Filtrar resultados no nulos para ver si alguna operación tuvo éxito
          const successfulOps = results.filter(r => r !== null);
          return {
            success: successfulOps.length > 0,
            message: successfulOps.length > 0 
              ? `Casillero ${lockerId} liberado exitosamente` 
              : `No se pudo liberar el casillero ${lockerId}`,
            results: results
          };
        })
      );
    }

}
