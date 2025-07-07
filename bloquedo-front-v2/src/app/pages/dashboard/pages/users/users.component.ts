import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { UsersService } from '../../../services/users.service';
import { LogsService } from '../../../services/logs.service';
import { DashboardLayoutComponent } from '../../components/dashboard-layout/dashboard-layout.component';
import Swal from 'sweetalert2';

interface Fingerprint {
  position: 'rightThumb' | 'rightIndex' | 'rightMiddle' | 'rightRing' | 'rightPinky' |
           'leftThumb' | 'leftIndex' | 'leftMiddle' | 'leftRing' | 'leftPinky';
  template: string;
  quality: number;
  capturedAt: Date;
}

interface UserRegistration {
  nombre: string;
  email: string;
  telefono: string;
  rut: string;
  empresa: string;
  disciplina: string;
  perfil: 'trabajador' | 'supervisor' | 'duenoDeEnergia' | 'admin';
  fingerprints: Fingerprint[];
  fingerprintsComplete: boolean;
  isActive: boolean;
}
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DashboardLayoutComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent {
  userForm: FormGroup;
  rightHandPositions: Fingerprint['position'][] = [
    'rightThumb', 'rightIndex', 'rightMiddle', 'rightRing', 'rightPinky'
  ];
  leftHandPositions: Fingerprint['position'][] = [
    'leftThumb', 'leftIndex', 'leftMiddle', 'leftRing', 'leftPinky'
  ];

  constructor(
    private fb: FormBuilder,  
    @Inject(UsersService) private usersService: UsersService,
    private logsService: LogsService
  ) {
    this.userForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      rut: ['', [Validators.required]],
      empresa: ['', Validators.required],
      disciplina: ['', Validators.required],
      perfil: ['trabajador', Validators.required],
      fingerprints: [[]],
      fingerprintsComplete: [false],
      isActive: [true],
      password: ['', Validators.required]
    });
  }

  getPositionLabel(position: string): string {
    const labels = {
      rightThumb: 'Pulgar',
      rightIndex: 'Índice',
      rightMiddle: 'Medio',
      rightRing: 'Anular',
      rightPinky: 'Meñique',
      leftThumb: 'Pulgar',
      leftIndex: 'Índice',
      leftMiddle: 'Medio',
      leftRing: 'Anular',
      leftPinky: 'Meñique'
    };
    return labels[position as keyof typeof labels];
  }

  hasFingerprint(position: string): boolean {
    const fingerprints: Fingerprint[] = this.userForm.get('fingerprints')?.value || [];
    return fingerprints.some(f => f.position === position);
  }

  captureFingerprint(position: string) {
    const userName = this.userForm.get('nombre')?.value || 'Usuario sin nombre';
    
    // Log del intento de captura de huella
    this.logsService.logInfo('user_updated', 
      `Iniciando captura de huella dactilar para usuario "${userName}" en posición ${this.getPositionLabel(position)}`,
      { 
        userName: userName,
        position: position,
        positionLabel: this.getPositionLabel(position)
      }
    ).subscribe();

    this.usersService.captureFingerprint().subscribe({
      next: (response: any) => {
        console.log(response.TemplateBase64);
        
        const fingerprints: Fingerprint[] = [...(this.userForm.get('fingerprints')?.value || [])];
        const existingIndex = fingerprints.findIndex(f => f.position === position);
        
        const newFingerprint: Fingerprint = {
          position: position as Fingerprint['position'],
          template: response.TemplateBase64 || 'base64EncodedTemplate',
          quality: Math.floor(Math.random() * 30) + 70,
          capturedAt: new Date()
        };

        if (existingIndex >= 0) {
          fingerprints[existingIndex] = newFingerprint;
        } else {
          fingerprints.push(newFingerprint);
        }

        this.userForm.patchValue({ fingerprints });
        
        // Log de captura exitosa
        this.logsService.logInfo('user_updated', 
          `Huella dactilar capturada exitosamente para usuario "${userName}" en posición ${this.getPositionLabel(position)}`,
          { 
            userName: userName,
            position: position,
            positionLabel: this.getPositionLabel(position),
            quality: newFingerprint.quality,
            totalFingerprints: fingerprints.length
          }
        ).subscribe();
        
        // Mostrar mensaje de éxito
        Swal.fire({
          icon: 'success',
          title: 'Huella Capturada',
          text: `Huella dactilar del ${this.getPositionLabel(position)} capturada exitosamente`,
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al capturar huella:', error);
        
        // Log de error en captura
        this.logsService.logError('user_updated', 
          `Error al capturar huella dactilar para usuario "${userName}" en posición ${this.getPositionLabel(position)}`,
          { 
            userName: userName,
            position: position,
            error: error.message
          }
        ).subscribe();
        
        // Mostrar mensaje de error
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo capturar la huella dactilar. Inténtalo de nuevo.',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  rutValidator(control: AbstractControl): ValidationErrors | null {
    const rut = control.value;
    // Implementa aquí la lógica de validación del RUT
    const rutRegex = /^[0-9]+-[0-9kK]{1}$/; // Ejemplo de expresión regular para RUT
    return rutRegex.test(rut) ? null : { invalidRut: true };
  }

  onSubmit() {
    if (this.userForm.valid) {
      const userData: UserRegistration = this.userForm.value;
      console.log('Usuario registrado:', userData);
      
      // Log del intento de creación de usuario
      this.logsService.logInfo('user_created', 
        `Iniciando creación de usuario "${userData.nombre}" con perfil ${userData.perfil}`,
        { 
          userName: userData.nombre,
          email: userData.email,
          rut: userData.rut,
          empresa: userData.empresa,
          perfil: userData.perfil,
          fingerprintsCount: userData.fingerprints.length
        }
      ).subscribe();
      
      this.usersService.createUser(userData).subscribe({
        next: (response) => {
          console.log('Usuario creado:', response);
          
          // Log de creación exitosa
          this.logsService.logInfo('user_created', 
            `Usuario "${userData.nombre}" creado exitosamente con ID: ${response.id || 'N/A'}`,
            { 
              userId: response.id,
              userName: userData.nombre,
              email: userData.email,
              rut: userData.rut,
              empresa: userData.empresa,
              perfil: userData.perfil,
              fingerprintsCount: userData.fingerprints.length,
              isActive: userData.isActive
            }
          ).subscribe();
          
          // Mostrar mensaje de éxito
          Swal.fire({
            icon: 'success',
            title: '¡Usuario Creado!',
            text: `El usuario "${userData.nombre}" ha sido creado exitosamente`,
            timer: 3000,
            showConfirmButton: false
          });
          
          // Limpiar formulario
          this.userForm.reset({
            nombre: '',
            email: '',
            telefono: '',
            rut: '',
            empresa: '',
            disciplina: '',
            perfil: 'trabajador',
            fingerprints: [],
            fingerprintsComplete: false,
            isActive: true,
            password: ''
          });
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          
          // Log de error en creación
          this.logsService.logError('user_created', 
            `Error al crear usuario "${userData.nombre}": ${error.message}`,
            { 
              userName: userData.nombre,
              email: userData.email,
              rut: userData.rut,
              error: error.message,
              errorCode: error.status
            }
          ).subscribe();
          
          // Mostrar mensaje de error
          Swal.fire({
            icon: 'error',
            title: 'Error al Crear Usuario',
            text: error.error?.message || 'No se pudo crear el usuario. Inténtalo de nuevo.',
            confirmButtonText: 'Entendido'
          });
        }
      });
    } else {
      // Log de validación fallida
      const invalidFields = Object.keys(this.userForm.controls).filter(key => 
        this.userForm.get(key)?.invalid
      );
      
      this.logsService.logWarning('user_created', 
        `Intento de creación de usuario con campos inválidos: ${invalidFields.join(', ')}`,
        { 
          invalidFields: invalidFields,
          formData: this.userForm.value
        }
      ).subscribe();
      
      Object.keys(this.userForm.controls).forEach(key => {
        const control = this.userForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      
      // Mostrar mensaje de validación
      Swal.fire({
        icon: 'warning',
        title: 'Formulario Incompleto',
        text: 'Por favor completa todos los campos requeridos antes de continuar.',
        confirmButtonText: 'Entendido'
      });
    }
  }
}