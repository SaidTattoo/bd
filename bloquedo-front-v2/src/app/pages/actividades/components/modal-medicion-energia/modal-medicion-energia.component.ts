import { Component, Inject, OnInit } from "@angular/core";

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { EnergyValidation } from "../../interface/activity.interface";
    

interface ValidatorData {
    nombre: string;
  email: string;
  telefono: string;
  _id: string;
}

@Component({
  selector: 'app-modal-medicion-energia',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Medición de Energía Cero</h2>
    <mat-dialog-content>
      <form [formGroup]="medicionForm">
        <mat-form-field appearance="fill">
          <mat-label>Validador</mat-label>
          <input matInput [value]="data.validator.nombre" disabled>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Email del Validador</mat-label>
          <input matInput [value]="data.validator.email" disabled>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Teléfono del Validador</mat-label>
          <input matInput [value]="data.validator.telefono" disabled>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Instrumento Utilizado</mat-label>
          <input matInput formControlName="instrumentUsed">
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Valor de Energía (V)</mat-label>
          <input matInput type="number" formControlName="energyValue">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!medicionForm.valid">
        Confirmar
      </button>
    </mat-dialog-actions>
  `
})
export class ModalMedicionEnergiaComponent implements OnInit {
  medicionForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<ModalMedicionEnergiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { validator: ValidatorData },
    private fb: FormBuilder
  ) {
    this.medicionForm = this.fb.group({
      instrumentUsed: ['', Validators.required],
      energyValue: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Inicialización si es necesaria
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.medicionForm.valid) {
      const result = {
        validatorId: this.data.validator._id,
        validatorName: this.data.validator.nombre,
        instrumentUsed: this.medicionForm.value.instrumentUsed,
        energyValue: this.medicionForm.value.energyValue
      };
      this.dialogRef.close(result);
    }
  }
} 
