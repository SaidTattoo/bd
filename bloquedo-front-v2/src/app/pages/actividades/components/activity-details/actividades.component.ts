import { Component, Input, OnInit, signal, EventEmitter, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Activity, EnergyValidation, LockerStatus, User } from '../../interface/activity.interface';
import { ActivityService } from '../../services/actividades.service';
import { TotemService } from '../../../services/totem.service';
import Swal from 'sweetalert2';
import { RouterModule } from '@angular/router';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

// Importación de componentes
import { CommonModule } from '@angular/common';
import { ActivityUsersComponent } from '../activity-users/activity-users.component';
import { EnergiaCeroComponent } from '../energia-cero/energia-cero.component';
import { AddValidatorModalComponent } from '../add-validator-modal/add-validator-modal.component';
import { ValidationDataService } from '../../services/validation-data.service';
import { MatDialog } from '@angular/material/dialog';
import { ValidacionComponent } from '../../validacion/validacion.component';
import { UsersService } from '../../../services/users.service';
import { ModalCambiarEnergyOwnerComponent } from '../modal-cambiar-energy-owner/modal-cambiar-energy-owner.component';
import { TecladoComponent } from '../../../teclado/teclado.component';
import { UserModalComponent } from '../user-modal/user-modal.component';
import { SocketService } from '../../../../services/socket.service';
import { environment } from '../../../../../environments/environment';

/**
 * Interfaz para definir la estructura de las respuestas de API
 */
interface ApiResponses {
  totem?: any[];
  activity?: any;
}

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [
    CommonModule,
    ActivityUsersComponent,
    UserModalComponent  ,
    EnergiaCeroComponent,
    AddValidatorModalComponent,
    TecladoComponent,
    RouterModule,
  ],
  templateUrl: './actividades.component.html',
  styleUrl: './actividades.component.scss'
})
export class ActividadesComponent implements OnInit, OnDestroy {

  // Estado y propiedades principales
  private readonly TOTEM_ID = environment.totem.id; // Usando el ID del totem desde environment
  private subscriptions: Subscription[] = []; // Array para gestionar suscripciones
  showValidatorModal = false;
  showEditModal = false;
  selectedUser: any = null;
  activityId: number = 0;
  lockers: any[] = [];
  selectedLocker: string | null = null;

  activity: Activity = {
    zeroEnergyValidation: undefined,
    energyOwners: [],
    name: '',
    pendingNewEnergyOwner: false,
    description: '',
    createdAt: '',
    blockType: '',
    lockers: [],
    equipments: [],
    isBlocked: false,
    selectedNewOwner: ''
  };

  defaultEnergyValidation: EnergyValidation = {
    validatorName: '',
    instrumentUsed: '',
    energyValue: 0
  };

  // Signal para la validación de energía cero
  zeroEnergyValidation = signal(this.activity.zeroEnergyValidation || {});
  energyOwners: any[] = [];
  private isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService,
    private totemService: TotemService,
    private validationDataService: ValidationDataService,
    private dialog: MatDialog,
    private usersService: UsersService,
    private socketService: SocketService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Inicializa el componente, carga los datos de usuarios, tótem y actividad
   * Configura los WebSockets para actualizaciones en tiempo real
   */
  ngOnInit() {
    // Solo cargar datos y establecer WebSockets si estamos en el navegador
    if (this.isBrowser) {
      this.route.params.subscribe(params => {
        this.activityId = +params['id'] || 0;
        
        const activityObservable = this.activityService.getActivity(params['id']);
        
        // Cargar datos con timeout de seguridad
        const subscription = activityObservable.pipe(
          timeout(10000) // 10 segundos de timeout
        ).subscribe({
          next: (activity) => {
            this.activity = activity;
            this.loadTotemData();
            this.setupWebSocketListeners();
            
            // Inicializar validaciones si existen
            if (activity.zeroEnergyValidation) {
              this.zeroEnergyValidation.set(activity.zeroEnergyValidation);
            }
            
            // Cargar propietarios de energía
            if (activity.energyOwners) {
              this.energyOwners = activity.energyOwners;
            }
          },
          error: (error) => {
            console.error('Error al cargar la actividad', error);
          }
        });
        
        // Limpiar suscripción si componente se destruye
        this.subscriptions.push(subscription);
      });
    } else {
      // En el servidor, establecer datos mínimos para renderizado
      console.log('Renderizando en servidor - modo simplificado');
      // Establecer datos mínimos sin esperar API
      this.activity = {
        _id: '0',
        name: 'Cargando actividad...',
        description: 'Cargando descripción...',
        isBlocked: false,
        blockType: '',
        createdAt: new Date().toISOString(), // Convert to string format
        energyOwners: [],
        // Add missing required properties
        lockers: [],
        equipments: [],
        pendingNewEnergyOwner: false,
        selectedNewOwner: ''
      };
    }
  }

