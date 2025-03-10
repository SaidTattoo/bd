import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-cuestionario-validacion-energia-cero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-cuestionario-validacion-energia-cero.component.html',
  styleUrl: './modal-cuestionario-validacion-energia-cero.component.scss'
})
export class ModalCuestionarioValidacionEnergiaCeroComponent {
  verifications = {
    energyCero: false,
    powerCut: false,
    grounding: false
  };

  allVerified = false;
  constructor(private dialogRef: MatDialogRef<ModalCuestionarioValidacionEnergiaCeroComponent>) {}
  get buttonClass(): string {
    return this.allVerified
      ? 'bg-amber-600 text-white hover:bg-amber-700'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed';
  }

  checkAllVerifications() {
    this.allVerified = Object.values(this.verifications).every(v => v === true);
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onAccept() {
    if (this.allVerified) {
      this.dialogRef.close(true);
    }
  }
}
