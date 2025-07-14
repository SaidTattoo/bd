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

  /**
   * Función auxiliar para obtener el ID del usuario desde el resultado del modal de validación
   * Maneja tanto la estructura de autenticación por credenciales como por huella
   */
  private getUserIdFromValidationResult(result: any): string {
    console.log('🔍 DEBUG - EnergiaCero - getUserIdFromValidationResult - result completo:', result);
    
    if (!result) {
      console.log('❌ EnergiaCero - getUserIdFromValidationResult - result es null/undefined');
      return '';
    }
    
    if (result.user) {
      console.log('🔍 DEBUG - EnergiaCero - getUserIdFromValidationResult - result.user:', result.user);
      
      // Si viene de autenticación por huella (estructura nueva)
      if (result.user.usuario && result.user.usuario._id) {
        console.log('✅ EnergiaCero - getUserIdFromValidationResult - Extrayendo ID de estructura de huella (result.user.usuario._id):', result.user.usuario._id);
        return result.user.usuario._id;
      }
      // Si viene de autenticación por huella con 'id' en lugar de '_id'
      if (result.user.usuario && result.user.usuario.id) {
        console.log('✅ EnergiaCero - getUserIdFromValidationResult - Extrayendo ID de estructura de huella (result.user.usuario.id):', result.user.usuario.id);
        return result.user.usuario.id;
      }
      // Si viene de autenticación por credenciales (estructura original)
      if (result.user._id) {
        console.log('✅ EnergiaCero - getUserIdFromValidationResult - Extrayendo ID de estructura de credenciales (result.user._id):', result.user._id);
        return result.user._id;
      }
      // Si result.user tiene un campo 'id' en lugar de '_id'
      if (result.user.id) {
        console.log('✅ EnergiaCero - getUserIdFromValidationResult - Extrayendo ID de result.user.id:', result.user.id);
        return result.user.id;
      }
    }
    
    // Intentar extraer directamente del result si tiene _id
    if (result._id) {
      console.log('✅ EnergiaCero - getUserIdFromValidationResult - Extrayendo ID directamente del result (_id):', result._id);
      return result._id;
    }
    
    // Si result tiene un campo 'id' en lugar de '_id'
    if (result.id) {
      console.log('✅ EnergiaCero - getUserIdFromValidationResult - Extrayendo ID directamente del result (id):', result.id);
      return result.id;
    }
    
    console.log('❌ EnergiaCero - getUserIdFromValidationResult - No se pudo extraer ID, retornando string vacío');
    console.log('❌ EnergiaCero - Estructura disponible en result:', Object.keys(result));
    if (result.user) {
      console.log('❌ EnergiaCero - Estructura disponible en result.user:', Object.keys(result.user));
    }
    return '';
  }

  /**
   * Función auxiliar para obtener el nombre del usuario desde el resultado del modal de validación
   * Maneja tanto la estructura de autenticación por credenciales como por huella
   */
  private getUserNameFromValidationResult(result: any): string {
    console.log('🔍 DEBUG - EnergiaCero - getUserNameFromValidationResult - result completo:', result);
    
    if (!result) {
      console.log('❌ EnergiaCero - getUserNameFromValidationResult - result es null/undefined');
      return '';
    }
    
    if (result.user) {
      console.log('🔍 DEBUG - EnergiaCero - getUserNameFromValidationResult - result.user:', result.user);
      
      // Si viene de autenticación por huella (estructura nueva)
      if (result.user.usuario && result.user.usuario.nombre) {
        console.log('✅ EnergiaCero - getUserNameFromValidationResult - Extrayendo nombre de estructura de huella (result.user.usuario.nombre):', result.user.usuario.nombre);
        return result.user.usuario.nombre;
      }
      // Si viene de autenticación por credenciales (estructura original)
      if (result.user.nombre) {
        console.log('✅ EnergiaCero - getUserNameFromValidationResult - Extrayendo nombre de estructura de credenciales (result.user.nombre):', result.user.nombre);
        return result.user.nombre;
      }
    }
    
    // Intentar extraer directamente del result si tiene nombre
    if (result.nombre) {
      console.log('✅ EnergiaCero - getUserNameFromValidationResult - Extrayendo nombre directamente del result (nombre):', result.nombre);
      return result.nombre;
    }
    
    console.log('❌ EnergiaCero - getUserNameFromValidationResult - No se pudo extraer nombre, retornando string vacío');
    return '';
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
        console.log('🔍 DEBUG - EnergiaCero - Resultado de validación recibido:', result);
        
        const dialogRefEnergyZero = this.dialog.open(AddValidatorModalComponent);
        
        dialogRefEnergyZero.componentInstance.onSave.subscribe((modalData) => {
          // Usar las funciones auxiliares para extraer datos consistentemente
          const validatorName = this.getUserNameFromValidationResult(result);
          const validatorId = this.getUserIdFromValidationResult(result);
          
          const validationData = {
            validatorName: validatorName,
            validator: validatorId,
            instrumentUsed: modalData.instrumentUsed,
            energyValue: modalData.energyValue
          };
          
          console.log('🔍 DEBUG - EnergiaCero - Datos de validación enviados:', validationData);
          
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
