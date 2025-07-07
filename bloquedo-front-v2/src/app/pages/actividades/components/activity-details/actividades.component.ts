import { Component, Input, OnInit, signal, EventEmitter, Inject, PLATFORM_ID, OnDestroy, ViewChild } from '@angular/core';
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

  // Add platformId as class property
  private readonly platformId: Object;
  
  // Change from private to public getter
  public get totemId(): string {
    return this.totemService.getTotemId();
  }
  
  private subscriptions: Subscription[] = []; // Array para gestionar suscripciones
  showValidatorModal = false;
  showEditModal = false;
  selectedUser: any = null;
  activityId: number = 0;
  lockers: any[] = [];
  selectedLocker: string | null = null;

  activity: Activity = {
    assignedLockers: [
      {
        totemId: '',
        lockerId: ''
      }
    ],
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

  @ViewChild(ActivityUsersComponent) activityUsersComponent!: ActivityUsersComponent;

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
    this.platformId = platformId; // Store platformId as class property
  }

  /**
   * Inicializa el componente, carga los datos de usuarios, tótem y actividad
   * Configura los WebSockets para actualizaciones en tiempo real
   */
  ngOnInit() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      // Obtener el ID de la actividad desde la URL
      const activityId = this.route.snapshot.paramMap.get('id');
      console.log('ID de actividad desde URL:', activityId);
      
      if (activityId) {
        // Si tenemos un ID de actividad válido, cargar los datos
        this.activityService.getActivity(activityId).subscribe({
          next: (data) => {
            console.log('Datos de actividad cargados:', data);
            this.activity = data;
            this.energyOwners = data.energyOwners || [];
            
            // Después de cargar la actividad, cargar los casilleros
            // Primero intentamos cargar los casilleros directamente
            this.loadLockers();
            
            // También cargamos datos del tótem como respaldo
            this.loadTotemData();
            
            // Configurar escuchadores de WebSockets
            this.setupWebSocketListeners();
          },
          error: (error) => {
            console.error('Error al cargar la actividad:', error);
          }
        });
      }
    }
  }

  /**
   * Carga los datos del tótem y los casilleros de forma optimizada
   * Utiliza forkJoin para hacer peticiones en paralelo
   */
  loadTotemData() {
    if (!this.isBrowser) return;
    
    console.log('Cargando datos del tótem con id:', this.totemId);
    
    // Usar el getter totemId en lugar de this.TOTEM_ID
    const sub = this.totemService.getTotems(this.totemId, true).subscribe({
      next: (data: any) => {
        console.log('Respuesta completa de loadTotemData:', data);
        
        // Procesamiento similar a loadLockers
        if (data && Array.isArray(data.casilleros)) {
          this.lockers = data.casilleros;
          console.log('Casilleros cargados (desde data.casilleros):', this.lockers);
        } else if (data && Array.isArray(data)) {
          this.lockers = data;
          console.log('Casilleros cargados (directamente como array):', this.lockers);
        } else if (typeof data === 'object' && data !== null) {
          if (Array.isArray(data.casilleros)) {
            this.lockers = data.casilleros;
          } else {
            const possibleCasilleros = Object.values(data).find(
              (val: any) => Array.isArray(val) && val.length > 0 && val[0].status !== undefined
            );
            
            if (possibleCasilleros) {
              this.lockers = possibleCasilleros as any[];
              console.log('Casilleros cargados (encontrados en objeto):', this.lockers);
            } else {
              console.warn('No se encontraron casilleros en la respuesta:', data);
              this.lockers = [];
            }
          }
        } else {
          console.warn('No se encontraron casilleros o formato no reconocido');
          this.lockers = [];
        }

        // Después de cargar los casilleros, verificar los asignados a esta actividad y marcarlos como ocupados
        if (this.activity && this.activity._id && this.activity.assignedLockers && this.lockers.length > 0) {
          console.log('Verificando assignedLockers para actualizar estado:', this.activity.assignedLockers);
          
          // Para cada casillero asignado a esta actividad
          this.activity.assignedLockers.forEach((assignedLocker: any) => {
            // Encontrar el casillero correspondiente en la lista de casilleros cargados
            const locker = this.lockers.find(l => l._id === assignedLocker.lockerId);
            
            if (locker) {
              console.log(`Actualizando estado del casillero ${locker._id} a ocupado (estaba: ${locker.status})`);
              
              // Actualizar el estado en la interfaz local
              locker.status = 'ocupado';
              locker.activityId = this.activity._id;
              
              // Si el casillero está como disponible en el backend pero debería estar ocupado, actualizarlo también en el backend
              if (locker.status !== 'ocupado') {
                console.log(`Actualizando estado del casillero ${locker._id} en el backend a ocupado`);
                this.totemService.updateLockerStatus(this.totemId, locker._id, 'ocupado')
                  .subscribe({
                    next: () => console.log(`Casillero ${locker._id} actualizado en el backend`),
                    error: (err) => console.error(`Error al actualizar casillero ${locker._id} en el backend:`, err)
                  });
              }
              
              // Guardar el ID del último casillero asignado como seleccionado
              this.selectedLocker = locker._id;
            } else {
              console.warn(`Casillero asignado ${assignedLocker.lockerId} no encontrado en la lista de casilleros cargados`);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar los datos del tótem:', error);
        this.lockers = [];
      }
    });
    
    this.subscriptions.push(sub);
  }

  /**
   * Recarga datos de actividad y casilleros en paralelo
   * @param showLoadingIndicator Si es true, muestra un indicador de carga
   */

  /**
   * Carga los datos de la actividad desde el servidor
   */
  loadActivityData() {
    const activityId = this.route.snapshot.paramMap.get('id');
    console.log('Actualizando datos de actividad, ID:', activityId);
    
    if (activityId) {
      this.activityService.getActivity(activityId).subscribe({
        next: (data) => {
          console.log('Actividad actualizada:', data);
          this.activity = data;
          this.energyOwners = data.energyOwners || [];
          
          // Verificar si hay casilleros asignados a esta actividad
          if (data.assignedLockers && data.assignedLockers.length > 0) {
            console.log('Casilleros asignados a esta actividad:', data.assignedLockers);
            
            // Guardar el ID del último casillero asignado como seleccionado
            const lastAssignedLocker = data.assignedLockers[data.assignedLockers.length - 1];
            if (lastAssignedLocker) {
              this.selectedLocker = lastAssignedLocker.lockerId;
              console.log('Último casillero asignado seleccionado:', this.selectedLocker);
            }
          }
          
          // Al actualizar la actividad, también actualizamos los casilleros
          this.loadLockers();
          
          // Forzar la actualización de los estados de los casilleros después de cargar los datos
          // Usamos setTimeout para asegurar que primero se carguen los casilleros
          setTimeout(() => {
            if (data.assignedLockers && data.assignedLockers.length > 0 && this.lockers.length > 0) {
              data.assignedLockers.forEach((assignedLocker: any) => {
                const locker = this.lockers.find(l => l._id === assignedLocker.lockerId);
                if (locker && locker.status !== 'ocupado') {
                  console.log(`Actualizando estado del casillero ${locker._id} a ocupado desde loadActivityData`);
                  locker.status = 'ocupado';
                  locker.activityId = data._id;
                  
                  // También actualizar en el backend
                  this.totemService.updateLockerStatus(this.totemId, locker._id, 'ocupado')
                    .subscribe({
                      next: () => console.log(`Casillero ${locker._id} actualizado en el backend desde loadActivityData`),
                      error: (err) => console.error(`Error al actualizar casillero ${locker._id} en el backend:`, err)
                    });
                }
              });
            }
          }, 500);
        },
        error: (error) => {
          console.error('Error al actualizar la actividad:', error);
        }
      });
    }
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
      this.totemId,
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

    this.totemService.clearLocker(this.totemId, locker._id).subscribe({
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
    if (!status) return 'Estado desconocido';
    
    switch (status.toLowerCase()) {
      case 'disponible':
        return 'Disponible';
      case 'ocupado':
        return 'Ocupado';
      case 'mantenimiento':
        return 'En mantenimiento';
      case 'abierto':
        return 'Abierto';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
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
    this.totemService.clearAllLockers(this.totemId).subscribe((response: any) => {
      console.log('Todos los casilleros limpiados', response);
      this.loadTotemData();
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
   * Actualiza completamente todos los componentes de la UI después de un cambio importante
   * como bloquear o desbloquear la actividad
   */
  updateAllComponents() {
    console.log('Actualizando todos los componentes de la UI...');
    
    // 1. Actualizar datos de la actividad
    this.loadActivityData();
    
    // 2. Actualizar casilleros
    this.loadLockers();
    
    // 3. Forzar actualización del componente de usuarios si está disponible
    setTimeout(() => {
      if (this.activityUsersComponent) {
        console.log('Forzando actualización del componente de usuarios');
        this.activityUsersComponent.forceRefresh();
      }
    }, 100);
  }
  
  /**
   * Método bloquearActividad modificado
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
            // Actualizar el modelo de actividad con la respuesta
            if (response) {
              // Actualizar directamente el modelo de la actividad con los datos de la respuesta
              if (response.energyOwners) {
                this.activity.energyOwners = response.energyOwners;
              }
              this.activity.isBlocked = true;
            }
            
            // Si hay un casillero seleccionado, actualizarlo a ocupado
            if (this.selectedLocker) {
              // Actualizar manualmente el casillero en la interfaz
              const lockerIndex = this.lockers.findIndex(l => l._id === this.selectedLocker);
              if (lockerIndex !== -1) {
                this.lockers[lockerIndex].status = 'ocupado';
              }
              
              this.totemService.updateLockerStatus(this.totemId, this.selectedLocker, 'ocupado')
                .subscribe({
                  next: () => {
                    console.log('Casillero actualizado exitosamente en el backend');
                    
                    Swal.close();
                    Swal.fire({
                      icon: 'success',
                      title: 'Actividad bloqueada',
                      text: 'La actividad ha sido bloqueada y el casillero actualizado exitosamente'
                    }).then(() => {
                      // Después de cerrar el diálogo, actualizar todos los componentes
                      this.updateAllComponents();
                    });
                  },
                  error: (err) => {
                    console.error('Error detallado al actualizar casillero:', err);
                    Swal.close();
                    Swal.fire({
                      icon: 'warning',
                      title: 'Actividad bloqueada parcialmente',
                      text: 'La actividad se bloqueó pero hubo un error al actualizar el casillero'
                    }).then(() => {
                      // Aún así, actualizar todos los componentes
                      this.updateAllComponents();
                    });
                  }
                });
            } else {
              // No hay casillero seleccionado
              Swal.close();
              Swal.fire({
                icon: 'success',
                title: 'Actividad bloqueada',
                text: 'La actividad ha sido bloqueada exitosamente'
              }).then(() => {
                // Actualizar todos los componentes después de cerrar el diálogo
                this.updateAllComponents();
              });
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
    console.log('Cargando casilleros con totemId:', this.totemId);
    this.totemService.getTotems(this.totemId).subscribe({
      next: (data: any) => {
        console.log('Respuesta completa de casilleros:', data);
        
        // La estructura correcta puede variar según lo que vemos en DevTools
        if (data && Array.isArray(data.casilleros)) {
          // Si los casilleros vienen como un array dentro del objeto data
          this.lockers = data.casilleros;
          console.log('Casilleros cargados (desde data.casilleros):', this.lockers);
        } else if (data && Array.isArray(data)) {
          // Si los casilleros vienen directamente como un array
          this.lockers = data;
          console.log('Casilleros cargados (directamente como array):', this.lockers);
        } else if (typeof data === 'object' && data !== null) {
          // Si es un objeto pero no tiene la propiedad casilleros, podría ser directamente el totem
          if (Array.isArray(data.casilleros)) {
            this.lockers = data.casilleros;
          } else {
            // Intentar encontrar los casilleros de alguna forma
            const possibleCasilleros = Object.values(data).find(
              (val: any) => Array.isArray(val) && val.length > 0 && val[0].status !== undefined
            );
            
            if (possibleCasilleros) {
              this.lockers = possibleCasilleros as any[];
              console.log('Casilleros cargados (encontrados en objeto):', this.lockers);
            } else {
              console.warn('No se encontraron casilleros en la respuesta:', data);
              this.lockers = [];
            }
          }
        } else {
          console.warn('Formato de respuesta no reconocido:', data);
          this.lockers = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar los casilleros:', error);
        this.lockers = [];
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
  async assignLocker(locker: any) {
    // Si la actividad está bloqueada, no hacer nada
    if (this.activity.isBlocked) {
      return;
    }

    // Verificar si el casillero está ocupado
    if (locker.status === 'ocupado') {
      // No hacer nada, el casillero ya está ocupado
      console.log('El casillero ya está ocupado, no se puede asignar');
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

    try {
      // Mostrar loading
      Swal.fire({
        title: 'Asignando casillero',
        text: 'Por favor espere...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Obtener el ID del tótem del localStorage
      const totemId = localStorage.getItem('totemId');
      
      if (!totemId) {
        throw new Error('No se encontró el ID del tótem');
      }

      // Llamar al nuevo endpoint para asignar el casillero
      const response = await this.activityService.assignLockerToActivity(
        this.activity._id ?? '',
        {
          lockerId: locker._id,
          totemId: totemId
        }
      ).toPromise();

      // Actualizar el estado del casillero a "ocupado" en el backend
      await this.totemService.updateLockerStatus(
        totemId, 
        locker._id, 
        'ocupado'
      ).toPromise();

      // Actualizar el estado del casillero en la interfaz local
      const lockerIndex = this.lockers.findIndex(l => l._id === locker._id);
      if (lockerIndex !== -1) {
        this.lockers[lockerIndex].status = 'ocupado';
        this.lockers[lockerIndex].activityId = this.activity._id;
      }

      // Guardar el ID del casillero seleccionado para usarlo más tarde
      this.selectedLocker = locker._id;

      // Actualizar la UI
      Swal.fire({
        title: 'Éxito',
        text: 'Casillero asignado correctamente y marcado como ocupado',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      // Recargar los datos
      this.loadTotemData();
      this.loadActivityData();

    } catch (error: any) {
      console.error('Error al asignar casillero:', error);
      
      // Verificar si es un error HTTP con mensaje específico del backend
      if (error.error && error.error.mensaje) {
        // Mostrar el mensaje recibido del backend en un formato amigable
        Swal.fire({
          title: 'Información',
          text: error.error.mensaje,
          icon: 'info',
          confirmButtonText: 'Aceptar'
        });
      } else {
        // Mostrar mensaje de error genérico
        Swal.fire({
          title: 'Error',
          text: error.message || 'No se pudo asignar el casillero',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
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
      
      if (data.totemId === this.totemId) {
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

