import { Component, OnInit } from '@angular/core';
import { ActividadesService } from '../../../services/actividades.service';
import { Activity } from '../../../actividades/interface/activity.interface';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [ 
    CommonModule,
     RouterModule
    ],
  templateUrl: './actividades.component.html',
  styleUrls: ['./actividades.component.scss']
})
export class ActividadesComponent implements OnInit {

  activities: any[] = [];
  totalActivities: number = 0;
  currentPage: number = 1;
  activitiesPerPage: number = 10;;

  constructor(private actividadesService: ActividadesService) {}

  ngOnInit(): void {
    this.getActivities();

  }

 eliminarActividad(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.actividadesService.deleteActivity(id).subscribe(
          response => {
            console.log(response);

            // Aviso de éxito
            Swal.fire({
              title: 'Actividad Eliminada',
              text: 'La actividad ha sido eliminada correctamente',
              icon: 'success'
            });

            // Refresca la lista de actividades
            this.getActivities();
          },
          error => {
            console.error('Error al eliminar la actividad:', error);
            Swal.fire('Error', 'No se pudo eliminar la actividad', 'error');
          }
        );
      }
    });
  }
  editarActividad(activity: Activity) {
    if (!activity._id) {
      Swal.fire('Error', 'No se pudo identificar la actividad a editar', 'error');
      return;
    }

    Swal.fire({
      title: 'Editar Actividad',
      html: `
        <input id="name" class="swal2-input" placeholder="Nombre" value="${activity.name}">
        <input id="description" class="swal2-input" placeholder="Descripción" value="${activity.description}">
      `,
      focusConfirm: true,
      showCancelButton: false,
      preConfirm: () => {
        const name = (document.getElementById('name') as HTMLInputElement).value;
        const description = (document.getElementById('description') as HTMLInputElement).value;

        if (!name || !description) {
          Swal.showValidationMessage('Por favor, completa todos los campos');
          return;
        }

        return { name, description };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const updatedActivity = { ...activity, ...result.value };

        //  Verificación previa de _id antes de llamar a updateActivity
        if (!activity._id) {
          Swal.fire('Error', 'No se pudo identificar la actividad a editar', 'error');
          return;
        }

        this.actividadesService.updateActivity(activity._id, updatedActivity).subscribe(
          (response) => {
            Swal.fire('Éxito', 'La actividad ha sido actualizada correctamente', 'success');
            this.getActivities();
          },
          (error) => {
            console.error('Error al actualizar la actividad:', error);
            Swal.fire('Error', 'No se pudo actualizar la actividad', 'error');
          }
        );
      }
    });
  }



  getActivities() {
    this.actividadesService.getActivities().subscribe(
      activities => {
        console.log(activities);
        this.activities = activities;
      },
      error => {
        console.error('Error al cargar actividades:', error);
        Swal.fire('Error', 'No se pudieron cargar las actividades', 'error');
      }
    );

  }
}
