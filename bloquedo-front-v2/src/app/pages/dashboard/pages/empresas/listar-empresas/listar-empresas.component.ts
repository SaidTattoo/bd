import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';
import { EmpresasService } from '../../../../services/empresas.service';
import { 
  Empresa, 
  EmpresaQueryParams, 
  PaginatedEmpresaResponse, 
  EmpresaStatus,
  EmpresaSector,
  SECTORES_EMPRESA,
  ESTADOS_EMPRESA
} from '../empresa.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listar-empresas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    DashboardLayoutComponent
  ],
  templateUrl: './listar-empresas.component.html',
 // styleUrls: ['./listar-empresas.component.scss']
})
export class ListarEmpresasComponent implements OnInit {
  empresas: Empresa[] = [];
  paginationData: PaginatedEmpresaResponse | null = null;
  isLoading = false;
  error: string | null = null;

  // Filtros
  searchForm: FormGroup;
  sectores = SECTORES_EMPRESA;
  estados = ESTADOS_EMPRESA;

  // Paginación
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // Ordenamiento
  sortBy = 'nombre';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Estado de la vista
  selectedEmpresas: Set<string> = new Set();
  showBatchActions = false;

  constructor(
    private empresasService: EmpresasService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      sector: [''],
      status: [''],
      sortBy: ['nombre'],
      sortOrder: ['asc']
    });
  }

  ngOnInit() {
    this.loadEmpresas();
    this.setupSearchForm();
  }

  private setupSearchForm() {
    this.searchForm.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadEmpresas();
    });
  }

  loadEmpresas() {
    this.isLoading = true;
    this.error = null;

    const formValues = this.searchForm.value;
    const params: EmpresaQueryParams = {
      page: this.currentPage,
      limit: this.pageSize,
      search: formValues.search || undefined,
      sector: formValues.sector || undefined,
      status: formValues.status || undefined,
      sortBy: formValues.sortBy || 'nombre',
      sortOrder: formValues.sortOrder || 'asc'
    };

    this.empresasService.getEmpresas(params).subscribe({
      next: (response) => {
        this.paginationData = response.data;
        this.empresas = response.data.empresas;
        this.totalItems = response.data.total;
        this.totalPages = response.data.totalPages;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar empresas:', error);
        this.error = 'Error al cargar las empresas';
        this.isLoading = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las empresas',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  // Navegación
  navigateToCreate() {
    this.router.navigate(['/dashboard/empresas/crear']);
  }



  goBackToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  // Paginación
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadEmpresas();
    }
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadEmpresas();
  }

  // Ordenamiento
  sort(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    
    this.searchForm.patchValue({
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    });
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return '';
    return this.sortOrder === 'asc' ? '↑' : '↓';
  }

  // Filtros
  clearFilters() {
    this.searchForm.reset({
      search: '',
      sector: '',
      status: '',
      sortBy: 'nombre',
      sortOrder: 'asc'
    });
    this.currentPage = 1;
  }

  // Acciones de empresa
  viewEmpresa(empresa: Empresa) {
    Swal.fire({
      title: empresa.nombre,
      html: `
        <div class="text-left">
          <p><strong>RUT:</strong> ${empresa.rut}</p>
          <p><strong>Razón Social:</strong> ${empresa.razonSocial}</p>
          <p><strong>Sector:</strong> ${this.getSectorLabel(empresa.sector)}</p>
          <p><strong>Estado:</strong> ${this.getStatusLabel(empresa.status)}</p>
          <p><strong>Email:</strong> ${empresa.email}</p>
          <p><strong>Teléfono:</strong> ${empresa.telefono}</p>
          <p><strong>Empleados:</strong> ${empresa.numeroEmpleados || 'N/A'}</p>
          ${empresa.sitioWeb ? `<p><strong>Sitio Web:</strong> <a href="${empresa.sitioWeb}" target="_blank">${empresa.sitioWeb}</a></p>` : ''}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      width: '600px'
    });
  }

  deleteEmpresa(empresa: Empresa) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar la empresa "${empresa.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.empresasService.deleteEmpresa(empresa.id!).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'La empresa ha sido eliminada exitosamente',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadEmpresas();
          },
          error: (error) => {
            console.error('Error al eliminar empresa:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la empresa',
              confirmButtonText: 'Entendido'
            });
          }
        });
      }
    });
  }

  changeStatus(empresa: Empresa) {
    const statusOptions = this.estados.map(estado => ({
      value: estado.value,
      text: estado.label
    }));

    Swal.fire({
      title: 'Cambiar Estado',
      text: `Empresa: ${empresa.nombre}`,
      input: 'select',
      inputOptions: statusOptions.reduce((acc, option) => {
        acc[option.value] = option.text;
        return acc;
      }, {} as Record<string, string>),
      inputValue: empresa.status,
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes seleccionar un estado';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const newStatus = result.value as EmpresaStatus;
        this.empresasService.changeEmpresaStatus(empresa.id!, newStatus).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Estado Actualizado',
              text: `El estado de la empresa ha sido cambiado a ${this.getStatusLabel(newStatus)}`,
              timer: 2000,
              showConfirmButton: false
            });
            this.loadEmpresas();
          },
          error: (error) => {
            console.error('Error al cambiar estado:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo cambiar el estado de la empresa',
              confirmButtonText: 'Entendido'
            });
          }
        });
      }
    });
  }

  // Selección múltiple
  toggleSelection(empresaId: string) {
    if (this.selectedEmpresas.has(empresaId)) {
      this.selectedEmpresas.delete(empresaId);
    } else {
      this.selectedEmpresas.add(empresaId);
    }
    this.showBatchActions = this.selectedEmpresas.size > 0;
  }

  selectAll() {
    if (this.selectedEmpresas.size === this.empresas.length) {
      this.selectedEmpresas.clear();
    } else {
      this.empresas.forEach(empresa => this.selectedEmpresas.add(empresa.id!));
    }
    this.showBatchActions = this.selectedEmpresas.size > 0;
  }

  clearSelection() {
    this.selectedEmpresas.clear();
    this.showBatchActions = false;
  }

  // Utilidades
  getSectorLabel(sector: EmpresaSector): string {
    return this.empresasService.getSectorLabel(sector);
  }

  getStatusLabel(status: EmpresaStatus): string {
    return this.empresasService.getStatusLabel(status);
  }

  getStatusClass(status: EmpresaStatus): string {
    return this.empresasService.getStatusClass(status);
  }

  formatRut(rut: string): string {
    return this.empresasService.formatRut(rut);
  }

  getPaginationArray(): number[] {
    const pages = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  trackByEmpresa(index: number, empresa: Empresa): string {
    return empresa.id || index.toString();
  }

  Math = Math;
} 