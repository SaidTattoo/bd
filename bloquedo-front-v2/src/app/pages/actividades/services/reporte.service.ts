import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private baseUrl = `${environment.api.url}/activities`;

  constructor(private http: HttpClient) {}

  getReport(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/report`);
  }
}
