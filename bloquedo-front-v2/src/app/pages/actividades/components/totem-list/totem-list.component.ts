import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TotemService } from '../../../services/totem.service';

@Component({
  selector: 'app-totem-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 bg-white rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Totems Conectados</h2>
      
      <div class="space-y-4">
        <div *ngFor="let totem of totems" class="border rounded-lg p-4">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-medium">{{ totem.name || 'Totem sin nombre' }}</h3>
            <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Conectado</span>
          </div>
          
          <!-- Casilleros ocupados -->
          <div *ngIf="totem.casilleros?.length > 0" class="mt-3">
            <h4 class="text-sm font-medium text-gray-600 mb-2">Casilleros ocupados:</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div *ngFor="let casillero of getOccupiedLockers(totem); let i = index" 
                  class="flex items-center p-2 bg-red-50 border border-red-100 rounded">
                <div class="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <div class="flex-1">
                  <span class="text-sm font-medium">{{ casillero.name || 'Casillero ' + (i+1) }}</span>
                  <div class="text-xs text-gray-600">
                    {{ casillero.equipos?.length || 0 }} equipos asignados
                  </div>
                </div>
              </div>
              <div *ngIf="getOccupiedLockers(totem).length === 0" class="text-sm text-gray-500 italic">
                No hay casilleros ocupados
              </div>
            </div>
          </div>
        </div>
        
        <div *ngIf="!totems || totems.length === 0" class="text-center py-4 text-gray-500">
          No hay totems conectados
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TotemListComponent implements OnInit {
  totems: any[] = [];
  
  constructor(private totemService: TotemService) {}
  
  ngOnInit() {
    this.loadTotems();
  }
  
  loadTotems() {
    this.totemService.getAllTotems().subscribe({
      next: (data) => {
        this.totems = data;
        console.log('Totems cargados:', this.totems);
      },
      error: (error) => {
        console.error('Error al cargar totems:', error);
      }
    });
  }
  
  getOccupiedLockers(totem: any): any[] {
    return totem.casilleros?.filter((c: any) => c.status === 'ocupado') || [];
  }
} 