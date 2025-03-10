import { Component, Input,EventEmitter, Output, inject } from '@angular/core';
import { FingerPosition, User } from '../../../../actividades/interface/activity.interface';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../../../services/users.service';


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
    // Here you would typically integrate with your fingerprint scanner
    // For now, we'll simulate the capture after a delay
    this.usersService.captureFingerprint().subscribe((response:any) => {
      // Convertir octet-stream a base64
      console.log('response',response);
      const newFingerprint = {
        position: position,
        template: `${response.data.template}`, // Formato correcto para mostrar imagen
        quality: Math.floor(Math.random() * 30) + 70,
        capturedAt: new Date()
      };
      
      this.usersService.saveFingerprint(newFingerprint, this.user._id).subscribe((response:any) => {
        console.log(response);
      });   
    });

    setTimeout(() => {
      this.simulateFingerprintCapture(position);
    }, 2000);
  }

  simulateFingerprintCapture(position: FingerPosition) {
    const newFingerprint = {
      position,
      template: 'base64EncodedTemplate',
      quality: Math.floor(Math.random() * 30) + 70, // Random quality between 70-100
      capturedAt: new Date().toISOString()
    };

    // Remove any existing fingerprint for this position
    this.user.fingerprints = this.user.fingerprints.filter(f => f.position !== position);
    // Add the new fingerprint
    this.user.fingerprints.push(newFingerprint);
    // Update completeness status
    this.user.fingerprintsComplete = this.user.fingerprints.length === 10;

    this.showCaptureModal = false;
    this.selectedFinger = null;
  }

  cancelCapture() {
    this.showCaptureModal = false;
    this.selectedFinger = null;
  }
}