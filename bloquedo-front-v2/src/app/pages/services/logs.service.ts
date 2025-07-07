import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LogConfiguration {
  level: 'error' | 'warning' | 'info' | 'debug';
  enabledEvents: LogEventType[];
  retention: number; // días
  format: 'json' | 'text' | 'csv';
  alertEmails: string[];
  autoExport: boolean;
  compressionEnabled: boolean;
  maxFileSize: number; // MB
  rotationEnabled: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info' | 'debug';
  eventType: LogEventType;
  userId?: string;
  userName?: string;
  message: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export type LogEventType = 
  | 'user_login' 
  | 'user_logout' 
  | 'user_login_failed'
  | 'user_created' 
  | 'user_updated' 
  | 'user_deleted'
  | 'locker_opened' 
  | 'locker_closed' 
  | 'locker_assigned' 
  | 'locker_released'
  | 'activity_started' 
  | 'activity_completed' 
  | 'activity_validated'
  | 'activity_cancelled'
  | 'equipment_assigned' 
  | 'equipment_unassigned'
  | 'equipment_status_changed'
  | 'system_config_changed' 
  | 'theme_changed' 
  | 'database_connection_lost'
  | 'database_connection_restored'
  | 'totem_connected'
  | 'totem_disconnected'
  | 'backup_created'
  | 'backup_restored'
  | 'error_occurred';

export interface LogFilter {
  startDate?: Date;
  endDate?: Date;
  level?: string;
  eventType?: LogEventType;
  userId?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface LogResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  private readonly apiUrl = `${environment.api.url}/logs`;
  private logConfigSubject = new BehaviorSubject<LogConfiguration | null>(null);
  
  public logConfig$ = this.logConfigSubject.asObservable();
  
  // Mock local logs storage
  private mockLogs: LogEntry[] = [];
  private mockLogId = 1;
  
  // Detectar si estamos en el browser
  private isBrowser: boolean;
  
  private defaultConfig: LogConfiguration = {
    level: 'info',
    enabledEvents: [
      'user_login', 'user_logout', 'user_login_failed', 'user_created', 'user_updated', 'user_deleted',
      'locker_opened', 'locker_closed', 'locker_assigned', 'locker_released',
      'activity_started', 'activity_completed', 'activity_validated', 'activity_cancelled',
      'equipment_assigned', 'equipment_unassigned', 'equipment_status_changed',
      'system_config_changed', 'theme_changed', 'database_connection_lost', 'database_connection_restored',
      'totem_connected', 'totem_disconnected', 'backup_created', 'backup_restored', 'error_occurred'
    ],
    retention: 90,
    format: 'json',
    alertEmails: [],
    autoExport: false,
    compressionEnabled: true,
    maxFileSize: 100,
    rotationEnabled: true
  };

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.initializeMockLogs();
    this.loadConfiguration();
  }

  private initializeMockLogs(): void {
    // Solo cargar logs desde localStorage si estamos en el browser
    if (this.isBrowser) {
      const savedLogs = localStorage.getItem('app_logs');
      if (savedLogs) {
        try {
          const parsedLogs = JSON.parse(savedLogs);
          // Convertir las fechas de string a Date objects
          this.mockLogs = parsedLogs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }));
          console.log('📊 [LogsService] Logs cargados desde localStorage:', this.mockLogs.length);
        } catch (error) {
          console.error('Error al cargar logs desde localStorage:', error);
          this.mockLogs = [];
        }
      } else {
        // Empezar sin logs de ejemplo - los logs reales se generarán con el uso
        this.mockLogs = [];
        console.log('📊 [LogsService] Iniciando sin logs guardados');
      }
    } else {
      // En SSR, empezar con array vacío
      this.mockLogs = [];
      console.log('📊 [LogsService] Ejecutando en SSR - sin localStorage');
    }
    
    // Generar un ID inicial basado en la cantidad de logs existentes
    this.mockLogId = this.mockLogs.length + 1;
  }

  private saveLogsToStorage(): void {
    // Solo guardar en localStorage si estamos en el browser
    if (this.isBrowser) {
      try {
        localStorage.setItem('app_logs', JSON.stringify(this.mockLogs));
        console.log('📊 [LogsService] Logs guardados en localStorage:', this.mockLogs.length);
      } catch (error) {
        console.error('Error al guardar logs en localStorage:', error);
      }
    }
  }

  clearAllStoredLogs(): void {
    // Solo limpiar localStorage si estamos en el browser
    if (this.isBrowser) {
      try {
        localStorage.removeItem('app_logs');
        this.mockLogs = [];
        console.log('📊 [LogsService] Todos los logs han sido eliminados del localStorage');
      } catch (error) {
        console.error('Error al limpiar logs del localStorage:', error);
      }
    } else {
      // En SSR, solo limpiar el array en memoria
      this.mockLogs = [];
      console.log('📊 [LogsService] Logs limpiados (SSR - sin localStorage)');
    }
  }

  // Configuración
  getConfiguration(): Observable<LogConfiguration> {
    console.log('📊 [LogsService] Getting configuration (mock)');
    return of(this.defaultConfig);
  }

  updateConfiguration(config: LogConfiguration): Observable<{ success: boolean; message: string }> {
    console.log('📊 [LogsService] Updating configuration (mock):', config);
    this.defaultConfig = { ...config };
    this.logConfigSubject.next(config);
    return of({ success: true, message: 'Configuración actualizada (mock)' });
  }

  resetConfiguration(): Observable<{ success: boolean; config: LogConfiguration }> {
    console.log('📊 [LogsService] Resetting configuration (mock)');
    const newConfig = { ...this.defaultConfig };
    this.logConfigSubject.next(newConfig);
    return of({ success: true, config: newConfig });
  }

  // Gestión de logs
  getLogs(filter: LogFilter): Observable<LogResponse> {
    console.log('📊 [LogsService] Getting logs (mock):', filter);
    
    let filteredLogs = [...this.mockLogs];
    
    // Aplicar filtros
    if (filter.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }
    
    if (filter.eventType) {
      filteredLogs = filteredLogs.filter(log => log.eventType === filter.eventType);
    }
    
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        log.userName?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filter.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startDate!);
    }
    
    if (filter.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endDate!);
    }
    
    // Ordenar por timestamp descendente
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Paginación
    const startIndex = (filter.page - 1) * filter.limit;
    const endIndex = startIndex + filter.limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    return of({
      logs: paginatedLogs,
      total: filteredLogs.length,
      page: filter.page,
      totalPages: Math.ceil(filteredLogs.length / filter.limit)
    });
  }

  exportLogs(filter: LogFilter, format: 'json' | 'csv' | 'excel'): Observable<Blob> {
    console.log('📊 [LogsService] Exporting logs (mock):', format);
    
    // Simular exportación
    const mockData = JSON.stringify(this.mockLogs, null, 2);
    const blob = new Blob([mockData], { type: 'application/json' });
    
    return of(blob);
  }

  clearLogs(olderThanDays?: number): Observable<{ success: boolean; deletedCount: number }> {
    const options = olderThanDays ? { params: { olderThanDays } } : {};
    
    // En el mock, simular la limpieza
    const initialCount = this.mockLogs.length;
    
    if (olderThanDays) {
      // Filtrar logs más antiguos que X días
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      this.mockLogs = this.mockLogs.filter(log => new Date(log.timestamp) > cutoffDate);
    } else {
      // Limpiar todos los logs
      this.mockLogs = [];
    }
    
    const deletedCount = initialCount - this.mockLogs.length;
    
    // Guardar en localStorage
    this.saveLogsToStorage();
    
    console.log(`📊 [LogsService] Limpiados ${deletedCount} logs`);
    
    return of({ success: true, deletedCount });
  }

  // Estadísticas
  getLogStats(): Observable<{
    totalLogs: number;
    logsByLevel: { [key: string]: number };
    logsByEventType: { [key: string]: number };
    recentErrors: LogEntry[];
  }> {
    console.log('📊 [LogsService] Getting log stats (mock)');
    
    const stats = {
      totalLogs: this.mockLogs.length,
      logsByLevel: {} as { [key: string]: number },
      logsByEventType: {} as { [key: string]: number },
      recentErrors: this.mockLogs.filter(log => log.level === 'error').slice(0, 5)
    };

    // Contar logs por nivel
    this.mockLogs.forEach(log => {
      stats.logsByLevel[log.level] = (stats.logsByLevel[log.level] || 0) + 1;
    });

    // Contar logs por tipo de evento
    this.mockLogs.forEach(log => {
      stats.logsByEventType[log.eventType] = (stats.logsByEventType[log.eventType] || 0) + 1;
    });

    return of(stats);
  }

  // Métodos de logging para usar en la aplicación
  logEvent(
    level: 'error' | 'warning' | 'info' | 'debug',
    eventType: LogEventType,
    message: string,
    details?: any,
    userId?: string
  ): Observable<{ success: boolean }> {
    // En una aplicación real, esto haría una llamada HTTP al backend
    // Por ahora, guardamos en el mock local
    
    const logEntry: LogEntry = {
      id: `log_${this.mockLogId++}`,
      timestamp: new Date(),
      level,
      eventType,
      message,
      details,
      userId,
      userName: userId ? `Usuario ${userId}` : undefined,
      ipAddress: '127.0.0.1', // Mock IP
      userAgent: navigator.userAgent
    };

    this.mockLogs.unshift(logEntry); // Agregar al principio para mostrar los más recientes primero
    
    // Limitar a 1000 logs para evitar problemas de memoria
    if (this.mockLogs.length > 1000) {
      this.mockLogs = this.mockLogs.slice(0, 1000);
    }

    // Guardar en localStorage
    this.saveLogsToStorage();

    console.log(`📊 [LogsService] Logging ${level} event: ${message}`, details);
    
    return of({ success: true });
  }

  // Métodos de conveniencia
  logInfo(eventType: LogEventType, message: string, details?: any, userId?: string): Observable<{ success: boolean }> {
    return this.logEvent('info', eventType, message, details, userId);
  }

  logWarning(eventType: LogEventType, message: string, details?: any, userId?: string): Observable<{ success: boolean }> {
    return this.logEvent('warning', eventType, message, details, userId);
  }

  logError(eventType: LogEventType, message: string, details?: any, userId?: string): Observable<{ success: boolean }> {
    return this.logEvent('error', eventType, message, details, userId);
  }

  logDebug(eventType: LogEventType, message: string, details?: any, userId?: string): Observable<{ success: boolean }> {
    return this.logEvent('debug', eventType, message, details, userId);
  }

  // Métodos específicos para eventos comunes
  logUserLogin(userId: string, userName: string): void {
    this.logInfo('user_login', `Usuario "${userName}" inició sesión exitosamente`, { userId, userName }).subscribe();
  }

  logUserLogout(userId: string, userName: string): void {
    this.logInfo('user_logout', `Usuario "${userName}" cerró sesión`, { userId, userName }).subscribe();
  }

  logLockerOperation(operation: 'opened' | 'closed' | 'assigned' | 'released', lockerId: string, userId?: string): void {
    const eventType = `locker_${operation}` as LogEventType;
    this.logInfo(eventType, `Casillero ${lockerId} ${operation}`, { lockerId, operation, userId }).subscribe();
  }

  logActivityOperation(operation: 'started' | 'completed' | 'validated' | 'cancelled', activityId: string, userId?: string): void {
    const eventType = `activity_${operation}` as LogEventType;
    this.logInfo(eventType, `Actividad ${activityId} ${operation}`, { activityId, operation, userId }).subscribe();
  }

  logSystemConfigChange(configType: string, changes: any, userId?: string): void {
    this.logInfo('system_config_changed', `Configuración ${configType} modificada`, { configType, changes, userId }).subscribe();
  }

  logThemeChange(themeId: string, themeName: string, userId?: string): void {
    this.logInfo('theme_changed', `Tema cambiado a "${themeName}"`, { themeId, themeName, userId }).subscribe();
  }

  logSystemError(error: any, context?: string, userId?: string): void {
    const errorMessage = error?.message || error?.error?.message || 'Error desconocido';
    const message = context ? `${context}: ${errorMessage}` : errorMessage;
    this.logError('error_occurred', message, { error, context, userId }).subscribe();
  }

  private loadConfiguration(): void {
    this.logConfigSubject.next(this.defaultConfig);
  }

  updateConfigurationSubject(config: LogConfiguration): void {
    this.logConfigSubject.next(config);
  }

  // Obtener todos los tipos de eventos disponibles
  getAvailableEventTypes(): { value: LogEventType; label: string; category: string }[] {
    return [
      // Usuarios
      { value: 'user_login', label: 'Inicio de sesión', category: 'Usuarios' },
      { value: 'user_logout', label: 'Cierre de sesión', category: 'Usuarios' },
      { value: 'user_login_failed', label: 'Intento de login fallido', category: 'Usuarios' },
      { value: 'user_created', label: 'Usuario creado', category: 'Usuarios' },
      { value: 'user_updated', label: 'Usuario actualizado', category: 'Usuarios' },
      { value: 'user_deleted', label: 'Usuario eliminado', category: 'Usuarios' },
      
      // Casilleros
      { value: 'locker_opened', label: 'Casillero abierto', category: 'Casilleros' },
      { value: 'locker_closed', label: 'Casillero cerrado', category: 'Casilleros' },
      { value: 'locker_assigned', label: 'Casillero asignado', category: 'Casilleros' },
      { value: 'locker_released', label: 'Casillero liberado', category: 'Casilleros' },
      
      // Actividades
      { value: 'activity_started', label: 'Actividad iniciada', category: 'Actividades' },
      { value: 'activity_completed', label: 'Actividad completada', category: 'Actividades' },
      { value: 'activity_validated', label: 'Actividad validada', category: 'Actividades' },
      { value: 'activity_cancelled', label: 'Actividad cancelada', category: 'Actividades' },
      
      // Equipos
      { value: 'equipment_assigned', label: 'Equipo asignado', category: 'Equipos' },
      { value: 'equipment_unassigned', label: 'Equipo desasignado', category: 'Equipos' },
      { value: 'equipment_status_changed', label: 'Estado de equipo cambiado', category: 'Equipos' },
      
      // Sistema
      { value: 'system_config_changed', label: 'Configuración cambiada', category: 'Sistema' },
      { value: 'theme_changed', label: 'Tema cambiado', category: 'Sistema' },
      { value: 'database_connection_lost', label: 'Conexión BD perdida', category: 'Sistema' },
      { value: 'database_connection_restored', label: 'Conexión BD restaurada', category: 'Sistema' },
      { value: 'totem_connected', label: 'Tótem conectado', category: 'Sistema' },
      { value: 'totem_disconnected', label: 'Tótem desconectado', category: 'Sistema' },
      { value: 'backup_created', label: 'Backup creado', category: 'Sistema' },
      { value: 'backup_restored', label: 'Backup restaurado', category: 'Sistema' },
      { value: 'error_occurred', label: 'Error ocurrido', category: 'Sistema' }
    ];
  }

  // Obtener niveles de log disponibles
  getAvailableLogLevels(): { value: string; label: string; color: string }[] {
    return [
      { value: 'error', label: 'Error', color: 'text-red-600' },
      { value: 'warning', label: 'Advertencia', color: 'text-yellow-600' },
      { value: 'info', label: 'Información', color: 'text-blue-600' },
      { value: 'debug', label: 'Debug', color: 'text-gray-600' }
    ];
  }
} 