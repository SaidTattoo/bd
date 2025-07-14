import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DashboardLayoutComponent } from '../../components/dashboard-layout/dashboard-layout.component';
import { ConfiguracionService, Configuracion, Theme } from '../../../services/configuracion.service';
import { TotemService } from '../../../services/totem.service';
import { ActividadesService } from '../../../services/actividades.service';
import { Activity } from '../../../actividades/interface/activity.interface';
import { LogsService, LogConfiguration, LogEntry, LogEventType } from '../../../services/logs.service';
import { UsersService } from '../../../services/users.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CreateTotemModalComponent } from '../../components/create-totem-modal/create-totem-modal.component';
import Swal from 'sweetalert2';
import { forkJoin, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, DashboardLayoutComponent, ReactiveFormsModule, FormsModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './configuracion.component.html'
})
export class ConfiguracionComponent implements OnInit {
  // Hacer Math disponible en el template
  Math = Math;
  
  currentLogo: string | null = null;
  logoPreview: string | null = null;
  isUploadingLogo = false;
  configuracion: Configuracion = {};
  
  // Estado de la base de datos
  databaseStatus: any = null;
  isCheckingDatabase = false;
  isReconnecting = false;
  
  // Temas
  themes: Theme[] = [];
  currentTheme: string = 'default';
  isLoadingThemes = false;
  isChangingTheme = false;

  // Modal de crear tema personalizado
  showCreateThemeModal = false;
  customThemeForm: FormGroup;
  isCreatingTheme = false;

  // Modal de editar tema personalizado
  showEditThemeModal = false;
  editingThemeId: string | null = null;
  isEditingTheme = false;

  // Tótem
  hasTotem: boolean = false;
  totemId: string = '';
  isCheckingTotem = false;
  isClearingLockers = false;
  isOpeningLockers = false;

  // Casilleros
  lockers: any[] = [];
  isLoadingLockers = false;
  lastUpdated: Date = new Date();

  // Control del LED del lector
  isLedOn = false;
  isControllingLed = false;

  // Test de lectura de huellas
  isTestingFingerprint = false;
  lastFingerprintTest: any = null;
  fingerprintTestResult: 'success' | 'error' | null = null;

  // Log configuration
  logConfiguration: LogConfiguration | null = null;
  logStats: any = null;
  isLoadingLogConfig = false;
  isLoadingLogStats = false;
  showLogConfigModal = false;
  showLogViewerModal = false;
  logConfigForm: FormGroup;
  recentLogs: LogEntry[] = [];
  logEventTypes: { value: LogEventType; label: string; category: string }[] = [];
  logLevels: { value: string; label: string; color: string }[] = [];

  // Log viewer
  currentLogs: LogEntry[] = [];
  isLoadingLogs = false;
  currentLogFilter: any = {
    level: '',
    event: '',
    search: '',
    startDate: '',
    endDate: ''
  };
  logsPagination: any = {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  };

