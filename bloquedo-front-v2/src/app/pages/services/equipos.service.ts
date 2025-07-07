import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Equipment } from '../actividades/interface/activity.interface';

@Injectable({
  providedIn: 'root'
})
export class EquiposService {
  private readonly apiUrl = `${environment.api.url}/equipment`;

  constructor( private http: HttpClient ) { }

  getEquipments(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(this.apiUrl);
  }

  getEquipment(id: string): Observable<Equipment> {
    return this.http.get<Equipment>(`${this.apiUrl}/${id}`);
  }

  createEquipment(equipment: Partial<Equipment>): Observable<any> {
    return this.http.post<any>(this.apiUrl, equipment);
  }

  updateEquipment(id: string, equipment: Partial<Equipment>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, equipment);
  }

  deleteEquipment(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  toggleLock(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/toggle-lock`, {});
  }

  assignActivity(equipmentId: string, activityId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${equipmentId}/assign-activity`, { activityId });
  }

  removeActivity(equipmentId: string, activityId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${equipmentId}/remove-activity/${activityId}`);
  }

  // Métodos heredados para compatibilidad con actividades
  addEquipmentToActivity(id: string, equipment: Equipment): Observable<Equipment> {
    return this.http.post<Equipment>(`${environment.api.url}/activities/${id}/equipments`, equipment);
  }

  removeEquipmentFromActivity(id: string, equipment: Equipment): Observable<Equipment> {
    return this.http.delete<Equipment>(`${environment.api.url}/activities/${id}/equipments/${equipment._id}`);
  }
}
