import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../interface/activity.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-cambiar-energy-owner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-cambiar-energy-owner.component.html',
  styleUrl: './modal-cambiar-energy-owner.component.scss'
})
export class ModalCambiarEnergyOwnerComponent implements OnInit {
  users: any[] = [];
  selectedUserId: User | null = null;
  searchTerm: string = '';
  constructor(@Inject(MAT_DIALOG_DATA) public data: any,  private dialogRef: MatDialogRef<ModalCambiarEnergyOwnerComponent>
) {
    console.log('data', data);
    this.users = data.energyOwners;
  }

  ngOnInit(): void {
    console.log('energyOwners', this.users);
  }

  selectUser(user: User): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Quieres cambiar el dueño de energía?',
      icon: 'warning',
      confirmButtonText: 'Cambiar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.dialogRef.close({
          user: user
        });
        Swal.fire({
          title: "Notificado el nuevo dueño de energía!",
          text: "El nuevo dueño de energía será notificado para que pueda acceder a la actividad.",
          icon: "success"
        });
        this.selectedUserId = user;
        console.log('selectedUserId', this.selectedUserId);

        //TODO: Notificar al nuevo dueño de energía
        //TODO: dejar en estado pendiente al dueño de energia anterior
      }
    });
  }

  getStatusClass(user: User): string {
    return user.isActive
      ? 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'
      : 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
  }
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  get filteredUsers(): User[] {
    return this.users.filter(user => 
      user.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.telefono.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  } 
  onCancel(): void {
    this.dialogRef.close();
  }
}
