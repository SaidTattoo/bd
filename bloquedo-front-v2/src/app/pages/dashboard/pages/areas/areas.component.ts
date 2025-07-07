import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AreasService } from '../../../services/areas.service';
import { DashboardLayoutComponent } from '../../components/dashboard-layout/dashboard-layout.component';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DashboardLayoutComponent,
  ],
  templateUrl: './areas.component.html',
  styleUrl: './areas.component.scss'
})
export class AreasComponent implements OnInit{

  constructor(
    private areasService: AreasService,
    private router: Router
  ) { }

  areas: any[] = [
    {
      id: 1,
      nombre: 'Área de Producción',
      descripcion: 'Área principal de producción y ensamblaje de productos',
      estado: 'activo',
      ultimaModificacion: new Date('2024-02-15T10:30:00')
    },
    {
      id: 2,
      nombre: 'Almacén Central',
      descripcion: 'Almacenamiento principal de materias primas y productos terminados',
      estado: 'activo',
      ultimaModificacion: new Date('2024-02-14T15:45:00')
    },
    {
      id: 3,
      nombre: 'Zona de Despacho',
      descripcion: 'Área designada para la preparación y despacho de pedidos',
      estado: 'inactivo',
      ultimaModificacion: new Date('2024-02-13T09:20:00')
    }
  ];
  editarArea(area: any): void {
    Swal.fire({
      title: 'Editar Área',
      html: `
        <input id="nombre" class="swal2-input" placeholder="Nombre" value="${area.name}">
        <textarea id="descripcion" class="swal2-input" placeholder="Descripción">${area.description}</textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre = (document.getElementById('nombre') as HTMLInputElement).value;
        const descripcion = (document.getElementById('descripcion') as HTMLTextAreaElement).value;

        if (!nombre || !descripcion) {
          Swal.showValidationMessage('Por favor, completa todos los campos');
          return;
        }

        return { name: nombre, description: descripcion };
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        const updatedArea = { ...area, ...result.value };

        this.areasService.editArea(area._id, updatedArea).subscribe(
          response => {
            Swal.fire('Éxito', 'El área ha sido actualizada correctamente', 'success');
            this.loadAreas(); // Refresca la lista de áreas
          },
          error => {
            console.error('Error al editar el área:', error);
            Swal.fire('Error', 'No se pudo editar el área', 'error');
          }
        );
      }
    });
  }

  eliminarArea(id: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.areasService.deleteArea(id).subscribe(
          () => {
            Swal.fire({
              title: 'Área Eliminada',
              text: 'El área ha sido eliminada correctamente',
              icon: 'success',
            });

            // Refrescar la lista de áreas
            this.loadAreas();
          },
          (error) => {
            console.error('Error al eliminar el área:', error);
            Swal.fire('Error', 'No se pudo eliminar el área', 'error');
          }
        );
      }
    });
  }


  ngOnInit(): void {
    this.loadAreas();
  }

  goBackToDashboard() {
    this.router.navigate(['/dashboard']);
  }
  loadAreas(): void {
    this.areasService.getAreas().subscribe(
      (areas) => {
        this.areas = areas;
      },
      (error) => {
        console.error('Error al cargar áreas:', error);
        Swal.fire('Error', 'No se pudieron cargar las áreas', 'error');
      }
    );
  }

}
