import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;
  public clientesConectados$ = new BehaviorSubject<any[]>([]);
  public miTotemId: string = '';
  public ubicacionTotem: string = '';
  public equiposOcupados$ = new BehaviorSubject<{ [key: string]: { totem: string; actividad: string; actividadNombre: string } }>({});
  private reconnectAttempts = 0;
  private maxReconnectAttempts = environment.websocket.reconnectAttempts;
  private reconnectTimer: any = null;
  private serverUrl = environment.websocket.url;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    if (isPlatformBrowser(this.platformId)) {
      // Inicializar con valores del entorno
      this.ubicacionTotem = environment.totem.location;
      
      // Si hay un ID de totem definido y no es 'auto', usarlo
      if (environment.totem.id && environment.totem.id !== 'auto') {
        this.miTotemId = environment.totem.id;
        console.log(`ℹ️ Usando ID de tótem configurado: ${this.miTotemId}`);
      }
      
      //this.initSocket();
    }
  }

  private async loadInitialState() {
    try {
      console.log(`🔄 Cargando estado inicial desde ${this.serverUrl}/api/equipment-state`);
      const response = await this.http.get<any>(`${this.serverUrl}/api/equipment-state`).toPromise();
      if (response && response.equiposEnUso) {
        this.equiposOcupados$.next(response.equiposEnUso);
        console.log(`✅ Estado cargado: ${Object.keys(response.equiposEnUso).length} equipos en uso`);
      }
    } catch (error) {
      console.error('❌ Error al cargar el estado inicial:', error);
    }
  }

  private initSocket() {
    try {
      if (this.socket) {
        this.socket.disconnect();
      }

      console.log(`🔌 Conectando a WebSocket en ${this.serverUrl}`);
      
      // Opciones de conexión para red local
      const options = {
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 5000,
        query: {} as any
      };
      
      // Si hay un ID de tótem preconfigurado, incluirlo en la conexión
      if (this.miTotemId && this.miTotemId !== 'auto') {
        options.query.totemId = this.miTotemId;
        options.query.location = this.ubicacionTotem;
      }
      
      this.socket = io(this.serverUrl, options);

      //this.setupSocketListeners();
      //this.loadInitialState();
    } catch (error) {
      console.error('❌ Error al inicializar el socket:', error);
     
     // this.handleReconnect();
    }
  }

  private handleReconnect() {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      console.log(`⏱️ Intento de reconexión ${this.reconnectAttempts} de ${this.maxReconnectAttempts}...`);
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }
      
      const reconnectDelay = Math.min(3000 * this.reconnectAttempts, 15000); // Retraso exponencial con máximo de 15 segundos
      console.log(`🔄 Reintentando conexión en ${reconnectDelay/1000} segundos...`);
      
      this.reconnectTimer = setTimeout(() => {
        this.initSocket();
      }, reconnectDelay);
    } else {
      console.error('❌ Número máximo de intentos de reconexión alcanzado');
     // this.showConnectionError();
      // Reiniciar contador para futuros intentos manuales
      this.reconnectAttempts = 0;
    }
  }

  private showConnectionError() {
    Swal.fire({
      title: 'Error de conexión',
      html: `<p>No se pudo conectar al servidor WebSocket en <strong>${this.serverUrl}</strong>.</p>
            <p>Posibles causas:</p>
            <ul class="text-left">
              <li>El servidor WebSocket no está en ejecución</li>
              <li>La dirección IP configurada no es correcta</li>
              <li>Existe un problema de red entre este dispositivo y el servidor</li>
            </ul>`,
      icon: 'error',
      confirmButtonText: 'Reintentar',
      showCancelButton: true,
      cancelButtonText: 'Configurar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.initSocket();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Mostrar un formulario para configurar manualmente la URL del servidor
        this.showServerConfig();
      }
    });
  }
  
  private showServerConfig() {
    Swal.fire({
      title: 'Configuración del servidor',
      html: `<div class="mb-3">
              <label class="form-label">URL del Servidor WebSocket:</label>
              <input id="server-url" class="form-control" type="text" value="${this.serverUrl}">
            </div>
            <div class="text-muted">Ejemplo: http://192.168.1.100:3003</div>`,
      icon: 'question',
      confirmButtonText: 'Guardar y Conectar',
      showCancelButton: true,
      preConfirm: () => {
        const serverURL = (document.getElementById('server-url') as HTMLInputElement).value;
        if (!serverURL) {
          Swal.showValidationMessage('La URL del servidor es obligatoria');
          return false;
        }
        return serverURL;
      }
    }).then((result) => {
      if (result.isConfirmed && typeof result.value === 'string') {
        // Actualizar URL del servidor y reconectar
        this.serverUrl = result.value;
        console.log(`⚙️ URL del servidor actualizada a: ${this.serverUrl}`);
        this.initSocket();
      }
    });
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.reconnectAttempts = 0;
      
      // Si no teníamos ID de tótem predefinido, usar el asignado por Socket.io
      if (!this.miTotemId || this.miTotemId === 'auto') {
        this.miTotemId = this.socket?.id ?? 'totem000000001';
      }
      
      console.log(`✅ Conectado al servidor WebSocket ${this.serverUrl}`);
      console.log(`🆔 ID del tótem: ${this.miTotemId}`);
      console.log(`📍 Ubicación: ${this.ubicacionTotem}`);
      
      // Enviar información adicional al servidor al conectarse
      this.socket?.emit('register-totem', {
        id: this.miTotemId,
        location: this.ubicacionTotem
      });
      
      // Al conectarse, emitir evento para solicitar la lista de clientes
      this.socket?.emit('get-clients');
      
      // Mostrar notificación de éxito si hubo problemas anteriores
      if (this.reconnectAttempts > 0) {
        Swal.fire({
          title: '¡Conexión restaurada!',
          text: 'Se ha restablecido la conexión con el servidor.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Error de conexión WebSocket:", error.message);
      console.error("URL del servidor:", this.serverUrl);
      this.handleReconnect();
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("🔌 Desconectado del WebSocket. Razón:", reason);
      
      // Mensaje más descriptivo según la razón
      let reasonMsg = 'Se ha perdido la conexión con el servidor.';
      
      if (reason === 'io server disconnect') {
        reasonMsg = 'El servidor ha cerrado la conexión.';
      } else if (reason === 'ping timeout') {
        reasonMsg = 'Tiempo de espera agotado para la comunicación con el servidor.';
      } else if (reason === 'transport close') {
        reasonMsg = 'La conexión de red se ha cerrado.';
      }
      
      console.warn(`ℹ️ ${reasonMsg}`);
      
      // Intentar reconectar para la mayoría de las razones
      if (reason !== 'io client disconnect') {
        this.handleReconnect();
      }
    });

    this.socket.on("actualizar-clientes", (clientes) => {
      console.log("📱 Lista de tótems actualizada:", clientes);
      
      // Convertir los IDs de socket en objetos con formato adecuado
      const clientesFormateados = clientes.map((id: string) => ({
        id,
        nombre: `Tótem ${id.slice(-4)}`,
        esEsteTotem: id === this.miTotemId
      }));
      
      this.clientesConectados$.next(clientesFormateados);
    });

    this.socket.on("actualizar-equipos", (equipos) => {
      console.log("🔄 Equipos ocupados actualizados:", equipos);
      this.equiposOcupados$.next(equipos);
    });
  }

  /**
   * 🔹 Método para emitir eventos al servidor WebSocket
   * @param evento Nombre del evento
   * @param datos Datos a enviar
   */
  emitirEvento(evento: string, datos: any) {
    if (this.socket?.connected) {
      this.socket.emit(evento, datos);
      return true;
    } else {
      console.warn("⚠️ Socket no conectado. No se pudo emitir evento:", evento);
      this.initSocket();
      return false;
    }
  }

  ocuparEquipo(equipoId: string, actividadId: string, actividadNombre: string) {
    if (this.socket?.connected) {
      this.socket.emit("usar-equipo", { equipoId, actividadId, actividadNombre });
      return true;
    } else {
      console.warn("⚠️ Socket no conectado. No se pudo ocupar el equipo.");
      Swal.fire({
        title: 'Error de conexión',
        text: 'No hay conexión con el servidor. No se pudo ocupar el equipo.',
        icon: 'warning',
        confirmButtonText: 'Reintentar',
      }).then(() => {
        this.initSocket();
        // Intentar nuevamente después de inicializar
        setTimeout(() => {
          if (this.socket?.connected) {
            this.socket.emit("usar-equipo", { equipoId, actividadId, actividadNombre });
          }
        }, 1000);
      });
      return false;
    }
  }

  liberarEquipo(equipoId: string, actividadId: string) {
    if (this.socket?.connected) {
      this.socket.emit("liberar-equipo", { equipoId, actividadId });
      return true;
    } else {
      console.warn("⚠️ Socket no conectado. No se pudo liberar el equipo.");
      Swal.fire({
        title: 'Error de conexión',
        text: 'No hay conexión con el servidor. No se pudo liberar el equipo.',
        icon: 'warning',
        confirmButtonText: 'Reintentar',
      }).then(() => {
        this.initSocket();
        // Intentar nuevamente después de inicializar
        setTimeout(() => {
          if (this.socket?.connected) {
            this.socket.emit("liberar-equipo", { equipoId, actividadId });
          }
        }, 1000);
      });
      return false;
    }
  }

  reconnect() {
    this.reconnectAttempts = 0;
    this.initSocket();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log("🔌 Desconectado manualmente del WebSocket");
    }
  }
}
