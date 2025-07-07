import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardLayoutComponent } from '../../components/dashboard-layout/dashboard-layout.component';
import { UsersService } from '../../../services/users.service';
import { ActividadesService } from '../../../services/actividades.service';
import { EquiposService } from '../../../services/equipos.service';
import { AreasService } from '../../../services/areas.service';
import { forkJoin } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { 
  Chart, 
  ChartConfiguration, 
  ChartOptions, 
  ChartType,
  LinearScale,
  CategoryScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Registrar los componentes necesarios de Chart.js solo si estamos en el navegador
if (typeof window !== 'undefined') {
  Chart.register(
    LinearScale,
    CategoryScale,
    PointElement,
    LineElement,
    LineController,
    Title,
    Tooltip,
    Legend,
    Filler
  );
}

@Component({
  selector: 'app-blank',
  standalone: true,
  imports: [CommonModule, DashboardLayoutComponent, BaseChartDirective],
  template: `
    <app-dashboard-layout>
      <div class="space-y-6">
        <!-- Título del Dashboard -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p class="mt-2 text-gray-600">Resumen general del sistema de gestión de energía</p>
            </div>
            <button 
              (click)="loadStatistics()"
              [disabled]="loading"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <svg class="w-4 h-4 mr-2" [class.animate-spin]="loading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ loading ? 'Cargando...' : 'Actualizar' }}
            </button>
          </div>
        </div>

        <!-- Tarjetas de Estadísticas -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <!-- Usuarios -->
          <div class="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200" (click)="navigateToUsers()">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500">
                    <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.25"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Total Usuarios
                    </dt>
                    <dd class="text-3xl font-semibold text-gray-900">
                      {{ loading ? '...' : stats.users }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Actividades -->
          <div class="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200" (click)="navigateToActivities()">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="flex items-center justify-center h-12 w-12 rounded-md bg-green-500">
                    <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Total Actividades
                    </dt>
                    <dd class="text-3xl font-semibold text-gray-900">
                      {{ loading ? '...' : stats.activities }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Equipos -->
          <div class="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200" (click)="navigateToEquipments()">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500">
                    <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Total Equipos
                    </dt>
                    <dd class="text-3xl font-semibold text-gray-900">
                      {{ loading ? '...' : stats.equipments }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Áreas -->
          <div class="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200" (click)="navigateToAreas()">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500">
                    <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Total Áreas
                    </dt>
                    <dd class="text-3xl font-semibold text-gray-900">
                      {{ loading ? '...' : stats.areas }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Gráfico de Actividades por Día -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Actividades por Día (Últimos 7 días)</h2>
          <div class="h-80 w-full">
            <div *ngIf="isBrowser; else noChart" class="h-full w-full">
              <canvas 
                baseChart
                [data]="lineChartData"
                [options]="lineChartOptions"
                [type]="lineChartType"
                class="h-full w-full">
              </canvas>
            </div>
            <ng-template #noChart>
              <div class="flex items-center justify-center h-full">
                <div class="text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-gray-900">Cargando gráfico...</h3>
                  <p class="mt-1 text-sm text-gray-500">El gráfico se cargará cuando la página esté lista.</p>
                </div>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Estado del Sistema -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Estado del Sistema</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600">{{ stats.activities }}</div>
              <div class="text-sm text-gray-600">Actividades Totales</div>
            </div>
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">{{ stats.activeActivities || 0 }}</div>
              <div class="text-sm text-gray-600">Actividades Activas</div>
            </div>
            <div class="text-center p-4 bg-yellow-50 rounded-lg">
              <div class="text-2xl font-bold text-yellow-600">{{ stats.equipments }}</div>
              <div class="text-sm text-gray-600">Equipos Disponibles</div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                Error al cargar estadísticas
              </h3>
              <div class="mt-2 text-sm text-red-700">
                {{ error }}
              </div>
            </div>
          </div>
        </div>

      </div>
    </app-dashboard-layout>
  `
})
export class BlankComponent implements OnInit {
  
  stats = {
    users: 0,
    activities: 0,
    equipments: 0,
    areas: 0,
    activeActivities: 0
  };

  loading = true;
  error: string | null = null;

  // Propiedades para el gráfico
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Actividades Creadas',
        fill: true,
        tension: 0.5,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)'
      }
    ]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  };

  public lineChartType = 'line' as const;

  public isBrowser: boolean;

  constructor(
    private usersService: UsersService,
    private actividadesService: ActividadesService,
    private equiposService: EquiposService,
    private areasService: AreasService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.loadStatistics();
  }

  loadStatistics() {
    this.loading = true;
    this.error = null;

    // Hacer todas las peticiones en paralelo
    forkJoin({
      users: this.usersService.getUsers(),
      activities: this.actividadesService.getActivities(),
      equipments: this.equiposService.getEquipments(),
      areas: this.areasService.getAreas()
    }).subscribe({
      next: (data) => {
        this.stats.users = data.users?.length || 0;
        this.stats.activities = data.activities?.length || 0;
        this.stats.equipments = data.equipments?.length || 0;
        this.stats.areas = data.areas?.length || 0;
        
        // Calcular actividades activas (isBlocked = true)
        this.stats.activeActivities = data.activities?.filter(activity => activity.isBlocked)?.length || 0;
        
        // Procesar datos para el gráfico solo en el navegador
        if (this.isBrowser) {
          this.processChartData(data.activities || []);
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.error = 'No se pudieron cargar las estadísticas. Verifique la conexión con el servidor.';
        this.loading = false;
      }
    });
  }

  processChartData(activities: any[]) {
    // Solo procesar datos del gráfico en el navegador
    if (!this.isBrowser) {
      return;
    }
    
    // Obtener los últimos 7 días
    const last7Days = this.getLast7Days();
    
    // Contar actividades por día
    const activityCounts = last7Days.map(date => {
      const count = activities.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        return this.isSameDay(activityDate, date);
      }).length;
      return count;
    });

    // Formatear labels para mostrar día de la semana
    const labels = last7Days.map(date => 
      date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    );

    // Crear nueva referencia para forzar actualización
    this.lineChartData = {
      labels: labels,
      datasets: [
        {
          data: activityCounts,
          label: 'Actividades Creadas',
          fill: true,
          tension: 0.4,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(59, 130, 246)',
          pointHoverBorderWidth: 2,
          borderWidth: 2
        }
      ]
    };
  }

  // Métodos de navegación
  navigateToUsers() {
    this.router.navigate(['/dashboard/usuarios/listar']);
  }

  navigateToActivities() {
    this.router.navigate(['/dashboard/actividades']);
  }

  navigateToEquipments() {
    this.router.navigate(['/dashboard/equipos']);
  }

  navigateToAreas() {
    this.router.navigate(['/dashboard/areas']);
  }

  private getLast7Days(): Date[] {
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
} 