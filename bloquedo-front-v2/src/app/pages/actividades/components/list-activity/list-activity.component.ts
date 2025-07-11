import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { Activity } from '../../interface/activity.interface';
import { Router } from '@angular/router';
import { ActivityService } from '../../services/actividades.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ValidacionComponent } from '../../validacion/validacion.component';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { TotemService } from '../../../services/totem.service';
import { Subscription } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';
import { SocketService } from '../../../../services/socket.service';
import { forkJoin } from 'rxjs';


@Component({
  selector: 'app-list-activity',
  standalone: true,
  imports: [CommonModule, ValidacionComponent, MatDialogModule, HttpClientModule],
  templateUrl: './list-activity.component.html',
  styleUrl: './list-activity.component.scss',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ 
          transform: 'translateX(100%)',
          opacity: 0 
        }),
        animate('300ms ease-out', style({ 
          transform: 'translateX(0%)',
          opacity: 1 
        }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ 
          transform: 'translateX(100%)',
          opacity: 0 
        }))
      ])
    ]),
    trigger('expandPanel', [
      transition(':enter', [
        style({ 
          transform: 'scale(0.3)',
          opacity: 0,
          width: '25px',
          height: '25px'
        }),
        animate('150ms ease-out', style({
          transform: 'scale(1)',
          opacity: 1,
          width: '220px',
          height: 'auto'
        }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({
          transform: 'scale(0.3)',
          opacity: 0,
          width: '25px',
          height: '25px'
        }))
      ])
    ])
  ]
})
export class ListActivityComponent implements OnInit, OnDestroy {
  activities: Activity[] = [];
  loading = false;
  error: string | null = null;
  clientesConectados: any[] = [];
  miTotemId: string = '';
  private wsSubscription?: Subscription;
  showTotemList = false;
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private activityService: ActivityService,
    private dialog: MatDialog,
    private totemService: TotemService,
    public socketService: SocketService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.miTotemId = localStorage.getItem('totemId') || '';
    }
  }
  encenderLuz(){
    this.totemService.encenderLuz().subscribe((response) => {
      console.log('Luz encendida:', response);
    });
  }
  apagarLuz(){
    this.totemService.apagarLuz().subscribe((response) => {
      console.log('Luz apagada:', response);
    });
  }
  ngOnInit() {
    if (this.isBrowser) {
      this.wsSubscription = this.socketService.clientesConectados$.subscribe((clientes: any[]) => {
        console.log('📱 Tótems conectados actualizados:', clientes);
        this.clientesConectados = clientes;
      });
      this.miTotemId = this.socketService.miTotemId;
    }

    this.loadActivities();
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  private loadActivities() {
    this.loading = true;
    this.activityService.getActivities().subscribe({
      next: (activities) => {
        this.activities = activities;
        this.loading = false;
        this.error = null;
      },
      error: (error) => {
        console.error('Error al cargar actividades:', error);
        this.loading = false;
        this.error = error.message;
        this.activities = [];
      }
    });
  }

  navigateToDetail(id:string) {

 
      this.router.navigate(['/detail', id]);
  
    
  }
  createActivity() {
    console.log('Navegando a crear actividad...');
    this.router.navigate(['/dashboard/crear-actividad'])
      .then(() => {
        console.log('Navegación exitosa');
      })
      .catch(error => {
        console.error('Error en la navegación:', error);
        // Intenta una ruta alternativa si la primera falla
        this.router.navigate(['/crear-actividad'])
          .catch(err => console.error('Error en la navegación alternativa:', err));
      });
  }

  navigateToDashboard() {
    console.log('Navegando al dashboard...');
    this.router.navigate(['/dashboard'])
      .then(() => {
        console.log('Navegación al dashboard exitosa');
      })
      .catch(error => {
        console.error('Error en la navegación al dashboard:', error);
      });
  }
  getStatusColor(activity: Activity): string {
    const hasBlockedOwner = activity.energyOwners?.some(owner => owner.user.isActive === true);
    return hasBlockedOwner ? 'bg-teal-500' : 'bg-emerald-500';
  }

  hasBlockedUsers(activity: Activity): boolean {
    
   /*  return activity.energyOwners?.some(owner => 
      owner.isActive === false || 
      owner.blocks?.some(supervisor => 
        supervisor.isBlocked === 'blocked' ||
        supervisor.blocks?.some(worker => worker.isBlocked === 'blocked')
      )
    ) || false; */
     return true
  }

  hasClosedLockers(activity: Activity): boolean {
    return activity.lockers?.some(locker => locker.status === 'ocupado') || false;
  }

  hasEnergyValidation(activity: Activity): boolean {
    return activity.zeroEnergyValidation?.energyValue === 0.0;
  }

  unlockActivity(activityId: string) {
    console.log('Desbloqueando actividad:', activityId);
    const dialogRef = this.dialog.open(ValidacionComponent);
    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result);
      if(result.perfil === 'duenoDeEnergia'){
         this.activityService.unlockActivity(activityId, result).subscribe({
          next: async (response) => {
            console.log('Respuesta de unlockActivity:', response);
            console.log('Lockers en la respuesta:', response.lockers);
            
            // Encontrar la actividad actual
            const activity: any = this.activities.find(activity => activity._id === activityId);
            
               if (!response.lockers || !response.lockers.length) {
              console.error('No hay casilleros en la respuesta');
              return;
            }

            // Abrir la cerradura física si hay casilleros asignados
            if (activity.assignedLockers && activity.assignedLockers.length > 0) {
              const assignedLocker = activity.assignedLockers[0]; // Tomar el primer casillero asignado
              
              console.log('🔓 Abriendo cerradura física para el casillero:', assignedLocker);
              
              try {
                // Extraer el número del casillero del nombre
                const boxNumber = this.extractBoxNumber(assignedLocker.lockerName || 'CASILLERO 1');
                console.log('🔢 Número extraído del casillero:', boxNumber);
                
                // Llamar al endpoint para abrir físicamente el casillero
                const openBoxResponse = await this.http.post('http://localhost:4000/openbox', {
                  numberBox: boxNumber
                }).toPromise();
                
                console.log('✅ Cerradura abierta físicamente:', openBoxResponse);
                
                // Mostrar mensaje de éxito
                Swal.fire({
                  title: '¡Desbloqueo Completado!',
                  html: `
                    <div class="text-left space-y-2">
                      <p><strong>✅ Actividad desbloqueada</strong></p>
                      <p><strong>✅ Cerradura abierta físicamente</strong></p>
                      <p><strong>✅ Casillero "${assignedLocker.lockerName}" disponible</strong></p>
                    </div>
                  `,
                  icon: 'success',
                  confirmButtonText: 'Aceptar',
                  timer: 4000
                });
                
                // Ocultar la actividad de la vista
                this.activities = this.activities.filter(act => act._id !== activityId);
                
                // Actualizar el estado del casillero
                this.totemService.updateLockerStatus(
                  assignedLocker.totemId, 
                  assignedLocker.lockerId, 
                  'disponible'
                );
                
              } catch (error) {
                console.error('❌ Error al abrir la cerradura físicamente:', error);
                
                // Mostrar mensaje de éxito parcial (desbloqueo exitoso pero error al abrir cerradura)
                Swal.fire({
                  title: 'Actividad Desbloqueada',
                  text: `La actividad fue desbloqueada correctamente, pero hubo un problema al abrir la cerradura físicamente.`,
                  icon: 'warning',
                  confirmButtonText: 'Aceptar'
                });
                
                // Ocultar la actividad de la vista aunque haya error en la cerradura
                this.activities = this.activities.filter(act => act._id !== activityId);
              }
            } else {
              // Si no hay casilleros asignados, solo ocultar la actividad
              Swal.fire('Éxito', 'Actividad desbloqueada correctamente', 'success');
              this.activities = this.activities.filter(act => act._id !== activityId);
            }
          },
          error: (error) => {
            console.error('Error completo al desbloquear actividad:', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo desbloquear la actividad',
              icon: 'error'
            });
          }
        });
       }else if(result.perfil === 'supervisor'){
        this.activityService.desbloquearSupervisor(activityId, result).subscribe({
          next: (response) => {
            console.log('Actividad desbloqueada:', response);
            // Refrescar la lista de actividades
            Swal.fire('Éxito', 'Actividad desbloqueada correctamente', 'success');
            this.loadActivities(); // Recargar para ver cambios
          },
          error: (error) => {
            console.error('Error al desbloquear actividad:', error);
            Swal.fire({
              title: 'Error',
              text: 'El supervisor no puede desbloquear la actividad ya que tiene trabajadores asignados',
              icon: 'error'
            });
          }
        });
       
       } else if(result.perfil === 'trabajador'){
            this.activityService.desbloquearTrabajador(activityId, result).subscribe({
              next: (response) => {
                console.log('Actividad desbloqueada:', response);
                Swal.fire('Éxito', 'Actividad desbloqueada correctamente', 'success');
                this.loadActivities(); // Recargar para ver cambios
              },
              error: (error) => {
                console.error('Error al desbloquear actividad:', error);
                Swal.fire('Error', 'No se pudo desbloquear la actividad', 'error');
              }
            });
      
      }
    });
  }

  /**
   * Extrae el número del casillero del nombre
   * Ejemplos: "CASILLERO 1" -> 1, "Casillero 5" -> 5, "LOCKER 10" -> 10
   */
  private extractBoxNumber(lockerName: string): number {
    if (!lockerName) return 1;
    
    // Buscar cualquier número en el nombre del casillero
    const numberMatch = lockerName.match(/\d+/);
    if (numberMatch) {
      return parseInt(numberMatch[0]);
    }
    
    // Si no hay número, intentar extraer de diferentes formatos
    const patterns = [
      /casillero\s*(\d+)/i,
      /locker\s*(\d+)/i,
      /box\s*(\d+)/i,
      /(\d+)/  // Cualquier número
    ];
    
    for (const pattern of patterns) {
      const match = lockerName.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1]);
      }
    }
    
    // Valor por defecto si no se puede extraer
    console.warn(`No se pudo extraer número del casillero: "${lockerName}", usando valor por defecto: 1`);
    return 1;
  }

  navigateToCreateUser(){
    this.router.navigate(['/dashboard/crear-usuario']);
  }

  toggleTotemList() {
    this.showTotemList = !this.showTotemList;
  }
}