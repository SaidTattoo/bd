import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TotemService } from '../../../services/totem.service';
import { environment } from '../../../../../environments/environment';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateTotemModalComponent } from '../create-totem-modal/create-totem-modal.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ 
    CommonModule,
    RouterLink, 
    RouterLinkActive,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  hasTotem: boolean = false;
  totemId: string = '';
  
  constructor(
    private totemService: TotemService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit() {
    // Verificar si ya existe un tótem configurado
    this.hasTotem = this.totemService.hasConfiguredTotem();
    this.totemId = this.totemService.getTotemId();
    
    // Depuración
    console.log('Estado del tótem:', {
      hasTotem: this.hasTotem,
      totemId: this.totemId
    });
    
    // Si no hay un tótem válido, forzar a mostrar el botón
    if (!this.totemId || this.totemId === 'undefined' || this.totemId === 'null' || this.totemId === '') {
      this.hasTotem = false;
      console.log('Forzando mostrar botón de crear tótem');
      
      // En caso de primer arranque, forzar visualización del botón
      if (localStorage.getItem('first_run') !== 'done') {
        localStorage.setItem('first_run', 'done');
        localStorage.removeItem('totemId');
        this.snackBar.open('Bienvenido! Cree un nuevo tótem para comenzar', 'Entendido', {
          duration: 5000
        });
      }
    }
  }

  openCreateTotemModal() {
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

  clearAllLockers() {
    const totemId = this.totemService.getTotemId();
    
    if (!totemId) {
      this.snackBar.open('No hay ningún tótem configurado', 'Cerrar', {
        duration: 3000
      });
      return;
    }
    
    this.totemService.clearAllLockers(totemId).subscribe({
      next: (response) => {
        this.snackBar.open('Casilleros limpiados exitosamente', 'Cerrar', {
          duration: 3000
        });
      },
      error: (error) => {
        this.snackBar.open('Error al limpiar casilleros', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  openAllLockers() {
    const totemId = this.totemService.getTotemId();
    
    if (!totemId) {
      this.snackBar.open('No hay ningún tótem configurado', 'Cerrar', {
        duration: 3000
      });
      return;
    }
    
    this.totemService.openAllLockers(totemId).subscribe({
      next: (response) => {
        this.snackBar.open('Todos los casilleros han sido marcados como disponibles', 'Cerrar', {
          duration: 3000
        });
      },
      error: (error) => {
        this.snackBar.open('Error al marcar los casilleros como disponibles', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  // Método para forzar mostrar el botón de crear tótem
  forceShowCreateButton() {
    localStorage.removeItem('totemId');
    this.hasTotem = false;
    this.totemId = '';
    this.snackBar.open('Puede crear un nuevo tótem ahora', 'Cerrar', {
      duration: 3000
    });
  }
}
