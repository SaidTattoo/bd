import { Request, Response } from 'express';
import EmpresaService from './empresa.service';
import { CreateEmpresaDTO, UpdateEmpresaDTO, EmpresaQueryParams } from './empresa.types';

export class EmpresaController {
  private empresaService: EmpresaService;

  constructor() {
    this.empresaService = new EmpresaService();
  }

  /**
   * Crear nueva empresa
   * @route POST /api/empresas
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const empresaData: CreateEmpresaDTO = req.body;
      const empresa = await this.empresaService.create(empresaData);

      res.status(201).json({
        mensaje: 'Empresa creada exitosamente',
        data: empresa
      });
    } catch (error) {
      res.status(400).json({
        error: 'Error al crear empresa',
        mensaje: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtener todas las empresas con paginación y filtros
   * @route GET /api/empresas
   */
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const params: EmpresaQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string,
        sector: req.query.sector as any,
        status: req.query.status as any,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };

      const result = await this.empresaService.findAll(params);
      
      res.json({
        mensaje: 'Empresas obtenidas exitosamente',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error al obtener empresas',
        mensaje: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtener empresa por ID
   * @route GET /api/empresas/:id
   */
  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const empresa = await this.empresaService.findById(id);

      res.json({
        mensaje: 'Empresa obtenida exitosamente',
        data: empresa
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('no encontrada') ? 404 : 500;
      res.status(statusCode).json({
        error: 'Error al obtener empresa',
        mensaje: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtener empresa por RUT
   * @route GET /api/empresas/rut/:rut
   */
  async findByRut(req: Request, res: Response): Promise<void> {
    try {
      const { rut } = req.params;
      const empresa = await this.empresaService.findByRut(rut);

      res.json({
        mensaje: 'Empresa obtenida exitosamente',
        data: empresa
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('no encontrada') ? 404 : 500;
      res.status(statusCode).json({
        error: 'Error al obtener empresa por RUT',
        mensaje: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Actualizar empresa
   * @route PUT /api/empresas/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateEmpresaDTO = req.body;
      const empresa = await this.empresaService.update(id, updateData);

      res.json({
        mensaje: 'Empresa actualizada exitosamente',
        data: empresa
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('no encontrada') ? 404 : 400;
      res.status(statusCode).json({
        error: 'Error al actualizar empresa',
        mensaje: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Eliminar empresa (soft delete)
   * @route DELETE /api/empresas/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.empresaService.delete(id);

      res.json({
        mensaje: 'Empresa eliminada exitosamente'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('no encontrada') ? 404 : 500;
      res.status(statusCode).json({
        error: 'Error al eliminar empresa',
        mensaje: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Cambiar estado de empresa
   * @route PATCH /api/empresas/:id/status
   */
  async changeStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['activa', 'inactiva', 'suspendida'].includes(status)) {
        res.status(400).json({
          error: 'Estado inválido',
          mensaje: 'El estado debe ser: activa, inactiva o suspendida'
        });
        return;
      }

      const empresa = await this.empresaService.changeStatus(id, status);

      res.json({
        mensaje: 'Estado de empresa actualizado exitosamente',
        data: empresa
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('no encontrada') ? 404 : 400;
      res.status(statusCode).json({
        error: 'Error al cambiar estado de empresa',
        mensaje: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtener empresas por sector
   * @route GET /api/empresas/sector/:sector
   */
  async findBySector(req: Request, res: Response): Promise<void> {
    try {
      const { sector } = req.params;
      
      const validSectors = ['mineria', 'construccion', 'manufactura', 'servicios', 'tecnologia', 'energia', 'agricultura', 'salud', 'educacion', 'otro'];
      if (!validSectors.includes(sector)) {
        res.status(400).json({
          error: 'Sector inválido',
          mensaje: `El sector debe ser uno de: ${validSectors.join(', ')}`
        });
        return;
      }

      const empresas = await this.empresaService.findBySector(sector as any);

      res.json({
        mensaje: 'Empresas obtenidas exitosamente',
        data: empresas
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error al obtener empresas por sector',
        mensaje: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtener estadísticas de empresas
   * @route GET /api/empresas/stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.empresaService.getStats();

      res.json({
        mensaje: 'Estadísticas obtenidas exitosamente',
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error al obtener estadísticas',
        mensaje: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Verificar si una empresa existe
   * @route GET /api/empresas/:id/exists
   */
  async exists(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const exists = await this.empresaService.exists(id);

      res.json({
        mensaje: 'Verificación completada',
        data: { exists }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error al verificar empresa',
        mensaje: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtener número de empleados de una empresa
   * @route GET /api/empresas/:id/employees/count
   */
  async getEmployeeCount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const count = await this.empresaService.getEmployeeCount(id);

      res.json({
        mensaje: 'Conteo de empleados obtenido exitosamente',
        data: { count }
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('no encontrada') ? 404 : 500;
      res.status(statusCode).json({
        error: 'Error al obtener conteo de empleados',
        mensaje: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Buscar empresas (endpoint simplificado)
   * @route GET /api/empresas/search
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({
          error: 'Parámetro de búsqueda inválido',
          mensaje: 'El parámetro "q" es requerido'
        });
        return;
      }

      const params: EmpresaQueryParams = {
        search: q,
        limit: 20 // Límite por defecto para búsquedas
      };

      const result = await this.empresaService.findAll(params);
      
      res.json({
        mensaje: 'Búsqueda completada exitosamente',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error en la búsqueda',
        mensaje: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}

// Crear una instancia del controlador
const empresaController = new EmpresaController();

// Exportar métodos como funciones individuales para compatibilidad con Express
export const createEmpresa = empresaController.create.bind(empresaController);
export const getAllEmpresas = empresaController.findAll.bind(empresaController);
export const getEmpresaById = empresaController.findById.bind(empresaController);
export const getEmpresaByRut = empresaController.findByRut.bind(empresaController);
export const updateEmpresa = empresaController.update.bind(empresaController);
export const deleteEmpresa = empresaController.delete.bind(empresaController);
export const changeEmpresaStatus = empresaController.changeStatus.bind(empresaController);
export const getEmpresasBySector = empresaController.findBySector.bind(empresaController);
export const getEmpresaStats = empresaController.getStats.bind(empresaController);
export const checkEmpresaExists = empresaController.exists.bind(empresaController);
export const getEmpresaEmployeeCount = empresaController.getEmployeeCount.bind(empresaController);
export const searchEmpresas = empresaController.search.bind(empresaController);

export default empresaController; 