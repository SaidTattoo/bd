import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TecladoService {
  private showKeyboard = signal(false);
  private currentInput = signal<HTMLInputElement | null>(null);

  show() {
    this.showKeyboard.set(true);
  }

  hide() {
    this.showKeyboard.set(false);
  }

  setTargetInput(input: HTMLInputElement) {
    this.currentInput.set(input);
  }

  getShowKeyboard() {
    return this.showKeyboard;
  }

  getCurrentInput() {
    return this.currentInput;
  }

  typeKey(key: string) {
    const input = this.currentInput();
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const value = input.value;

    input.value = value.substring(0, start) + key + value.substring(end);
    input.setSelectionRange(start + 1, start + 1);
    input.focus();
    
    // Disparar evento de input para actualizar formularios reactivos
    input.dispatchEvent(new Event('input'));
  }
} 