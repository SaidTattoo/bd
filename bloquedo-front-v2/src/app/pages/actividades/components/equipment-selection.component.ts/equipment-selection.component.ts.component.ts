import { Component, OnInit } from '@angular/core';
import { Equipment } from '../../interface/activity.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityService } from '../../services/actividades.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipmentFormComponent } from '../equipment-form/equipment-form.component';
import { EquiposService } from '../../../services/equipos.service';
import { WebsocketService } from '../../../services/websocket.service';

@Component({
  selector: 'app-equipment-selection.component.ts',
  standalone: true,
  imports: [CommonModule, FormsModule, EquipmentFormComponent],
  templateUrl: './equipment-selection.component.ts.component.html',
  styleUrl: './equipment-selection.component.ts.component.scss'
})
export class EquipmentSelectionComponent implements OnInit {
  availableEquipments: Equipment[] = [];
  
  selectedEquipments: Equipment[] = [];
  availableSearch = '';
  selectedSearch = '';
  activityId: string = '';
  clientesConectados: any[] = [];

  equiposEnUso: { [key: string]: { totem: string, actividad: string, actividadNombre: string } } = {};

  showCreateEquipmentModal = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private activityService: ActivityService,
    private equiposService: EquiposService,
    public wsService: WebsocketService
  ) {}

  ngOnInit() {
    // Suscripción a los tótems conectados
    this.wsService.clientesConectados$.subscribe(clientes => {
      this.clientesConectados = clientes;
      console.log('📱 Tótems conectados:', this.clientesConectados);
    });

    this.wsService.equiposOcupados$.subscribe(equipos => {
      this.equiposEnUso = equipos;
      console.log('📥 Equipos en uso actualizados:', this.equiposEnUso);
      
      this.updateEquipmentStatus();
    });

    this.equiposService.getEquipments().subscribe(equipments => {
      this.availableEquipments = equipments;
      this.updateEquipmentStatus();
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id') ?? '';
      this.activityId = id;
      this.activityService.getActivity(id).subscribe(activity => {
        this.selectedEquipments = activity.equipments || [];
        this.availableEquipments = this.availableEquipments.filter(
          available => !this.selectedEquipments.some(selected => selected._id === available._id)
        );
        this.updateEquipmentStatus();
      });
    });
  }

  private updateEquipmentStatus() {
    this.availableEquipments = this.availableEquipments.map(equipment => ({
      ...equipment,
      inUseCount: this.getEquipmentUseCount(equipment._id),
      inUseBy: this.equiposEnUso[equipment._id]
    }));
  }

  get filteredAvailableEquipments(): Equipment[] {
    return this.availableEquipments.filter(equipment =>
      equipment.name && equipment.name.includes(this.availableSearch)
    );
  }

  get filteredSelectedEquipments(): Equipment[] {
    return this.selectedEquipments.filter(equipment =>
      equipment.name && equipment.name.includes(this.selectedSearch)
    );
  }

  selectEquipment(equipment: Equipment) {
    const equipoEnUso = this.equiposEnUso[equipment._id];
    
    // Si el equipo está en uso por otro tótem, mostramos una advertencia
    if (equipoEnUso && equipoEnUso.totem !== this.wsService.miTotemId) {
      console.log(`⚠️ Advertencia: Equipo en uso en actividad: ${equipoEnUso.actividadNombre}`);
    }
    
    if (this.selectedEquipments.some(e => e._id === equipment._id)) {
      console.log('⚠️ Este equipo ya está seleccionado en la actividad');
      return;
    }

    this.activityService.getActivity(this.activityId).subscribe(activity => {
      this.equiposService.addEquipmentToActivity(this.activityId, equipment).subscribe({
        next: (res) => {
          // Si el equipo ya está en uso por otro tótem, mantenemos su ID de actividad
          if (equipoEnUso && equipoEnUso.totem !== this.wsService.miTotemId) {
            this.wsService.ocuparEquipo(equipment._id, equipoEnUso.actividad, activity.name);
          } else {
            this.wsService.ocuparEquipo(equipment._id, this.activityId, activity.name);
          }
          
          this.availableEquipments = this.availableEquipments.filter(e => e._id !== equipment._id);
          this.selectedEquipments.push(equipment);
        },
        error: (error) => {
          if (error.error?.mensaje === "El equipo ya existe en la actividad") {
            console.log('⚠️ Error:', error.error.mensaje);
          }
        }
      });
    });
  }

  unselectEquipment(equipment: Equipment) {
    this.equiposService.removeEquipmentFromActivity(this.activityId, equipment).subscribe({
      next: (res) => {
        this.wsService.liberarEquipo(equipment._id, this.activityId);
        
        this.selectedEquipments = this.selectedEquipments.filter(e => e._id !== equipment._id);
        this.availableEquipments.push(equipment);
      },
      error: (error) => {
        console.log('⚠️ Error al remover equipo:', error);
      }
    });
  }

  handleNewEquipment(equipment: Equipment) {
    const newEquipment = {
      ...equipment,
      _id: (Math.max(...this.availableEquipments.map(e => Number(e._id))) + 1).toString(),
      status: 'active'
    };
    this.availableEquipments.push(newEquipment);
    this.showCreateEquipmentModal = false;
  }

  saveChanges() {
    this.activityService.getActivity(this.activityId).subscribe(activity => {
      const updatedActivity = {
        ...activity,
        equipments: this.selectedEquipments
      };this.router.navigate(['/detail', this.activityId]);
    /*   this.activityService.updateActivity(updatedActivity).subscribe(() => {
        this.router.navigate(['/detail', this.activityId]);
      }); */
    });
  }

  goBack() {
    this.router.navigate(['/detail', this.activityId]);
  }

  getEquipmentUseCount(equipmentId: string): number {
    return this.equiposEnUso[equipmentId] ? 1 : 0;
  }

  getEquipmentActivities(equipmentId: string): Array<{ totem: string, actividad: string }> {
    const uso = this.equiposEnUso[equipmentId];
    return uso ? [uso] : [];
  }
}