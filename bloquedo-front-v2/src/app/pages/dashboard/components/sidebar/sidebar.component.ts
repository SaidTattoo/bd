import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ConfiguracionService, Theme } from '../../../services/configuracion.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ 
    CommonModule,
    RouterLink, 
    RouterLinkActive
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  currentLogo: string | null = null;
  
  // Propiedades del tema
  currentTheme: Theme | null = null;
  themes: Theme[] = [];
  
  constructor(
    private configuracionService: ConfiguracionService
  ) {}
  
  ngOnInit() {
    // Suscribirse al logo
    this.configuracionService.logo$.subscribe(logo => {
      this.currentLogo = logo;
    });
    
    // Cargar y suscribirse a los temas
    this.loadThemes();
    this.subscribeToThemeChanges();
  }

  loadThemes(): void {
    this.configuracionService.getThemes().subscribe({
      next: (response) => {
        this.themes = response.themes;
        const currentThemeId = response.currentTheme;
        this.currentTheme = this.themes.find(t => t.id === currentThemeId) || null;
      },
      error: (error) => {
        console.error('Error loading themes:', error);
      }
    });
  }

  subscribeToThemeChanges(): void {
    this.configuracionService.currentTheme$.subscribe(theme => {
      if (theme) {
        this.currentTheme = theme;
        console.log('Tema actualizado automáticamente:', theme);
      }
    });
  }

  getSidebarBackgroundColor(): string {
    return this.currentTheme?.backgroundColor || '#1a1f36';
  }

  getActiveItemColor(): string {
    return this.currentTheme?.primaryColor || '#6366f1';
  }

  getHoverColor(): string {
    return this.currentTheme?.secondaryColor || '#374151';
  }

  getAccentColor(): string {
    return this.currentTheme?.accentColor || '#10b981';
  }

  getSidebarHeaderColor(): string {
    return this.currentTheme?.sidebarHeaderColor || '#9ca3af';
  }

  getSidebarLinkColor(): string {
    return this.currentTheme?.sidebarLinkColor || '#d1d5db';
  }

  onMouseEnter(event: Event): void {
    const element = event.target as HTMLElement;
    if (element) {
      element.style.backgroundColor = this.getHoverColor();
    }
  }

  onMouseLeave(event: Event, isActive: boolean): void {
    const element = event.target as HTMLElement;
    if (element) {
      element.style.backgroundColor = isActive ? this.getActiveItemColor() : 'transparent';
    }
  }

  onMouseLeaveAccent(event: Event): void {
    const element = event.target as HTMLElement;
    if (element) {
      element.style.backgroundColor = this.getAccentColor();
    }
  }

  onMouseLeaveActive(event: Event): void {
    const element = event.target as HTMLElement;
    if (element) {
      element.style.backgroundColor = this.getActiveItemColor();
    }
  }


}
