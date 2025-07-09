import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ActividadesService } from '../../../services/actividades.service';
import { TecladoComponent } from '../../../teclado/teclado.component';
import Swal from 'sweetalert2';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-create-activity-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    TecladoComponent,
    DatePipe
  ],
  templateUrl: './create-activity-modal.component.html',
  styleUrls: ['./create-activity-modal.component.scss']
})
export class CreateActivityModalComponent implements OnInit {
  activityForm: FormGroup;
  isSubmitting = false;
  currentDateTime: Date = new Date();

  constructor(
    private fb: FormBuilder,
    private actividadesService: ActividadesService,
    public dialogRef: MatDialogRef<CreateActivityModalComponent>
  ) {
    this.activityForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      createdAt: [''], // Se configurará en ngOnInit con la fecha local correcta
      blockType: ['', Validators.required],
      energyOwners: [[]],
      equipments: [[]]
    });
  }

  ngOnInit() {
    // Configurar la fecha actual en hora local
    const now = new Date();
    this.currentDateTime = now;
    
    // Para el formulario, usar la fecha local en formato datetime-local
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    this.activityForm.patchValue({
      createdAt: localDateTime
    });
  }

  onSubmit() {
    if (this.activityForm.valid) {
      this.isSubmitting = true;
      
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
            confirmButtonText: 'Continuar con la actividad'
          }).then(() => {
            // Cerrar el modal y devolver la actividad creada
            this.dialogRef.close(response);
          });
        },
        error: (error) => {
          Swal.close();
          this.isSubmitting = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error?.error?.mensaje || 'Error al crear la actividad',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    } else {
      this.markFormGroupTouched();
      
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor complete todos los campos requeridos',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.activityForm.controls).forEach(key => {
      const control = this.activityForm.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  // Validación de campos
  isFieldInvalid(fieldName: string): boolean {
    const field = this.activityForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.activityForm.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.activityForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }
} 