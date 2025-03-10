import { Component, Inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ValidacionComponent } from '../validacion/validacion.component';

@Component({
  selector: 'app-ruptura',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './ruptura.component.html',
  styleUrls: ['./ruptura.component.scss']
})
export class RupturaComponent implements OnInit {
  selectedOption: number | null = null;
  tipoUsuarioTexto: string = 'trabajador/a';
  
  // Opciones principales (se actualizarán según el tipo de usuario)
  mainOptions = [
    {
      text: 'Se logró ubicar al trabajador/a pero no pudo estar presente',
      detail: ''
    },
    {
      text: 'No se ubicó al trabajador/a pero sí se pudo contactar telefónicamente',
      detail: ''
    },
    {
      text: 'No se ubicó al trabajador/a y se buscó en',
      detail: ''
    }
  ];
  
  // Sub-opciones que aparecen cuando se selecciona la tercera opción
  subOptions = [
    {
      text: 'Área de trabajo',
      checked: false
    },
    {
      text: 'Oficinas administrativas',
      checked: false
    },
    {
      text: 'Zonas comunes',
      checked: false
    }
  ];
  
  constructor(
    public dialogRef: MatDialogRef<RupturaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    // Determinar el texto según el tipo de usuario
    if (this.data?.tipoUsuario === 'supervisor') {
      this.tipoUsuarioTexto = 'supervisor/a';
    } else if (this.data?.tipoUsuario === 'duenoEnergia') {
      this.tipoUsuarioTexto = 'dueño de energía';
    } else {
      this.tipoUsuarioTexto = 'trabajador/a';
    }
    
    // Actualizar los textos de las opciones con el tipo de usuario correcto
    this.actualizarTextosOpciones();
  }
  
  /**
   * Actualiza los textos de las opciones según el tipo de usuario
   */
  private actualizarTextosOpciones() {
    this.mainOptions[0].text = `Se logró ubicar al ${this.tipoUsuarioTexto} pero no pudo estar presente`;
    this.mainOptions[1].text = `No se ubicó al ${this.tipoUsuarioTexto} pero sí se pudo contactar telefónicamente`;
    this.mainOptions[2].text = `No se ubicó al ${this.tipoUsuarioTexto} y se buscó en`;
    
    // Forzar actualización de la vista
    this.cdr.detectChanges();
  }
  
  /**
   * Selecciona una opción principal
   * @param index Índice de la opción seleccionada
   */
  selectOption(index: number): void {
    console.log('Seleccionando opción:', index);
    
    // Si se está seleccionando la misma opción, no hacemos nada
    if (this.selectedOption === index) {
      return;
    }
    
    this.selectedOption = index;
    
    // Si no es la tercera opción, resetear los checks de las sub-opciones
    if (index !== 2) {
      this.resetSubOptions();
    }
    
    // Forzar la detección de cambios para asegurar que la UI se actualice
    this.cdr.detectChanges();
  }
  
  /**
   * Resetea las sub-opciones
   */
  resetSubOptions(): void {
    this.subOptions.forEach(option => option.checked = false);
  }
  
  /**
   * Verifica si todas las sub-opciones están marcadas
   */
  allSubOptionsChecked(): boolean {
    // Verificar que TODAS las sub-opciones estén marcadas
    return this.subOptions.every(option => option.checked);
  }
  
  /**
   * Verifica si se puede continuar con el proceso
   * @returns true si se han completado todos los campos obligatorios
   */
  canContinue(): boolean {
  /*   console.log('Verificando si se puede continuar:', {
      selectedOption: this.selectedOption,
      details: this.selectedOption !== null ? this.mainOptions[this.selectedOption].detail : null,
      subOptionsChecked: this.selectedOption === 2 ? this.allSubOptionsChecked() : null
    }); */
    
    // Verificar que se haya seleccionado una opción
    if (this.selectedOption === null) return false;
    
    // Para la primera opción, verificar que tenga detalle
    if (this.selectedOption === 0) {
      return this.mainOptions[0].detail.trim() !== '';
    }
    
    // Para la segunda opción, verificar que tenga detalle
    if (this.selectedOption === 1) {
      return this.mainOptions[1].detail.trim() !== '';
    }
    
    // Para la tercera opción, verificar que TODAS las sub-opciones estén marcadas
    if (this.selectedOption === 2) {
      return this.allSubOptionsChecked();
    }
    
    return false;
  }
  
  /**
   * Obtiene el texto completo de la justificación
   */
  getFullReason(): string {
    if (this.selectedOption === null) return '';
    
    let reason = '';
    
    if (this.selectedOption === 0 || this.selectedOption === 1) {
      // Para las dos primeras opciones, incluir el texto de la opción + el detalle
      reason = this.mainOptions[this.selectedOption].text + ': ' + this.mainOptions[this.selectedOption].detail.trim();
    } else if (this.selectedOption === 2) {
      // Para la tercera opción, incluir el texto de la opción + las opciones seleccionadas
      const checkedOptions = this.subOptions
        .filter(option => option.checked)
        .map(option => option.text)
        .join(', ');
      
      reason = `No se ubicó al ${this.tipoUsuarioTexto} y se buscó en: ` + checkedOptions;
    }
    
    return reason;
  }
  
  /**
   * Abre el modal de validación antes de confirmar
   */
  openValidationModal(): void {
    const dialogRef = this.dialog.open(ValidacionComponent);
    
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.verificationStatus === 'verified') {
        this.confirm(result);
      }
    });
  }
  
  /**
   * Cierra el modal enviando la confirmación y razón
   */
  confirm(validationResult: any): void {
    console.log('Confirm called with validation result:', validationResult);
    
    // Ensure we have the mainOptions property for detallesOpcion
    const result = {
      confirmed: true,
      reason: this.getFullReason(),
      selectedOption: this.selectedOption,
      mainOptions: this.mainOptions, // Add this to ensure access to details
      subOptions: this.selectedOption === 2 ? this.subOptions : [],
      validationData: validationResult
    };
    
    console.log('Sending back to caller:', result);
    this.dialogRef.close(result);
  }
  
  /**
   * Cierra el modal sin confirmar
   */
  cancel(): void {
    this.dialogRef.close({
      confirmed: false
    });
  }
}