  constructor(
    private configuracionService: ConfiguracionService,
    private formBuilder: FormBuilder,
    private totemService: TotemService,
    private actividadesService: ActividadesService,
    private logsService: LogsService,
    private usersService: UsersService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
    this.customThemeForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      primaryColor: ['#6366f1', [Validators.required]],
      secondaryColor: ['#4f46e5', [Validators.required]],
      accentColor: ['#8b5cf6', [Validators.required]],
      backgroundColor: ['#0f172a', [Validators.required]],
      textColor: ['#f1f5f9', [Validators.required]],
      cardColor: ['#1e293b', [Validators.required]],
      borderColor: ['#334155', [Validators.required]],
      sidebarHeaderColor: ['#9ca3af', [Validators.required]],
      sidebarLinkColor: ['#d1d5db', [Validators.required]]
    });

    // Inicializar formulario de configuración de logs
    this.logConfigForm = this.formBuilder.group({
      level: ['info', [Validators.required]],
      enabledEvents: [[], [Validators.required]],
      retention: [90, [Validators.required, Validators.min(1), Validators.max(365)]],
      format: ['json', [Validators.required]],
      alertEmails: [''],
      autoExport: [false],
      compressionEnabled: [true],
      maxFileSize: [100, [Validators.required, Validators.min(10), Validators.max(1000)]],
      rotationEnabled: [true]
    });

    // Cargar tipos de eventos y niveles
    this.logEventTypes = this.logsService.getAvailableEventTypes();
    this.logLevels = this.logsService.getAvailableLogLevels();
  }

  ngOnInit(): void {
    this.loadConfiguration();
    this.checkDatabaseConnection();
    this.loadThemes();
    this.loadTotemStatus();
    this.loadLogConfiguration();
    this.loadLogStats();
    this.configuracionService.logo$.subscribe(logo => {
      this.currentLogo = logo;
    });
  }

  loadConfiguration(): void {
    this.configuracionService.getConfiguracion().subscribe({
      next: (config) => {
        this.configuracion = config;
        this.currentLogo = config.logo || null;
      },
      error: (error) => {
        console.error('Error loading configuration:', error);
      }
    });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    // Validar archivo
    if (!this.configuracionService.isValidImageFile(file)) {
      Swal.fire({
        icon: 'error',
        title: 'Archivo inválido',
        text: 'Por favor selecciona una imagen válida (JPEG, PNG, GIF, WebP) menor a 5MB'
      });
      return;
    }

    // Convertir a base64 y mostrar preview
    this.configuracionService.convertFileToBase64(file).then(base64 => {
      this.logoPreview = base64;
    }).catch(error => {
      console.error('Error converting file:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al procesar la imagen'
      });
    });
  }

  uploadLogo(): void {
    if (!this.logoPreview) return;

    this.isUploadingLogo = true;

    this.configuracionService.uploadLogo(this.logoPreview).subscribe({
      next: (response) => {
        this.configuracionService.updateLogoSubject(this.logoPreview!);
        this.currentLogo = this.logoPreview;
        this.logoPreview = null;
        this.isUploadingLogo = false;
        
        Swal.fire({
          icon: 'success',
          title: '¡Logo actualizado!',
          text: 'El logo se ha guardado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error uploading logo:', error);
        this.isUploadingLogo = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al guardar el logo. Inténtalo de nuevo.'
        });
      }
    });
  }

  cancelLogoPreview(): void {
    this.logoPreview = null;
    // Reset file input
    const fileInput = document.getElementById('logoInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  removeLogo(): void {
    Swal.fire({
      title: '¿Eliminar logo?',
      text: 'Se eliminará el logo actual del sistema',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isUploadingLogo = true;
        
        this.configuracionService.uploadLogo('').subscribe({
          next: () => {
            this.configuracionService.updateLogoSubject('');
            this.currentLogo = null;
            this.isUploadingLogo = false;
            
            Swal.fire({
              icon: 'success',
              title: 'Logo eliminado',
              text: 'El logo ha sido eliminado correctamente',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error removing logo:', error);
            this.isUploadingLogo = false;
            
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error al eliminar el logo'
            });
          }
        });
      }
    });
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  checkDatabaseConnection(): void {
    this.isCheckingDatabase = true;
    
    this.configuracionService.checkDatabaseConnection().subscribe({
      next: (status) => {
        this.databaseStatus = status;
        this.isCheckingDatabase = false;
      },
      error: (error) => {
        this.databaseStatus = {
          isConnected: false,
          state: 'error',
          error: error.message || 'Error al verificar conexión'
        };
        this.isCheckingDatabase = false;
      }
    });
  }

  reconnectDatabase(): void {
    this.isReconnecting = true;
    
    this.configuracionService.reconnectDatabase().subscribe({
      next: (response) => {
        this.isReconnecting = false;
        
        Swal.fire({
          icon: 'success',
          title: '¡Reconectado!',
          text: response.message || 'Base de datos reconectada correctamente',
          timer: 3000,
          showConfirmButton: false
        });
        
        // Verificar estado después de reconectar
        setTimeout(() => {
          this.checkDatabaseConnection();
        }, 1000);
      },
      error: (error) => {
        this.isReconnecting = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error de reconexión',
          text: error.error?.message || 'No se pudo reconectar a la base de datos',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  getConnectionStatusColor(): string {
    if (!this.databaseStatus) return 'text-gray-500';
    
    switch (this.databaseStatus.state) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'disconnected':
        return 'text-red-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  }

  getConnectionStatusText(): string {
    if (!this.databaseStatus) return 'Verificando...';
    
    switch (this.databaseStatus.state) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Error';
      default:
        return 'Desconocido';
    }
  }

  // Métodos para temas
  loadThemes(): void {
    this.isLoadingThemes = true;
    
    this.configuracionService.getThemes().subscribe({
      next: (data) => {
        this.themes = data.themes ? data.themes.filter(theme => theme != null) : [];
        this.currentTheme = data.currentTheme;
        this.isLoadingThemes = false;
      },
      error: (error) => {
        console.error('Error loading themes:', error);
        this.isLoadingThemes = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los temas'
        });
      }
    });
  }

  changeTheme(themeId: string): void {
    if (!themeId || this.currentTheme === themeId) return;
    
    this.isChangingTheme = true;
    
    this.configuracionService.changeTheme(themeId).subscribe({
      next: (response) => {
        this.currentTheme = themeId;
        this.isChangingTheme = false;
        
        // Encontrar y actualizar el tema actual en el BehaviorSubject
        const selectedTheme = this.themes.find(theme => theme && theme.id === themeId);
        if (selectedTheme) {
          this.configuracionService.updateCurrentThemeSubject(selectedTheme);
          // Log del cambio de tema
          this.logsService.logThemeChange(themeId, selectedTheme.displayName);
        }
        
        Swal.fire({
          icon: 'success',
          title: '¡Tema cambiado!',
          text: response.message || 'El tema se ha aplicado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        this.isChangingTheme = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Error al cambiar el tema'
        });
      }
    });
  }

  resetThemes(): void {
    Swal.fire({
      title: '¿Resetear temas?',
      text: 'Se restablecerán todos los temas a sus valores por defecto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, resetear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.configuracionService.resetThemes().subscribe({
          next: (response) => {
            this.themes = response.themes ? response.themes.filter((theme: any) => theme != null) : [];
            this.currentTheme = response.currentTheme;
            
            // Actualizar el tema actual en el BehaviorSubject
            const newCurrentTheme = this.themes.find((theme: any) => theme && theme.id === response.currentTheme);
            if (newCurrentTheme) {
              this.configuracionService.updateCurrentThemeSubject(newCurrentTheme);
            }
            
            Swal.fire({
              icon: 'success',
              title: 'Temas reseteados',
              text: 'Los temas han sido restablecidos exitosamente',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'Error al resetear los temas'
            });
          }
        });
      }
    });
  }

  getThemePreview(theme: Theme): any {
    return {
      'background': `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
      'border': `2px solid ${theme.borderColor}`
    };
  }

  isCurrentTheme(themeId: string): boolean {
    return !!(themeId && this.currentTheme === themeId);
  }

  getCurrentThemeDisplayName(): string {
    return this.themes.find(t => t && t.id === this.currentTheme)?.displayName || 'Cargando...';
  }

  // Métodos para tema personalizado
  openCreateThemeModal(): void {
    this.showCreateThemeModal = true;
    this.resetCustomThemeForm();
  }

  closeCreateThemeModal(): void {
    this.showCreateThemeModal = false;
    this.resetCustomThemeForm();
  }

  resetCustomThemeForm(): void {
    this.customThemeForm.reset({
      name: '',
      displayName: '',
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      accentColor: '#8b5cf6',
      backgroundColor: '#0f172a',
      textColor: '#f1f5f9',
      cardColor: '#1e293b',
      borderColor: '#334155',
      sidebarHeaderColor: '#9ca3af',
      sidebarLinkColor: '#d1d5db'
    });
  }

  createCustomTheme(): void {
    if (!this.customThemeForm.valid) return;

    this.isCreatingTheme = true;
    const themeData = this.customThemeForm.value;

    this.configuracionService.createCustomTheme(themeData).subscribe({
      next: (response) => {
        this.isCreatingTheme = false;
        this.showCreateThemeModal = false;
        
        // Actualizar lista de temas
        this.loadThemes();
        
        Swal.fire({
          icon: 'success',
          title: '¡Tema creado!',
          text: `El tema "${themeData.displayName}" se ha creado exitosamente`,
          timer: 3000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        this.isCreatingTheme = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Error al crear el tema personalizado'
        });
      }
    });
  }

  deleteCustomTheme(themeId: string, themeName: string): void {
    if (!themeId || !themeName) return;
    
    Swal.fire({
      title: '¿Eliminar tema?',
      text: `Se eliminará el tema "${themeName}" permanentemente`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.configuracionService.deleteCustomTheme(themeId).subscribe({
          next: (response) => {
            // Actualizar lista de temas
            this.loadThemes();
            
            Swal.fire({
              icon: 'success',
              title: 'Tema eliminado',
              text: `El tema "${themeName}" ha sido eliminado exitosamente`,
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'Error al eliminar el tema'
            });
          }
        });
      }
    });
  }

  isCustomTheme(theme: Theme): boolean {
    return !!(theme && theme.id && theme.id.startsWith('custom_'));
  }

  // Métodos para editar tema personalizado
  openEditThemeModal(theme: Theme): void {
    if (!theme || !theme.id) {
      console.error('Tema inválido para editar:', theme);
      return;
    }
    
    this.editingThemeId = theme.id;
    
    // Primero cargar los datos del tema desde el backend para asegurar que están actualizados
    this.configuracionService.getTheme(theme.id).subscribe({
      next: (response) => {
        const themeData = response.theme;
        
        // Cargar los datos del tema en el formulario
        this.customThemeForm.patchValue({
          name: themeData.name,
          displayName: themeData.displayName,
          primaryColor: themeData.primaryColor,
          secondaryColor: themeData.secondaryColor,
          accentColor: themeData.accentColor,
          backgroundColor: themeData.backgroundColor,
          textColor: themeData.textColor,
          cardColor: themeData.cardColor,
          borderColor: themeData.borderColor,
          sidebarHeaderColor: themeData.sidebarHeaderColor || '#9ca3af',
          sidebarLinkColor: themeData.sidebarLinkColor || '#d1d5db'
        });
        
        // Mostrar el modal después de cargar los datos
        this.showEditThemeModal = true;
      },
      error: (error) => {
        console.error('Error loading theme data:', error);
        
        // Si falla la carga del backend, usar los datos locales
        this.customThemeForm.patchValue({
          name: theme.name,
          displayName: theme.displayName,
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          accentColor: theme.accentColor,
          backgroundColor: theme.backgroundColor,
          textColor: theme.textColor,
          cardColor: theme.cardColor,
          borderColor: theme.borderColor,
          sidebarHeaderColor: (theme as any).sidebarHeaderColor || '#9ca3af',
          sidebarLinkColor: (theme as any).sidebarLinkColor || '#d1d5db'
        });
        
        this.showEditThemeModal = true;
        
        Swal.fire({
          icon: 'warning',
          title: 'Advertencia',
          text: 'No se pudieron cargar los datos más recientes del tema. Se usarán los datos locales.',
          timer: 3000,
          showConfirmButton: false
        });
      }
    });
  }

  closeEditThemeModal(): void {
    this.showEditThemeModal = false;
    this.editingThemeId = null;
    this.isEditingTheme = false;
    this.resetCustomThemeForm();
  }

  updateCustomTheme(): void {
    if (!this.customThemeForm.valid || !this.editingThemeId) return;

    this.isEditingTheme = true;
    const themeData = {
      ...this.customThemeForm.value,
      id: this.editingThemeId  // Incluir el ID del tema
    };

    this.configuracionService.updateTheme(this.editingThemeId, themeData).subscribe({
      next: (response) => {
        this.isEditingTheme = false;
        this.showEditThemeModal = false;
        this.editingThemeId = null;
        
        // Actualizar lista de temas
        this.loadThemes();
        
        Swal.fire({
          icon: 'success',
          title: '¡Tema actualizado!',
          text: `El tema "${themeData.displayName}" se ha actualizado exitosamente`,
          timer: 3000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        this.isEditingTheme = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Error al actualizar el tema personalizado'
        });
      }
    });
  }

  // ===== MÉTODOS DE TÓTEMS =====

  loadTotemStatus(): void {
    this.hasTotem = this.totemService.hasConfiguredTotem();
    this.totemId = this.totemService.getTotemId();
    
    console.log('Estado del tótem en configuración:', {
      hasTotem: this.hasTotem,
      totemId: this.totemId,
      expectedId: '6862e21eadfd4988a6a87acf'
    });

    // Si hay tótem configurado, cargar automáticamente los casilleros
    if (this.hasTotem && this.totemId) {
      console.log('Tótem detectado, cargando casilleros automáticamente...');
      setTimeout(() => {
        this.loadLockersStatus();
      }, 500);
    }
  }

  refreshTotemStatus(): void {
    this.isCheckingTotem = true;
    
    // Simular verificación
    setTimeout(() => {
      this.loadTotemStatus();
      this.isCheckingTotem = false;
      
      this.snackBar.open(
        this.hasTotem ? 'Estado del tótem verificado' : 'No hay tótem configurado',
        'Cerrar',
        { duration: 3000 }
      );
    }, 1000);
  }

  // Método temporal para debugging - establecer totemId manualmente
  setTotemIdManually(): void {
    const correctTotemId = '6862e21eadfd4988a6a87acf';
    console.log('=== ESTABLECIENDO TOTEM ID MANUALMENTE ===');
    console.log('TotemId anterior:', this.totemId);
    console.log('TotemId correcto:', correctTotemId);
    
    // Guardar en localStorage
    localStorage.setItem('totemId', correctTotemId);
    console.log('✅ Guardado en localStorage');
    
    // Actualizar variables locales
    this.totemId = correctTotemId;
    this.hasTotem = true;
    
    console.log('Estado actualizado:', {
      totemId: this.totemId,
      hasTotem: this.hasTotem
    });
    
    // Verificar que se guardó correctamente
    const savedId = localStorage.getItem('totemId');
    console.log('Verificación localStorage:', savedId);
    
    // Forzar carga inmediata de casilleros
    console.log('🔄 Iniciando carga automática de casilleros...');
    setTimeout(() => {
      this.loadLockersStatus();
    }, 500);
    
    this.snackBar.open(`Tótem configurado manualmente: ${correctTotemId.slice(-8)}`, 'Cerrar', {
      duration: 3000
    });
  }

  getTotemStatusText(): string {
    if (this.isCheckingTotem) return 'Verificando...';
    return this.hasTotem ? 'Conectado' : 'No configurado';
  }

  openCreateTotemModal(): void {
    const dialogRef = this.dialog.open(CreateTotemModalComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result._id) {
        // Actualizar variables locales
        this.totemId = result._id;
        this.hasTotem = true;
        
        this.snackBar.open(`Tótem creado correctamente. ID: ${result._id}`, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      }
    });
  }

  resetTotemConfiguration(): void {
    Swal.fire({
      title: '¿Resetear configuración del tótem?',
      text: 'Se eliminará la configuración actual del tótem. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, resetear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('totemId');
        this.hasTotem = false;
        this.totemId = '';
        
        this.snackBar.open('Configuración de tótem reseteada. Puede crear un nuevo tótem ahora.', 'Cerrar', {
          duration: 5000
        });
      }
    });
  }

  /**
   * Enciende el LED del lector de huellas
   */
  encenderLedLector(): void {
    console.log('🔥 Encendiendo LED del lector');
    this.isControllingLed = true;
    
    this.usersService.controlLed(true).subscribe({
      next: (response) => {
        console.log('✅ LED encendido exitosamente:', response);
        this.isControllingLed = false;
        this.isLedOn = true;
        
        this.snackBar.open('LED del lector encendido', 'Cerrar', {
          duration: 3000
        });
        
        // Log de la operación
        this.logsService.logInfo('system_config_changed', 'LED del lector encendido manualmente', {
          action: 'encender',
          timestamp: new Date().toISOString()
        }).subscribe();
      },
      error: (error) => {
        console.error('❌ Error al encender LED:', error);
        this.isControllingLed = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error al encender LED',
          text: 'No se pudo encender el LED del lector. Verifica la conexión con el servicio.',
          confirmButtonText: 'Aceptar'
        });
        
        // Log del error
        this.logsService.logError('error_occurred', 'Error al encender LED del lector', {
          action: 'encender',
          error: error.message || 'Error desconocido'
        }).subscribe();
      }
    });
  }

  /**
   * Apaga el LED del lector de huellas
   */
  apagarLedLector(): void {
    console.log('🔴 Apagando LED del lector');
    this.isControllingLed = true;
    
    this.usersService.controlLed(false).subscribe({
      next: (response) => {
        console.log('✅ LED apagado exitosamente:', response);
        this.isControllingLed = false;
        this.isLedOn = false;
        
        this.snackBar.open('LED del lector apagado', 'Cerrar', {
          duration: 3000
        });
        
        // Log de la operación
        this.logsService.logInfo('system_config_changed', 'LED del lector apagado manualmente', {
          action: 'apagar',
          timestamp: new Date().toISOString()
        }).subscribe();
      },
      error: (error) => {
        console.error('❌ Error al apagar LED:', error);
        this.isControllingLed = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error al apagar LED',
          text: 'No se pudo apagar el LED del lector. Verifica la conexión con el servicio.',
          confirmButtonText: 'Aceptar'
        });
        
        // Log del error
        this.logsService.logError('error_occurred', 'Error al apagar LED del lector', {
          action: 'apagar',
          error: error.message || 'Error desconocido'
        }).subscribe();
      }
    });
  }

  /**
   * Alterna el estado del LED del lector
   */
  toggleLedLector(): void {
    if (this.isLedOn) {
      this.apagarLedLector();
    } else {
      this.encenderLedLector();
    }
  }

  /**
   * Testea la lectura de huellas del lector
   */
  testearLecturaHuella(): void {
    console.log('🔍 Iniciando test de lectura de huellas');
    this.isTestingFingerprint = true;
    this.fingerprintTestResult = null;
    this.lastFingerprintTest = null;

    // Mostrar indicador de que está capturando
    Swal.fire({
      title: 'Capturando huella...',
      html: `
        <div class="text-center">
          <div class="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg class="w-12 h-12 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <p class="text-gray-600">Por favor, coloque su dedo en el lector de huellas</p>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.usersService.captureFingerprint().subscribe({
      next: (response:any) => {
        console.log('✅ Test de huella exitoso:', response);
        this.isTestingFingerprint = false;
        this.fingerprintTestResult = 'success';
        this.lastFingerprintTest = {
          timestamp: new Date(),
          template: response.template,
          templateLength: response.template?.length || 0,
          originalResponse: response.originalResponse
        };

        Swal.fire({
          icon: 'success',
          title: '¡Huella capturada exitosamente!',
          html: `
            <div class="text-left">
              <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Longitud del template:</strong> ${response.template?.length || 0} caracteres</p>
              <p><strong>Estado:</strong> Captura exitosa</p>
              ${response.template ? 
                `<div class="mt-3">
                  <p><strong>Template completo:</strong></p>
                  <div class="bg-gray-100 p-3 rounded mt-2 max-h-48 overflow-y-auto">
                    <textarea 
                      readonly 
                      class="w-full h-32 p-2 border rounded text-xs font-mono resize-none"
                      id="templateContent"
                    >${response.template}</textarea>
                  </div>
                  <button 
                    class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onclick="
                      const textarea = document.getElementById('templateContent');
                      textarea.select();
                      document.execCommand('copy');
                      this.innerHTML = '¡Copiado!';
                      setTimeout(() => this.innerHTML = 'Copiar Template', 2000);
                    "
                  >
                    Copiar Template
                  </button>
                </div>` 
                : '<p class="text-gray-500">No se pudo obtener el template</p>'
              }
            </div>
          `,
          confirmButtonText: 'Entendido',
          customClass: {
            htmlContainer: 'text-left'
          },
          width: '600px'
        });

        this.snackBar.open('Test de huella completado exitosamente', 'Cerrar', {
          duration: 3000
        });

        // Log de la operación
        this.logsService.logInfo('system_config_changed', 'Test de lectura de huellas realizado exitosamente', {
          action: 'test_fingerprint',
          templateLength: response.template?.length || 0,
          timestamp: new Date().toISOString()
        }).subscribe();
      },
      error: (error) => {
        console.error('❌ Error en test de huella:', error);
        this.isTestingFingerprint = false;
        this.fingerprintTestResult = 'error';
        this.lastFingerprintTest = {
          timestamp: new Date(),
          error: error.message || 'Error desconocido',
          errorDetails: error
        };

        Swal.fire({
          icon: 'error',
          title: 'Error en la captura de huella',
          html: `
            <div class="text-left">
              <p><strong>Error:</strong> ${error.error?.message || error.message || 'Error desconocido'}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
              <p class="text-sm text-gray-600 mt-2">
                Verifica que el lector de huellas esté conectado y que el servicio en puerto 5000 esté funcionando.
              </p>
            </div>
          `,
          confirmButtonText: 'Aceptar'
        });

        // Log del error
        this.logsService.logError('error_occurred', 'Error en test de lectura de huellas', {
          action: 'test_fingerprint',
          error: error.message || 'Error desconocido',
          errorDetails: error
        }).subscribe();
      }
    });
  }

  clearAllLockers(): void {
    if (!this.hasTotem) {
      this.snackBar.open('No hay ningún tótem configurado', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    if (!this.lockers || this.lockers.length === 0) {
      this.snackBar.open('No hay casilleros cargados. Intenta cargar los casilleros primero.', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    Swal.fire({
      title: '¿Limpiar todos los casilleros?',
      text: `Se cambiarán ${this.lockers.length} casilleros a estado "disponible" y se eliminarán sus asignaciones.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, limpiar todos',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isClearingLockers = true;
        this.clearAllLockersIndividually();
      }
    });
  }

  /**
   * Limpia todos los casilleros individualmente y actualiza las actividades
   */
  private clearAllLockersIndividually(): void {
    console.log('🧹 Iniciando limpieza completa de casilleros y actividades...');
    
    // Paso 1: Limpiar todos los casilleros
    const updatePromises = this.lockers.map(locker => {
      if (!locker || !locker._id) {
        console.warn('Casillero inválido omitido:', locker);
        return Promise.resolve();
      }

      console.log(`🧹 Limpiando casillero: ${locker.name} (${locker._id})`);
      
      return firstValueFrom(this.totemService.updateLockerStatus(this.totemId, locker._id, 'disponible'))
        .then(() => {
          console.log(`✅ Casillero ${locker.name} limpiado exitosamente`);
        })
        .catch(error => {
          console.error(`❌ Error limpiando casillero ${locker.name}:`, error);
          throw error;
        });
    });

    Promise.all(updatePromises)
      .then(() => {
        console.log('✅ Todos los casilleros limpiados exitosamente');
        console.log('🔄 Ahora limpiando asignaciones en actividades...');
        
        // Paso 2: Limpiar asignaciones en actividades
        return this.clearActivityAssignments();
      })
      .then(() => {
        console.log('✅ Proceso completo de limpieza terminado');
        this.isClearingLockers = false;
        
        // Recargar casilleros para mostrar el estado actualizado
        this.loadLockersStatus();
        
        Swal.fire({
          icon: 'success',
          title: '¡Limpieza completa!',
          text: `Se han limpiado ${this.lockers.length} casilleros y actualizado las actividades`,
          timer: 3000,
          showConfirmButton: false
        });

        // Log de la operación
        this.logsService.logInfo('system_config_changed', 'Limpieza completa: casilleros y actividades actualizadas', {
          totemId: this.totemId,
          lockersCount: this.lockers.length
        }).subscribe();
      })
      .catch(error => {
        console.error('❌ Error en la limpieza completa:', error);
        this.isClearingLockers = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error en la limpieza',
          text: 'Algunos casilleros o actividades no pudieron ser limpiados. Revisa la consola para más detalles.',
          confirmButtonText: 'Aceptar'
        });

        // Log del error
        this.logsService.logSystemError(error, 'Limpieza completa de casilleros y actividades');
      });
  }

  /**
   * Limpia las asignaciones de casilleros en todas las actividades activas
   */
  private async clearActivityAssignments(): Promise<void> {
    try {
      console.log('📋 Obteniendo actividades activas...');
      
      // Obtener todas las actividades
      const actividades = await firstValueFrom(this.actividadesService.getActivities());
      
      // Filtrar actividades que tengan casilleros asignados del tótem actual
      const actividadesConCasilleros = actividades.filter(actividad => 
        actividad.assignedLockers && 
        actividad.assignedLockers.length > 0 &&
        actividad.assignedLockers.some(locker => locker.totemId === this.totemId)
      );

      console.log(`📋 Encontradas ${actividadesConCasilleros.length} actividades con casilleros asignados`);

      if (actividadesConCasilleros.length === 0) {
        console.log('✅ No hay actividades con casilleros asignados, terminando...');
        return;
      }

      // Limpiar asignaciones en cada actividad
      const clearPromises = actividadesConCasilleros.map(async (actividad) => {
        try {
          console.log(`🧹 Limpiando asignaciones en actividad: ${actividad.name}`);
          
          if (!actividad._id) {
            console.warn(`❌ Actividad ${actividad.name} no tiene ID válido, omitiendo...`);
            return;
          }
          
          // Filtrar casilleros que NO pertenezcan al tótem actual (mantener otros)
          const casillerosFiltrados = actividad.assignedLockers.filter(locker => 
            locker.totemId !== this.totemId
          );
          
          // Actualizar la actividad con la nueva lista de casilleros
          const updateData = {
            assignedLockers: casillerosFiltrados
          };
          
          await firstValueFrom(this.actividadesService.updateActivity(actividad._id, updateData));
          console.log(`✅ Actividad ${actividad.name} actualizada - Casilleros removidos: ${actividad.assignedLockers.length - casillerosFiltrados.length}`);
          
        } catch (error) {
          console.error(`❌ Error actualizando actividad ${actividad.name}:`, error);
          throw error;
        }
      });

      await Promise.all(clearPromises);
      console.log('✅ Todas las asignaciones de actividades han sido limpiadas');
      
    } catch (error) {
      console.error('❌ Error en clearActivityAssignments:', error);
      throw error;
    }
  }

  openAllLockers(): void {
    if (!this.hasTotem) {
      this.snackBar.open('No hay ningún tótem configurado', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    if (!this.lockers || this.lockers.length === 0) {
      this.snackBar.open('No hay casilleros cargados. Intenta cargar los casilleros primero.', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    const lockersToUpdate = this.lockers.filter(locker => 
      locker && locker.status !== 'disponible' && locker.status !== 'mantenimiento'
    );

    if (lockersToUpdate.length === 0) {
      this.snackBar.open('Todos los casilleros ya están disponibles o en mantenimiento', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    Swal.fire({
      title: '¿Marcar casilleros como disponibles?',
      text: `Se marcarán ${lockersToUpdate.length} casilleros como disponibles (excluyendo los que están en mantenimiento).`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, marcar disponibles',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isOpeningLockers = true;
        this.openAllLockersIndividually(lockersToUpdate);
      }
    });
  }

  /**
   * Marca todos los casilleros como disponibles individualmente y actualiza las actividades
   */
  private openAllLockersIndividually(lockersToUpdate: any[]): void {
    console.log('🔓 Iniciando apertura completa de casilleros y actividades...');
    
    // Paso 1: Marcar casilleros como disponibles
    const updatePromises = lockersToUpdate.map(locker => {
      if (!locker || !locker._id) {
        console.warn('Casillero inválido omitido:', locker);
        return Promise.resolve();
      }

      console.log(`🔓 Abriendo casillero: ${locker.name} (${locker._id}) - Estado actual: ${locker.status}`);
      
      return firstValueFrom(this.totemService.updateLockerStatus(this.totemId, locker._id, 'disponible'))
        .then(() => {
          console.log(`✅ Casillero ${locker.name} marcado como disponible`);
        })
        .catch(error => {
          console.error(`❌ Error abriendo casillero ${locker.name}:`, error);
          throw error;
        });
    });

    Promise.all(updatePromises)
      .then(() => {
        console.log('✅ Todos los casilleros marcados como disponibles exitosamente');
        console.log('🔄 Ahora limpiando asignaciones en actividades...');
        
        // Paso 2: Limpiar asignaciones en actividades
        return this.clearActivityAssignments();
      })
      .then(() => {
        console.log('✅ Proceso completo de apertura terminado');
        this.isOpeningLockers = false;
        
        // Recargar casilleros para mostrar el estado actualizado
        this.loadLockersStatus();
        
        Swal.fire({
          icon: 'success',
          title: '¡Apertura completa!',
          text: `Se han marcado ${lockersToUpdate.length} casilleros como disponibles y actualizado las actividades`,
          timer: 3000,
          showConfirmButton: false
        });

        // Log de la operación
        this.logsService.logInfo('system_config_changed', 'Apertura completa: casilleros marcados como disponibles y actividades actualizadas', {
          totemId: this.totemId,
          lockersCount: lockersToUpdate.length
        }).subscribe();
      })
      .catch(error => {
        console.error('❌ Error en la apertura completa:', error);
        this.isOpeningLockers = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error en la apertura',
          text: 'Algunos casilleros o actividades no pudieron ser procesados. Revisa la consola para más detalles.',
          confirmButtonText: 'Aceptar'
        });

        // Log del error
        this.logsService.logSystemError(error, 'Apertura completa de casilleros y actividades');
      });
  }

  // ===== MÉTODOS DE CASILLEROS =====

  loadLockersStatus(): void {
    console.log('=== DEBUG loadLockersStatus ===');
    console.log('hasTotem:', this.hasTotem);
    console.log('totemId actual:', this.totemId);
    console.log('totemId esperado:', '6862e21eadfd4988a6a87acf');
    
    if (!this.hasTotem) {
      console.log('No hay tótem configurado, saliendo...');
      this.snackBar.open('No hay ningún tótem configurado', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    if (!this.totemId || this.totemId === '' || this.totemId === 'undefined' || this.totemId === 'null') {
      console.log('TotemId inválido, intentando recargar...');
      this.loadTotemStatus();
      return;
    }

    this.isLoadingLockers = true;
    
    console.log('=== CARGANDO CASILLEROS Y ACTIVIDADES EN PARALELO ===');
    console.log('Cargando casilleros con totemId:', this.totemId);
    
    // Hacer dos llamadas en paralelo: casilleros y actividades
    forkJoin({
      casilleros: this.totemService.getTotems(this.totemId, true),
      actividades: this.actividadesService.getActivities()
    }).subscribe({
      next: (resultado: { casilleros: any; actividades: Activity[] }) => {
        console.log('=== RESPUESTA PARALELA ===');
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

        // Log de carga exitosa de casilleros
        this.logsService.logInfo('totem_connected', `Casilleros cargados exitosamente: ${this.lockers.length} casilleros, ${casilleroOcupados.length} ocupados`, { 
          totemId: this.totemId, 
          lockersCount: this.lockers.length,
          occupiedCount: casilleroOcupados.length
        }).subscribe();
      },
      error: (error: any) => {
        console.error('=== ERROR AL CARGAR CASILLEROS Y ACTIVIDADES ===');
        console.error('Error loading lockers and activities:', error);
        console.error('TotemId usado:', this.totemId);
        
        this.isLoadingLockers = false;
        this.snackBar.open('Error al cargar el estado de los casilleros', 'Cerrar', {
          duration: 3000
        });
        this.lockers = [];

        // Log del error
        this.logsService.logSystemError(error, `Carga de casilleros del tótem ${this.totemId}`);
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
    
    console.log('🔍 Actividades activas encontradas:', actividadesActivas.length);
    
    // Extraer IDs de casilleros asignados
    actividadesActivas.forEach(actividad => {
      actividad.assignedLockers.forEach(locker => {
        if (locker.lockerId && locker.totemId === this.totemId) {
          casilleroOcupados.push(locker.lockerId);
          console.log(`📌 Casillero ${locker.lockerId} ocupado por actividad "${actividad.name}"`);
        }
      });
    });
    
    return casilleroOcupados;
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
        return {
          ...casillero,
          status: 'ocupado',
          occupiedByActivity: true // Marcar que está ocupado por actividad
        };
      }
      
      // Si el casillero no está ocupado pero tenía el flag, limpiarlo
      if (!estaOcupado && casillero.occupiedByActivity) {
        console.log(`🔄 Cambiando estado del casillero "${casillero.name}" de "ocupado" a "disponible"`);
        return {
          ...casillero,
          status: 'disponible',
          occupiedByActivity: false
        };
      }
      
      return casillero;
    });
  }

  // Método de prueba usando getTotemsSimple (sin timestamp)
  loadLockersSimple(): void {
    if (!this.hasTotem) {
      this.snackBar.open('No hay ningún tótem configurado', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.isLoadingLockers = true;
    
    console.log('=== PROBANDO MÉTODO SIMPLE (SIN TIMESTAMP) ===');
    console.log('TotemId:', this.totemId);
    
    this.totemService.getTotemsSimple(this.totemId).subscribe({
      next: (data: any) => {
        console.log('=== RESPUESTA MÉTODO SIMPLE ===');
        console.log('Respuesta completa:', data);
        console.log('Tipo de data:', typeof data);
        console.log('Es array?:', Array.isArray(data));
        
        // ✅ CORRECCIÓN: El servidor devuelve DIRECTAMENTE un array
        if (Array.isArray(data)) {
          this.lockers = data.filter(locker => locker != null);
          console.log('✅ Casilleros cargados (respuesta directa como array):', this.lockers);
        } else if (data && Array.isArray(data.casilleros)) {
          this.lockers = data.casilleros.filter((locker: any) => locker != null);
          console.log('✅ Casilleros cargados (desde data.casilleros):', this.lockers);
        } else if (typeof data === 'object' && data !== null) {
          console.log('Explorando objeto data...');
          console.log('Propiedades del objeto:', Object.keys(data));
          
          // Buscar casilleros en cualquier propiedad
          for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value) && value.length > 0) {
              console.log(`Encontrado array en propiedad "${key}":`, value);
              if (value[0] && typeof value[0] === 'object' && ('status' in value[0] || 'name' in value[0])) {
                this.lockers = value.filter(locker => locker != null);
                console.log(`✅ Casilleros cargados desde propiedad "${key}":`, this.lockers);
                break;
              }
            }
          }
          
          if (this.lockers.length === 0) {
            console.warn('❌ No se encontraron casilleros en la respuesta:', data);
          }
        } else {
          console.warn('❌ Formato de respuesta no reconocido:', data);
          this.lockers = [];
        }
        
        this.lastUpdated = new Date();
        this.isLoadingLockers = false;
        
        console.log('=== RESULTADO FINAL SIMPLE ===');
        console.log('Casilleros cargados:', this.lockers.length);
        
        this.snackBar.open(`[SIMPLE] Cargados ${this.lockers.length} casilleros`, 'Cerrar', {
          duration: 2000
        });
      },
      error: (error: any) => {
        console.error('=== ERROR MÉTODO SIMPLE ===');
        console.error('Error:', error);
        console.error('TotemId usado:', this.totemId);
        
        this.isLoadingLockers = false;
        this.snackBar.open('Error al cargar casilleros (método simple)', 'Cerrar', {
          duration: 3000
        });
        this.lockers = [];
      }
    });
  }

  getLockerStats(): any {
    console.log('=== CALCULANDO ESTADÍSTICAS DE CASILLEROS ===');
    console.log('Array de casilleros:', this.lockers);
    console.log('Cantidad de casilleros:', this.lockers?.length || 0);
    
    if (!this.lockers || this.lockers.length === 0) {
      console.log('❌ No hay casilleros para procesar');
      return {
        disponible: 0,
        ocupado: 0,
        mantenimiento: 0,
        abierto: 0
      };
    }

    const stats = {
      disponible: 0,
      ocupado: 0,
      mantenimiento: 0,
      abierto: 0
    };

    this.lockers.forEach((locker: any, index: number) => {
      if (!locker) {
        console.warn(`Casillero ${index + 1} es null o undefined`);
        return;
      }
      
      console.log(`Casillero ${index + 1}:`, {
        name: locker.name,
        status: locker.status,
        _id: locker._id
      });
      
      switch (locker.status) {
        case 'disponible':
          stats.disponible++;
          break;
        case 'ocupado':
          stats.ocupado++;
          break;
        case 'mantenimiento':
          stats.mantenimiento++;
          break;
        case 'abierto':
          stats.abierto++;
          break;
        default:
          console.warn(`Estado desconocido: ${locker.status} para casillero ${locker.name || 'sin nombre'}`);
      }
    });

    console.log('📊 Estadísticas calculadas:', stats);
    return stats;
  }

  getLockerTooltip(locker: any): string {
    if (!locker) {
      return 'Casillero no disponible';
    }
    
    const statusText = this.getLockerStatusText(locker.status);
    const equipmentCount = locker.equipos ? locker.equipos.length : 0;
    const equipmentText = equipmentCount > 0 ? `${equipmentCount} equipos asignados` : 'Sin equipos asignados';
    
    return `${locker.name || 'Casillero'} - ${statusText} - ${equipmentText}`;
  }

  getLockerStatusText(status: string): string {
    switch (status) {
      case 'disponible':
        return 'Disponible';
      case 'ocupado':
        return 'Ocupado';
      case 'mantenimiento':
        return 'Mantenimiento';
      case 'abierto':
        return 'Abierto';
      default:
        return 'Desconocido';
    }
  }

  // Función de tracking para temas
  trackByTheme(index: number, theme: any): any {
    return theme ? theme.id : index;
  }

  // ===== MÉTODOS DE CASILLEROS INDIVIDUALES =====

  /**
   * Abre un casillero individual específico
   */
  openIndividualLocker(locker: any): void {
    if (!locker || !locker._id) {
      console.warn('Casillero inválido para abrir:', locker);
      return;
    }

    if (!this.hasTotem || !this.totemId) {
      this.snackBar.open('No hay un tótem configurado', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    // Mostrar confirmación
    Swal.fire({
      title: `¿Abrir ${locker.name}?`,
      text: `¿Deseas abrir físicamente el casillero "${locker.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, abrir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeOpenLocker(locker);
      }
    });
  }

  /**
   * Ejecuta la apertura física del casillero
   */
  private executeOpenLocker(locker: any): void {
    console.log(`🔓 Abriendo casillero individual: ${locker.name} (${locker._id})`);
    
    // Indicador de carga
    Swal.fire({
      title: 'Abriendo casillero...',
      text: `Enviando comando para abrir "${locker.name}"`,
      icon: 'info',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Llamar al servicio para abrir el casillero
    this.totemService.openCasillero(this.totemId, locker._id).subscribe({
      next: (response) => {
        console.log(`✅ Casillero ${locker.name} abierto exitosamente:`, response);
        
        Swal.fire({
          icon: 'success',
          title: '¡Casillero abierto!',
          text: `El casillero "${locker.name}" ha sido abierto exitosamente`,
          timer: 3000,
          showConfirmButton: false
        });

        // Log de la operación
        this.logsService.logInfo('locker_opened', `Casillero ${locker.name} abierto manualmente`, {
          lockerId: locker._id,
          lockerName: locker.name,
          totemId: this.totemId,
          openedFrom: 'configuration_panel'
        }).subscribe();

        // Opcional: Recargar estado de casilleros después de un tiempo
        setTimeout(() => {
          this.loadLockersStatus();
        }, 2000);
      },
      error: (error) => {
        console.error(`❌ Error abriendo casillero ${locker.name}:`, error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error al abrir casillero',
          text: error.error?.message || `No se pudo abrir el casillero "${locker.name}". Verifica la conexión con el tótem.`,
          confirmButtonText: 'Aceptar'
        });

        // Log del error
        this.logsService.logSystemError(error, `Apertura individual del casillero ${locker.name}`);
      }
    });
  }

  /**
   * Verifica si un casillero puede ser abierto
   */
  canOpenLocker(locker: any): boolean {
    if (!locker || !locker._id) return false;
    if (!this.hasTotem || !this.totemId) return false;
    
    // Solo permitir abrir casilleros disponibles o en mantenimiento
    return locker.status === 'disponible' || locker.status === 'mantenimiento';
  }

  /**
   * Obtiene el texto de ayuda para mostrar en el tooltip del casillero
   */
  getLockerClickTooltip(locker: any): string {
    if (!locker) return 'Casillero no disponible';
    
    const baseTooltip = this.getLockerTooltip(locker);
    
    if (this.canOpenLocker(locker)) {
      return `${baseTooltip} • Haz clic para abrir`;
    }
    
    return `${baseTooltip} • No se puede abrir (estado: ${locker.status})`;
  }

  // ===== MÉTODOS DE LOGS =====

  loadLogConfiguration(): void {
    this.isLoadingLogConfig = true;
    
    this.logsService.getConfiguration().subscribe({
      next: (config) => {
        this.logConfiguration = config;
        this.updateLogConfigForm(config);
        this.isLoadingLogConfig = false;
      },
      error: (error) => {
        console.error('Error loading log configuration:', error);
        this.isLoadingLogConfig = false;
        this.snackBar.open('Error al cargar la configuración de logs', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  loadLogStats(): void {
    this.isLoadingLogStats = true;
    
    this.logsService.getLogStats().subscribe({
      next: (stats) => {
        this.logStats = stats;
        this.recentLogs = stats.recentErrors || [];
        this.isLoadingLogStats = false;
      },
      error: (error) => {
        console.error('Error loading log stats:', error);
        this.isLoadingLogStats = false;
      }
    });
  }

  openLogConfigModal(): void {
    this.showLogConfigModal = true;
    if (this.logConfiguration) {
      this.updateLogConfigForm(this.logConfiguration);
    }
  }

  closeLogConfigModal(): void {
    this.showLogConfigModal = false;
  }

  updateLogConfigForm(config: LogConfiguration): void {
    this.logConfigForm.patchValue({
      level: config.level,
      enabledEvents: config.enabledEvents,
      retention: config.retention,
      format: config.format,
      alertEmails: config.alertEmails.join(', '),
      autoExport: config.autoExport,
      compressionEnabled: config.compressionEnabled,
      maxFileSize: config.maxFileSize,
      rotationEnabled: config.rotationEnabled
    });
  }

  saveLogConfiguration(): void {
    if (!this.logConfigForm.valid) return;

    this.isLoadingLogConfig = true;
    const formValue = this.logConfigForm.value;
    
    const config: LogConfiguration = {
      level: formValue.level,
      enabledEvents: formValue.enabledEvents,
      retention: formValue.retention,
      format: formValue.format,
      alertEmails: formValue.alertEmails ? formValue.alertEmails.split(',').map((email: string) => email.trim()).filter((email: string) => email) : [],
      autoExport: formValue.autoExport,
      compressionEnabled: formValue.compressionEnabled,
      maxFileSize: formValue.maxFileSize,
      rotationEnabled: formValue.rotationEnabled
    };

    this.logsService.updateConfiguration(config).subscribe({
      next: (response) => {
        this.logConfiguration = config;
        this.logsService.updateConfigurationSubject(config);
        this.isLoadingLogConfig = false;
        this.showLogConfigModal = false;
        
        // Log del cambio de configuración
        this.logsService.logSystemConfigChange('logs', config);
        
        Swal.fire({
          icon: 'success',
          title: '¡Configuración guardada!',
          text: response.message || 'La configuración de logs se ha guardado correctamente',
          timer: 3000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        this.isLoadingLogConfig = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Error al guardar la configuración de logs'
        });
      }
    });
  }

  resetLogConfiguration(): void {
    Swal.fire({
      title: '¿Resetear configuración de logs?',
      text: 'Se restablecerán todos los valores a sus configuraciones por defecto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, resetear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.logsService.resetConfiguration().subscribe({
          next: (response) => {
            this.logConfiguration = response.config;
            this.logsService.updateConfigurationSubject(response.config);
            this.updateLogConfigForm(response.config);
            
            Swal.fire({
              icon: 'success',
              title: 'Configuración reseteada',
              text: 'La configuración de logs ha sido restablecida exitosamente',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'Error al resetear la configuración de logs'
            });
          }
        });
      }
    });
  }

  clearLogs(): void {
    Swal.fire({
      title: '¿Limpiar logs?',
      text: 'Se eliminarán todos los logs almacenados. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.logsService.clearLogs().subscribe({
          next: (response) => {
            this.loadLogStats(); // Recargar estadísticas
            
            Swal.fire({
              icon: 'success',
              title: 'Logs limpiados',
              text: `Se eliminaron ${response.deletedCount} entradas de log`,
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'Error al limpiar los logs'
            });
          }
        });
      }
    });
  }

  clearAllStoredLogs(): void {
    Swal.fire({
      title: '¿Limpiar TODO el historial de logs?',
      text: 'Se eliminarán TODOS los logs del almacenamiento local. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.logsService.clearAllStoredLogs();
        this.loadLogStats(); // Recargar estadísticas
        
        Swal.fire({
          icon: 'success',
          title: 'Historial eliminado',
          text: 'Se ha eliminado todo el historial de logs del almacenamiento local',
          timer: 3000,
          showConfirmButton: false
        });
      }
    });
  }

  clearOldLogs(): void {
    Swal.fire({
      title: '¿Limpiar logs antiguos?',
      text: 'Se eliminarán los logs más antiguos según la configuración de retención',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const retentionDays = this.logConfiguration?.retention || 90;
        
        this.logsService.clearLogs(retentionDays).subscribe({
          next: (response) => {
            this.loadLogStats(); // Recargar estadísticas
            
            Swal.fire({
              icon: 'success',
              title: 'Logs antiguos limpiados',
              text: `Se eliminaron ${response.deletedCount} entradas de log anteriores a ${retentionDays} días`,
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'Error al limpiar los logs antiguos'
            });
          }
        });
      }
    });
  }

  exportLogs(): void {
    const format = this.logConfiguration?.format || 'json';
    
    const filter = {
      page: 1,
      limit: 10000 // Exportar todos los logs
    };

    this.logsService.exportLogs(filter, format as 'json' | 'csv' | 'excel').subscribe({
      next: (blob) => {
        // Crear URL para descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open('Logs exportados exitosamente', 'Cerrar', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error exporting logs:', error);
        this.snackBar.open('Error al exportar los logs', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  openLogViewer(): void {
    this.showLogViewerModal = true;
    this.loadLogs(); // Cargar logs al abrir el modal
  }

  closeLogViewer(): void {
    this.showLogViewerModal = false;
    this.currentLogs = [];
    this.resetLogFilter();
  }

  loadLogs(): void {
    this.isLoadingLogs = true;
    
    const filter = {
      page: this.currentLogFilter.page,
      limit: this.currentLogFilter.limit,
      level: this.currentLogFilter.level || undefined,
      eventType: this.currentLogFilter.eventType || undefined,
      search: this.currentLogFilter.search || undefined,
      startDate: this.currentLogFilter.startDate || undefined,
      endDate: this.currentLogFilter.endDate || undefined
    };

    this.logsService.getLogs(filter).subscribe({
      next: (response) => {
        this.currentLogs = response.logs;
        this.logsPagination = {
          total: response.total,
          totalPages: response.totalPages,
          currentPage: response.page
        };
        this.isLoadingLogs = false;
        console.log('📊 Logs cargados en el visor:', response);
      },
      error: (error) => {
        console.error('Error loading logs:', error);
        this.currentLogs = [];
        this.isLoadingLogs = false;
        this.snackBar.open('Error al cargar los logs', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  filterLogs(): void {
    this.currentLogFilter.page = 1; // Resetear a la primera página
    this.loadLogs();
  }

  resetLogFilter(): void {
    this.currentLogFilter = {
      page: 1,
      limit: 10,
      level: '',
      eventType: '',
      search: '',
      startDate: null,
      endDate: null
    };
    this.loadLogs();
  }

  changePage(page: number): void {
    this.currentLogFilter.page = page;
    this.loadLogs();
  }

  nextPage(): void {
    if (this.currentLogFilter.page < this.logsPagination.totalPages) {
      this.changePage(this.currentLogFilter.page + 1);
    }
  }

  previousPage(): void {
    if (this.currentLogFilter.page > 1) {
      this.changePage(this.currentLogFilter.page - 1);
    }
  }

  getLogLevelColor(level: string): string {
    const levelInfo = this.logLevels.find(l => l.value === level);
    return levelInfo ? levelInfo.color : 'text-gray-600';
  }

  getEventTypeLabel(eventType: LogEventType): string {
    const eventInfo = this.logEventTypes.find(e => e.value === eventType);
    return eventInfo ? eventInfo.label : eventType;
  }

  getEventTypesByCategory(): { [category: string]: { value: LogEventType; label: string; category: string }[] } {
    return this.logEventTypes.reduce((acc, event) => {
      if (!acc[event.category]) {
        acc[event.category] = [];
      }
      acc[event.category].push(event);
      return acc;
    }, {} as { [category: string]: { value: LogEventType; label: string; category: string }[] });
  }

  isEventEnabled(eventType: LogEventType): boolean {
    return this.logConfiguration?.enabledEvents.includes(eventType) || false;
  }

  toggleEvent(eventType: LogEventType): void {
    if (!this.logConfiguration) return;
    
    const currentEvents = this.logConfigForm.get('enabledEvents')?.value || [];
    const eventIndex = currentEvents.indexOf(eventType);
    
    if (eventIndex > -1) {
      currentEvents.splice(eventIndex, 1);
    } else {
      currentEvents.push(eventType);
    }
    
    this.logConfigForm.patchValue({
      enabledEvents: currentEvents
    });
  }

  ngOnDestroy(): void {
    // Limpiar recursos si es necesario
  }

  /**
   * Limpia todas las actividades dejándolas con estructura básica
   * Muestra confirmación antes de proceder
   */
  async cleanAllActivities(): Promise<void> {
    try {
      // Mostrar confirmación con SweetAlert
      const confirmResult = await Swal.fire({
        title: '¿Limpiar todas las actividades?',
        html: `
          <div class="text-left">
            <p class="mb-3">Esta acción eliminará de todas las actividades:</p>
            <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Usuarios asignados (dueños de energía, supervisores, trabajadores)</li>
              <li>Validaciones de energía cero</li>
              <li>Equipos asociados</li>
              <li>Casilleros asignados</li>
              <li>Historial de rupturas</li>
            </ul>
            <p class="mt-3 text-sm"><strong>Las actividades quedarán limpias y en estado "pendiente"</strong></p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, limpiar actividades',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
      });

      if (!confirmResult.isConfirmed) {
        return;
      }

      // Mostrar loading
      Swal.fire({
        title: 'Limpiando actividades...',
        text: 'Por favor espera mientras se procesan las actividades',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Llamar al servicio para limpiar actividades
      const result = await firstValueFrom(this.actividadesService.cleanAllActivities());

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Actividades limpiadas!',
          html: `
            <div class="text-center">
              <p>${result.message}</p>
              <div class="mt-3 text-sm text-gray-600">
                <p>Actividades procesadas: ${result.data?.matched || 0}</p>
                <p>Actividades modificadas: ${result.data?.modified || 0}</p>
              </div>
            </div>
          `,
          timer: 5000,
          timerProgressBar: true
        });

        console.log('✅ Actividades limpiadas exitosamente:', result);
      } else {
        throw new Error(result.message || 'Error desconocido al limpiar actividades');
      }

    } catch (error) {
      console.error('❌ Error al limpiar actividades:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al limpiar actividades',
        text: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        confirmButtonText: 'Entendido'
      });
    }
  }

  async debugFingerprintComparison() {
    try {
      this.isTestingFingerprint = true;
      
      // Capturar huella actual
      const captureResult = await this.usersService.captureFingerprint().toPromise();
      
      if (!captureResult || captureResult.error) {
        this.snackBar.open('Error al capturar huella para debug', 'Cerrar', { duration: 3000 });
        return;
      }
      
      const currentTemplate = (captureResult as any).template;
      
      // Probar diferentes niveles de seguridad
      const testLevels = [1, 3, 5, 7, 9];
      const debugResults = [];
      
      for (const level of testLevels) {
        try {
          const compareData = {
            template1_data: currentTemplate,
            template2_data: currentTemplate, // Comparar consigo misma
            security_level: level
          };
          
          const response = await this.http.post<any>('http://localhost:5000/comparar-huellas', compareData).toPromise();
          debugResults.push({
            level,
            matched: response?.matched || false,
            score: response?.score || 0,
            message: response?.message || 'N/A'
          });
        } catch (error: any) {
          debugResults.push({
            level,
            error: error?.message || 'Error desconocido'
          });
        }
      }
      
      console.log('Debug results:', debugResults);
      
      // Mostrar resultados en modal
      Swal.fire({
        title: 'Debug Comparación de Huellas',
        html: `
          <div style="text-align: left; max-height: 400px; overflow-y: auto;">
            <h4>Resultados por nivel de seguridad:</h4>
            ${debugResults.map(result => `
              <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd;">
                <strong>Nivel ${result.level}:</strong><br>
                ${result.error ? `Error: ${result.error}` : 
                  `Match: ${result.matched ? 'SÍ' : 'NO'}<br>
                   Score: ${result.score || 0}<br>
                   Mensaje: ${result.message || 'N/A'}`}
              </div>
            `).join('')}
          </div>
        `,
        width: 600,
        confirmButtonText: 'Cerrar'
      });
      
    } catch (error: any) {
      console.error('Error en debug:', error);
      this.snackBar.open('Error en debug de comparación', 'Cerrar', { duration: 3000 });
    } finally {
      this.isTestingFingerprint = false;
    }
  }
} 