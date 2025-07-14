import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';
import { EmpresasService } from '../../../../services/empresas.service';
import Swal from 'sweetalert2';

// Interfaz simplificada para empresa básica
interface EmpresaBasica {
  nombre: string;
  rut: string;
  razonSocial: string;
  email: string;
  telefono?: string;
}

@Component({
  selector: 'app-crear-empresa',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    DashboardLayoutComponent
  ],
  templateUrl: './crear-empresa.component.html',
  styleUrls: ['./crear-empresa.component.scss']
})
export class CrearEmpresaComponent implements OnInit {
  empresaForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private empresasService: EmpresasService,
    private router: Router
  ) {
    this.empresaForm = this.createForm();
  }

  ngOnInit() {
    this.setupFormValidation();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      rut: ['', [Validators.required, this.rutValidator]],
      razonSocial: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [this.telefonoValidator]]
    });
  }

  private setupFormValidation() {
    // Configurar validaciones adicionales si es necesario
    this.empresaForm.valueChanges.subscribe(value => {
      // Lógica de validación personalizada si es necesaria
    });
  }

  // Validador personalizado para RUT
  rutValidator = (control: any) => {
    const value = control.value;
    if (!value) return null;
    
    // Validación básica de formato RUT (12345678-9)
    const rutPattern = /^[0-9]+-[0-9kK]{1}$/;
    return rutPattern.test(value) ? null : { invalidRut: true };
  };

  // Validador personalizado para teléfono
  telefonoValidator = (control: any) => {
    const value = control.value;
    if (!value) return null; // El teléfono es opcional
    
    // Validación básica de formato de teléfono
    const phonePattern = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
    return phonePattern.test(value) ? null : { invalidPhone: true };
  };

  goBack() {
    this.router.navigate(['/dashboard/empresas/listar']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.empresaForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.empresaForm.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.empresaForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `Este campo es requerido`;
      }
      if (field.errors['email']) {
        return 'Formato de email inválido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors['invalidRut']) {
        return 'Formato de RUT inválido (ej: 12345678-9)';
      }
      if (field.errors['invalidPhone']) {
        return 'Formato de teléfono inválido';
      }
    }
    return '';
  }

  onSubmit() {
    if (this.empresaForm.valid) {
      this.isSubmitting = true;
      
      const empresaBasica: EmpresaBasica = {
        nombre: this.empresaForm.get('nombre')?.value,
        rut: this.empresaForm.get('rut')?.value,
        razonSocial: this.empresaForm.get('razonSocial')?.value,
        email: this.empresaForm.get('email')?.value,
        telefono: this.empresaForm.get('telefono')?.value || undefined
      };

      // Crear una empresa con valores por defecto para campos requeridos
      const empresaCompleta = {
        ...empresaBasica,
        sector: 'otro' as const, // Valor por defecto
        direccion: {
          calle: 'No especificada',
          numero: 'S/N',
          ciudad: 'No especificada',
          region: 'No especificada',
          codigoPostal: '0000000',
          pais: 'Chile'
        },
        contactoPrincipal: {
          nombre: 'No especificado',
          cargo: 'No especificado',
          email: empresaBasica.email,
          telefono: empresaBasica.telefono || '000000000'
        },
        telefono: empresaBasica.telefono || '000000000'
      };

      this.empresasService.createEmpresa(empresaCompleta).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          
          Swal.fire({
            icon: 'success',
            title: '¡Empresa creada exitosamente!',
            text: `La empresa "${empresaBasica.nombre}" ha sido registrada en el sistema.`,
            showConfirmButton: false,
            timer: 2000
          }).then(() => {
            this.resetForm();
            this.router.navigate(['/dashboard/empresas/listar']);
          });
        },
        error: (error) => {
          this.isSubmitting = false;
          
          Swal.fire({
            icon: 'error',
            title: 'Error al crear la empresa',
            text: error.error?.message || 'Ocurrió un error inesperado. Intente nuevamente.',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.markAllFieldsAsTouched();
      
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor complete todos los campos requeridos correctamente.',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.empresaForm.controls).forEach(key => {
      this.empresaForm.get(key)?.markAsTouched();
    });
  }

  private resetForm() {
    this.empresaForm.reset();
    this.isSubmitting = false;
  }
} 