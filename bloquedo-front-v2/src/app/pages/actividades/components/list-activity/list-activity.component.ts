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
import { WebsocketService } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-activity',
  standalone: true,
  imports: [CommonModule, ValidacionComponent, MatDialogModule],
  templateUrl: './list-activity.component.html',
  styleUrl: './list-activity.component.scss'
})
export class ListActivityComponent implements OnInit, OnDestroy {
  activities: Activity[] = [];
  loading = false;
  error: string | null = null;
  clientesConectados: any[] = [];
  miTotemId: string = '';
  private wsSubscription?: Subscription;


  constructor(
    private router: Router,
    private activityService: ActivityService,
    private dialog: MatDialog,
    private totemService: TotemService,
    public wsService: WebsocketService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
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
    if (isPlatformBrowser(this.platformId)) {
      this.wsSubscription = this.wsService.clientesConectados$.subscribe((clientes) => {
        console.log('📱 Tótems conectados actualizados:', clientes);
        this.clientesConectados = clientes;
      });
      this.miTotemId = this.wsService.miTotemId;
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
            this.activityService.getActivities().subscribe({
              next: (activities) => {
                this.activities = activities;
                Swal.fire('Éxito', 'Actividad finalizada y casillero liberado.', 'success');
              },
              error: (error) => {
                console.error('Error al recargar actividades:', error);
                this.error = error.message;
              }
            });
            console.log('Actividad desbloqueada:', response);
            // Primero liberar el casillero
            this.totemService.clearLocker(activityId, response.lockers[0]._id).subscribe({
              next: () => {
                // Refrescar la lista de actividades después de liberar el casillero
                Swal.fire('Éxito', 'Actividad finalizada y casillero liberado.', 'success');
              },
              error: (error) => {
                console.error('Error al liberar casillero:', error);
                Swal.fire('Error', 'No se pudo liberar el casillero.', 'error');
              }
            });
          },
          error: (error) => {
            console.error('Error al desbloquear actividad:', error);
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
}