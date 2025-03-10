import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EnergyValidation } from '../../interface/activity.interface';
import { CommonModule } from '@angular/common';
import { AddValidatorModalComponent } from '../add-validator-modal/add-validator-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ValidacionComponent } from '../../validacion/validacion.component';
import { ModalCuestionarioValidacionEnergiaCeroComponent } from '../modal-cuestionario-validacion-energia-cero/modal-cuestionario-validacion-energia-cero.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-energia-cero',
  standalone: true,
  imports: [CommonModule],  

  templateUrl: './energia-cero.component.html',
  styleUrl: './energia-cero.component.scss'
})
export class EnergiaCeroComponent implements OnInit{
  @Input() zeroEnergyValidation: any = {};
  @Input() activity: any;
  @Output() onAddValidator = new EventEmitter<any>();
  
  constructor(private dialog: MatDialog) {}

  ngOnInit() {
    console.log('zeroEnergyValidation', this.zeroEnergyValidation);
  }

  addValidator() {
    if (!this.activity?.equipments || this.activity.equipments.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay equipos',
        text: 'Debe agregar equipos a la actividad antes de validar la energía cero'
      });
      return;
    }

    const dialogRef = this.dialog.open(ValidacionComponent);
    
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const dialogRefEnergyZero = this.dialog.open(AddValidatorModalComponent);
        
        dialogRefEnergyZero.componentInstance.onSave.subscribe((modalData) => {
          const validationData = {
            validatorName: result.user.nombre,
            validator: result.user._id,
            instrumentUsed: modalData.instrumentUsed,
            energyValue: modalData.energyValue
          };
          this.onAddValidator.emit(validationData);
          dialogRefEnergyZero.close();
        });

        dialogRefEnergyZero.componentInstance.onClose.subscribe(() => {
          dialogRefEnergyZero.close();
        });
      }
    });
  }
}
