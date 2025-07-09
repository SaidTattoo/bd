import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReportService } from '../../services/reporte.service';
import { ConfiguracionService } from '../../../services/configuracion.service';

declare const html2pdf: any;

@Component({
  selector: 'app-reporte',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporte.component.html',
  styleUrl: './reporte.component.scss'
})
export class ReporteComponent implements OnInit {

  report: any;
  isLoading = true;
  errorMessage: string | null = null;
  logo: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private reportService: ReportService,
    private configuracionService: ConfiguracionService
  ) {}

  ngOnInit(): void {
    const activityId = this.route.snapshot.paramMap.get('id');
    if (activityId) {
      this.loadReport(activityId);
      this.loadLogo();
    } else {
      this.errorMessage = 'ID de actividad no proporcionado.';
      this.isLoading = false;
    }
  }

  loadReport(id: string): void {
    this.isLoading = true;
    this.reportService.getReport(id).subscribe({
      next: (data) => {
        this.report = data;
        console.log('📊 DATOS DEL REPORTE:', data);
        console.log('📋 USER HISTORY:', data.userHistory);
        console.log('🔢 USER HISTORY LENGTH:', data.userHistory?.length);
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar el reporte:', error);
        this.errorMessage = 'No se pudo cargar el reporte. Intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  loadLogo(): void {
    this.configuracionService.getLogo().subscribe({
      next: (data) => {
        this.logo = data.logo;
      },
      error: (error) => {
        console.log('No se pudo cargar el logo:', error);
        this.logo = null;
      }
    });
  }

  exportToPDF(): void {
    const element = document.getElementById('report-content');
    if (!element) {
      console.error('No se encontró el elemento del reporte');
      return;
    }

    // Guardar las clases originales
    const originalClasses = element.className;
    
    // Aplicar clases para PDF (sin borde, sombra, ni bordes redondeados)
    element.className = 'bg-white p-8';

    const options = {
      margin: 0.5,
      filename: `reporte-actividad-${this.report?.name || 'actividad'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait' 
      }
    };

    html2pdf().from(element).set(options).save().then(() => {
      // Restaurar las clases originales después de la exportación
      element.className = originalClasses;
    });
  }

  /**
   * Obtiene la etiqueta legible del perfil de usuario
   */
  getProfileLabel(profile: string): string {
    switch (profile) {
      case 'duenoDeEnergia':
        return 'Dueño de Energía';
      case 'supervisor':
        return 'Supervisor';
      case 'trabajador':
        return 'Trabajador';
      default:
        return profile;
    }
  }

  /**
   * Cuenta el número de acciones de un tipo específico
   */
  getActionCount(action: 'bloqueo' | 'desbloqueo'): number {
    if (!this.report?.userHistory) return 0;
    return this.report.userHistory.filter((entry: any) => entry.action === action).length;
  }

  /**
   * Cuenta el número de usuarios únicos que participaron en la actividad
   */
  getUniqueUsersCount(): number {
    if (!this.report?.userHistory) return 0;
    const uniqueUsers = new Set(this.report.userHistory.map((entry: any) => entry.user.name));
    return uniqueUsers.size;
  }

  /**
   * Calcula la duración de la actividad basada en el histórico
   */
  getDurationActivity(): string {
    if (!this.report?.userHistory || this.report.userHistory.length === 0) {
      return 'N/A';
    }

    // Ordenar las entradas por fecha
    const sortedEntries = this.report.userHistory.sort((a: any, b: any) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstEntry = new Date(sortedEntries[0].timestamp);
    const lastEntry = new Date(sortedEntries[sortedEntries.length - 1].timestamp);

    const diffInMs = lastEntry.getTime() - firstEntry.getTime();
    
    // Convertir a horas y minutos
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffInHours > 0) {
      return `${diffInHours}h ${diffInMinutes}m`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}m`;
    } else {
      return '< 1m';
    }
  }
}
