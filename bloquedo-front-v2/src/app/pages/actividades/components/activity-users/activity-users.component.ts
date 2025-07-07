import { Component, EventEmitter, Input, Output, HostListener, OnInit, OnDestroy } from '@angular/core';
import { User } from '../../interface/activity.interface';
import { UserModalComponent } from '../user-modal/user-modal.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ValidacionComponent } from '../../validacion/validacion.component';
import { CommonModule } from '@angular/common';
import { RupturaComponent } from '../../ruptura/ruptura.component';
import { Observable, Subscription } from 'rxjs';
import { SocketService } from '../../../../services/socket.service';
import { ActivityService } from '../../services/actividades.service';

@Component({
  selector: 'app-activity-users',
  standalone: true,
  imports: [CommonModule, MatDialogModule, UserModalComponent, ValidacionComponent, RupturaComponent],
  
  templateUrl: './activity-users.component.html',
  styleUrls: ['./activity-users.component.scss']
})
export class ActivityUsersComponent implements OnInit, OnDestroy {
  @Input() energyOwners: any[] = [];
  @Input() activityId!: string;
  @Input() refreshCallback?: () => void; // Callback opcional para refrescar datos externos
  selectedUser: User | null = null;
  @Output() updateRequired = new EventEmitter<void>();
  actionMenuOpen: string | null = null;
  private socketSubscriptions: Subscription[] = [];
  loading: boolean = false; // Indicador de carga para operaciones

  constructor(
    private dialog: MatDialog, 
    private activityService: ActivityService,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    // Subscribe to real-time updates
    if (this.activityId) {
      this.setupSocketListeners();
      
      // Cargar datos iniciales
      this.refreshActivityData();
    }
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
  }

  setupSocketListeners() {
    // Listen for activity updates
    const activitySub = this.socketService.listen('activity-updated').subscribe((data: any) => {
      console.log('Activity users received update event:', data);
      if (data.activityId === this.activityId) {
        this.refreshActivityData();
      }
    });

    // Listen for energy owner changes
    const ownerSub = this.socketService.listen('energy-owner-changed').subscribe((data: any) => {
      console.log('Energy owner changed event received:', data);
      if (data.activityId === this.activityId) {
        this.refreshActivityData();
      }
    });

    // Listen for block status changes
    const blockSub = this.socketService.listen('activity-blocked').subscribe((data: any) => {
      console.log('Activity block status changed:', data);
      if (data.activityId === this.activityId) {
        this.refreshActivityData();
      }
    });

    // Listen for user assignments
    const assignSub = this.socketService.listen('user-assigned').subscribe((data: any) => {
      console.log('User assignment changed:', data);
      if (data.activityId === this.activityId) {
        this.refreshActivityData();
      }
    });

    this.socketSubscriptions.push(activitySub, ownerSub, blockSub, assignSub);
  }

