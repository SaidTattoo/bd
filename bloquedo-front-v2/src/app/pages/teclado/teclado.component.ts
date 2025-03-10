import { Component, ViewChild } from '@angular/core';
import Keyboard from "simple-keyboard";
import "simple-keyboard/build/css/index.css";

@Component({
  selector: 'app-teclado',
  standalone: true,
  imports: [],
  templateUrl: './teclado.component.html',
  styleUrl: './teclado.component.scss'
})
export class TecladoComponent {
  @ViewChild('keyboardContainer') keyboardContainer: any;
  keyboard!: Keyboard;
  inputFocusedElement!: HTMLInputElement;

  ngAfterViewInit() {
    this.keyboard = new Keyboard(this.keyboardContainer.nativeElement, {
      onChange: (input) => this.onChange(input),
      onKeyPress: (button) => this.onKeyPress(button),
    });

    // Detect focus on inputs and bind keyboard
    document.addEventListener('focusin', (event: any) => {
      if (event.target.tagName === 'INPUT') {
        this.inputFocusedElement = event.target;
        this.keyboard.setInput(event.target.value || '');
      }
    });
  }

  onChange(input: string) {
    if (this.inputFocusedElement) {
      this.inputFocusedElement.value = input;
    }
  }

  onKeyPress(button: string) {
    if (button === '{shift}' || button === '{lock}') {
      this.handleShift();
    }
  }

  handleShift() {
    let currentLayout = this.keyboard.options.layoutName;
    let shiftToggle = currentLayout === 'default' ? 'shift' : 'default';

    this.keyboard.setOptions({
      layoutName: shiftToggle,
    });
  }
}
