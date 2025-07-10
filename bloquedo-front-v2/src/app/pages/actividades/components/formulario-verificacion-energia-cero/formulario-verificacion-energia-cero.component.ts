import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

interface VerificationQuestion {
  id: string;
  question: string;
  answer: boolean | null;
}

@Component({
  selector: 'app-formulario-verificacion-energia-cero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario-verificacion-energia-cero.component.html',
  styleUrl: './formulario-verificacion-energia-cero.component.scss'
})
export class FormularioVerificacionEnergiaCeroComponent {
  questions: VerificationQuestion[] = [
    {
      id: 'energia_cero',
      question: '¿Verificó que Efectivamente hay Energía Cero?',
      answer: null
    },
    {
      id: 'corte_fuente',
      question: '¿Verificó el Corte de la Fuente y Retorno de Energía Eléctrica?',
      answer: null
    },
    {
      id: 'puesta_tierra',
      question: '¿Verificó que el Equipo esté con Puesta a Tierra?',
      answer: null
    },
    {
      id: 'permiso_sodi',
      question: '¿El Trabajo que Realizaré Requiere SODI y Tengo el Permiso Debidamente autorizado?',
      answer: null
    },
    {
      id: 'permiso_ptee',
      question: '¿El Trabajo que Realizaré Requiere PTEE y Tengo el Permiso Debidamente Autorizado?',
      answer: null
    }
  ];

  constructor(private dialogRef: MatDialogRef<FormularioVerificacionEnergiaCeroComponent>) {}

  get isFormValid(): boolean {
    return this.questions.every(q => q.answer === true);
  }

  get buttonClass(): string {
    return this.isFormValid
      ? 'bg-green-600 text-white hover:bg-green-700'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed';
  }

  get completedCount(): number {
    return this.questions.filter(q => q.answer === true).length;
  }

  get progressPercentage(): number {
    return (this.completedCount / this.questions.length) * 100;
  }

  setAnswer(questionId: string, answer: boolean) {
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      question.answer = answer;
    }
  }

  onClose() {
    this.dialogRef.close(null);
  }

  onAccept() {
    if (this.isFormValid) {
      const responses = this.questions.map(q => ({
        question: q.question,
        answer: q.answer
      }));
      
      this.dialogRef.close({
        responses: responses,
        allVerified: true
      });
    }
  }
} 