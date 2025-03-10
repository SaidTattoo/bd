import { Injectable, Inject, PLATFORM_ID, Optional } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { filter, share } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private connected$ = new BehaviorSubject<boolean>(false);
  private eventListeners: Map<string, Subject<any>> = new Map();
  private connectAttempts = 0;
  private maxReconnectAttempts = environment.websocket.reconnectAttempts || 5;
  private isBrowser: boolean;
  
  // Variables del tótem
  public clientesConectados$ = new BehaviorSubject<any[]>([]);
  public miTotemId: string = ''; // Inicialmente vacío, se llenará dinámicamente

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Obtener el ID del tótem de localStorage o environment
    if (this.isBrowser) {
      this.updateTotemIdFromStorage();
      this.initSocketConnection();
    } else {
      console.log('Ejecutando en SSR - WebSockets deshabilitados');
    }
  }

  // Método para obtener el ID del tótem desde localStorage o environment
  private updateTotemIdFromStorage() {
    const savedTotemId = localStorage.getItem('totemId');
    this.miTotemId = savedTotemId || environment.totem.id || '';
    console.log('Socket usando Tótem ID:', this.miTotemId);
  }

  // Método para actualizar el ID del tótem cuando cambie
  updateTotemId(totemId: string) {
    if (this.miTotemId !== totemId) {
      console.log('Actualizando ID del tótem en Socket:', totemId);
      this.miTotemId = totemId;
      
      // Si ya estábamos conectados, nos reconectamos con el nuevo ID
      if (this.connected$.value) {
        this.disconnect();
        this.initSocketConnection();
      }
    }
  }

  private initSocketConnection() {
    // No inicializar si no estamos en un navegador
    if (!this.isBrowser) {
      this.connected$.next(false);
      return;
    }
    
    console.log('Intentando conectar a:', environment.websocket.url);
    
    // Check if the WebSocket URL is defined
    if (!environment.websocket.url) {
      console.warn('URL de WebSocket no definida en environment.websocket.url');
      this.connected$.next(false);
      return;
    }
    
    try {
      if (this.socket) {
        this.socket.disconnect();
      }
      
      this.socket = io(environment.websocket.url, {
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: environment.websocket.reconnectInterval || 5000,
        autoConnect: true,
        transports: ['websocket', 'polling'],
        withCredentials: true,
        timeout: 10000,  // 10 seconds timeout
        forceNew: true,
        query: {
          totemId: this.miTotemId,
          type: 'totem'
        }
      });

      this.socket.on('connect', () => {
        console.log('Socket conectado exitosamente:', this.socket.id);
        this.connected$.next(true);
        this.connectAttempts = 0;
        
        // Register all pending event listeners
        this.registerQueuedListeners();
      });

      this.socket.on('connect_error', (err: any) => {
        console.error('Error de conexión de socket:', err);
        this.connected$.next(false);
        this.connectAttempts++;
        
        if (this.connectAttempts >= this.maxReconnectAttempts) {
          console.warn(`Máximo número de intentos de reconexión (${this.maxReconnectAttempts}) alcanzado.`);
          console.warn('La aplicación continuará funcionando sin conexión WebSocket.');
          // You could add a notification to the UI here if needed
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket desconectado:', reason);
        this.connected$.next(false);
        
        // Try to reconnect if disconnected for a reason other than explicit user action
        if (reason !== 'io client disconnect') {
          this.reconnect();
        }
      });
    } catch (error) {
      console.error('Error al inicializar la conexión socket:', error);
      this.connected$.next(false);
    }
  }

  private registerQueuedListeners() {
    // No registrar listeners en SSR
    if (!this.isBrowser || !this.socket) return;
    
    // Setup all registered event listeners
    this.eventListeners.forEach((subject, eventName) => {
      console.log(`Registrando listener para evento: ${eventName}`);
      this.socket.on(eventName, (data: any) => {
        subject.next(data);
      });
    });
  }

  reconnect() {
    // No reconectar en SSR
    if (!this.isBrowser) return;
    
    if (this.socket && !this.socket.connected && this.connectAttempts < this.maxReconnectAttempts) {
      console.log('Intentando reconectar al servidor WebSocket...');
      this.socket.connect();
    }
  }

  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  listen(eventName: string): Observable<any> {
    // En SSR, devolver un observable vacío
    if (!this.isBrowser) {
      return of();
    }
    
    // Check if we already have a subject for this event
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Subject<any>());
      
      // If socket is connected, register the listener immediately
      if (this.socket?.connected) {
        console.log(`Registrando listener para evento: ${eventName}`);
        this.socket.on(eventName, (data: any) => {
          this.eventListeners.get(eventName)?.next(data);
        });
      } else {
        console.warn(`Socket no conectado, evento "${eventName}" se registrará cuando se conecte`);
        // Try to reconnect - event will be registered in the connect handler
        this.reconnect();
      }
    }
    
    // Return the subject as an observable
    return this.eventListeners.get(eventName)!.asObservable().pipe(share());
  }

  emit(eventName: string, data?: any): void {
    // No emitir eventos en SSR
    if (!this.isBrowser || !this.socket) return;
    
    if (!this.socket.connected) {
      console.warn(`Socket no conectado, no se puede emitir: ${eventName}`);
      this.reconnect();
      return;
    }
    
    this.socket.emit(eventName, data);
  }

  disconnect(): void {
    // No hacer nada en SSR
    if (!this.isBrowser || !this.socket) return;
    
    this.socket.disconnect();
    // Clear all event listeners
    this.eventListeners.clear();
  }
} 