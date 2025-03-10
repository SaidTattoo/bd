import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Equipment } from '../actividades/interface/activity.interface';

@Injectable({
  providedIn: 'root'
})
export class EquiposService {

  constructor( private http: HttpClient ) { }

  getEquipments() {
    return this.http.get<Equipment[]>(`${environment.api.url}/equipment`);
  }
  createEquipment(equipment: Equipment) {
    return this.http.post<Equipment>(`${environment.api.url}/equipment`, equipment);
  }
  getEquipment(id: string) {
    return this.http.get<Equipment>(`${environment.api.url}/equipment/${id}`);
  }
  addEquipmentToActivity(id: string, equipment: Equipment) {
    return this.http.post<Equipment>(`${environment.api.url}/activities/${id}/equipments`, equipment);
  }
  removeEquipmentFromActivity(id: string, equipment: Equipment) {
    return this.http.delete<Equipment>(`${environment.api.url}/activities/${id}/equipments/${equipment._id}`);
  }
}
