import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { User } from '../../interface/activity.interface';
import { UserModalComponent } from '../user-modal/user-modal.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ValidacionComponent } from '../../validacion/validacion.component';
import { ActivityService } from '../../services/actividades.service';
import { CommonModule } from '@angular/common';
import { RupturaComponent } from '../../ruptura/ruptura.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-activity-users',
  standalone: true,
  imports: [CommonModule, MatDialogModule, UserModalComponent, ValidacionComponent, RupturaComponent],
  providers: [ActivityService],
  templateUrl: './activity-users.component.html',
  styleUrls: ['./activity-users.component.scss']
})
export class ActivityUsersComponent {
  @Input() energyOwners: any[] = [];
  @Input() activityId!: string;
  selectedUser: User | null = null;
  @Output() updateRequired = new EventEmitter<void>();
  actionMenuOpen: string | null = null;

  constructor(private dialog: MatDialog, private activityService: ActivityService){}

  openUserModal(user: User, energyOwner: any) {
    const dialogRef = this.dialog.open(ValidacionComponent);
  
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.verificationStatus === 'verified') {
        const userModalRef = this.dialog.open(UserModalComponent, {
          data: {
            user: user,
            activityId: this.activityId,
            userLogin: result,
            energyOwner: energyOwner
          }
        });

        userModalRef.afterClosed().subscribe(success => {
          if (success) {
            this.activityService.getActivity(this.activityId).subscribe({
              next: (activity: any) => {
                this.updateRequired.emit();
              },
              error: (error: any) => {
                console.error('Error al recargar la actividad:', error);
              }
            });
          }
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
                      this.updateRequired.emit();
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
}