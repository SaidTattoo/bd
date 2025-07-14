import { Component, Input, OnInit, signal, EventEmitter, Inject, PLATFORM_ID, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Activity, EnergyValidation, LockerStatus, User } from '../../interface/activity.interface';
import { ActivityService } from '../../services/actividades.service';
import { ActividadesService } from '../../../services/actividades.service';
import { TotemService } from '../../../services/totem.service';
import Swal from 'sweetalert2';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

// Importación de componentes
import { CommonModule } from '@angular/common';
import { ActivityUsersComponent } from '../activity-users/activity-users.component';
import { EnergiaCeroComponent } from '../energia-cero/energia-cero.component';
import { AddValidatorModalComponent } from '../add-validator-modal/add-validator-modal.component';

import { ValidationDataService } from '../../services/validation-data.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ValidacionComponent } from '../../validacion/validacion.component';
import { UsersService } from '../../../services/users.service';
import { ModalCambiarEnergyOwnerComponent } from '../modal-cambiar-energy-owner/modal-cambiar-energy-owner.component';
import { TecladoComponent } from '../../../teclado/teclado.component';
import { UserModalComponent } from '../user-modal/user-modal.component';
import { SocketService } from '../../../../services/socket.service';
import { environment } from '../../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormularioVerificacionEnergiaCeroComponent } from '../formulario-verificacion-energia-cero/formulario-verificacion-energia-cero.component';

/**
 * Interfaz para definir la estructura de las respuestas de API
 */
interface ApiResponses {
  totem?: any[];
  activity?: any;
}

// Nueva interfaz para representar conflictos de asignación de casilleros
interface LockerConflict {
  lockerId: string;
  lockerName: string;
  totemId: string;
  conflictingActivities: {
    activityId: string;
    activityName: string;
    assignedAt: Date;
  }[];
  severity: 'warning' | 'error';
}