  /**
   * Carga los datos del tótem y los casilleros de forma optimizada
   * Utiliza forkJoin para hacer peticiones en paralelo
   */
  loadTotemData() {
    if (!this.isBrowser) return; // No ejecutar en SSR
    
    const sub = this.totemService.getTotems(this.TOTEM_ID, true).subscribe({
      next: (totems) => {
        this.lockers = totems;
        // Procesar los casilleros si es necesario
      },
      error: (error) => {
        console.error('Error al cargar datos del totem', error);
      }
    });
    
    this.subscriptions.push(sub);
  }

  /**
   * Recarga datos de actividad y casilleros en paralelo
   * @param showLoadingIndicator Si es true, muestra un indicador de carga
   */

  /**
   * Carga los datos de la actividad basado en el ID de la ruta
   */
  loadActivityData() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id') ?? '';
      console.log(id);
      this.activityService.getActivity(id).subscribe({
        next: (activity: Activity) => {
          this.activity = activity;
          this.zeroEnergyValidation.set(activity.zeroEnergyValidation || {});
          
          // Si la actividad está bloqueada, buscar el casillero ocupado
          if (activity.isBlocked && activity.lockers) {
            const occupiedLocker = activity.lockers.find(l => l.status === 'ocupado');
            if (occupiedLocker) {
              this.selectedLocker = occupiedLocker._id;
              console.log('Casillero ocupado seleccionado:', this.selectedLocker);
            }
          }
        },
        error: (error) => {
          console.error('Error al cargar la actividad:', error);
        }
      });
    });
  }

  /**
   * Navega a la vista de lista de actividades
   */
  goBack() {
    this.router.navigate(['/']);
  }

  /**
   * Navega a la pantalla de selección de equipos para la actividad actual
   */
  navigateToEquipmentSelection() {
    this.router.navigate(['/equipment-selection', this.activity._id]);
  }

  /**
   * Abre el modal con información del usuario
   * @param user El usuario que se mostrará en el modal
   */
  openUserModal(user: any) {
    this.selectedUser = user;
  }

  /**
   * Cierra el modal de usuario
   */
  closeUserModal() {
    this.selectedUser = null;
  }

  /**
   * Actualiza los campos de la actividad con los valores proporcionados
   * @param updatedFields Campos actualizados de la actividad
   */
  updateActivity(updatedFields: Partial<Activity>) {
    this.activity = { ...this.activity, ...updatedFields };
    this.zeroEnergyValidation.set(this.activity.zeroEnergyValidation || {});
  }

  /**
   * Abre el modal para la validación de energía cero
   */
  openValidatorModal() {
    this.showValidatorModal = true;
  }

  /**
   * Registra los datos de validación de energía cero y actualiza la actividad
   * @param validation Datos de la validación de energía cero
   */
  addValidator(validation: EnergyValidation) {
    this.showValidatorModal = false;
    
    const activityId = this.route.snapshot.paramMap.get('id') || '';
    Swal.fire({
      title: 'Validando energía cero',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.activityService.validateEnergy(activityId, validation).subscribe({
      next: (response) => {
        Swal.close();
        Swal.fire({
          icon: 'success',
          title: 'Validación exitosa',
          text: 'La validación de energía cero ha sido registrada'
        });
        this.loadActivityData();
        this.markVerifiedEquipments();
      },
      error: (error) => {
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error?.error?.mensaje || 'Error al validar energía cero'
        });
      }
    });
  }

  /**
   * Asigna los equipos de la actividad al casillero seleccionado
   * @param locker Casillero donde se asignarán los equipos
   */
  private addEquipmentsToLocker(locker: any) {
    // Verificar si la actividad está bloqueada
    if (this.activity.isBlocked) {
      Swal.fire({
        title: 'Actividad Bloqueada',
        text: 'No se pueden modificar los equipos cuando la actividad está bloqueada.',
        icon: 'warning'
      });
      return;
    }

    // Verificar si la actividad tiene equipos
    if (!this.activity.equipments || this.activity.equipments.length === 0) {
      Swal.fire({
        title: 'Sin Equipos',
        text: 'Esta actividad no tiene equipos para asignar.',
        icon: 'info'
      });
      return;
    }

    // Mostrar detalle de los equipos de la actividad para diagnóstico
    console.log('Equipos en la actividad actual:');
    this.activity.equipments.forEach((equipment, index) => {
      console.log(`${index + 1}. ID: ${equipment._id}, Nombre: ${equipment.name}`);
    });

    // Mostrar detalle del casillero para diagnóstico
    console.log('Información del casillero seleccionado:');
    console.log(`ID: ${locker._id}, Nombre: ${locker.name}, Estado: ${locker.status}`);
    console.log('Equipos actuales:', locker.equipos || 'No tiene equipos asignados');

    // Mostrar indicador de carga
    Swal.fire({
      title: 'Asignando equipos',
      text: 'Por favor espere mientras se asignan los equipos...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Preparar los IDs de equipos para enviar
    const equipmentIds = this.activity.equipments.map(eq => eq._id);

    // Realizar la asignación directamente usando el método corregido
    this.totemService.assignEquipmentToLocker(
      equipmentIds,
      this.activity._id || '',
      this.TOTEM_ID,
      locker._id
    ).subscribe({
      next: (response) => {
        console.log('Respuesta exitosa de asignación de equipos:', response);
        
        // Actualizar datos locales
        this.selectedLocker = locker._id;
        
        // Usar la nueva función optimizada para recargar los datos
        // No mostramos indicador de carga aquí porque ya tenemos uno activo
    
        
        // Cerrar el loading y mostrar mensaje de éxito
        setTimeout(() => {
          Swal.close();
          Swal.fire({
            title: 'Equipos Asignados',
            text: `Se han asignado ${equipmentIds.length} equipos al casillero ${locker.name}`,
            icon: 'success',
            confirmButtonText: 'Aceptar'
          });
        }, 500); // Pequeño retraso para asegurar que la UI se actualice
      },
      error: (error) => {
        console.error('Error detallado al asignar equipos:', error);
        
        // Intentar recargar los datos de todas formas para mantener la UI actualizada
        this.loadTotemData();
        
        // Cerrar el loading y mostrar mensaje de error
        Swal.close();
        Swal.fire({
          title: 'Error en la Asignación',
          text: error?.error?.mensaje || 'No se pudieron asignar los equipos al casillero. Verifica que el servidor esté funcionando correctamente.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  /**
   * Elimina los equipos del casillero seleccionado
   * @param locker Casillero del que se eliminarán los equipos
   */
  private removeEquipmentsFromLocker(locker: any) {
    // Verificar si la actividad está bloqueada
    if (this.activity.isBlocked) {
      Swal.fire({
        title: 'Actividad Bloqueada',
        text: 'No se pueden modificar los equipos cuando la actividad está bloqueada.',
        icon: 'warning'
      });
      return;
    }

    if (!locker.equipos?.length) {
      Swal.fire({
        title: 'Casillero Vacío',
        text: 'Este casillero no tiene equipos para quitar.',
        icon: 'info'
      });
      return;
    }

    this.totemService.clearLocker(this.TOTEM_ID, locker._id).subscribe({
      next: (response: any) => {
        locker.status = 'disponible';
        locker.equipos = [];
        this.loadTotemData();
      },
      error: (error) => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron quitar los equipos',
          icon: 'error'
        });
      }
    });
  }

  /**
   * Actualiza el estado de un casillero específico
   * @param lockerId ID del casillero a actualizar
   * @param status Nuevo estado del casillero
   */
  updateLockerStatus(lockerId: string, status: string) {
    const locker = this.lockers.find(l => l._id === lockerId);
    if (locker) {
      locker.status = status;
      // Actualiza la interfaz si es necesario
      console.log(`Estado actualizado: Casillero ${lockerId} - ${status}`);
    }
  }

  /**
   * Desactiva los equipos asociados a la actividad
   */
  disableEquipments() {
    this.lockers.forEach(locker => {
      locker.equipos.forEach((equipment: any) => {
        equipment.status = 'disabled';
      });
    });
  }

  /**
   * Marca los equipos que han sido validados con energía cero
   */
  markVerifiedEquipments() {
    this.loadActivityData();
  const verifiedIds = new Set(
    this.activity.equipments
      .filter(equipment => equipment.zeroEnergyValidated)
      .map(equipment => equipment._id)
  );

  this.lockers.forEach(locker => {
    locker.equipments?.forEach((equipment: any) => {
      equipment.isVerified = verifiedIds.has(equipment._id);
    });
  });

  console.log("Equipos verificados actualizados:", this.lockers);
  }

  /**
   * Obtiene el texto de estado del casillero para mostrar en la UI
   * @param status Estado del casillero
   * @returns Texto descriptivo del estado
   */
  getLockerStatusText(status: string): string {
    switch (status) {
      case 'disponible': return 'Disponible';
      case 'ocupado': return 'Ocupado';
      case 'mantenimiento': return 'En Mantenimiento';
      case 'abierto': return 'Abierto';
      default: return status;
    }
  }

  /**
   * Obtiene las clases CSS para un casillero según su estado
   * @param status Estado del casillero
   * @returns Clases CSS para aplicar
   */
  getLockerClass(status: LockerStatus): string {
    const baseClass = 'rounded-lg border shadow-sm transition-all duration-200';
    switch (status) {
      case 'disponible': return `${baseClass} bg-white border-green-200 hover:border-green-300`;
      case 'ocupado': return `${baseClass} bg-white border-red-200 hover:border-red-300`;
      case 'mantenimiento': return `${baseClass} bg-white border-yellow-200 hover:border-yellow-300`;
      case 'abierto': return `${baseClass} bg-white border-blue-200 hover:border-blue-300`;
      default: return `${baseClass} bg-white border-gray-200 hover:border-gray-300`;
    }
  }

  /**
   * Obtiene las clases CSS para el icono del casillero según su estado
   * @param status Estado del casillero
   * @returns Clases CSS para el icono
   */
  getLockerIconClass(status: LockerStatus): string {
    switch (status) {
      case 'disponible': return 'text-green-500';
      case 'ocupado': return 'text-red-500';
      case 'mantenimiento': return 'text-yellow-500';
      case 'abierto': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  }

  /**
   * Obtiene las clases CSS para mostrar el estado visual del casillero
   * @param status Estado del casillero
   * @returns Clases CSS para el estado visual
   */
  getLockerStatusClass(status: LockerStatus): string {
    switch (status) {
      case 'disponible': return 'text-green-600';
      case 'ocupado': return 'text-red-600';
      case 'mantenimiento': return 'text-yellow-600';
      case 'abierto': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }

  /**
   * Obtiene las clases CSS para un equipo según su estado
   * @param status Estado del equipo
   * @returns Clases CSS para mostrar el estado
   */
  getEquipmentStatusClass(status: any): string {
    switch (status) {
      case 'En mantenimiento': return 'bg-yellow-100 text-yellow-800';
      case 'Operativo': return 'bg-green-100 text-green-800';
      case 'Fuera de servicio': return 'bg-red-100 text-red-800';
      case 'En uso': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Limpia todos los casilleros del tótem
   */
  clearAllLockers() {
    this.lockers.forEach(locker => {
      locker.status = 'disponible';
      locker.equipos = [];
      locker.activityId = null;
    });

    // Llamada al servicio para actualizar el estado en el backend si es necesario
    this.totemService.clearAllLockers(this.TOTEM_ID).subscribe((response: any) => {
      console.log("Todos los casilleros han sido limpiados:", response);
    });

    Swal.fire({
      title: 'Casilleros Limpiados',
      text: 'Todos los casilleros han sido limpiados exitosamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar',
    });
  }

  /**
   * Muestra modal para validar y seleccionar nuevo dueño de energía
   */
  validationModal() {
    const dialogRef = this.dialog.open(ValidacionComponent);

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);

      // Solo continúa si la validación fue exitosa
      if (result && result.verificationStatus === 'verified') {
        // Abre el segundo modal con los datos de validación obtenidos
        const dialogRefEnergyOwner = this.dialog.open(ModalCambiarEnergyOwnerComponent, {
          width: '800px',
          height: 'auto',
          panelClass: 'user-selector-dialog',
          data: {
            energyOwners: this.energyOwners,
            activityId: this.activity._id || '',
            supervisorId: result.user ? result.user._id : '',  // Utiliza el ID de usuario si está presente
            validatedUser: result  // Pasamos todos los datos del usuario validado
          }
        });
        dialogRefEnergyOwner.afterClosed().subscribe(userSelected => {
          console.log(userSelected)
          const activityId = this.activity._id ?? '';
          this.activityService.pendingStatusActivity(activityId, userSelected.user._id).subscribe((response: any) => {
            console.log('response', response);
            this.loadActivityData();
          });
        })
        // Actualizar el estado de la actividad

      } else {
        console.log('La validación falló o el usuario cerró el modal sin validar.');
      }
    });
  }

  /**
   * Bloquea la actividad y asigna un dueño de energía
   * Verifica previamente que existan equipos asignados y validación de energía cero
   */
  bloquearActividad() {
    // Verificar que haya equipos asignados y validación de energía cero
    if (this.activity.equipments.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede bloquear',
        text: 'No hay equipos asignados a esta actividad.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (!this.activity.zeroEnergyValidation?.validatorName) {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede bloquear',
        text: 'No se ha completado la validación de energía cero.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const dialogRef = this.dialog.open(ValidacionComponent);
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.verificationStatus === 'verified') {
        // Mostrar indicador de carga
        Swal.fire({
          title: 'Bloqueando actividad',
          text: 'Por favor espere...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        const activityId = this.route.snapshot.paramMap.get('id') || '';
        
        // Primera operación: asignar dueño de energía
        this.activityService.asignarDuenoDeEnergia(activityId, {userId: result.user._id}).subscribe({
          next: (response) => {
            // Si hay un casillero seleccionado, actualizarlo a ocupado
            if (this.selectedLocker) {
              // Actualizar manualmente el casillero en la interfaz
              const lockerIndex = this.lockers.findIndex(l => l._id === this.selectedLocker);
              if (lockerIndex !== -1) {
                this.lockers[lockerIndex].status = 'ocupado';
              }
              
              this.totemService.updateLockerStatus(this.TOTEM_ID, this.selectedLocker, 'ocupado')
                .subscribe({
                  next: () => {
                    console.log('Casillero actualizado exitosamente en el backend');
                    // Forzar una actualización inmediata
                    setTimeout(() => this.loadLockers(), 500);
                    
                    Swal.close();
                    Swal.fire({
                      icon: 'success',
                      title: 'Actividad bloqueada',
                      text: 'La actividad ha sido bloqueada y el casillero actualizado exitosamente'
                    });
                    
                    // Actualizar datos usando el método optimizado
               
                  },
                  error: (err) => {
                    console.error('Error detallado al actualizar casillero:', err);
                    Swal.close();
                    Swal.fire({
                      icon: 'warning',
                      title: 'Actividad bloqueada parcialmente',
                      text: 'La actividad se bloqueó pero hubo un error al actualizar el casillero'
                    });
                    this.loadActivityData();
                  }
                });
            } else {
              // No hay casillero seleccionado
              Swal.close();
              Swal.fire({
                icon: 'success',
                title: 'Actividad bloqueada',
                text: 'La actividad ha sido bloqueada exitosamente'
              });
              // Usar el método optimizado en lugar de solo cargar datos de actividad
          
            }
          },
          error: (error) => {
            console.error('Error detallado al asignar dueño de energía:', error);
            Swal.close();
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error?.error?.mensaje || 'Error al bloquear la actividad'
            });
          }
        });
      }
    });
  }

  /**
   * Carga los casilleros disponibles del tótem
   */
  loadLockers() {
    const activityId = this.route.snapshot.paramMap.get('id') || '';
    console.log('Cargando casilleros para actividad:', activityId);
    
    // Para ver exactamente qué está devolviendo el backend
    this.totemService.getTotems(this.TOTEM_ID).subscribe({
      next: (data) => {
        console.log('Casilleros recibidos:', data);
        this.lockers = data;
        
        // Buscar el casillero seleccionado
        if (this.selectedLocker) {
          const selected = this.lockers.find(l => l._id === this.selectedLocker);
          console.log('Estado actual del casillero seleccionado:', selected?.status);
        }
      },
      error: (error) => {
        console.error('Error detallado al cargar casilleros:', error);
      }
    });
  }

  /**
   * Procesa la aceptación del nuevo dueño de energía propuesto
   */
  aceptarNuevoDueno(){
    console.log('###############')
    const dialogRef = this.dialog.open(ValidacionComponent);
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
      const activityId = this.activity._id ?? '';
      console.log(this.activity.selectedNewOwner, result.user._id)

      if(result.perfil!== 'duenoDeEnergia') {
        Swal.fire({
          title: 'Error',
          text:'No Eres un Dueno de energia, no puedes hacer esto '
        })
      }else{
        if(this.activity.selectedNewOwner === result.user._id){
          Swal.fire({
              title:'Eres el usuario seleccionado para cambio de dueno de energia '
          }).then((confirmResult) => {
            if(confirmResult.isConfirmed){
              this.activityService.cambiarDuenoDeEnergia(activityId, { userId: result.user._id }).subscribe((response) => {
                console.log('response', response);
                this.loadActivityData();
                Swal.fire({
                  icon: 'success',
                  title: 'Actividad bloqueada',
                  text: 'La actividad ha sido bloqueada exitosamente'
                });
              });
            }
          })
        }else if(this.activity.selectedNewOwner !== result.user._id && this.activity.energyOwners[0]?.user._id !==  result.user._id){
          Swal.fire({
            icon:'warning',
            title:'¿Estás Seguro de Tomar el cargo de DE?',
            text:'Usted no es una persona seleccionada',
            showCancelButton: true,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'
         }).then((confirmResult) => {
          if(confirmResult.isConfirmed){
            console.log('result', confirmResult)
            this.activityService.cambiarDuenoDeEnergia(activityId, { userId: result.user._id }).subscribe((response) => {
              console.log('response', response);
              this.loadActivityData();
              Swal.fire({
                icon: 'success',
                title: 'Actividad bloqueada',
                text: 'La actividad ha sido bloqueada exitosamente'
              });
            });
          }
         })
        }else if(this.activity.energyOwners[0]?.user._id ===  result.user._id){
          Swal.fire({
            icon:'warning',
            title:'Acabas de solicitar el cambio de dueno de energia',
            text: 'Estas seguro que quieres volver a ser el dueno de energia de esta actividad',
          }).then((confirmResult) => {
              if(confirmResult.isConfirmed ) {
                this.activityService.cambiarDuenoDeEnergia(activityId, { userId: result.user._id }).subscribe((response) => {
                  console.log('response', response);
                  this.loadActivityData();
                  Swal.fire({
                    icon: 'success',
                    title: 'Actividad bloqueada',
                    text: 'La actividad ha sido bloqueada exitosamente'
                  });
                });
              }
          })
        }
      }
      console.log('cambiado el dueno de energia ', activityId)

    } )
  }

  /**
   * Obtiene el nombre del dueño de energía a partir de su ID
   * @param ownerId ID del dueño de energía
   * @returns Nombre del dueño de energía
   */
  getEnergyOwnerName(ownerId: string): string {
    if (!ownerId || !this.energyOwners) return 'No especificado';
    
    const owner = this.energyOwners.find(owner => owner._id === ownerId);
    return owner ? owner.nombre : 'No especificado';
  }

  /**
   * Limpia recursos cuando el componente se destruye
   */
  ngOnDestroy() {
    // Desuscribirse de todos los observables
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Si ya tenías código en ngOnDestroy, mantenlo
    if (this.socketService.isConnected()) {
      console.log('Desconectando socket en la destrucción del componente');
      this.socketService.disconnect();
    }
  }

  /**
   * Asigna un casillero a la actividad actual
   * @param locker Casillero seleccionado para asignar
   */
  assignLocker(locker: any) {
    // Si la actividad está bloqueada, no hacer nada
    if (this.activity.isBlocked) {
      return;
    }

    // Solo verificar si está en mantenimiento
    if (locker.status === 'mantenimiento') {
      Swal.fire({
        title: 'Casillero en Mantenimiento',
        text: `El casillero ${locker.name} está en mantenimiento.`,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    // Verificar si ya hay un casillero ocupado POR ESTA ACTIVIDAD
    const existeCasilleroOcupadoPorEstaActividad = this.lockers.some(
      l => l.status === 'ocupado' && l.activityId === this.activity._id
    );

    if (existeCasilleroOcupadoPorEstaActividad && locker.status === 'disponible') {
      Swal.fire({
        title: 'Casillero en Uso',
        text: 'Ya hay un casillero ocupado para esta actividad.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    // Si el casillero ya está ocupado y pertenece a esta actividad, podemos agregar equipos
    if (locker.status === 'ocupado' && locker.activityId === this.activity._id) {
      this.addEquipmentsToLocker(locker);
      return;
    }

    // Si el casillero está disponible, asignar equipos
    if (locker.status === 'disponible') {
      this.addEquipmentsToLocker(locker);
      return;
    }

    // Si el casillero está ocupado por otra actividad, mostrar mensaje
    if (locker.status === 'ocupado' && locker.activityId !== this.activity._id) {
      Swal.fire({
        title: 'Casillero Ocupado',
        text: 'Este casillero está siendo utilizado por otra actividad.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
      return;
    }
  }

  /**
   * Configura los WebSockets para actualizaciones en tiempo real
   */
  setupWebSocketListeners() {
    if (!this.isBrowser) return; // No ejecutar en SSR
    
    // First, subscribe to the connection status
    this.socketService.isConnected().subscribe(connected => {
      console.log('Socket connection status:', connected ? 'Connected' : 'Disconnected');
      
      if (connected) {
        console.log('Socket conectado, configurando listeners...');
        this.setupSocketEvents();
      }
    });
  }
  
  private setupSocketEvents() {
    this.socketService.listen('locker-status-changed').subscribe((data: any) => {
      console.log('Evento locker-status-changed recibido:', data);
      
      if (data.totemId === this.TOTEM_ID) {
        const locker = this.lockers.find(l => l._id === data.lockerId);
        if (locker) {
          locker.status = data.status;
          this.loadActivityData();
        }
      }
    });

    this.socketService.listen('activity-updated').subscribe((data: any) => {
      console.log('Evento activity-updated recibido:', data);
      
      if (data.activityId === this.activityId) {
        this.loadActivityData();
      }
    });
  }

}

