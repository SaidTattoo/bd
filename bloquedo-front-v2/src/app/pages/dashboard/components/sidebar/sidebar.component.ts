import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TotemService } from '../../../services/totem.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ RouterLink, RouterLinkActive, ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  constructor(private totemService: TotemService) {}

  private readonly TOTEM_ID = environment.totem.id; // Usando el ID del totem desde environment

  clearAllLockers() {
    this.totemService.clearAllLockers(this.TOTEM_ID).subscribe((response: any) => {
      console.log('Casilleros limpiados', response);
    });
  }

  openAllLockers() {
    this.totemService.openAllLockers(this.TOTEM_ID).subscribe((response: any) => {
      console.log('Casilleros abiertos', response);
    });
  }
}
