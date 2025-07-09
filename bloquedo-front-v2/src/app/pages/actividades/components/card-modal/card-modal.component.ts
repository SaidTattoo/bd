import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RupturaComponent } from '../../ruptura/ruptura.component';
import { ActivityService } from '../../services/actividades.service';

@Component({
  selector: 'app-card-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, RupturaComponent],
  templateUrl: './card-modal.component.html',
  styleUrls: ['./card-modal.component.scss']
})
export class CardModalComponent {
  constructor(
    public dialogRef: MatDialogRef<CardModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private activityService: ActivityService
  ) {}

  closeModal() {
    this.dialogRef.close();
  }

  openRupturaModal() {
    console.log('Abriendo modal de ruptura para usuario:', this.data);
    
    // Abrir el modal de confirmación de ruptura
    const dialogRef = this.dialog.open(RupturaComponent, {
      width: '800px',
      data: {
        user: this.data.originalUser?.user || this.data.originalUser || this.data,
        tipoUsuario: this.data.tipo,
        worker: this.data.originalUser || this.data
      }
    });
    
    // Suscribirse al resultado del modal
    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Modal de ruptura result:', result);
      
      // Si el usuario confirmó la ruptura y hay datos de validación
      if (result && result.confirmed && result.validationData) {
        console.log('Ruptura de bloqueo confirmada para usuario:', this.data);
        console.log('Tipo de usuario:', this.data.tipo);
        console.log('Razón:', result.reason);
        console.log('Datos de validación:', result.validationData);
        
        // Preparar datos para el servicio
        const requestData = {
          reason: result.reason,
          validationData: result.validationData,
          selectedOption: result.selectedOption,
          subOptions: result.subOptions,
          detallesOpcion: result.selectedOption !== 2 ? result.mainOptions?.[result.selectedOption]?.detail : ''
        };
        
        console.log('REQUEST DATA COMPLETO:', JSON.stringify(requestData, null, 2));
        
        // Llamar al servicio correspondiente según el tipo de usuario
        this.executeRuptura(requestData);
      }
    });
  }

  private executeRuptura(requestData: any) {
    const activityId = this.data.activityId;
    const userType = this.data.tipo;
    
    if (!activityId) {
      console.error('No se encontró el ID de la actividad');
      return;
    }

    let serviceCall;
    
    switch (userType) {
      case 'trabajador':
        serviceCall = this.activityService.desbloquearTrabajador(activityId, {
          ...requestData,
          trabajadorId: this.data.id
        });
        break;
        
      case 'supervisor':
        serviceCall = this.activityService.desbloquearSupervisor(activityId, {
          ...requestData,
          supervisorId: this.data.id
        });
        break;
        
      case 'duenoEnergia':
        serviceCall = this.activityService.desbloquearDuenoEnergia(activityId, {
          ...requestData,
          userId: this.data.id
        });
        break;
        
      default:
        console.error('Tipo de usuario no reconocido:', userType);
        return;
    }

    // Ejecutar la llamada al servicio
    serviceCall.subscribe({
      next: (response) => {
        console.log('Ruptura exitosa:', response);
        // Cerrar el modal y notificar el éxito
        this.dialogRef.close({ rupturaExitosa: true, response });
      },
      error: (error) => {
        console.error('Error en la ruptura:', error);
        // Mostrar mensaje de error
        alert('Error al procesar la ruptura: ' + (error.error?.message || error.message));
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase();
  }

  formatPhoneNumber(phone: string): string {
    if (!phone) return 'No disponible';
    // Formato chileno: +56 9 1234 5678
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 8) {
      return `+56 ${cleaned.slice(-8, -4)} ${cleaned.slice(-4)}`;
    }
    return phone;
  }

  formatRut(rut: string): string {
    if (!rut) return 'No disponible';
    // Formato chileno: 12.345.678-9
    const cleaned = rut.replace(/\D/g, '');
    if (cleaned.length >= 8) {
      const body = cleaned.slice(0, -1);
      const digit = cleaned.slice(-1);
      return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${digit}`;
    }
    return rut;
  }

  getTipoLabel(tipo: string): string {
    switch (tipo) {
      case 'trabajador': return 'Trabajador';
      case 'supervisor': return 'Supervisor';
      case 'duenoEnergia': return 'Dueño de Energía';
      default: return 'Usuario';
    }
  }

  getTipoColor(tipo: string): string {
    switch (tipo) {
      case 'trabajador': return 'bg-blue-100 text-blue-800';
      case 'supervisor': return 'bg-green-100 text-green-800';
      case 'duenoEnergia': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
} 