import { Document } from 'mongoose';
import mongoose from 'mongoose';

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

export interface IContacto {
  nombre: string;
  cargo: string;
  email: string;
  telefono: string;
}

export interface IDireccion {
  calle: string;
  numero: string;
  ciudad: string;
  region: string;
  codigoPostal: string;
  pais: string;
}

export interface IEmpresaBase {
  nombre: string;
  rut: string;
  razonSocial: string;
  sector: EmpresaSector;
  descripcion?: string;
  direccion: IDireccion;
  contactoPrincipal: IContacto;
  contactosAdicionales?: IContacto[];
  telefono: string;
  email: string;
  sitioWeb?: string;
  fechaFundacion?: Date;
  numeroEmpleados?: number;
  status: EmpresaStatus;
  isActive: boolean;
  logo?: string;
  certificaciones?: string[];
  observaciones?: string;
}

export interface IEmpresa extends IEmpresaBase, Document {
  createdAt: Date;
  updatedAt: Date;
  isValidRut(): boolean;
  getTotalEmpleados(): Promise<number>;
  getContactByEmail(email: string): IContacto | undefined;
}

export interface IEmpresaModel extends mongoose.Model<IEmpresa> {
  findByRut(rut: string): Promise<IEmpresa | null>;
  findActiveBySector(sector: EmpresaSector): Promise<IEmpresa[]>;
  getStats(): Promise<EmpresaStatsDTO>;
}

// DTOs para requests
export interface CreateEmpresaDTO {
  nombre: string;
  rut: string;
  razonSocial: string;
  sector: EmpresaSector;
  descripcion?: string;
  direccion: IDireccion;
  contactoPrincipal: IContacto;
  contactosAdicionales?: IContacto[];
  telefono: string;
  email: string;
  sitioWeb?: string;
  fechaFundacion?: Date;
  numeroEmpleados?: number;
  logo?: string;
  certificaciones?: string[];
  observaciones?: string;
}

export interface UpdateEmpresaDTO {
  nombre?: string;
  rut?: string;
  razonSocial?: string;
  sector?: EmpresaSector;
  descripcion?: string;
  direccion?: IDireccion;
  contactoPrincipal?: IContacto;
  contactosAdicionales?: IContacto[];
  telefono?: string;
  email?: string;
  sitioWeb?: string;
  fechaFundacion?: Date;
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

// DTOs para responses
export interface EmpresaResponseDTO {
  id: string;
  nombre: string;
  rut: string;
  razonSocial: string;
  sector: EmpresaSector;
  descripcion?: string;
  direccion: IDireccion;
  contactoPrincipal: IContacto;
  contactosAdicionales?: IContacto[];
  telefono: string;
  email: string;
  sitioWeb?: string;
  fechaFundacion?: Date;
  numeroEmpleados?: number;
  status: EmpresaStatus;
  isActive: boolean;
  logo?: string;
  certificaciones?: string[];
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedEmpresaResponse {
  empresas: EmpresaResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface EmpresaStatsDTO {
  totalEmpresas: number;
  empresasActivas: number;
  empresasInactivas: number;
  empresasSuspendidas: number;
  empresasPorSector: Record<EmpresaSector, number>;
  totalEmpleados: number;
} 