interface LockerAssignment {
  activityId: string;
  activityName: string;
  lockerId: string;
  assignedAt: Date;
}

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule, ActivityUsersComponent, AddValidatorModalComponent, UserModalComponent, EnergiaCeroComponent, MatSnackBarModule, HttpClientModule],
  templateUrl: './actividades.component.html',
  styleUrls: ['./actividades.component.scss']
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
  showSupervisorModal = false; // Nuevo modal para seleccionar supervisor
  selectedUser: any = null;
  supervisors: any[] = []; // Lista de supervisores disponibles
  selectedSupervisor: any = null; // Supervisor seleccionado
  currentWorkerData: any = null; // Datos del trabajador actual
  activityId: number = 0;
  lockers: any[] = [];
  selectedLocker: string | null = null;
  actividadesActivas: Activity[] = []; // Almacenar actividades activas para referencia

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
    status: 'pendiente',
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

  // Nuevas propiedades para manejo de conflictos
  lockerConflicts: LockerConflict[] = [];
  showConflictModal = false;
  selectedConflict: LockerConflict | null = null;
  lastUpdated: Date | null = null;
  isLoadingLockers: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService,
    private actividadesService: ActividadesService,
    private totemService: TotemService,
    private validationDataService: ValidationDataService,
    private dialog: MatDialog,
    private usersService: UsersService,
    private socketService: SocketService,
    @Inject(PLATFORM_ID) platformId: Object,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
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
         //   this.setupWebSocketListeners();
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
   * Obtiene las clases CSS apropiadas según el estado del equipo
   * @param equipment Objeto equipo
   * @returns Clases CSS para mostrar el estado
   */
  getEquipmentStatusClass(equipment: any): string {
    if (equipment.locked) {
      return 'bg-red-100 text-red-800';
    }
    if (equipment.zeroEnergyValidated) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtiene el texto del estado del equipo
   * @param equipment Objeto equipo
   * @returns Texto del estado
   */
  getEquipmentStatusText(equipment: any): string {
    if (equipment.locked) {
      return 'Bloqueado';
    }
    if (equipment.zeroEnergyValidated) {
      return 'Validado';
    }
    return 'Disponible';
  }

  /**
   * Limpia todos los casilleros del tótem
   */
  clearAllLockers() {
    this.lockers.forEach(locker => {
      if (locker.status === 'ocupado') {
        this.updateLockerStatus(locker._id, 'disponible');
      }
    });
  }

  /**
   * Función auxiliar para obtener el ID del usuario desde el resultado del modal de validación
   * Maneja tanto la estructura de autenticación por credenciales como por huella
   */
  private getUserIdFromValidationResult(result: any): string {
    console.log('🔍 DEBUG - getUserIdFromValidationResult - result completo:', result);
    
    if (!result) {
      console.log('❌ getUserIdFromValidationResult - result es null/undefined');
      return '';
    }
    
    if (result.user) {
      console.log('🔍 DEBUG - getUserIdFromValidationResult - result.user:', result.user);
      
      // Si viene de autenticación por huella (estructura nueva)
      if (result.user.usuario && result.user.usuario._id) {
        console.log('✅ getUserIdFromValidationResult - Extrayendo ID de estructura de huella (result.user.usuario._id):', result.user.usuario._id);
        return result.user.usuario._id;
      }
      // Si viene de autenticación por huella con 'id' en lugar de '_id'
      if (result.user.usuario && result.user.usuario.id) {
        console.log('✅ getUserIdFromValidationResult - Extrayendo ID de estructura de huella (result.user.usuario.id):', result.user.usuario.id);
        return result.user.usuario.id;
      }
      // Si viene de autenticación por credenciales (estructura original)
      if (result.user._id) {
        console.log('✅ getUserIdFromValidationResult - Extrayendo ID de estructura de credenciales (result.user._id):', result.user._id);
        return result.user._id;
      }
      // Si result.user tiene un campo 'id' en lugar de '_id'
      if (result.user.id) {
        console.log('✅ getUserIdFromValidationResult - Extrayendo ID de result.user.id:', result.user.id);
        return result.user.id;
      }
    }
    
    // Intentar extraer directamente del result si tiene _id
    if (result._id) {
      console.log('✅ getUserIdFromValidationResult - Extrayendo ID directamente del result (_id):', result._id);
      return result._id;
    }
    
    // Si result tiene un campo 'id' en lugar de '_id'
    if (result.id) {
      console.log('✅ getUserIdFromValidationResult - Extrayendo ID directamente del result (id):', result.id);
      return result.id;
    }
    
    console.log('❌ getUserIdFromValidationResult - No se pudo extraer ID, retornando string vacío');
    console.log('❌ Estructura disponible en result:', Object.keys(result));
    if (result.user) {
      console.log('❌ Estructura disponible en result.user:', Object.keys(result.user));
    }
    return '';
  }

  /**
   * Función auxiliar para obtener el objeto usuario desde el resultado del modal de validación
   * Maneja tanto la estructura de autenticación por credenciales como por huella
   */
  private getUserObjectFromValidationResult(result: any): any {
    if (result && result.user) {
      // Si viene de autenticación por huella (estructura nueva)
      if (result.user.usuario) {
        return result.user.usuario;
      }
      // Si viene de autenticación por credenciales (estructura original)
      return result.user;
    }
    return null;
  }

  /**
   * Carga la lista de dueños de energía para mostrar en el modal
   */
  loadEnergyOwners(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.usersService.findEnergyOwners().subscribe({
        next: (response: any) => {
          console.log('Dueños de energía cargados:', response);
          this.energyOwners = response || [];
          resolve();
        },
        error: (error: any) => {
          console.error('Error al cargar dueños de energía:', error);
          this.energyOwners = [];
          reject(error);
        }
      });
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
        // Cargar lista de dueños de energía antes de abrir el modal
        this.loadEnergyOwners().then(() => {
          // Abre el segundo modal con los datos de validación obtenidos
          const dialogRefEnergyOwner = this.dialog.open(ModalCambiarEnergyOwnerComponent, {
            width: '800px',
            height: 'auto',
            panelClass: 'user-selector-dialog',
            data: {
              energyOwners: this.energyOwners,
              activityId: this.activity._id || '',
              supervisorId: this.getUserIdFromValidationResult(result),  // Utiliza función auxiliar
              validatedUser: result  // Pasamos todos los datos del usuario validado
            }
          });
          dialogRefEnergyOwner.afterClosed().subscribe(userSelected => {
            if (userSelected && userSelected.user) {
              console.log('User selected:', userSelected);
              const activityId = this.activity._id ?? '';
              this.activityService.pendingStatusActivity(activityId, userSelected.user._id).subscribe((response: any) => {
                console.log('response', response);
                this.loadActivityData();
              });
            }
          });
        }).catch(error => {
          console.error('Error al cargar lista de dueños de energía:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la lista de dueños de energía. Por favor, intenta de nuevo.',
            confirmButtonText: 'Entendido'
          });
        });
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
   * Método para bloquear actividad solo para supervisores y trabajadores
   * Este método excluye a los dueños de energía
   */
  bloquearActividadSupervisoryTrabajador() {
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
      // Debug: Log de datos recibidos del modal de validación
      console.log('🔍 DEBUG - Datos recibidos en bloquearActividadSupervisoryTrabajador:', result);
      
      if (result && result.verificationStatus === 'verified') {
        const activityId = this.route.snapshot.paramMap.get('id') || '';
        
        // Debug: Log específico del perfil
        console.log('🔍 DEBUG - Perfil del usuario:', result.perfil, 'Tipo:', typeof result.perfil);
        
        // Verificar el tipo de usuario - SOLO supervisores y trabajadores
        if (result.perfil === 'supervisor') {
          // Si es supervisor, asignar supervisor al dueño de energía
          const data = {
            energyOwnerId: this.activity.energyOwners.length > 0 ? this.activity.energyOwners[0].user._id : '',
            supervisorId: result.user.usuario ? result.user.usuario._id : result.user._id
          };
          
          // Debug: Log de datos que se enviarán al backend
          console.log('🔍 DEBUG - Datos enviados al backend para asignar supervisor:', {
            activityId: activityId,
            data: data,
            userFromResult: result.user
          });
          
          if (!data.energyOwnerId) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se encontró un dueño de energía en esta actividad'
            });
            return;
          }
          
          this.ejecutarBloqueoConServicio(
            this.activityService.asignarSupervisorAduenoEnergia(activityId, data),
            'supervisor',
            this.getUserObjectFromValidationResult(result)
          );
          
        } else if (result.perfil === 'trabajador') {
          // Si es trabajador, guardar datos del trabajador y mostrar modal para seleccionar supervisor
          this.currentWorkerData = result;
          
          // Cargar supervisores disponibles
          const hasSupervisors = this.loadSupervisors();
          if (hasSupervisors) {
            // Pequeño delay para asegurar que el DOM se renderice correctamente
            setTimeout(() => {
              this.showSupervisorModal = true;
            }, 50);
          } else {
            Swal.fire({
              icon: 'info',
              title: 'Sin supervisores',
              text: 'No hay supervisores disponibles en esta actividad para asignarse'
            });
          }
          
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Acceso denegado',
            text: 'Solo supervisores y trabajadores pueden usar esta opción. Los dueños de energía deben usar la opción desde la sección de usuarios.',
            confirmButtonText: 'Entendido'
          });
        }
      }
    });
  }

  /**
   * Ejecuta un servicio de bloqueo/asignación y maneja la respuesta
   */
  private ejecutarBloqueoConServicio(serviceCall: any, tipoUsuario: string, usuario: any) {
    // Mostrar indicador de carga
    Swal.fire({
      title: `Asignando ${tipoUsuario}`,
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    serviceCall.subscribe({
      next: (response: any) => {
        // Actualizar el modelo de actividad con la respuesta
        if (response) {
          this.activity = response;
          if (response.energyOwners) {
            this.activity.energyOwners = response.energyOwners;
          }
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
                  title: `${tipoUsuario.charAt(0).toUpperCase() + tipoUsuario.slice(1)} asignado`,
                  text: `${usuario.nombre} ha sido asignado exitosamente`
                }).then(() => {
                  this.updateAllComponents();
                });
              },
              error: (err) => {
                console.error('Error detallado al actualizar casillero:', err);
                Swal.close();
                Swal.fire({
                  icon: 'warning',
                  title: 'Asignación parcialmente exitosa',
                  text: `${usuario.nombre} se asignó pero hubo un error al actualizar el casillero`
                }).then(() => {
                  this.updateAllComponents();
                });
              }
            });
        } else {
          // No hay casillero seleccionado
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: `${tipoUsuario.charAt(0).toUpperCase() + tipoUsuario.slice(1)} asignado`,
            text: `${usuario.nombre} ha sido asignado exitosamente`
          }).then(() => {
            this.updateAllComponents();
          });
        }
      },
      error: (error: any) => {
        console.error(`Error detallado al asignar ${tipoUsuario}:`, error);
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error?.error?.mensaje || `Error al asignar ${tipoUsuario}`
        });
      }
    });
  }

  /**
   * Método bloquearActividad modificado para manejar diferentes tipos de usuario
   * Este método permite dueños de energía, supervisores y trabajadores
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
      // Debug: Log de datos recibidos del modal de validación
      console.log('🔍 DEBUG - Datos recibidos en bloquearActividad:', result);
      
      if (result && result.verificationStatus === 'verified') {
        // Debug: Log específico del perfil
        console.log('🔍 DEBUG - Perfil del usuario:', result.perfil, 'Tipo:', typeof result.perfil);
        
        // Verificar el tipo de usuario y actuar según corresponda
        if (result.perfil === 'duenoDeEnergia') {
          
          // Si es dueño de energía, asignarse como dueño de energía de la actividad
          this.bloquearDuenoDeEnergia(result.user._id);
        } else if (result.perfil === 'supervisor') {
          // Si es supervisor, bloquear directamente al dueño de energía
          this.bloquearDuenoDeEnergia(result.user._id);
        } else if (result.perfil === 'trabajador') {
          // Si es trabajador, mostrar modal para seleccionar supervisor bajo el cual asignarse
          const hasSupervisors = this.loadSupervisors();
          if (hasSupervisors) {
            // Pequeño delay para asegurar que el DOM se renderice correctamente
            setTimeout(() => {
              this.showSupervisorModal = true;
            }, 50);
          }
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Acceso denegado',
            text: 'No tienes permisos para realizar esta acción.',
            confirmButtonText: 'Entendido'
          });
        }
      }
    });
  }

  /**
   * Carga la lista de supervisores disponibles en esta actividad para asignarse como trabajador
   * Retorna true si hay supervisores disponibles, false en caso contrario
   */
  loadSupervisors(): boolean {
    console.log('Cargando supervisores...');
    
    // Limpiar estado anterior
    this.selectedSupervisor = null;
    this.supervisors = [];
    
    // Obtener supervisores disponibles en esta actividad
    const availableSupervisors: any[] = [];
    
    if (this.activity.energyOwners && this.activity.energyOwners.length > 0) {
      this.activity.energyOwners.forEach(energyOwner => {
        if (energyOwner.supervisors && energyOwner.supervisors.length > 0) {
          energyOwner.supervisors.forEach(supervisor => {
            // Agregar supervisor completo a la lista si existe
            if (supervisor.user) {
              availableSupervisors.push(supervisor);
            }
          });
        }
      });
    }
    
    if (availableSupervisors.length > 0) {
      this.supervisors = availableSupervisors;
      console.log('Supervisores cargados:', this.supervisors.map((s, index) => ({
        index,
        id: s._id,
        nombre: s.user?.nombre
      })));
      return true;
    } else {
      // Si no hay supervisores disponibles, mostrar mensaje
      Swal.fire({
        icon: 'info',
        title: 'Sin supervisores disponibles',
        text: 'No hay supervisores asignados en esta actividad para poder asignarse.',
        confirmButtonText: 'Entendido'
      });
      this.supervisors = [];
      return false;
    }
  }



  /**
   * Selecciona un supervisor 
   */
  selectSupervisor(supervisor: any) {
    console.log('Supervisor seleccionado:', supervisor.user?.nombre, 'ID:', supervisor._id);
    this.selectedSupervisor = supervisor;
  }

  /**
   * Cierra el modal de selección de supervisores
   */
  closeSupervisorModal() {
    this.showSupervisorModal = false;
    this.selectedSupervisor = null;
    this.supervisors = [];
    this.currentWorkerData = null; // Limpiar los datos del trabajador
  }

  /**
   * Bloquea al supervisor seleccionado desde el modal
   */
  bloquearSupervisorSeleccionado() {
    if (!this.selectedSupervisor) {
      Swal.fire({
        icon: 'warning',
        title: 'Seleccionar supervisor',
        text: 'Debe seleccionar un supervisor para continuar.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (!this.currentWorkerData) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontraron datos del trabajador.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Usar la función auxiliar para extraer el ID del trabajador de manera consistente
    const workerId = this.getUserIdFromValidationResult(this.currentWorkerData);
    
    // Debug: Log para verificar la extracción del workerId
    console.log('🔍 DEBUG - bloquearSupervisorSeleccionado workerId:', workerId);
    console.log('🔍 DEBUG - currentWorkerData:', this.currentWorkerData);
    console.log('🔍 DEBUG - selectedSupervisor:', this.selectedSupervisor);
    
    this.confirmarBloqueoSupervisor(this.selectedSupervisor, workerId);
  }

  /**
   * Confirma y ejecuta el bloqueo del supervisor
   * @param supervisor El supervisor a bloquear
   * @param userId El ID del usuario que está haciendo la acción
   */
  private confirmarBloqueoSupervisor(supervisor: any, userId: string) {
    Swal.fire({
      icon: 'question',
      title: '¿Asignarse bajo supervisor?',
      text: `¿Estás seguro de que quieres asignarte como trabajador bajo el supervisor ${supervisor.user?.nombre || supervisor.nombre}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, asignar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarBloqueoSupervisor(supervisor, userId);
      }
    });
  }

  /**
   * Ejecuta el bloqueo del supervisor
   * @param supervisor El supervisor a bloquear
   * @param userId El ID del usuario que está haciendo la acción
   */
  private ejecutarBloqueoSupervisor(supervisor: any, userId: string) {
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Asignando trabajador',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    const activityId = this.route.snapshot.paramMap.get('id') || '';
    
    // Obtener el ID del dueño de energía
    const energyOwnerId = this.activity.energyOwners.length > 0 ? this.activity.energyOwners[0].user._id : '';
    
    if (!energyOwnerId) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró un dueño de energía en esta actividad'
      });
      return;
    }
    
    // Llamar al servicio para asignar al trabajador bajo el supervisor
    // Usar el ID del supervisor desde el objeto user si está disponible
    const supervisorId = supervisor.user?._id || supervisor._id;
    
    const payload = {
      energyOwnerId: energyOwnerId,
      supervisorId: supervisorId,
      workerId: userId
    };
    
    // Debug: Log del payload completo que se envía al backend
    console.log('🔍 DEBUG - Payload enviado a asignarTrabajadorAsupervisor:', payload);
    console.log('🔍 DEBUG - Activity ID:', activityId);
    console.log('🔍 DEBUG - Energy Owner ID:', energyOwnerId);
    console.log('🔍 DEBUG - Supervisor ID:', supervisorId);
    console.log('🔍 DEBUG - Worker ID (userId):', userId);
    
    this.activityService.asignarTrabajadorAsupervisor(activityId, payload).subscribe({
      next: (response) => {
        // Actualizar el modelo de actividad con la respuesta
        if (response) {
          this.activity = response;
          if (response.energyOwners) {
            this.activity.energyOwners = response.energyOwners;
          }
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
                  title: 'Trabajador asignado',
                  text: `El trabajador ha sido asignado exitosamente bajo el supervisor ${supervisor.user?.nombre || supervisor.nombre}`
                }).then(() => {
                  this.closeSupervisorModal();
                  this.updateAllComponents();
                });
              },
              error: (err) => {
                console.error('Error detallado al actualizar casillero:', err);
                Swal.close();
                Swal.fire({
                  icon: 'warning',
                  title: 'Trabajador asignado parcialmente',
                  text: `El trabajador se asignó al supervisor ${supervisor.user?.nombre || supervisor.nombre} pero hubo un error al actualizar el casillero`
                }).then(() => {
                  this.closeSupervisorModal();
                  this.updateAllComponents();
                });
              }
            });
        } else {
          // No hay casillero seleccionado
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Trabajador asignado',
            text: `El trabajador ha sido asignado exitosamente bajo el supervisor ${supervisor.user?.nombre || supervisor.nombre}`
          }).then(() => {
            this.closeSupervisorModal();
            this.updateAllComponents();
          });
        }
      },
      error: (error) => {
        console.error('Error detallado al bloquear supervisor:', error);
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error?.error?.mensaje || `Error al asignar el trabajador bajo el supervisor ${supervisor.user?.nombre || supervisor.nombre}`
        });
      }
    });
  }

  /**
   * Método para bloquear al dueño de energía
   */
  private bloquearDuenoDeEnergia(userId: string) {
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
    
    // Asignar dueño de energía
    this.activityService.asignarDuenoDeEnergia(activityId, {userId: userId}).subscribe({
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

  /**
   * Carga los casilleros disponibles del tótem y verifica su estado real cruzando con actividades activas
   */
  loadLockers() {
    console.log('=== CARGANDO CASILLEROS Y ACTIVIDADES (Activity Details) ===');
    console.log('Cargando casilleros con totemId:', this.totemId);
    
    // Hacer dos llamadas en paralelo: casilleros del tótem y todas las actividades
    forkJoin({
      casilleros: this.totemService.getTotems(this.totemId, true),
      actividades: this.actividadesService.getActivities()
    }).subscribe({
      next: (resultado: { casilleros: any; actividades: Activity[] }) => {
        console.log('=== RESPUESTA PARALELA (Activity Details) ===');
        console.log('Casilleros response:', resultado.casilleros);
        console.log('Actividades response:', resultado.actividades);
        
        // Procesar casilleros
        let casilleros: any[] = [];
        const data = resultado.casilleros;
        
        if (Array.isArray(data)) {
          casilleros = data.filter(locker => locker != null);
          console.log('✅ Casilleros cargados (respuesta directa como array):', casilleros);
        } else if (data && Array.isArray(data.casilleros)) {
          casilleros = data.casilleros.filter((locker: any) => locker != null);
          console.log('✅ Casilleros cargados (desde data.casilleros):', casilleros);
        } else if (typeof data === 'object' && data !== null) {
          console.log('Explorando objeto data para encontrar casilleros...');
          console.log('Propiedades del objeto:', Object.keys(data));
          
          // Buscar cualquier propiedad que sea un array de casilleros
          const possibleCasilleros = Object.values(data).find(
            (val: any) => Array.isArray(val) && val.length > 0 && val[0] && val[0].status !== undefined
          );
          
          if (possibleCasilleros) {
            casilleros = (possibleCasilleros as any[]).filter(locker => locker != null);
            console.log('✅ Casilleros cargados (encontrados en objeto):', casilleros);
          } else {
            console.warn('❌ No se encontraron casilleros en la respuesta:', data);
            casilleros = [];
          }
        } else {
          console.warn('❌ Formato de respuesta no reconocido:', data);
          casilleros = [];
        }
        
        // Almacenar actividades activas para referencia
        this.actividadesActivas = resultado.actividades;
        
        // Obtener casilleros ocupados por actividades activas
        const casilleroOcupados = this.getCasilleroOcupados(resultado.actividades);
        console.log('📋 Casilleros ocupados por actividades:', casilleroOcupados);
        
        // Actualizar estado de casilleros
        this.lockers = this.actualizarEstadoCasilleros(casilleros, casilleroOcupados);
        
        this.lastUpdated = new Date();
        this.isLoadingLockers = false;
        
        console.log('=== RESULTADO FINAL ===');
        console.log('Casilleros cargados:', this.lockers.length);
        console.log('Datos de casilleros con estado actualizado:', this.lockers);
        
        // Mostrar mensaje de éxito
        this.snackBar.open(`Cargados ${this.lockers.length} casilleros (${casilleroOcupados.length} ocupados)`, 'Cerrar', {
          duration: 2000
        });

        // Detectar conflictos de asignación después de cargar los datos
        this.detectLockerConflicts();
        
        // Marcar el casillero asignado a esta actividad como seleccionado
        this.marcarCasilleroAsignado();
      },
      error: (error: any) => {
        console.error('=== ERROR AL CARGAR CASILLEROS Y ACTIVIDADES (Activity Details) ===');
        console.error('Error loading lockers and activities:', error);
        console.error('TotemId usado:', this.totemId);
        
        this.lockers = [];
      }
    });
  }

  /**
   * Obtiene los IDs de casilleros ocupados por actividades activas
   */
  private getCasilleroOcupados(actividades: Activity[]): string[] {
    const casilleroOcupados: string[] = [];
    
    // Filtrar actividades activas (que no estén finalizadas)
    const actividadesActivas = actividades.filter(actividad => 
      actividad.status !== 'finalizada' &&
      actividad.assignedLockers && 
      actividad.assignedLockers.length > 0
    );
    
    console.log('🔍 Actividades activas encontradas (Activity Details):', actividadesActivas.length);
    
    // Extraer IDs de casilleros asignados
    actividadesActivas.forEach(actividad => {
      actividad.assignedLockers.forEach(locker => {
        if (locker.lockerId && locker.totemId === this.totemId) {
          casilleroOcupados.push(locker.lockerId);
          console.log(`📌 Casillero ${locker.lockerId} ocupado por actividad "${actividad.name}" (ID: ${actividad._id})`);
        }
      });
    });
    
    return casilleroOcupados;
  }

  /**
   * Obtiene información detallada de qué actividad está usando un casillero específico
   */
  private getActivityUsingLocker(lockerId: string, actividades: Activity[]): { name: string; id: string } | null {
    const actividadesActivas = actividades.filter(actividad => 
      actividad.status !== 'finalizada' &&
      actividad.assignedLockers && 
      actividad.assignedLockers.length > 0
    );
    
    for (const actividad of actividadesActivas) {
      const lockerAsignado = actividad.assignedLockers.find(locker => 
        locker.lockerId === lockerId && locker.totemId === this.totemId
      );
      
      if (lockerAsignado) {
        return {
          name: actividad.name,
          id: actividad._id || ''
        };
      }
    }
    
    return null;
  }

  /**
   * Actualiza el estado de los casilleros basándose en las actividades activas
   */
  private actualizarEstadoCasilleros(casilleros: any[], casilleroOcupados: string[]): any[] {
    return casilleros.map(casillero => {
      const estaOcupado = casilleroOcupados.includes(casillero._id);
      
      // Si el casillero está ocupado por una actividad, cambiar su estado
      if (estaOcupado && casillero.status === 'disponible') {
        console.log(`🔄 Cambiando estado del casillero "${casillero.name}" de "disponible" a "ocupado"`);
        
        // Obtener información de la actividad que está usando este casillero
        const actividadInfo = this.getActivityUsingLocker(casillero._id, this.actividadesActivas);
        
        return {
          ...casillero,
          status: 'ocupado',
          occupiedByActivity: true, // Marcar que está ocupado por actividad
          occupiedByActivityInfo: actividadInfo // Información de la actividad
        };
      }
      
      // Si el casillero no está ocupado pero tenía el flag, limpiarlo
      if (!estaOcupado && casillero.occupiedByActivity) {
        console.log(`🔄 Cambiando estado del casillero "${casillero.name}" de "ocupado" a "disponible"`);
        return {
          ...casillero,
          status: 'disponible',
          occupiedByActivity: false,
          occupiedByActivityInfo: null
        };
      }
      
      return casillero;
    });
  }

  /**
   * Marca el casillero asignado a la actividad actual como seleccionado
   */
  private marcarCasilleroAsignado(): void {
    if (this.activity && this.activity.assignedLockers && this.activity.assignedLockers.length > 0) {
      const ultimoCasilleroAsignado = this.activity.assignedLockers[this.activity.assignedLockers.length - 1];
      if (ultimoCasilleroAsignado) {
        this.selectedLocker = ultimoCasilleroAsignado.lockerId;
        console.log(`🎯 Casillero seleccionado para esta actividad: ${this.selectedLocker}`);
      }
    }
  }

  /**
   * Cuenta la cantidad de casilleros por estado
   */
  getLockerCountByStatus(status: string): number {
    if (!this.lockers || this.lockers.length === 0) return 0;
    return this.lockers.filter(locker => locker && locker.status === status).length;
  }

  /**
   * Verifica si un casillero puede ser seleccionado por el usuario
   */
  canSelectLocker(locker: any): boolean {
    if (!locker) return false;
    
    // Solo se pueden seleccionar casilleros disponibles o el casillero actual de esta actividad
    return locker.status === 'disponible' || this.selectedLocker === locker._id;
  }

  /**
   * Obtiene información adicional sobre un casillero ocupado
   */
  getLockerOccupiedInfo(locker: any): string {
    if (!locker || locker.status !== 'ocupado') return '';
    
    if (this.selectedLocker === locker._id) {
      return 'Asignado a esta actividad';
    } else if (locker.occupiedByActivity && locker.occupiedByActivityInfo) {
      return `Ocupado por: "${locker.occupiedByActivityInfo.name}"`;
    } else if (locker.occupiedByActivity) {
      return 'Ocupado por otra actividad';
    } else {
      return 'Ocupado';
    }
  }

  /**
   * Navega a la actividad que está usando un casillero específico
   */
  navigateToOccupyingActivity(locker: any): void {
    if (!locker?.occupiedByActivityInfo?.id) return;
    
    Swal.fire({
      title: 'Navegar a actividad',
      text: `¿Desea ir a la actividad "${locker.occupiedByActivityInfo.name}" que está usando este casillero?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, ir a la actividad',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Navegar a la actividad
        this.router.navigate(['/actividades', locker.occupiedByActivityInfo.id]);
      }
    });
  }

  /**
   * Detecta conflictos de asignación donde múltiples actividades tienen el mismo casillero asignado
   */
  detectLockerConflicts(): void {
    console.log('🔍 Detectando conflictos de asignación de casilleros...');
    
    const lockerAssignments: LockerAssignment[] = [];
    const conflicts: LockerConflict[] = [];
    
    // Recopilar todas las asignaciones de casilleros de actividades activas
    this.actividadesActivas.forEach(actividad => {
      if (actividad.status !== 'finalizada' && actividad.assignedLockers) {
        actividad.assignedLockers.forEach(locker => {
          if (locker.totemId === this.totemId) {
            lockerAssignments.push({
              activityId: actividad._id || '',
              activityName: actividad.name,
              lockerId: locker.lockerId,
              assignedAt: new Date(locker.assignedAt || new Date())
            });
          }
        });
      }
    });
    
    // Agrupar asignaciones por lockerId para detectar duplicados
    const assignmentsByLocker = new Map<string, LockerAssignment[]>();
    lockerAssignments.forEach(assignment => {
      if (!assignmentsByLocker.has(assignment.lockerId)) {
        assignmentsByLocker.set(assignment.lockerId, []);
      }
      assignmentsByLocker.get(assignment.lockerId)!.push(assignment);
    });
    
    // Identificar conflictos (casilleros con múltiples asignaciones)
    assignmentsByLocker.forEach((assignments, lockerId) => {
      if (assignments.length > 1) {
        const lockerInfo = this.lockers.find(l => l._id === lockerId);
        const lockerName = lockerInfo ? lockerInfo.name : `Casillero ${lockerId.slice(-8)}`;
        
        const conflict: LockerConflict = {
          lockerId: lockerId,
          lockerName: lockerName,
          totemId: this.totemId,
          conflictingActivities: assignments.map(a => ({
            activityId: a.activityId,
            activityName: a.activityName,
            assignedAt: a.assignedAt
          })).sort((a, b) => a.assignedAt.getTime() - b.assignedAt.getTime()),
          severity: 'error'
        };
        
        conflicts.push(conflict);
        console.log(`⚠️ CONFLICTO DETECTADO: Casillero ${lockerName} asignado a ${assignments.length} actividades:`, 
          assignments.map(a => a.activityName).join(', '));
      }
    });
    
    this.lockerConflicts = conflicts;
    
    // Mostrar notificación si hay conflictos
    if (conflicts.length > 0) {
      this.showConflictNotification(conflicts);
    }
  }

  /**
   * Muestra una notificación sobre conflictos detectados
   */
  private showConflictNotification(conflicts: LockerConflict[]): void {
    const conflictCount = conflicts.length;
    const totalActivities = conflicts.reduce((sum, conflict) => sum + conflict.conflictingActivities.length, 0);
    
    console.log(`🚨 ${conflictCount} conflictos detectados afectando ${totalActivities} actividades`);
    
    // Mostrar banner de advertencia
    const conflictMessage = conflictCount === 1 
      ? `Se detectó 1 conflicto de asignación de casillero`
      : `Se detectaron ${conflictCount} conflictos de asignación de casilleros`;
    
    Swal.fire({
      title: '⚠️ Conflictos de Asignación Detectados',
      text: `${conflictMessage}. Múltiples actividades tienen asignados los mismos casilleros.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ver Conflictos',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (result.isConfirmed) {
        this.showConflictModal = true;
      }
    });
  }

  /**
   * Abre el modal para resolver conflictos
   */
  openConflictResolutionModal(conflict?: LockerConflict): void {
    if (conflict) {
      this.selectedConflict = conflict;
    }
    this.showConflictModal = true;
  }

  /**
   * Cierra el modal de resolución de conflictos
   */
  closeConflictModal(): void {
    this.showConflictModal = false;
    this.selectedConflict = null;
  }

  /**
   * Resuelve un conflicto liberando el casillero de una actividad específica
   */
  resolveConflict(conflictingActivity: any, conflict: LockerConflict): void {
    Swal.fire({
      title: '¿Liberar casillero?',
      text: `¿Desea liberar el casillero "${conflict.lockerName}" de la actividad "${conflictingActivity.activityName}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, liberar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeConflictResolution(conflictingActivity.activityId, conflict.lockerId, conflict.lockerName);
      }
    });
  }

  /**
   * Ejecuta la resolución del conflicto liberando el casillero
   */
  private executeConflictResolution(activityId: string, lockerId: string, lockerName: string): void {
    // Mostrar loading
    Swal.fire({
      title: 'Liberando casillero...',
      text: `Removiendo asignación de casillero "${lockerName}"`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Llamar al servicio para liberar el casillero
    this.activityService.unassignLockerFromActivity(activityId, lockerId).subscribe({
      next: (response) => {
        console.log(`✅ Casillero ${lockerName} liberado de la actividad ${activityId}`);
        
        // Recargar datos para actualizar el estado
        this.loadActivityData();
        this.loadLockers();
        
        Swal.fire({
          title: '¡Conflicto resuelto!',
          text: `El casillero "${lockerName}" ha sido liberado exitosamente.`,
          icon: 'success',
          confirmButtonText: 'Aceptar',
          timer: 3000
        });
        
        // Cerrar modal si no hay más conflictos
        setTimeout(() => {
          this.detectLockerConflicts();
          if (this.lockerConflicts.length === 0) {
            this.closeConflictModal();
          }
        }, 1000);
      },
      error: (error) => {
        console.error(`❌ Error liberando casillero ${lockerName}:`, error);
        
        Swal.fire({
          title: 'Error al liberar casillero',
          text: error.error?.message || `No se pudo liberar el casillero "${lockerName}". Inténtalo de nuevo.`,
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  /**
   * Navega a una actividad específica desde el modal de conflictos
   */
  navigateToActivityFromConflict(activityId: string): void {
    this.closeConflictModal();
    this.router.navigate(['/actividades', activityId]);
  }

  /**
   * Obtiene el color del badge según la severidad del conflicto
   */
  getConflictSeverityColor(severity: 'warning' | 'error'): string {
    return severity === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
  }

  /**
   * Obtiene el icono del conflicto según la severidad
   */
  getConflictSeverityIcon(severity: 'warning' | 'error'): string {
    return severity === 'error' ? '🚨' : '⚠️';
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
   * Asigna un casillero a la actividad actual y ejecuta el flujo de bloqueo si es necesario
   * @param locker Casillero seleccionado para asignar
   */
  async assignLocker(locker: any) {
    console.log('🎯 [assignLocker] Iniciando asignación:', {
      lockerId: locker._id,
      lockerName: locker.name,
      lockerStatus: locker.status,
      currentSelectedLocker: this.selectedLocker,
      activityBlocked: this.activity.isBlocked,
      hasEnergyOwners: this.activity.energyOwners.length > 0
    });

    // Si la actividad está bloqueada, no hacer nada
    if (this.activity.isBlocked) {
      console.log('❌ Actividad bloqueada, no se puede asignar casillero');
      return;
    }

    // Si el casillero está en mantenimiento, no se puede usar
    if (locker.status === 'mantenimiento') {
      Swal.fire({
        title: 'Casillero en Mantenimiento',
        text: `El casillero ${locker.name} está en mantenimiento y no puede ser usado.`,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    // Si el casillero está ocupado por otra actividad, no se puede usar
    if (locker.status === 'ocupado' && locker.occupiedByActivity && this.selectedLocker !== locker._id) {
      const actividadInfo = locker.occupiedByActivityInfo;
      const actividadTexto = actividadInfo ? `"${actividadInfo.name}"` : 'otra actividad';
      
      const swalOptions: any = {
        title: 'Casillero Ocupado',
        text: `El casillero ${locker.name} está ocupado por ${actividadTexto}.`,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        footer: actividadInfo ? `<small>Para liberar este casillero, debe finalizar la actividad "${actividadInfo.name}"</small>` : undefined
      };

      // Si tenemos información de la actividad, agregar botón para navegar
      if (actividadInfo?.id) {
        swalOptions.showCancelButton = true;
        swalOptions.confirmButtonText = 'Ir a la actividad';
        swalOptions.cancelButtonText = 'Cerrar';
        swalOptions.confirmButtonColor = '#3085d6';
        swalOptions.cancelButtonColor = '#6b7280';
        
        Swal.fire(swalOptions).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/actividades', actividadInfo.id]);
          }
        });
      } else {
        Swal.fire(swalOptions);
      }
      return;
    }

    // Si es el mismo casillero ya seleccionado, no hacer nada
    if (this.selectedLocker === locker._id) {
      console.log('ℹ️ Casillero ya seleccionado, no se requiere cambio');
      return;
    }

    // Verificar validaciones para el bloqueo
    const canProceedWithBlocking = this.canProceedWithBlocking();
    const hasAssignedLockers = this.activity.assignedLockers && this.activity.assignedLockers.length > 0;
    
    // Si no hay dueños de energía Y no hay casilleros asignados, ejecutar flujo de bloqueo inicial
    if (this.activity.energyOwners.length === 0 && !hasAssignedLockers) {
      if (!canProceedWithBlocking.canProceed) {
        Swal.fire({
          icon: 'warning',
          title: 'No se puede proceder con el bloqueo',
          text: canProceedWithBlocking.reason,
          confirmButtonText: 'Entendido'
        });
        return;
      }

      console.log('🔐 Iniciando flujo de bloqueo para dueño de energía (primera vez)...');
      this.executeEnergyOwnerBlockingFlow(locker);
      return;
    }

    // Si ya hay dueños de energía O ya tiene casilleros asignados, proceder con asignación normal
    console.log('📌 Ejecutando asignación normal de casillero (actividad ya inicializada)...');
    try {
      await this.executeNormalLockerAssignment(locker);
    } catch (error: any) {
      this.handleLockerAssignmentError(error);
    }
  }

  /**
   * Verifica si se puede proceder con el bloqueo de la actividad
   */
  private canProceedWithBlocking(): { canProceed: boolean; reason?: string } {
    if (this.activity.equipments.length === 0) {
      return {
        canProceed: false,
        reason: 'No hay equipos asignados a esta actividad.'
      };
    }

    if (!this.activity.zeroEnergyValidation?.validatorName) {
      return {
        canProceed: false,
        reason: 'No se ha completado la validación de energía cero.'
      };
    }

    return { canProceed: true };
  }

  /**
   * Ejecuta el flujo de bloqueo para dueño de energía con apertura física del casillero
   */
  private executeEnergyOwnerBlockingFlow(locker: any): void {
    console.log('🔐 Iniciando validación de dueño de energía...');

    const dialogRef = this.dialog.open(ValidacionComponent);
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.verificationStatus === 'verified') {
        // Verificar que el usuario validado es dueño de energía
        if (result.perfil === 'duenoDeEnergia') {
          console.log('✅ Usuario validado como dueño de energía, procediendo con bloqueo...');
          
          // Abrir modal para rellenar formulario de confirmación de energía cero
          const energyVerificationDialogRef = this.dialog.open(FormularioVerificacionEnergiaCeroComponent);
          
          energyVerificationDialogRef.afterClosed().subscribe(energyVerificationResult => {
            if (energyVerificationResult && energyVerificationResult.allVerified) {
              console.log('✅ Formulario de energía cero completado - Todas las verificaciones en SÍ');
              console.log('📋 Respuestas:', energyVerificationResult.responses);
              
              // Proceder con el bloqueo completo
              this.executeFullBlockingProcess(locker, result.user._id);
            } else {
              console.log('❌ Formulario de energía cero cancelado o incompleto');
              if (energyVerificationResult && !energyVerificationResult.allVerified) {
                Swal.fire({
                  icon: 'warning',
                  title: 'Verificación incompleta',
                  text: 'Debe responder "Sí" a todas las preguntas de verificación para continuar.',
                  confirmButtonText: 'Entendido'
                });
              }
            }
          });
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Acceso denegado',
            text: 'Solo los dueños de energía pueden bloquear actividades seleccionando casilleros.',
            confirmButtonText: 'Entendido'
          });
        }
      } else {
        console.log('❌ Validación cancelada o fallida');
      }
    });
  }

  /**
   * Ejecuta el proceso completo de bloqueo: asignar casillero, bloquear actividad y abrir casillero físicamente
   */
  private async executeFullBlockingProcess(locker: any, userId: string): Promise<void> {
    try {
      // Mostrar loading
      Swal.fire({
        title: 'Procesando bloqueo de actividad',
        text: 'Asignando casillero y configurando bloqueo...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const activityId = this.activity._id ?? '';
      const totemId = this.totemId || localStorage.getItem('totemId');
      
      if (!totemId) {
        throw new Error('No se encontró el ID del tótem');
      }

      console.log('🔄 Paso 1: Asignando casillero a la actividad...');
      
      // Paso 1: Asignar casillero a la actividad
      await this.activityService.assignLockerToActivity(activityId, {
        lockerId: locker._id,
        totemId: totemId
      }).toPromise();

      console.log('✅ Casillero asignado exitosamente');
      console.log('🔄 Paso 2: Bloqueando actividad con dueño de energía...');

      // Paso 2: Bloquear la actividad asignando el dueño de energía
      const blockingResponse = await this.activityService.asignarDuenoDeEnergia(activityId, {
        userId: userId
      }).toPromise();

      console.log('✅ Actividad bloqueada exitosamente');
      console.log('🔄 Paso 3: Abriendo casillero físicamente...');
      console.log('📦 Nombre del casillero:', locker.name);
      
      // Extraer el número del casillero del nombre
      const boxNumber = this.extractBoxNumber(locker.name);
      console.log('🔢 Número extraído del casillero:', boxNumber);

      // Paso 3: Abrir físicamente el casillero usando el nuevo endpoint
      const openBoxResponse = await this.http.post('http://localhost:4000/openbox', {
        numberBox: boxNumber
      }).toPromise();

      console.log('✅ Casillero abierto físicamente:', openBoxResponse);

      // Actualizar datos locales
      if (blockingResponse && blockingResponse.energyOwners) {
        this.activity.energyOwners = blockingResponse.energyOwners;
        this.activity.isBlocked = true;
      }
      
      this.selectedLocker = locker._id;

      // Recargar datos para sincronizar
      this.loadLockers();
      this.loadActivityData();

      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Bloqueo Completado!',
        html: `
          <div class="text-left space-y-2">
            <p><strong>✅ Casillero "${locker.name}" asignado</strong></p>
            <p><strong>✅ Actividad bloqueada</strong></p>
            <p><strong>✅ Casillero abierto físicamente</strong></p>
          </div>
        `,
        confirmButtonText: 'Aceptar',
        timer: 5000
      });

    } catch (error: any) {
      console.error('❌ Error en el proceso de bloqueo:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error en el proceso de bloqueo',
        text: error.error?.mensaje || error.message || 'Ocurrió un error durante el proceso. Verifica el estado de la actividad.',
        confirmButtonText: 'Aceptar'
      });

      // Recargar datos para verificar el estado actual
      this.loadActivityData();
      this.loadLockers();
    }
  }

  /**
   * Ejecuta la asignación normal de casillero (cuando ya hay dueños de energía)
   */
  private async executeNormalLockerAssignment(locker: any): Promise<void> {
    // Mostrar loading
    Swal.fire({
      title: 'Asignando casillero',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Obtener el ID del tótem
    const totemId = this.totemId || localStorage.getItem('totemId');
    
    if (!totemId) {
      throw new Error('No se encontró el ID del tótem');
    }

    console.log('🔄 Asignando casillero al backend...');

    // Llamar al endpoint para asignar el casillero a la actividad
    const response = await this.activityService.assignLockerToActivity(
      this.activity._id ?? '',
      {
        lockerId: locker._id,
        totemId: totemId
      }
    ).toPromise();

    console.log('✅ Casillero asignado exitosamente:', response);

    // Actualizar el estado local
    this.selectedLocker = locker._id;

    // Recargar datos para sincronizar el estado
    console.log('🔄 Recargando datos para sincronizar...');
    this.loadLockers();
    this.loadActivityData();

    // Llamar al endpoint para abrir físicamente el casillero
    console.log('🔓 Abriendo casillero físicamente...');
    console.log('📦 Nombre del casillero:', locker.name);
    
    // Extraer el número del casillero del nombre (ej: "CASILLERO 1" -> 1)
    const boxNumber = this.extractBoxNumber(locker.name);
    console.log('🔢 Número extraído del casillero:', boxNumber);
    
    try {
      const openBoxResponse = await this.http.post('http://localhost:4000/openbox', {
        numberBox: boxNumber
      }).toPromise();
      
      console.log('✅ Casillero abierto físicamente:', openBoxResponse);
      
      // Mostrar mensaje de éxito
      Swal.fire({
        title: '¡Éxito!',
        text: `Casillero "${locker.name}" asignado y abierto correctamente.`,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        timer: 3000
      });
    } catch (error) {
      console.error('❌ Error al abrir el casillero físicamente:', error);
      
      // Mostrar mensaje de éxito parcial (asignación exitosa pero error al abrir)
      Swal.fire({
        title: 'Casillero Asignado',
        text: `El casillero "${locker.name}" fue asignado correctamente, pero hubo un problema al abrirlo físicamente.`,
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  /**
   * Maneja errores en la asignación de casilleros
   */
  private handleLockerAssignmentError(error: any): void {
    console.error('❌ Error al asignar casillero:', error);
    
    // Verificar si es un error HTTP con mensaje específico del backend
    if (error.error && error.error.mensaje) {
      // Mostrar el mensaje recibido del backend
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
        text: error.message || 'No se pudo asignar el casillero. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
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
    const owner = this.energyOwners.find(eo => eo.user._id === ownerId);
    return owner ? owner.user.nombre : 'Desconocido';
  }

  /**
   * Cuenta el total de dueños de energía en la actividad
   */
  getTotalEnergyOwnersCount(): number {
    return this.activity.energyOwners ? this.activity.energyOwners.length : 0;
  }

  /**
   * Cuenta el total de supervisores en la actividad
   */
  getTotalSupervisorsCount(): number {
    if (!this.activity.energyOwners) return 0;
    
    return this.activity.energyOwners.reduce((total, energyOwner) => {
      return total + (energyOwner.supervisors ? energyOwner.supervisors.length : 0);
    }, 0);
  }

  /**
   * Cuenta el total de trabajadores en la actividad
   */
  getTotalWorkersCount(): number {
    if (!this.activity.energyOwners) return 0;
    
    return this.activity.energyOwners.reduce((total, energyOwner) => {
      if (!energyOwner.supervisors) return total;
      
      return total + energyOwner.supervisors.reduce((supervisorTotal, supervisor) => {
        return supervisorTotal + (supervisor.workers ? supervisor.workers.length : 0);
      }, 0);
    }, 0);
  }

  /**
   * Cuenta el total de usuarios en la actividad (dueños + supervisores + trabajadores)
   */
  getTotalUsersCount(): number {
    return this.getTotalEnergyOwnersCount() + this.getTotalSupervisorsCount() + this.getTotalWorkersCount();
  }

 
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
}

