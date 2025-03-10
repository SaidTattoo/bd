import { Routes } from '@angular/router';
import { ActividadesComponent } from './pages/actividades/components/activity-details/actividades.component';
import { ListActivityComponent } from './pages/actividades/components/list-activity/list-activity.component';
import { EquipmentSelectionComponent } from './pages/actividades/components/equipment-selection.component.ts/equipment-selection.component.ts.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { routesDashboard } from './pages/dashboard/dashboard.routes';
import { AreasComponent } from './pages/dashboard/pages/areas/areas.component';
import { ReporteComponent } from './pages/actividades/components/reporte/reporte.component';


export const routes: Routes = [
    { path: '', component: ListActivityComponent },
    { path: 'dashboard', component: DashboardComponent, children: routesDashboard },
    { path: 'detail/:id', component: ActividadesComponent },
    { path: 'equipment-selection/:id', component: EquipmentSelectionComponent },
    { path: 'areas', component: AreasComponent },
    { path: 'activities/:id/report', component: ReporteComponent },
   { path: 'reporte/:id', component: ReporteComponent },

    // Agrega más rutas según sea necesario
];
