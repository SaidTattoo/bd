import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';
import { EmpresasService } from '../../../../services/empresas.service';
import { 
  CreateEmpresaRequest, 
  SECTORES_EMPRESA, 
  EmpresaSector,
  Contacto,
  Direccion
} from '../empresa.interface';
import Swal from 'sweetalert2';

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
  sectores = SECTORES_EMPRESA;
  isSubmitting = false;
  showAdvancedFields = false;

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
      // Información básica
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      rut: ['', [Validators.required, this.rutValidator]],
      razonSocial: ['', [Validators.required, Validators.maxLength(200)]],
      sector: ['', [Validators.required]],
      descripcion: ['', [Validators.maxLength(1000)]],
      
      // Dirección
      direccion: this.fb.group({
        calle: ['', [Validators.required, Validators.maxLength(200)]],
        numero: ['', [Validators.required, Validators.maxLength(20)]],
        ciudad: ['', [Validators.required, Validators.maxLength(100)]],
        region: ['', [Validators.required, Validators.maxLength(100)]],
        codigoPostal: ['', [Validators.required, Validators.maxLength(20)]],
        pais: ['Chile', [Validators.required, Validators.maxLength(100)]]
      }),
      
      // Contacto principal
      contactoPrincipal: this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
        cargo: ['', [Validators.required, Validators.maxLength(100)]],
        email: ['', [Validators.required, Validators.email]],
        telefono: ['', [Validators.required, this.telefonoValidator]]
      }),
      
      // Contacto empresarial
      telefono: ['', [Validators.required, this.telefonoValidator]],
      email: ['', [Validators.required, Validators.email]],
      sitioWeb: ['', [this.urlValidator]],
      
      // Información adicional
      fechaFundacion: [''],
      numeroEmpleados: ['', [Validators.min(0), Validators.max(1000000)]],
      logo: ['', [this.urlValidator]],
      observaciones: ['', [Validators.maxLength(2000)]],
      
      // Certificaciones
      certificaciones: this.fb.array([]),
      
      // Contactos adicionales
      contactosAdicionales: this.fb.array([])
    });
  }

  private setupFormValidation() {
    // Validación en tiempo real del RUT
    this.empresaForm.get('rut')?.valueChanges.subscribe(rut => {
      if (rut) {
        const rutControl = this.empresaForm.get('rut');
        if (rutControl && this.empresasService.validateRut(rut)) {
          rutControl.setErrors(null);
        } else {
          rutControl?.setErrors({ invalidRut: true });
        }
      }
    });

    // Formateo automático del RUT
    this.empresaForm.get('rut')?.valueChanges.subscribe(rut => {
      if (rut && rut.length > 1) {
        const formatted = this.empresasService.formatRut(rut);
        if (formatted !== rut) {
          this.empresaForm.patchValue({ rut: formatted }, { emitEvent: false });
        }
      }
    });
  }

  // Validadores personalizados
  rutValidator = (control: any) => {
    const rut = control.value;
    if (!rut) return null;
    return this.empresasService.validateRut(rut) ? null : { invalidRut: true };
  };

  telefonoValidator = (control: any) => {
    const telefono = control.value;
    if (!telefono) return null;
    const telefonoRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return telefonoRegex.test(telefono) ? null : { invalidTelefono: true };
  };

  urlValidator = (control: any) => {
    const url = control.value;
    if (!url) return null;
    const urlRegex = /^https?:\/\/.+/;
    return urlRegex.test(url) ? null : { invalidUrl: true };
  };

  // Manejo de certificaciones
  get certificaciones(): FormArray {
    return this.empresaForm.get('certificaciones') as FormArray;
  }

  addCertificacion() {
    const control = this.fb.control('', [Validators.required]);
    this.certificaciones.push(control);
  }

  removeCertificacion(index: number) {
    this.certificaciones.removeAt(index);
  }

  // Manejo de contactos adicionales
  get contactosAdicionales(): FormArray {
    return this.empresaForm.get('contactosAdicionales') as FormArray;
  }

  addContacto() {
    const contactoGroup = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      cargo: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, this.telefonoValidator]]
    });
    this.contactosAdicionales.push(contactoGroup);
  }

  removeContacto(index: number) {
    this.contactosAdicionales.removeAt(index);
  }

  // Navegación
  goBack() {
    this.router.navigate(['/dashboard/empresas/listar']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  // Validación del formulario
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
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['email']) return 'Email inválido';
      if (field.errors['invalidRut']) return 'RUT inválido';
      if (field.errors['invalidTelefono']) return 'Teléfono inválido';
      if (field.errors['invalidUrl']) return 'URL inválida';
      if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;
    }
    return '';
  }

  // Envío del formulario
  onSubmit() {
    if (this.empresaForm.valid) {
      this.isSubmitting = true;
      
      const formData = this.empresaForm.value;
      const empresaData: CreateEmpresaRequest = {
        ...formData,
        fechaFundacion: formData.fechaFundacion || undefined,
        numeroEmpleados: formData.numeroEmpleados || undefined,
        sitioWeb: formData.sitioWeb || undefined,
        logo: formData.logo || undefined,
        observaciones: formData.observaciones || undefined,
        certificaciones: formData.certificaciones.length > 0 ? formData.certificaciones : undefined,
        contactosAdicionales: formData.contactosAdicionales.length > 0 ? formData.contactosAdicionales : undefined
      };

      this.empresasService.createEmpresa(empresaData).subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Empresa Creada',
            text: 'La empresa ha sido creada exitosamente',
            confirmButtonText: 'Ir a Lista',
            showCancelButton: true,
            cancelButtonText: 'Crear Otra'
          }).then((result) => {
            if (result.isConfirmed) {
              this.router.navigate(['/dashboard/empresas/listar']);
            } else {
              this.resetForm();
            }
          });
        },
        error: (error) => {
          console.error('Error al crear empresa:', error);
          let errorMessage = 'No se pudo crear la empresa';
          
          if (error.error?.mensaje) {
            errorMessage = error.error.mensaje;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage,
            confirmButtonText: 'Entendido'
          });
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.markAllFieldsAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario Incompleto',
        text: 'Por favor, complete todos los campos requeridos',
        confirmButtonText: 'Entendido'
      });
    }
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.empresaForm.controls).forEach(key => {
      const control = this.empresaForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(subKey => {
          control.get(subKey)?.markAsTouched();
        });
      }

      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          arrayControl.markAsTouched();
          if (arrayControl instanceof FormGroup) {
            Object.keys(arrayControl.controls).forEach(subKey => {
              arrayControl.get(subKey)?.markAsTouched();
            });
          }
        });
      }
    });
  }

  private resetForm() {
    this.empresaForm.reset({
      direccion: { pais: 'Chile' }
    });
    this.certificaciones.clear();
    this.contactosAdicionales.clear();
    this.showAdvancedFields = false;
  }

  // Utilidades
  getSectorLabel(sector: EmpresaSector): string {
    return this.empresasService.getSectorLabel(sector);
  }

  toggleAdvancedFields() {
    this.showAdvancedFields = !this.showAdvancedFields;
  }
} 