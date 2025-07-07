import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DashboardLayoutComponent } from '../../components/dashboard-layout/dashboard-layout.component';
import { EquiposService } from '../../../services/equipos.service';
import { LogsService } from '../../../services/logs.service';
import { Equipment } from '../../../actividades/interface/activity.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [CommonModule, DashboardLayoutComponent],
  templateUrl: './equipos.component.html',
  styleUrl: './equipos.component.scss'
})
export class EquiposComponent implements OnInit {
  equipments: Equipment[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private router: Router,
    private equiposService: EquiposService,
    private logsService: LogsService
  ) {}

  ngOnInit() {
    this.loadEquipments();
  }

  goBackToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  loadEquipments() {
    this.loading = true;
    this.error = null;

    this.equiposService.getEquipments().subscribe({
      next: (equipments) => {
        this.equipments = equipments;
        this.loading = false;
        
        // Log exitoso de carga de equipos
        this.logsService.logInfo('equipment_status_changed', 
          `Cargados ${equipments.length} equipos exitosamente`,
          { equipmentCount: equipments.length }
        ).subscribe();
      },
      error: (error) => {
        console.error('Error al cargar equipos:', error);
        this.error = 'No se pudieron cargar los equipos. Verifique la conexión con el servidor.';
        this.loading = false;
        
        // Log de error al cargar equipos
        this.logsService.logSystemError(error, 'Carga de equipos fallida');
      }
    });
  }

  editEquipment(equipment: Equipment) {
    Swal.fire({
      title: 'Editar Equipo',
      html: `
        <input id="name" class="swal2-input" placeholder="Nombre" value="${equipment.name}">
        <textarea id="description" class="swal2-input" placeholder="Descripción">${equipment.description}</textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const name = (document.getElementById('name') as HTMLInputElement).value;
        const description = (document.getElementById('description') as HTMLTextAreaElement).value;

        if (!name || !description) {
          Swal.showValidationMessage('Por favor, completa todos los campos');
          return;
        }

        return { name, description };
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        const originalName = equipment.name;
        const changes = result.value;
        
        this.equiposService.updateEquipment(equipment._id, changes).subscribe({
          next: (response) => {
            Swal.fire('Éxito', 'El equipo ha sido actualizado correctamente', 'success');
            this.loadEquipments();
            
            // Log de edición exitosa
            this.logsService.logInfo('equipment_status_changed', 
              `Equipo "${originalName}" actualizado a "${changes.name}"`,
              { 
                equipmentId: equipment._id,
                originalName: originalName,
                newName: changes.name,
                changes: changes
              }
            ).subscribe();
          },
          error: (error) => {
            console.error('Error al editar el equipo:', error);
            Swal.fire('Error', 'No se pudo editar el equipo', 'error');
            
            // Log de error al editar
            this.logsService.logError('equipment_status_changed', 
              `Error al editar equipo "${originalName}"`,
              { 
                equipmentId: equipment._id,
                error: error.message,
                attemptedChanges: changes
              }
            ).subscribe();
          }
        });
      }
    });
  }

  deleteEquipment(id: string) {
    const equipmentToDelete = this.equipments.find(eq => eq._id === id);
    const equipmentName = equipmentToDelete?.name || 'Equipo desconocido';
    
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.equiposService.deleteEquipment(id).subscribe({
          next: (response) => {
            Swal.fire('Eliminado', 'El equipo ha sido eliminado correctamente', 'success');
            this.loadEquipments();
            
            // Log de eliminación exitosa
            this.logsService.logWarning('equipment_unassigned', 
              `Equipo "${equipmentName}" eliminado del sistema`,
              { 
                equipmentId: id,
                equipmentName: equipmentName,
                deletedAt: new Date().toISOString()
              }
            ).subscribe();
          },
          error: (error) => {
            console.error('Error al eliminar el equipo:', error);
            Swal.fire('Error', 'No se pudo eliminar el equipo', 'error');
            
            // Log de error al eliminar
            this.logsService.logError('equipment_unassigned', 
              `Error al eliminar equipo "${equipmentName}"`,
              { 
                equipmentId: id,
                error: error.message
              }
            ).subscribe();
          }
        });
      }
    });
  }

  toggleLock(equipment: Equipment) {
    const action = equipment.locked ? 'desbloquear' : 'bloquear';
    const newStatus = !equipment.locked;
    
    Swal.fire({
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} equipo?`,
      text: `¿Estás seguro de que quieres ${action} el equipo "${equipment.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.equiposService.toggleLock(equipment._id).subscribe({
          next: (response) => {
            Swal.fire('Éxito', response.mensaje, 'success');
            this.loadEquipments();
            
            // Log de cambio de estado exitoso
            this.logsService.logInfo('equipment_status_changed', 
              `Estado del equipo "${equipment.name}" cambiado a ${newStatus ? 'BLOQUEADO' : 'DESBLOQUEADO'}`,
              { 
                equipmentId: equipment._id,
                equipmentName: equipment.name,
                previousState: equipment.locked ? 'BLOQUEADO' : 'DESBLOQUEADO',
                newState: newStatus ? 'BLOQUEADO' : 'DESBLOQUEADO',
                action: action
              }
            ).subscribe();
          },
          error: (error) => {
            console.error('Error al cambiar estado del equipo:', error);
            Swal.fire('Error', 'No se pudo cambiar el estado del equipo', 'error');
            
            // Log de error al cambiar estado
            this.logsService.logError('equipment_status_changed', 
              `Error al ${action} equipo "${equipment.name}"`,
              { 
                equipmentId: equipment._id,
                error: error.message,
                attemptedAction: action
              }
            ).subscribe();
          }
        });
      }
    });
  }

  getStatusClass(equipment: Equipment): string {
    if (equipment.locked) {
      return 'bg-red-100 text-red-800';
    }
    if (equipment.zeroEnergyValidated) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  getStatusText(equipment: Equipment): string {
    if (equipment.locked) {
      return 'Bloqueado';
    }
    if (equipment.zeroEnergyValidated) {
      return 'Validado';
    }
    return 'Disponible';
  }
}
