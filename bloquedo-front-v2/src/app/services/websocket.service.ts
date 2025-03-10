import { Injectable } from '@angular/core';
import { Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  public socketStatus: boolean = false;
  public miTotemId: string = '';

  constructor(
    private socket: Socket
  ) {
    this.checkStatus();
  }

  checkStatus() {
    // Detectar conexión
    this.socket.on('connect', () => {
      console.log('Conectado al servidor');
      this.socketStatus = true;
    });

    // Detectar desconexión
    this.socket.on('disconnect', () => {
      console.log('Desconectado del servidor');
      this.socketStatus = false;
    });
  }

  // ... resto de los métodos existentes ...
}