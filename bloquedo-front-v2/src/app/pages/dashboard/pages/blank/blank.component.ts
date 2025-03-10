import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardLayoutComponent } from '../../components/dashboard-layout/dashboard-layout.component';

@Component({
  selector: 'app-blank',
  standalone: true,
  imports: [CommonModule, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout>
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h1 class="text-2xl font-semibold text-gray-900">Página en Blanco</h1>
          <p class="mt-2 text-gray-600">Esta es una página en blanco de ejemplo.</p>
        </div>
      </div>
    </app-dashboard-layout>
  `
})
export class BlankComponent {} 