import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UsersService } from '../../../../services/users.service';
import { User } from '../../../../actividades/interface/activity.interface';
import { FingerprintModalComponent } from '../fingerprint-modal/fingerprint-modal.component';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';

@Component({
  selector: 'app-listar-usuarios',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    FingerprintModalComponent,
    DashboardLayoutComponent],
  templateUrl: './listar-usuarios.component.html',
  styleUrl: './listar-usuarios.component.scss'
})
export class ListarUsuariosComponent {
  users: User[] = [];
  selectedUser: User | null = null;

  constructor(
    private usersService: UsersService,
    private router: Router
  ) {}

  ngOnInit() {
    this.usersService.getUsers().subscribe(users => {
      this.users = users;
    });
  }

  goBackToDashboard() {
    this.router.navigate(['/dashboard']);
  }
    getProfileBadgeClass(perfil: string): string {
    switch (perfil) {
      case 'duenoDeEnergia':
        return 'bg-amber-100 text-amber-800';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'trabajador':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getProfileLabel(perfil: string): string {
    switch (perfil) {
      case 'duenoDeEnergia':
        return 'Dueño de Energía';
      case 'supervisor':
        return 'Supervisor';
      case 'trabajador':
        return 'Trabajador';
      default:
        return perfil;
    }
  }

  getFingerprintStatusClass(user: User): string {
    if (user.fingerprintsComplete) {
      return 'bg-green-100 text-green-800';
    }
    if (user.fingerprints.length > 0) {
      return 'bg-amber-100 text-amber-800';
    }
    return 'bg-red-100 text-red-800';
  }

  openFingerprintModal(user: User) {
    console.log('user', user);
    this.selectedUser = user;
  }

  closeFingerprintModal() {
    this.selectedUser = null;
  }

  saveFingerprintData(data: any) {
    console.log('Saving fingerprint data:', data);
    // Implement save logic here
    this.closeFingerprintModal();
  }
}

