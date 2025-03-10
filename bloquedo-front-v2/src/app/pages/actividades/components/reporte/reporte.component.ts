import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReportService } from '../../services/reporte.service';

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

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    const activityId = this.route.snapshot.paramMap.get('id');
    if (activityId) {
      this.loadReport(activityId);
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
}
