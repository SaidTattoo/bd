import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TecladoService } from '../../services/teclado.service';

@Component({
  selector: 'app-teclado',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (tecladoService.getShowKeyboard()()) {
      <div class="fixed bottom-0 left-0 right-0 bg-gray-100 p-4 shadow-lg">
        <div class="grid grid-cols-10 gap-2">
          @for (key of keys; track key) {
            <button 
              (click)="onKeyPress(key)"
              class="p-3 bg-white rounded shadow hover:bg-gray-50">
              {{ key }}
            </button>
          }
        </div>
      </div>
    }
  `
})
export class TecladoComponent {
  tecladoService = inject(TecladoService);
  
  keys = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
    'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p',
    'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ',
    'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'
  ];

  onKeyPress(key: string) {
    this.tecladoService.typeKey(key);
  }
} 