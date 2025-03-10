import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AreasService {

  constructor(private http: HttpClient) { }

  getAreas(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.api.url}/areas`);
  }

  /*
  {
    "name":"Area 2",
    "description":"area desde aca hasta alla 2"
  }
  */
  createArea(area: any): Observable<any> {
    return this.http.post<any>(`${environment.api.url}/areas`, area);
  }
  editArea(id: string, updatedArea: any): Observable<any> {
    return this.http.put<any>(`${environment.api.url}/areas/${id}`, updatedArea);
  }

  deleteArea(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.api.url}/areas/${id}`);
  }

}
