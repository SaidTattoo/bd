import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { TecladoService } from '../services/teclado.service';

@Directive({
  selector: '[virtualKeyboard]',
  standalone: true
})
export class VirtualKeyboardDirective {
  private el = inject(ElementRef);
  private tecladoService = inject(TecladoService); 

  @HostListener('focus')
  onFocus() {
    this.tecladoService.setTargetInput(this.el.nativeElement);
    this.tecladoService.show();
  }

  @HostListener('blur')
  onBlur() {
    // Opcional: ocultar el teclado cuando el input pierde el foco
    // this.tecladoService.hide();
  }
} 