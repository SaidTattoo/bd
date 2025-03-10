import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActividadesService } from '../../../../services/actividades.service';
import { TecladoComponent } from '../../../../teclado/teclado.component';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crear-actividad',
  standalone: true,
  imports: [ ReactiveFormsModule, FormsModule, RouterLink, TecladoComponent ,TecladoComponent ],
  templateUrl: './crear-actividad.component.html',
  styleUrl: './crear-actividad.component.scss'
})
export class CrearActividadComponent {
  activityForm: FormGroup;

  constructor(
    private fb: FormBuilder, 
    private actividadesService: ActividadesService,
    private router: Router
  ) {
    this.activityForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      createdAt: [new Date().toISOString().slice(0, 16)],
      blockType: ['', Validators.required],
      energyOwners: [[]],
      equipments: [[]]
    });
  }

  onSubmit() {
    if (this.activityForm.valid) {
      Swal.fire({
        title: 'Creando actividad',
        text: 'Por favor espere...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.actividadesService.createActivity(this.activityForm.value).subscribe({
        next: (response) => {
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: '¡Actividad creada!',
            text: 'La actividad ha sido creada exitosamente',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.router.navigate(['']);
          });
        },
        error: (error) => {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error?.error?.mensaje || 'Error al crear la actividad',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    } else {
      Object.keys(this.activityForm.controls).forEach(key => {
        const control = this.activityForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor complete todos los campos requeridos',
        confirmButtonText: 'Aceptar'
      });
    }
  }
}