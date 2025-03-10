import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-validator-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-validator-modal.component.html',
  styleUrls: ['./add-validator-modal.component.scss']
})
export class AddValidatorModalComponent {
  @Input() activityId: string = '';

  validation = {
    instrumentUsed: '',
    energyValue: 0.0
  };

  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  cancel() {
    this.onClose.emit();
  }

  saveValidation() {
    if (this.validation.instrumentUsed && this.validation.energyValue !== null) {
      console.log('Emitting validation data:', this.validation); // Para debugging
      this.onSave.emit(this.validation);
    } else {
      // Opcional: Mostrar mensaje de error si los campos están vacíos
      console.error('Por favor complete todos los campos');
    }
  }
}
