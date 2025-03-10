import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TotemService } from '../../../services/totem.service';

@Component({
  selector: 'app-create-totem-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="p-6 max-w-lg">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Crear Nuevo Tótem</h2>
      
      <form [formGroup]="totemForm" (ngSubmit)="onSubmit()">
        <div class="space-y-4">
          <!-- Nombre del Tótem -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Tótem</label>
            <input 
              type="text" 
              formControlName="name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="Ingrese un nombre para el tótem">
            <div *ngIf="totemForm.get('name')?.invalid && totemForm.get('name')?.touched" class="text-red-500 text-sm mt-1">
              Nombre requerido
            </div>
          </div>
          
          <!-- Descripción del Tótem -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea 
              formControlName="description"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="Descripción del tótem"
              rows="3"></textarea>
          </div>
          
          <!-- Número de Casilleros -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Número de Casilleros</label>
            <input 
              type="number" 
              formControlName="numLockers"
              min="1"
              max="20"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="Ingrese el número de casilleros">
            <div *ngIf="totemForm.get('numLockers')?.invalid && totemForm.get('numLockers')?.touched" class="text-red-500 text-sm mt-1">
              Número de casilleros requerido (1-20)
            </div>
          </div>
        </div>
        
        <!-- Error message -->
        <div *ngIf="error" class="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {{ error }}
        </div>
        
        <!-- Botones -->
        <div class="flex justify-end space-x-3 mt-6">
          <button 
            type="button"
            (click)="onCancel()"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Cancelar
          </button>
          <button 
            type="submit"
            [disabled]="totemForm.invalid || loading"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
            {{loading ? 'Creando...' : 'Crear Tótem'}}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: []
})
export class CreateTotemModalComponent {
  totemForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private totemService: TotemService,
    public dialogRef: MatDialogRef<CreateTotemModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.totemForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      numLockers: [4, [Validators.required, Validators.min(1), Validators.max(20)]]
    });
  }

  onSubmit() {
    if (this.totemForm.invalid) return;

    this.loading = true;
    this.error = null;

    // Create the proper payload structure with correct casillero format
    const formData: { name: string, description: string, casilleros: any[] } = {
      name: this.totemForm.value.name,
      description: this.totemForm.value.description || '',
      casilleros: Array(this.totemForm.value.numLockers).fill(0).map((_, index) => ({
        name: `Casillero ${index + 1}`,
        description: `${this.totemForm.value.name} - Casillero ${index + 1}`,
        status: "disponible",
        equipos: []
      }))
    };

    this.totemService.createTotem(formData).subscribe({
      next: (response: any) => {
        this.loading = false;
        console.log('Tótem creado:', response);
        // ID del tótem y de los casilleros disponibles en response
        if (response && response._id) {
          console.log('ID del tótem:', response._id);
          
          if (response.casilleros && Array.isArray(response.casilleros)) {
            console.log('IDs de los casilleros:');
            response.casilleros.forEach((casillero: any, index: number) => {
              console.log(`Casillero ${index + 1}:`, casillero._id);
            });
          }
        }
        this.dialogRef.close(response);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.message || 'Error al crear el tótem';
        console.error('Error creating totem:', err);
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
} 