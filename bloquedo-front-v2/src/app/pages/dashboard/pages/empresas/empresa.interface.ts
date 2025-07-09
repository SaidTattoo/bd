export type EmpresaStatus = 'activa' | 'inactiva' | 'suspendida';

export type EmpresaSector = 
  | 'mineria' 
  | 'construccion' 
  | 'manufactura' 
  | 'servicios' 
  | 'tecnologia' 
  | 'energia' 
  | 'agricultura' 
  | 'salud' 
  | 'educacion' 
  | 'otro';

export interface Contacto {
  nombre: string;
  cargo: string;
  email: string;
  telefono: string;
}

export interface Direccion {
  calle: string;
  numero: string;
  ciudad: string;
  region: string;
  codigoPostal: string;
  pais: string;
}

export interface Empresa {
  id?: string;
  nombre: string;
  rut: string;
  razonSocial: string;
  sector: EmpresaSector;
  descripcion?: string;
  direccion: Direccion;
  contactoPrincipal: Contacto;
  contactosAdicionales?: Contacto[];
  telefono: string;
  email: string;
  sitioWeb?: string;
  fechaFundacion?: Date | string;
  numeroEmpleados?: number;
  status: EmpresaStatus;
  isActive: boolean;
  logo?: string;
  certificaciones?: string[];
  observaciones?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateEmpresaRequest {
  nombre: string;
  rut: string;
  razonSocial: string;
  sector: EmpresaSector;
  descripcion?: string;
  direccion: Direccion;
  contactoPrincipal: Contacto;
  contactosAdicionales?: Contacto[];
  telefono: string;
  email: string;
  sitioWeb?: string;
  fechaFundacion?: Date | string;
  numeroEmpleados?: number;
  logo?: string;
  certificaciones?: string[];
  observaciones?: string;
}

export interface UpdateEmpresaRequest {
  nombre?: string;
  rut?: string;
  razonSocial?: string;
  sector?: EmpresaSector;
  descripcion?: string;
  direccion?: Direccion;
  contactoPrincipal?: Contacto;
  contactosAdicionales?: Contacto[];
  telefono?: string;
  email?: string;
  sitioWeb?: string;
  fechaFundacion?: Date | string;
  numeroEmpleados?: number;
  status?: EmpresaStatus;
  logo?: string;
  certificaciones?: string[];
  observaciones?: string;
}

export interface EmpresaQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sector?: EmpresaSector;
  status?: EmpresaStatus;
  sortBy?: 'nombre' | 'fechaCreacion' | 'numeroEmpleados';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedEmpresaResponse {
  empresas: Empresa[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface EmpresaStats {
  totalEmpresas: number;
  empresasActivas: number;
  empresasInactivas: number;
  empresasSuspendidas: number;
  empresasPorSector: Record<EmpresaSector, number>;
  totalEmpleados: number;
}

export interface ApiResponse<T> {
  mensaje: string;
  data: T;
}

export const SECTORES_EMPRESA: { value: EmpresaSector; label: string }[] = [
  { value: 'mineria', label: 'Minería' },
  { value: 'construccion', label: 'Construcción' },
  { value: 'manufactura', label: 'Manufactura' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'energia', label: 'Energía' },
  { value: 'agricultura', label: 'Agricultura' },
  { value: 'salud', label: 'Salud' },
  { value: 'educacion', label: 'Educación' },
  { value: 'otro', label: 'Otro' }
];

export const ESTADOS_EMPRESA: { value: EmpresaStatus; label: string; class: string }[] = [
  { value: 'activa', label: 'Activa', class: 'bg-green-100 text-green-800' },
  { value: 'inactiva', label: 'Inactiva', class: 'bg-gray-100 text-gray-800' },
  { value: 'suspendida', label: 'Suspendida', class: 'bg-red-100 text-red-800' }
]; 