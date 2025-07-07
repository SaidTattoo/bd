import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Activity } from '../actividades/interface/activity.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActividadesService {

  constructor(private http: HttpClient) {}

  createActivity(activity: Activity): Observable<Activity> {
    return this.http.post<Activity>(`${environment.api.url}/activities`, activity);
  }

  getActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${environment.api.url}/activities`);
  }

  deleteActivity(id: string): Observable<any> {
    return this.http.delete(`${environment.api.url}/activities/${id}`);
  }

  updateActivity(id: string, activity: Partial<Activity>): Observable<Activity> {
    return this.http.put<Activity>(`${environment.api.url}/activities/${id}`, activity);
  }

  /**
   * Limpia todas las actividades dejándolas con la estructura básica
   * Elimina usuarios asignados, validaciones de energía cero, equipos, etc.
   * @returns Observable con el resultado de la operación
   */
  cleanAllActivities(): Observable<any> {
    console.log('Limpiando todas las actividades...');
    return this.http.post<any>(`${environment.api.url}/activities/clean-all`, {});
  }

  /**
   * Limpia una actividad específica dejándola con la estructura básica
   * @param activityId ID de la actividad a limpiar
   * @returns Observable con el resultado de la operación
   */
  cleanActivity(activityId: string): Observable<any> {
    console.log('Limpiando actividad:', activityId);
    return this.http.post<any>(`${environment.api.url}/activities/${activityId}/clean`, {});
  }
 }
