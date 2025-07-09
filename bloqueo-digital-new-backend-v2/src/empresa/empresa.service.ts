import { 
  IEmpresa, 
  CreateEmpresaDTO, 
  UpdateEmpresaDTO, 
  EmpresaQueryParams, 
  EmpresaResponseDTO, 
  PaginatedEmpresaResponse, 
  EmpresaStatsDTO,
  EmpresaStatus,
  EmpresaSector 
} from './empresa.types';
import Empresa from './empresa.model';
import { FilterQuery, Types } from 'mongoose';

export class EmpresaService {
  
  /**
   * Crear una nueva empresa
   * @param empresaData - Datos de la empresa a crear
   * @returns Promise<EmpresaResponseDTO>
   */
  async create(empresaData: CreateEmpresaDTO): Promise<EmpresaResponseDTO> {
    try {
      // Validar si ya existe una empresa con el mismo RUT
      const existingEmpresa = await Empresa.findByRut(empresaData.rut);
      if (existingEmpresa) {
        throw new Error('Ya existe una empresa con este RUT');
      }

      // Validar si ya existe una empresa con el mismo email
      const existingEmail = await Empresa.findOne({ email: empresaData.email });
      if (existingEmail) {
        throw new Error('Ya existe una empresa con este email');
      }

      const empresa = new Empresa(empresaData);
      await empresa.save();

      return this.mapToResponseDTO(empresa);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al crear empresa: ${error.message}`);
      }
      throw new Error('Error desconocido al crear empresa');
    }
  }

  /**
   * Obtener todas las empresas con paginación y filtros
   * @param params - Parámetros de consulta
   * @returns Promise<PaginatedEmpresaResponse>
   */
  async findAll(params: EmpresaQueryParams = {}): Promise<PaginatedEmpresaResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sector,
        status,
        sortBy = 'nombre',
        sortOrder = 'asc'
      } = params;

      // Construir filtros
      const filters: FilterQuery<IEmpresa> = {};

      if (search) {
        filters.$or = [
          { nombre: { $regex: search, $options: 'i' } },
          { razonSocial: { $regex: search, $options: 'i' } },
          { rut: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (sector) {
        filters.sector = sector;
      }

      if (status) {
        filters.status = status;
      }

      // Configurar ordenamiento
      const sortOptions: any = {};
      if (sortBy === 'fechaCreacion') {
        sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
      } else {
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      }

      // Ejecutar consulta con paginación
      const skip = (page - 1) * limit;
      const [empresas, total] = await Promise.all([
        Empresa.find(filters)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        Empresa.countDocuments(filters)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        empresas: empresas.map(empresa => this.mapToResponseDTO(empresa)),
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener empresas: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener empresas');
    }
  }

  /**
   * Obtener empresa por ID
   * @param id - ID de la empresa
   * @returns Promise<EmpresaResponseDTO>
   */
  async findById(id: string): Promise<EmpresaResponseDTO> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error('ID de empresa no válido');
      }

      const empresa = await Empresa.findById(id);
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      return this.mapToResponseDTO(empresa);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener empresa: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener empresa');
    }
  }

  /**
   * Obtener empresa por RUT
   * @param rut - RUT de la empresa
   * @returns Promise<EmpresaResponseDTO>
   */
  async findByRut(rut: string): Promise<EmpresaResponseDTO> {
    try {
      const empresa = await Empresa.findByRut(rut);
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      return this.mapToResponseDTO(empresa);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener empresa por RUT: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener empresa por RUT');
    }
  }

  /**
   * Actualizar empresa
   * @param id - ID de la empresa
   * @param updateData - Datos a actualizar
   * @returns Promise<EmpresaResponseDTO>
   */
  async update(id: string, updateData: UpdateEmpresaDTO): Promise<EmpresaResponseDTO> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error('ID de empresa no válido');
      }

      // Si se actualiza el RUT, validar que no exista otra empresa con el mismo RUT
      if (updateData.rut) {
        const existingEmpresa = await Empresa.findByRut(updateData.rut);
        if (existingEmpresa && (existingEmpresa._id as any).toString() !== id) {
          throw new Error('Ya existe una empresa con este RUT');
        }
      }

      // Si se actualiza el email, validar que no exista otra empresa con el mismo email
      if (updateData.email) {
        const existingEmail = await Empresa.findOne({ email: updateData.email });
        if (existingEmail && (existingEmail._id as any).toString() !== id) {
          throw new Error('Ya existe una empresa con este email');
        }
      }

      const empresa = await Empresa.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      return this.mapToResponseDTO(empresa);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al actualizar empresa: ${error.message}`);
      }
      throw new Error('Error desconocido al actualizar empresa');
    }
  }

  /**
   * Eliminar empresa (soft delete)
   * @param id - ID de la empresa
   * @returns Promise<void>
   */
  async delete(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error('ID de empresa no válido');
      }

      const empresa = await Empresa.findByIdAndUpdate(
        id,
        { $set: { isActive: false, status: 'inactiva' } },
        { new: true }
      );

      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al eliminar empresa: ${error.message}`);
      }
      throw new Error('Error desconocido al eliminar empresa');
    }
  }

  /**
   * Cambiar estado de empresa
   * @param id - ID de la empresa
   * @param status - Nuevo estado
   * @returns Promise<EmpresaResponseDTO>
   */
  async changeStatus(id: string, status: EmpresaStatus): Promise<EmpresaResponseDTO> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error('ID de empresa no válido');
      }

      const empresa = await Empresa.findByIdAndUpdate(
        id,
        { $set: { status, isActive: status === 'activa' } },
        { new: true, runValidators: true }
      );

      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      return this.mapToResponseDTO(empresa);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al cambiar estado de empresa: ${error.message}`);
      }
      throw new Error('Error desconocido al cambiar estado de empresa');
    }
  }

  /**
   * Obtener empresas por sector
   * @param sector - Sector de la empresa
   * @returns Promise<EmpresaResponseDTO[]>
   */
  async findBySector(sector: EmpresaSector): Promise<EmpresaResponseDTO[]> {
    try {
      const empresas = await Empresa.findActiveBySector(sector);
      return empresas.map(empresa => this.mapToResponseDTO(empresa));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener empresas por sector: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener empresas por sector');
    }
  }

  /**
   * Obtener estadísticas de empresas
   * @returns Promise<EmpresaStatsDTO>
   */
  async getStats(): Promise<EmpresaStatsDTO> {
    try {
      const stats = await Empresa.getStats();
      return stats;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener estadísticas: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener estadísticas');
    }
  }

  /**
   * Verificar si una empresa existe
   * @param id - ID de la empresa
   * @returns Promise<boolean>
   */
  async exists(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return false;
      }

      const empresa = await Empresa.findById(id).select('_id');
      return empresa !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener empleados de una empresa
   * @param id - ID de la empresa
   * @returns Promise<number>
   */
  async getEmployeeCount(id: string): Promise<number> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error('ID de empresa no válido');
      }

      const empresa = await Empresa.findById(id);
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      return await empresa.getTotalEmpleados();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener número de empleados: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener número de empleados');
    }
  }

  /**
   * Mapear entidad a DTO de respuesta
   * @param empresa - Entidad empresa
   * @returns EmpresaResponseDTO
   */
  private mapToResponseDTO(empresa: any): EmpresaResponseDTO {
    return {
      id: empresa._id ? empresa._id.toString() : empresa.id,
      nombre: empresa.nombre,
      rut: empresa.rut,
      razonSocial: empresa.razonSocial,
      sector: empresa.sector,
      descripcion: empresa.descripcion,
      direccion: empresa.direccion,
      contactoPrincipal: empresa.contactoPrincipal,
      contactosAdicionales: empresa.contactosAdicionales,
      telefono: empresa.telefono,
      email: empresa.email,
      sitioWeb: empresa.sitioWeb,
      fechaFundacion: empresa.fechaFundacion,
      numeroEmpleados: empresa.numeroEmpleados,
      status: empresa.status,
      isActive: empresa.isActive,
      logo: empresa.logo,
      certificaciones: empresa.certificaciones,
      observaciones: empresa.observaciones,
      createdAt: empresa.createdAt,
      updatedAt: empresa.updatedAt
    };
  }
}

export default EmpresaService; 