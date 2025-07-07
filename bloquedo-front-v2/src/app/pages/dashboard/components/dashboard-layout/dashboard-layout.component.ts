import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TecladoComponent } from '../../../../shared/components/teclado/teclado.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent, TecladoComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-sidebar></app-sidebar>
      <div class="ml-64 flex flex-col min-h-screen">
        <app-header></app-header>
        <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div class="container mx-auto px-6 py-8">
            <ng-content></ng-content>
          </div>
        </main>
      </div>
      <app-teclado></app-teclado>
    </div>
  `
})
export class DashboardLayoutComponent {} 