  refreshActivityData() {
    console.log('Refreshing activity users data');
    this.loading = true; // Mostrar indicador de carga
    
    this.activityService.getActivity(this.activityId).subscribe({
      next: (activity: any) => {
        this.loading = false;
        if (activity.energyOwners) {
          console.log('Updated energy owners:', activity.energyOwners);
          this.energyOwners = activity.energyOwners;
          this.updateRequired.emit();
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error refreshing activity data:', error);
      }
    });
  }

  openUserModal(user: User, energyOwner: any) {
    const dialogRef = this.dialog.open(ValidacionComponent);
  
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.verificationStatus === 'verified') {
        this.loading = true; // Mostrar indicador de carga mientras se abre el modal
        
        const userModalRef = this.dialog.open(UserModalComponent, {
          data: {
            user: user,
            activityId: this.activityId,
            userLogin: result,
            energyOwner: energyOwner
          }
        });

        userModalRef.afterClosed().subscribe(response => {
          // Verificar si la respuesta contiene datos actualizados de la actividad
          if (response && response.actividad) {
            console.log('Actividad actualizada recibida:', response.actividad);
            
            // Actualizar energyOwners con los datos recibidos
            if (response.actividad.energyOwners) {
              this.energyOwners = response.actividad.energyOwners;
              console.log('EnergyOwners actualizados:', this.energyOwners);
            }
            
            // Emitir evento para que otros componentes se actualicen si es necesario
            this.updateRequired.emit();
            
            // Notificar sobre el cambio mediante socket
            this.notifyActivityChange();
          } else if (response === true || (response && !response.error)) {
            // Si recibimos true o una respuesta sin error, hacer una petición explícita
            console.log('Recibiendo confirmación simple, refrescando datos...');
            this.refreshActivityData();
            
            // Notificar sobre el cambio mediante socket
            this.notifyActivityChange();
          }
          
          this.loading = false;
        });
      }
    });
  }

  closeUserModal() {
    this.selectedUser = null;
  }

  blockUser(user: User) {
    console.log('Block user:', user);
  }

  breakUser(user: User) {
    console.log('Break user:', user);
  }

  toggleActionsMenu(userId: string, event?: MouseEvent): void {
    // Detener la propagación del evento para evitar que el documento lo capture
    if (event) {
      event.stopPropagation();
    }
    
    console.log('Toggle menu for user:', userId, 'Current open:', this.actionMenuOpen);
    
    if (this.actionMenuOpen === userId) {
      this.actionMenuOpen = null;
    } else {
      this.actionMenuOpen = userId;
    }
  }

  closeActionsMenu(): void {
    this.actionMenuOpen = null;
  }

  bloquearUsuario(usuario: any): void {
    console.log('Bloquear usuario:', usuario);
  }

  rupturaBloqueo(usuario: any): void {
    try {
      // Determinar el tipo de usuario
      const tipoUsuario = this.determinarTipoUsuario(usuario);
      console.log('Tipo de usuario para ruptura:', tipoUsuario);
      console.log('Usuario objeto completo:', JSON.stringify(usuario, null, 2));
      console.log('ActivityId value:', this.activityId);
      
      // Verificar actividad
      if (this.activityId) {
        this.debugActivity();
      } else {
        console.error('ERROR: activityId is undefined or empty!');
      }
      
      // Abrir el modal de confirmación de ruptura
      const dialogRef = this.dialog.open(RupturaComponent, {
        width: '800px',
        data: {
          user: usuario.user,
          tipoUsuario: tipoUsuario,
          worker: usuario
        }
      });
      
      // Suscribirse al resultado del modal
      dialogRef.afterClosed().subscribe((result: any) => {
        try {
          console.log('Modal result:', result);
          
          // Si el usuario confirmó la ruptura y hay datos de validación
          if (result && result.confirmed && result.validationData) {
            console.log('Ruptura de bloqueo confirmada para usuario:', usuario);
            console.log('Tipo de usuario:', tipoUsuario);
            console.log('Razón:', result.reason);
            console.log('Datos de validación:', result.validationData);
            
            // Implementación real de la ruptura de bloqueo
            if (usuario) {
              // Datos comunes para todos los tipos
              try {
                const requestData = {
                  reason: result.reason,
                  validationData: result.validationData,
                  selectedOption: result.selectedOption,
                  subOptions: result.subOptions,
                  detallesOpcion: result.selectedOption !== 2 ? result.mainOptions?.[result.selectedOption]?.detail : ''
                };
                
                console.log('REQUEST DATA COMPLETO:', JSON.stringify(requestData, null, 2));
                
                let serviceCall: Observable<any>;
                
                // Llamar al servicio correspondiente según el tipo de usuario
                switch (tipoUsuario) {
                  case 'trabajador':
                    serviceCall = this.activityService.desbloquearTrabajador(this.activityId, {
                      ...requestData,
                      trabajadorId: usuario.user?._id || usuario._id
                    });
                    break;
                    
                  case 'supervisor':
                    console.log('Supervisor object structure:', JSON.stringify(usuario, null, 2));
                    
                    // IMPORTANT FIX: Extract the correct supervisor ID based on data structure
                    let supervisorId;
                    
                    if (usuario.user && usuario.user._id) {
                      // If it's the full supervisor object with nested user
                      supervisorId = usuario.user._id;
                    } else if (usuario._id) {
                      // If it's just the ID directly
                      supervisorId = usuario._id;
                    } else {
                      console.error('No se pudo encontrar el ID del supervisor', usuario);
                      return;
                    }
                    
                    console.log('ID de supervisor a enviar:', supervisorId);
                    console.log('activityId:', this.activityId);
                    
                    serviceCall = this.activityService.desbloquearSupervisor(this.activityId, {
                      ...requestData,
                      supervisorId: supervisorId // Use the extracted ID
                    });
                    break;
                    
                  case 'duenoEnergia':
                    console.log('Dueño de energía object structure:', JSON.stringify(usuario, null, 2));
                    
                    // IMPORTANT FIX: Extract the correct energy owner ID based on data structure
                    let userId;
                    
                    if (usuario.user && usuario.user._id) {
                      // If it's the full user object with nested user
                      userId = usuario.user._id;
                    } else if (usuario._id) {
                      // If it's just the ID directly
                      userId = usuario._id;
                    } else {
                      console.error('No se pudo encontrar el ID del dueño de energía', usuario);
                      return;
                    }
                    
                    console.log('ID de dueño de energía a enviar:', userId);
                    console.log('activityId:', this.activityId);
                    
                    serviceCall = this.activityService.desbloquearDuenoEnergia(this.activityId, {
                      ...requestData,
                      userId: userId // Use the extracted ID
                    });
                    break;
                    
                  default:
                    console.error('Tipo de usuario no reconocido:', tipoUsuario);
                    return;
                }

                // Ejecutar la llamada al servicio
                if (serviceCall) {
                  console.log('Ejecutando serviceCall para ruptura...');
                  serviceCall.subscribe({
                    next: (response) => {
                      console.log('Ruptura de bloqueo exitosa:', response);
                      
                      // Actualizar directamente con los datos retornados en la respuesta
                      if (response && response.activity) {
                        console.log('Actualizando con datos de respuesta:', response.activity);
                        
                        // Verificar si la actividad se ha finalizado (no hay dueños de energía)
                        const activityFinalized = 
                          response.activity.status === 'finalizada' || 
                          (response.activity.energyOwners && response.activity.energyOwners.length === 0);
                        
                        // Si era un dueño de energía y la actividad ha quedado finalizada
                        if (tipoUsuario === 'duenoEnergia' && activityFinalized) {
                          console.log('============================================================');
                          console.log('ACTIVIDAD FINALIZADA - EJECUTANDO PROCESO DE FINALIZACIÓN');
                          console.log('Activity status:', response.activity.status);
                          console.log('Energy owners length:', response.activity.energyOwners?.length);
                          console.log('ActivityId:', this.activityId);
                          console.log('============================================================');
                          
                          // Ejecutar el proceso completo de finalización de actividad
                          this.executeActivityFinalization(this.activityId, false);
                        } else {
                          // Caso normal (no finalización) - sólo actualizar la UI
                          if (response.activity.energyOwners) {
                            this.energyOwners = response.activity.energyOwners;
                          }
                          
                          // Emitir evento para que otros componentes puedan actualizarse
                          this.updateRequired.emit();
                        }
                      } else {
                        // Si no hay datos completos en la respuesta, hacer una petición explícita
                        this.refreshActivityData();
                      }
                    },
                    error: (error) => {
                      console.error('Error al realizar la ruptura de bloqueo:', error);
                    }
                  });
                } else {
                  console.error('ServiceCall is undefined for type:', tipoUsuario);
                }
              } catch (error) {
                console.error('Error al procesar los datos de ruptura:', error);
              }
            }
          } else {
            console.log('Ruptura de bloqueo cancelada o no validada');
          }
        } catch (error) {
          console.error('Error al procesar el resultado del modal:', error);
        }
      });
    } catch (error) {
      console.error('Error al determinar el tipo de usuario:', error);
    }
  }

  /**
   * Determina el tipo de usuario basado en la estructura del objeto
   */
  private determinarTipoUsuario(usuario: any): 'trabajador' | 'supervisor' | 'duenoEnergia' {
    if (!usuario) return 'trabajador'; // Por defecto
    
    // Verificar si es un dueño de energía (tiene supervisors array)
    if (usuario.supervisors && Array.isArray(usuario.supervisors)) {
      return 'duenoEnergia';
    }
    
    // Verificar si es un supervisor (tiene workers array)
    if (usuario.workers && Array.isArray(usuario.workers)) {
      return 'supervisor';
    }
    
    // Por defecto asumimos que es un trabajador
    return 'trabajador';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.actionMenuOpen !== null && event.target instanceof Element && !event.target.closest('.relative')) {
      this.actionMenuOpen = null;
    }
  }

  isWorker(user: any): boolean {
    return user && user.role === 'worker';
  }

  // Helper method to debug activity details
  private debugActivity() {
    this.activityService.getActivity(this.activityId).subscribe({
      next: (activity) => {
        console.log('Activity details for debugging:', JSON.stringify({
          activityId: this.activityId,
          _id: activity._id,
          name: activity.name,
          energyOwnersCount: activity.energyOwners?.length || 0
        }, null, 2));
      },
      error: (error) => {
        console.error('Error fetching activity for debugging:', error);
      }
    });
  }
  
  // Testing method to directly test the endpoints
  testRupturaEndpoints(activityId: string) {
    console.log('Testing ruptura endpoints directly...');
    
    // Test supervisor rupture
    const supervisorData = {
      supervisorId: '67776cd9a8d6dbcd39258b2a', // Use a real ID from your screenshot
      reason: 'Test supervisor ruptura',
      selectedOption: 0,
      subOptions: [
        {text: 'Lugar 1', checked: true},
        {text: 'Lugar 2', checked: true}
      ],
      validationData: {
        user: {
          _id: '67776cd9a8d6dbcd39258b2a' // Validator ID (use a real user ID)
        }
      },
      detallesOpcion: 'Detalles de prueba'
    };
    
    console.log('Calling supervisor ruptura endpoint directly with:', supervisorData);
    this.activityService.desbloquearSupervisor(activityId, supervisorData)
      .subscribe({
        next: (response) => console.log('Supervisor ruptura success:', response),
        error: (error) => console.error('Supervisor ruptura error:', error)
      });
      
    // Test energy owner rupture
    const ownerData = {
      userId: '67776cd9a8d6dbcd39258b2a', // Use a real ID from your screenshot
      reason: 'Test energy owner ruptura',
      selectedOption: 0,
      subOptions: [
        {text: 'Lugar 1', checked: true},
        {text: 'Lugar 2', checked: true}
      ],
      validationData: {
        user: {
          _id: '67776cd9a8d6dbcd39258b2a' // Validator ID (use a real user ID)
        }
      },
      detallesOpcion: 'Detalles de prueba'
    };
    
    console.log('Calling energy owner ruptura endpoint directly with:', ownerData);
    this.activityService.desbloquearDuenoEnergia(activityId, ownerData)
      .subscribe({
        next: (response) => console.log('Energy owner ruptura success:', response),
        error: (error) => console.error('Energy owner ruptura error:', error)
      });
  }

  /**
   * Muestra un mensaje de éxito al usuario cuando se finaliza una actividad correctamente
   */
  showFinalizationSuccessMessage(): void {
    // Implementar con SweetAlert2 o el sistema de notificaciones que uses
    console.log('Mostrando mensaje de éxito de finalización');
    try {
      // Si tienes SweetAlert2 importado en tu componente
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          icon: 'success',
          title: 'Actividad finalizada',
          text: 'La actividad ha sido finalizada correctamente. El casillero ha sido liberado y los equipos han sido reseteados.',
          confirmButtonText: 'Entendido'
        });
      }).catch(() => {
        // Si no está disponible SweetAlert, usar un alert básico
        alert('Actividad finalizada correctamente. Casillero liberado y equipos reseteados.');
      });
    } catch (error) {
      console.error('Error al mostrar alerta de éxito:', error);
    }
  }

  /**
   * Muestra un mensaje de error al usuario cuando falla la finalización de una actividad
   */
  showFinalizationErrorMessage(message: string): void {
    // Implementar con SweetAlert2 o el sistema de notificaciones que uses
    console.log('Mostrando mensaje de error de finalización');
    try {
      // Si tienes SweetAlert2 importado en tu componente
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          icon: 'warning',
          title: 'Problema en finalización',
          text: message,
          confirmButtonText: 'Entendido'
        });
      }).catch(() => {
        // Si no está disponible SweetAlert, usar un alert básico
        alert(message);
      });
    } catch (error) {
      console.error('Error al mostrar alerta de error:', error);
    }
  }

  /**
   * Notifica a través del websocket que un casillero ha sido liberado
   * para actualizar la interfaz de otros clientes conectados
   * 
   * @param lockerId ID del casillero liberado
   */
  notifyLockerRelease(lockerId: string): void {
    try {
      if (this.socketService && lockerId) {
        console.log('Enviando notificación websocket de liberación de casillero:', lockerId);
        this.socketService.emit('locker-released', {
          lockerId: lockerId,
          releasedBy: 'usuario_app',
          timestamp: new Date().toISOString(),
          activityId: this.activityId
        });
      }
    } catch (error) {
      console.error('Error al enviar notificación de liberación de casillero:', error);
    }
  }
  
  /**
   * Finaliza la actividad actual, liberando casilleros y equipos
   * @param showConfirmation Si se debe mostrar diálogo de confirmación
   */
  executeActivityFinalization(activityId: string, showConfirmation: boolean = true): void {
    console.log('Intentando finalizar actividad', activityId);
    
    const proceedWithFinalization = !showConfirmation || confirm('¿Estás seguro de que deseas finalizar esta actividad?');
    
    if (proceedWithFinalization) {
      this.loading = true;
      this.activityService.finalizeActivity(activityId).subscribe({
        next: (response) => {
          console.log('Respuesta de finalización de actividad:', response);
          this.loading = false;
          
          if (response && response.success) {
            this.showFinalizationSuccessMessage();
            
            // Notificar a otros clientes si hay un casillero liberado
            if (response.lockerId) {
              this.notifyLockerRelease(response.lockerId);
            }
            
            // Si hay una función de refresco, llamarla
            if (this.refreshCallback) {
              this.refreshCallback();
            }
          } else {
            this.showFinalizationErrorMessage(response?.message || 'Error desconocido');
          }
          
          // Refrescar lista de usuarios después de finalizar (opcional)
          this.getUsers();
        },
        error: (err) => {
          console.error('Error al finalizar actividad:', err);
          this.loading = false;
          this.showFinalizationErrorMessage(err?.message || 'Error al comunicarse con el servidor');
        }
      });
    }
  }
  
  /**
   * Método público para finalizar actividad (usado en la interfaz)
   */
  finishActivity(): void {
    this.executeActivityFinalization(this.activityId, true);
  }

  /**
   * Refresca la lista de usuarios desde el backend
   */
  getUsers(): void {
    if (!this.activityId) return;
    
    this.refreshActivityData();
  }

  /**
   * Notifica a través del socket que la actividad ha cambiado
   * para que otros clientes actualicen su UI
   */
  notifyActivityChange() {
    try {
      if (this.socketService && this.activityId) {
        console.log('Notificando cambio en actividad vía socket:', this.activityId);
        this.socketService.emit('activity-updated', {
          activityId: this.activityId,
          timestamp: new Date().toISOString(),
          type: 'block-status-change'
        });
      }
    } catch (error) {
      console.error('Error al emitir notificación de cambio:', error);
    }
  }

  /**
   * Método público para forzar la actualización del componente
   * Puede ser llamado desde componentes padre
   */
  public forceRefresh() {
    console.log('Forzando actualización de activity-users');
    this.refreshActivityData();
  }
}