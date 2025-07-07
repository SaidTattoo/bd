import { Component, Input, Output,EventEmitter, Inject, OnInit } from '@angular/core';
import { User } from '../../interface/activity.interface';
import { ActivityService } from '../../services/actividades.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule, JsonPipe } from '@angular/common';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [ CommonModule],
  templateUrl: './user-modal.component.html',
  styleUrl: './user-modal.component.scss'
})
export class UserModalComponent implements OnInit {
  user!: User;
  activityId!: string;
  userLogin!:any;
  energyOwner!: any;
  @Output() userBlocked = new EventEmitter<void>();

  constructor(private activityService: ActivityService,@Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<UserModalComponent>  ){
    this.user = data.user;
    this.activityId = data.activityId;
    this.userLogin = data.userLogin;
    this.energyOwner = data.energyOwner;
  }

  ngOnInit(): void {
    console.log('user', this.user);
    console.log('activityId', this.activityId);
    console.log('userLogin', this.userLogin);
  }
  bloquear() {
    const data: any = {
      "energyOwnerId": this.energyOwner.user._id,
      "supervisorId": null,
      "workerId": null
    };

    let serviceMethod: any;

    // Si el usuario logueado es supervisor, él es quien debe ser asignado
    if (this.userLogin.user.perfil === 'supervisor') {
      data.supervisorId = this.userLogin.user._id;
      serviceMethod = this.activityService.asignarSupervisorAduenoEnergia(this.activityId, data);
    } 
    // Si es trabajador, buscamos el supervisor correspondiente
    else if (this.userLogin.user.perfil === 'trabajador') {
      const supervisor = this.energyOwner.supervisors.find((sup: any) => sup.user._id === this.user._id);
      data.workerId = this.userLogin.user._id;
      data.supervisorId = supervisor ? supervisor.user._id : null;
      serviceMethod = this.activityService.asignarTrabajadorAsupervisor(this.activityId, data);
    }

    // Verificar que serviceMethod esté definido (por si el rol no es ni supervisor ni trabajador)
    if (serviceMethod) {
      serviceMethod.subscribe({
        next: (response: any) => {
          if (response.error === false || !response.error) { // Considerar ambos casos
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: response.mensaje || 'Operación realizada exitosamente'
            });
            this.userBlocked.emit();
            
            // Cerrar el modal y pasar la respuesta completa en lugar de solo true
            this.dialogRef.close(response);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: response.mensaje || 'Ocurrió un error en la asignación'
            });
            this.dialogRef.close(false);
          }
        },
        error: (error: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Error inesperado',
            text: 'Ocurrió un error en el proceso de asignación.'
          });
          this.dialogRef.close(false);
        }
      });
    } else {
      console.warn('El rol del usuario no es válido para esta operación.');
    }
  }
}