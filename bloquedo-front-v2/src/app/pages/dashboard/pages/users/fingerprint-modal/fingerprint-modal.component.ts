import { Component, Input,EventEmitter, Output, inject } from '@angular/core';
import { FingerPosition, User, Fingerprint } from '../../../../actividades/interface/activity.interface';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../../../services/users.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-fingerprint-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fingerprint-modal.component.html',
  styleUrl: './fingerprint-modal.component.scss'
})
export class FingerprintModalComponent {
  @Input() user!: User;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();
  usersService = inject(UsersService);
  showCaptureModal = false;
  selectedFinger: FingerPosition | null = null;
  isCapturing = false;
  captureAttempts = 0;
  maxCaptureAttempts = 3;

  leftFingers = [
    { position: 'leftThumb' as FingerPosition, label: 'Pulgar Izquierdo' },
    { position: 'leftIndex' as FingerPosition, label: 'Índice Izquierdo' },
    { position: 'leftMiddle' as FingerPosition, label: 'Medio Izquierdo' },
    { position: 'leftRing' as FingerPosition, label: 'Anular Izquierdo' },
    { position: 'leftPinky' as FingerPosition, label: 'Meñique Izquierdo' }
  ];

  rightFingers = [
    { position: 'rightThumb' as FingerPosition, label: 'Pulgar Derecho' },
    { position: 'rightIndex' as FingerPosition, label: 'Índice Derecho' },
    { position: 'rightMiddle' as FingerPosition, label: 'Medio Derecho' },
    { position: 'rightRing' as FingerPosition, label: 'Anular Derecho' },
    { position: 'rightPinky' as FingerPosition, label: 'Meñique Derecho' }
  ];

  isFingerRegistered(position: FingerPosition): boolean {
    return this.user.fingerprints.some(f => f.position === position);
  }

  getFingerButtonClass(position: FingerPosition): string {
    return this.isFingerRegistered(position)
      ? 'bg-green-50 border-green-200 hover:bg-green-100'
      : 'bg-white hover:bg-gray-50 border-gray-200';
  }

  getFingerLabel(position: FingerPosition | null): string {
    const finger = [...this.leftFingers, ...this.rightFingers].find(f => f.position === position);
    return finger ? finger.label : '';
  }

  captureFingerprint(position: FingerPosition) {
    this.selectedFinger = position;
    this.showCaptureModal = true;
    this.isCapturing = true;
    this.captureAttempts = 0;
    
    // Encender el LED cuando se inicia la captura
    this.usersService.controlLed(true).subscribe({
      next: () => console.log('LED encendido para captura de huella'),
      error: (error) => console.error('Error al encender LED:', error)
    });
    
    this.performFingerprintCapture(position);
  }

  performFingerprintCapture(position: FingerPosition) {
    if (this.captureAttempts >= this.maxCaptureAttempts) {
      this.handleCaptureFailure('Límite de intentos alcanzado');
      return;
    }

    this.usersService.captureFingerprint().subscribe({
      next: (response: any) => {
        if (response.error === false && response.template) {
          this.saveFingerprintToDatabase(position, response.template);
        } else {
          this.captureAttempts++;
          const remainingAttempts = this.maxCaptureAttempts - this.captureAttempts;
          
          if (remainingAttempts > 0) {
            Swal.fire({
              title: 'Error en la captura',
              text: `No se pudo capturar la huella. Intentos restantes: ${remainingAttempts}`,
              icon: 'warning',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Reintentar'
            }).then(() => {
              this.performFingerprintCapture(position);
            });
          } else {
            this.handleCaptureFailure('No se pudo capturar la huella después de varios intentos');
          }
        }
      },
      error: (error) => {
        console.error('Error en captura de huella:', error);
        this.captureAttempts++;
        const remainingAttempts = this.maxCaptureAttempts - this.captureAttempts;
        
        if (remainingAttempts > 0) {
          Swal.fire({
            title: 'Error de conexión',
            text: `Error al conectar con el dispositivo. Intentos restantes: ${remainingAttempts}`,
            icon: 'error',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Reintentar'
          }).then(() => {
            this.performFingerprintCapture(position);
          });
        } else {
          this.handleCaptureFailure('Error de conexión con el dispositivo');
        }
      }
    });
  }

  saveFingerprintToDatabase(position: FingerPosition, template: string) {
    const newFingerprint: Fingerprint = {
      position: position,
      template: template,
      quality: Math.floor(Math.random() * 30) + 70, // Simular calidad entre 70-100
      capturedAt: new Date().toISOString()
    };

    this.usersService.saveFingerprint(newFingerprint, this.user._id).subscribe({
      next: (response: any) => {
        console.log('Huella guardada exitosamente:', response);
        
        // Apagar el LED después de guardar exitosamente
        this.usersService.controlLed(false).subscribe({
          next: () => console.log('LED apagado después de guardar huella'),
          error: (error) => console.error('Error al apagar LED:', error)
        });

        // Actualizar la lista de huellas del usuario
        this.user.fingerprints = this.user.fingerprints.filter(f => f.position !== position);
        this.user.fingerprints.push(newFingerprint);
        this.user.fingerprintsComplete = this.user.fingerprints.length === 10;

        // Mostrar mensaje de éxito
        Swal.fire({
          title: '¡Éxito!',
          text: `Huella del ${this.getFingerLabel(position)} guardada correctamente`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          timer: 2000,
          showConfirmButton: false
        });

        this.resetCaptureState();
      },
      error: (error) => {
        console.error('Error al guardar huella:', error);
        this.handleCaptureFailure('Error al guardar la huella en la base de datos');
      }
    });
  }

  handleCaptureFailure(message: string) {
    // Apagar el LED en caso de error
    this.usersService.controlLed(false).subscribe({
      next: () => console.log('LED apagado después de error'),
      error: (error) => console.error('Error al apagar LED:', error)
    });

    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonColor: '#3085d6'
    });

    this.resetCaptureState();
  }

  resetCaptureState() {
    this.showCaptureModal = false;
    this.selectedFinger = null;
    this.isCapturing = false;
    this.captureAttempts = 0;
  }



  cancelCapture() {
    // Apagar el LED cuando se cancela la captura
    this.usersService.controlLed(false).subscribe({
      next: () => console.log('LED apagado - captura cancelada'),
      error: (error) => console.error('Error al apagar LED:', error)
    });
    
    this.resetCaptureState();
  }
}