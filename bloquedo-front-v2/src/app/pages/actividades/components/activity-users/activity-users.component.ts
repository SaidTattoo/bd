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
    // Determinar el tipo de usuario
    const tipoUsuario = this.determinarTipoUsuario(usuario);
    console.log('Tipo de usuario para ruptura:', tipoUsuario, usuario);
    
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
      // Si el usuario confirmó la ruptura y hay datos de validación
      if (result && result.confirmed && result.validationData) {
        console.log('Ruptura de bloqueo confirmada para usuario:', usuario);
        console.log('Tipo de usuario:', tipoUsuario);
        console.log('Razón:', result.reason);
        console.log('Datos de validación:', result.validationData);
        
        // Implementación real de la ruptura de bloqueo
        if (usuario &&  usuario._id) {
          // Datos comunes para todos los tipos
          const requestData = {
            reason: result.reason,
            validationData: result.validationData,
            selectedOption: result.selectedOption,
            subOptions: result.subOptions
          };
          
          let serviceCall: Observable<any>;
          
          // Llamar al servicio correspondiente según el tipo de usuario
          switch (tipoUsuario) {
            case 'trabajador':
              serviceCall = this.activityService.desbloquearTrabajador(this.activityId, {
                ...requestData,
                trabajadorId: usuario._id
              });
              break;
              
            case 'supervisor':
              serviceCall = this.activityService.desbloquearSupervisor(this.activityId, {
                ...requestData,
                supervisorId: usuario._id
              });
              break;
              
            case 'duenoEnergia':
              serviceCall = this.activityService.desbloquearDuenoEnergia(this.activityId, {
                ...requestData,
                userId: usuario._id
              });
              break;
              
            default:
              console.error('Tipo de usuario no reconocido:', tipoUsuario);
              return;
          }
          
          // Ejecutar la llamada al servicio
          serviceCall.subscribe({
            next: (response) => {
              console.log('Ruptura completada exitosamente', response);
              // Notificar que se requiere actualización
              this.updateRequired.emit();
            },
            error: (error) => {
              console.error('Error al realizar ruptura:', error);
              // Manejar el error
            }
          });
        }
      } else {
        console.log('Ruptura de bloqueo cancelada o no validada');
      }
    });
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
}