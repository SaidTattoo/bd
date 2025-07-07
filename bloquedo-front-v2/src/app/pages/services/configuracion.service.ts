import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Theme {
  id: string;
  name: string;
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  cardColor: string;
  borderColor: string;
  sidebarHeaderColor: string;
  sidebarLinkColor: string;
  isDefault?: boolean;
}

export interface Configuracion {
  _id?: string;
  logo?: string; // base64 string
  nombreSistema?: string;
  version?: string;
  currentTheme?: string;
  themes?: Theme[];
  configuracionGeneral?: any;
  configuracionSeguridad?: any;
  configuracionNotificaciones?: any;
  configuracionTotems?: any;
  configuracionBD?: any;
  configuracionLogs?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private apiUrl = `${environment.api.url}/configuracion`;
  private logoSubject = new BehaviorSubject<string | null>(null);
  public logo$ = this.logoSubject.asObservable();
  
  private currentThemeSubject = new BehaviorSubject<Theme | null>(null);
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadLogo();
    this.loadCurrentTheme();
  }

  // Obtener configuración completa
  getConfiguracion(): Observable<Configuracion> {
    return this.http.get<Configuracion>(`${this.apiUrl}`);
  }

  // Actualizar configuración
  updateConfiguracion(configuracion: Partial<Configuracion>): Observable<Configuracion> {
    return this.http.put<Configuracion>(`${this.apiUrl}`, configuracion);
  }

  // Subir logo específicamente
  uploadLogo(logoBase64: string): Observable<Configuracion> {
    const body = { logo: logoBase64 };
    return this.http.put<Configuracion>(`${this.apiUrl}/logo`, body);
  }

  // Obtener solo el logo
  getLogo(): Observable<{ logo: string }> {
    return this.http.get<{ logo: string }>(`${this.apiUrl}/logo`);
  }

  // Cargar logo en el BehaviorSubject
  private loadLogo(): void {
    this.getLogo().subscribe({
      next: (data) => {
        this.logoSubject.next(data.logo);
      },
      error: () => {
        this.logoSubject.next(null);
      }
    });
  }

  // Actualizar logo en el BehaviorSubject
  updateLogoSubject(logo: string): void {
    this.logoSubject.next(logo);
  }

  // Cargar tema actual en el BehaviorSubject
  private loadCurrentTheme(): void {
    this.getThemes().subscribe({
      next: (data) => {
        const currentTheme = data.themes.find(theme => theme.id === data.currentTheme);
        this.currentThemeSubject.next(currentTheme || null);
      },
      error: () => {
        this.currentThemeSubject.next(null);
      }
    });
  }

  // Actualizar tema actual en el BehaviorSubject
  updateCurrentThemeSubject(theme: Theme): void {
    this.currentThemeSubject.next(theme);
  }

  // Convertir archivo a base64
  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  // Validar formato de imagen
  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  // Verificar estado de conexión a la base de datos
  checkDatabaseConnection(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/database/status`);
  }

  // Intentar reconectar a la base de datos
  reconnectDatabase(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/database/reconnect`, {});
  }

  // Obtener temas disponibles
  getThemes(): Observable<{ currentTheme: string; themes: Theme[] }> {
    return this.http.get<{ currentTheme: string; themes: Theme[] }>(`${this.apiUrl}/themes`);
  }

  // Obtener tema específico por ID
  getTheme(themeId: string): Observable<{ theme: Theme }> {
    return this.http.get<{ theme: Theme }>(`${this.apiUrl}/themes/${themeId}`);
  }

  // Cambiar tema actual
  changeTheme(themeId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/themes/change`, { themeId }).pipe(
      tap(() => {
        // Recargar el tema actual después del cambio exitoso
        this.loadCurrentTheme();
      })
    );
  }

  // Actualizar un tema específico
  updateTheme(themeId: string, themeData: Partial<Theme>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/themes/${themeId}`, themeData).pipe(
      tap(() => {
        // Recargar temas después de actualizar
        this.loadCurrentTheme();
      })
    );
  }

  // Resetear temas a valores por defecto
  resetThemes(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/themes/reset`, {});
  }

  // Crear tema personalizado
  createCustomTheme(themeData: Omit<Theme, 'id' | 'isDefault'>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/themes/custom`, themeData).pipe(
      tap(() => {
        // Recargar temas después de crear uno nuevo
        this.loadCurrentTheme();
      })
    );
  }

  // Eliminar tema personalizado
  deleteCustomTheme(themeId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/themes/custom/${themeId}`).pipe(
      tap(() => {
        // Recargar temas después de eliminar
        this.loadCurrentTheme();
      })
    );
  }
} 