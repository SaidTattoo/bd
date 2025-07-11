import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import * as pako from 'pako';
import { tap, map, catchError } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private http: HttpClient) { }
  private fingerPrintSdkUrl = 'http://localhost:5000/capturar-huella';
  private fingerPrintSdkUrlCompare = 'https://localhost:8443/SGIFPCompare';
  getUsers() {
    return this.http.get<any>(`${environment.api.url}/users`);
  }
  getUser(id: string) {
    return this.http.get<any>(`${environment.api.url}/users/${id}`);
  }
  createUser(user: any) {
    return this.http.post<any>(`${environment.api.url}/users`, user);
  }

  captureFingerprint() {
    console.log('Llamando al servicio de captura...');
    return this.http.post<any>(this.fingerPrintSdkUrl, {}).pipe(
      tap(response => console.log('Respuesta del SDK:', response)),
      map((response: any) => {
        // Verificar si la respuesta tiene la estructura esperada
        if (response?.data?.template || response?.data?.imagen) {
          console.log('Imagen capturada exitosamente');
          return {
            originalResponse: response,
            data: {
              imagen: response.data.template || response.data.imagen
            }
          };
        }
        
        // Si hay un mensaje de éxito pero la estructura es diferente
        if (response?.success && response?.data) {
          return {
            originalResponse: response,
            data: response.data
          };
        }

        console.log('Respuesta sin imagen:', response);
        throw new Error('No se pudo obtener la imagen');
      }),
      catchError(error => {
        console.error('Error en captureFingerprint:', error);
        if (error.status === 404) {
          throw new Error('No se pudo conectar con el servicio de huellas');
        }
        throw error;
      })
    );
  }
  compareFingerprint(fingerprint1: any, fingerprint2: any) {
    const body = new HttpParams()
      .set('Template1', fingerprint1)
      .set('Template2', fingerprint2);

    return this.http.post(this.fingerPrintSdkUrlCompare, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        origin: 'http://localhost',
      },
    });
  }
  findUserByFingerprint(template: string) {
    console.log('Iniciando verificación de huella...');
    
    const payload = {
      template: template
    };
    console.log('payload',payload);
    console.log('Enviando payload a /login-by-fingerprint');
    
    return this.http.post<any>(`${environment.api.url}/auth/login-by-fingerprint`, payload)
      .pipe(
        tap(response => {
          console.log('Respuesta del servidor:', response);
        }),
        catchError(error => {
          if (error.error?.mensaje) {
            console.error('Error del servidor:', error.error.mensaje);
          }
          throw error;
        })
      );
  }

  saveFingerprint(fingerprint: any, userId: string) {
    return this.http.post<any>(`${environment.api.url}/users/${userId}/fingerprints`, fingerprint);
  }
  loginByEmailandPassword(email: string, password: string) {
    return this.http.post<any>(`${environment.api.url}/users/login`, { email, password })
    .pipe(
      tap(response => console.log('Respuesta del servidor:', response)),
      catchError(error => {
        console.error('Error en loginByEmailandPassword:', error);
        throw error;
      })
    );
  }

  findEnergyOwners() {
    return this.http.get<any>(`${environment.api.url}/users/energy-owners`);
  }  

  loginByFingerprint() {

    return this.http.post('http://localhost:3000/fingerprint/compare',{})
  /*   const body = new HttpParams()
      .set('Timeout', '10000')
      .set('Quality', '50')
      .set('licstr', '')
      .set('templateFormat', 'ISO')
      .set('imageWSQRate', '0.75');

    this.http.post(this.fingerPrintSdkUrl, body.toString(), {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'http://localhost',
      }),
    }).subscribe((response: any) => {
      const template = response.TemplateBase64;

      // Comprimir el template y convertirlo a base64
      const compressedTemplate = pako.gzip(template);
      const base64Compressed = btoa(String.fromCharCode(...new Uint8Array(compressedTemplate)));

      // Enviar el template comprimido al backend para autenticación
      this.findUserByFingerprint(base64Compressed).subscribe((res: any) => {
        console.log('Usuario encontrado:', res);
      });
    }); */
  }

}
