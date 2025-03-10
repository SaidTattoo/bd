import { Routes } from '@angular/router';
import { EquiposComponent } from './pages/equipos/equipos.component';
import { AreasComponent } from './pages/areas/areas.component';
import { ActividadesComponent } from './pages/actividades/actividades.component';
import { CrearActividadComponent } from './pages/actividades/crear-actividad/crear-actividad.component';
import { CrearAreaComponent } from './pages/areas/crear-area/crear-area.component';
import { UsersComponent } from './pages/users/users.component';
import { ListarUsuariosComponent } from './pages/users/listar-usuarios/listar-usuarios.component';

export const routesDashboard: Routes = [
    { path: 'actividades', component: ActividadesComponent },
    { path: 'areas', component: AreasComponent },
    { path: 'equipos', component: EquiposComponent },
    { path: 'crear-actividad', component: CrearActividadComponent },
    { path: 'crear-area', component: CrearAreaComponent },
    { path: 'usuarios/registro', component: UsersComponent },
    { path: 'usuarios/listar', component: ListarUsuariosComponent },
    // Agrega más rutas según sea necesario
];