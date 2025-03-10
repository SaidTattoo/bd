import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { UsersService } from '../../../services/users.service';
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
  imports: [CommonModule, ReactiveFormsModule],
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

  constructor(private fb: FormBuilder,  @Inject(UsersService) private usersService: UsersService) {
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


    this.usersService.captureFingerprint().subscribe((response:any) => {
      console.log(response.TemplateBase64);
    });

    const fingerprints: Fingerprint[] = [...(this.userForm.get('fingerprints')?.value || [])];
    const existingIndex = fingerprints.findIndex(f => f.position === position);
    
    const newFingerprint: Fingerprint = {
      position: position as Fingerprint['position'],
      template: 'base64EncodedTemplate',
      quality: Math.floor(Math.random() * 30) + 70, // Calidad entre 70 y 100
      capturedAt: new Date()
    };

    if (existingIndex >= 0) {
      fingerprints[existingIndex] = newFingerprint;
    } else {
      fingerprints.push(newFingerprint);
    }

    this.userForm.patchValue({ fingerprints });
   
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
      // Aquí iría la lógica para enviar los datos al backend
      this.usersService.createUser(userData).subscribe(response => {
        console.log('Usuario creado:', response);
      });
    } else {
      Object.keys(this.userForm.controls).forEach(key => {
        const control = this.userForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }
}