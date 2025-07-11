import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { Activity } from '../../interface/activity.interface';
import { Router } from '@angular/router';
import { ActivityService } from '../../services/actividades.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
  imports: [CommonModule, ValidacionComponent, MatDialogModule],
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
    const dialogRef = this.dialog.open(ValidacionComponent);
    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result);
      if(result.perfil === 'duenoDeEnergia'){
         this.activityService.unlockActivity(activityId, result).subscribe({
          next: (response) => {
            console.log('Respuesta de unlockActivity:', response);
            console.log('Lockers en la respuesta:', response.lockers);
            const activity:any = this.activities.find(activity => activity._id === activityId);
            this.totemService.updateLockerStatus(activity.assignedLockers.totemId, activity.assignedLockers.lockerId, 'disponible')         
               if (!response.lockers || !response.lockers.length) {
              console.error('No hay casilleros en la respuesta');
              return;
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
              },
              error: (error) => {
                console.error('Error al desbloquear actividad:', error);
                Swal.fire('Error', 'No se pudo desbloquear la actividad', 'error');
              }
            });
      
      }
    });
  }

  navigateToCreateUser(){
    this.router.navigate(['/dashboard/crear-usuario']);
  }

  toggleTotemList() {
    this.showTotemList = !this.showTotemList;
  }
}