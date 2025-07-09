import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Empresa, 
  CreateEmpresaRequest, 
  UpdateEmpresaRequest, 
  EmpresaQueryParams, 
  PaginatedEmpresaResponse, 
  EmpresaStats, 
  ApiResponse,
  EmpresaStatus 
} from '../dashboard/pages/empresas/empresa.interface';

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {
  private baseUrl = `${environment.api.url}/empresas`;

  constructor(private http: HttpClient) { }

  /**
   * Crear nueva empresa
   */
  createEmpresa(empresa: CreateEmpresaRequest): Observable<ApiResponse<Empresa>> {
    return this.http.post<ApiResponse<Empresa>>(this.baseUrl, empresa);
  }

  /**
   * Obtener todas las empresas con paginación y filtros
   */
  getEmpresas(params?: EmpresaQueryParams): Observable<ApiResponse<PaginatedEmpresaResponse>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.sector) httpParams = httpParams.set('sector', params.sector);
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.http.get<ApiResponse<PaginatedEmpresaResponse>>(this.baseUrl, { params: httpParams });
  }

  /**
   * Obtener empresa por ID
   */
  getEmpresaById(id: string): Observable<ApiResponse<Empresa>> {
    return this.http.get<ApiResponse<Empresa>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtener empresa por RUT
   */
  getEmpresaByRut(rut: string): Observable<ApiResponse<Empresa>> {
    return this.http.get<ApiResponse<Empresa>>(`${this.baseUrl}/rut/${rut}`);
  }

  /**
   * Actualizar empresa
   */
  updateEmpresa(id: string, empresa: UpdateEmpresaRequest): Observable<ApiResponse<Empresa>> {
    return this.http.put<ApiResponse<Empresa>>(`${this.baseUrl}/${id}`, empresa);
  }

  /**
   * Eliminar empresa (soft delete)
   */
  deleteEmpresa(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Cambiar estado de empresa
   */
  changeEmpresaStatus(id: string, status: EmpresaStatus): Observable<ApiResponse<Empresa>> {
    return this.http.patch<ApiResponse<Empresa>>(`${this.baseUrl}/${id}/status`, { status });
  }

  /**
   * Obtener empresas por sector
   */
  getEmpresasBySector(sector: string): Observable<ApiResponse<Empresa[]>> {
    return this.http.get<ApiResponse<Empresa[]>>(`${this.baseUrl}/sector/${sector}`);
  }

  /**
   * Obtener estadísticas de empresas
   */
  getEmpresaStats(): Observable<ApiResponse<EmpresaStats>> {
    return this.http.get<ApiResponse<EmpresaStats>>(`${this.baseUrl}/stats`);
  }

  /**
   * Verificar si una empresa existe
   */
  checkEmpresaExists(id: string): Observable<ApiResponse<{ exists: boolean }>> {
    return this.http.get<ApiResponse<{ exists: boolean }>>(`${this.baseUrl}/${id}/exists`);
  }

  /**
   * Obtener número de empleados de una empresa
   */
  getEmpresaEmployeeCount(id: string): Observable<ApiResponse<{ count: number }>> {
    return this.http.get<ApiResponse<{ count: number }>>(`${this.baseUrl}/${id}/employees/count`);
  }

  /**
   * Buscar empresas (endpoint simplificado)
   */
  searchEmpresas(query: string): Observable<ApiResponse<PaginatedEmpresaResponse>> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ApiResponse<PaginatedEmpresaResponse>>(`${this.baseUrl}/search`, { params });
  }

  /**
   * Validar RUT chileno
   */
  validateRut(rut: string): boolean {
    if (!rut) return false;
    
    // Remover puntos y guiones
    const rutClean = rut.replace(/\./g, '').replace(/-/g, '');
    
    // Verificar formato básico
    if (!/^[0-9]+[0-9Kk]$/.test(rutClean)) return false;
    
    // Separar número y dígito verificador
    const numero = rutClean.slice(0, -1);
    const dv = rutClean.slice(-1).toUpperCase();
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = numero.length - 1; i >= 0; i--) {
      suma += parseInt(numero.charAt(i)) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const resto = suma % 11;
    const dvCalculado = resto < 2 ? resto.toString() : (11 - resto === 10 ? 'K' : (11 - resto).toString());
    
    return dv === dvCalculado;
  }

  /**
   * Formatear RUT para mostrar (agregar puntos y guión)
   */
  formatRut(rut: string): string {
    if (!rut) return '';
    
    // Remover formato existente
    const rutClean = rut.replace(/\./g, '').replace(/-/g, '');
    
    if (rutClean.length < 2) return rutClean;
    
    const numero = rutClean.slice(0, -1);
    const dv = rutClean.slice(-1);
    
    // Agregar puntos cada 3 dígitos desde la derecha
    const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${numeroFormateado}-${dv}`;
  }

  /**
   * Validar email
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Obtener label del sector
   */
  getSectorLabel(sector: string): string {
    const sectores: Record<string, string> = {
      'mineria': 'Minería',
      'construccion': 'Construcción',
      'manufactura': 'Manufactura',
      'servicios': 'Servicios',
      'tecnologia': 'Tecnología',
      'energia': 'Energía',
      'agricultura': 'Agricultura',
      'salud': 'Salud',
      'educacion': 'Educación',
      'otro': 'Otro'
    };
    return sectores[sector] || sector;
  }

  /**
   * Obtener clase CSS para el estado
   */
  getStatusClass(status: EmpresaStatus): string {
    const classes: Record<EmpresaStatus, string> = {
      'activa': 'bg-green-100 text-green-800',
      'inactiva': 'bg-gray-100 text-gray-800',
      'suspendida': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtener label del estado
   */
  getStatusLabel(status: EmpresaStatus): string {
    const labels: Record<EmpresaStatus, string> = {
      'activa': 'Activa',
      'inactiva': 'Inactiva',
      'suspendida': 'Suspendida'
    };
    return labels[status] || status;
  }
} 