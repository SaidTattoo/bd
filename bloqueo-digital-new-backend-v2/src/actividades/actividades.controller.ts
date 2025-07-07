import { Request, Response } from 'express';
import { ActividadModel } from './actividades.model';
import { ActivityModel } from '../activity/activity.model';
import Counter from '../activity/counter.model';

export const actividadesController = {
  /**
   * Obtiene todas las actividades
   * - Popula las relaciones de dueños de energía y equipos
   * - Retorna un error 404 si no hay actividades
   */
  async getAllActivities(req: Request, res: Response) {
    try {
      const actividades = await ActividadModel.find()
        .populate({
          path: 'energyOwners.user',
          select: 'nombre email perfil'
        })
        .populate({
          path: 'energyOwners.supervisors.user',
          select: 'nombre email perfil'
        })
        .populate({
          path: 'energyOwners.supervisors.workers',
          select: 'nombre email perfil'
        })
        .populate({
          path: 'equipments',
          select: 'name description'
        })
        .sort({ createdAt: -1 });

      if (!actividades || actividades.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No se encontraron actividades'
        });
      }

      return res.status(200).json({
        success: true,
        data: actividades,
        count: actividades.length
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener las actividades',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  },

  /**
   * Obtiene una actividad específica por su ID
   * - Valida que el ID sea válido
   * - Popula las relaciones
   * - Retorna 404 si no existe
   */
  async getActivityById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const actividad = await ActividadModel.findById(id)
        .populate({
          path: 'energyOwners.user',
          select: 'nombre email perfil'
        })
        .populate({
          path: 'energyOwners.supervisors.user',
          select: 'nombre email perfil'
        })
        .populate({
          path: 'energyOwners.supervisors.workers',
          select: 'nombre email perfil'
        })
        .populate({
          path: 'equipments',
          select: 'name description'
        });

      if (!actividad) {
        return res.status(404).json({
          success: false,
          message: 'Actividad no encontrada'
        });
      }

      return res.status(200).json({
        success: true,
        data: actividad
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener la actividad',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  },

  /**
   * Crea una nueva actividad
   * - Valida los campos requeridos
   * - Genera un ID único
   * - Retorna la actividad creada
   */
  async createActivity(req: Request, res: Response) {
    try {
      const {
        name,
        description,
        blockType,
        isBlocked = false,
        energyOwners = [],
        equipments = [],
        historial = []
      } = req.body;

      // Validación de campos requeridos
      const camposFaltantes = [];
      if (!name) camposFaltantes.push('name');
      if (!description) camposFaltantes.push('description');
      if (!blockType) camposFaltantes.push('blockType');

      if (camposFaltantes.length > 0) {
        return res.status(400).json({
          error: "Missing required fields",
          details: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`
        });
      }

      // Primero, obtener el siguiente ID
      const counter = await Counter.findOneAndUpdate(
        { _id: 'activityId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Crear el objeto de actividad con el ID asignado
      const actividadData = {
        activityId: counter.seq,
        name,
        description,
        blockType,
        isBlocked,
        energyOwners,
        equipments,
        historial: historial.length > 0 ? historial : [{
          fecha: new Date(),
          dueñoEnergia: 'sistema',
          dueñoEnergiaFinal: 'sistema'
        }]
      };

      // Crear y guardar la actividad
      const nuevaActividad = await ActividadModel.create(actividadData);

      // Obtener la actividad con las relaciones populadas
      const actividadPopulada = await ActividadModel.findById(nuevaActividad._id)
        .populate('energyOwners.user')
        .populate({
          path: 'equipments',
          select: 'name description'
        })
        .populate({
          path: 'energyOwners.supervisors.user',
          select: 'nombre email perfil'
        });

      return res.status(201).json({
        success: true,
        data: actividadPopulada
      });

    } catch (error) {
      console.error('Error creating activity:', error);
      return res.status(500).json({
        error: "Error creating activity",
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  },

  /**
   * Actualiza una actividad existente
   * - Valida que exista la actividad
   * - Actualiza solo los campos proporcionados
   * - Retorna la actividad actualizada
   */
  async updateActivity(req: Request, res: Response) {
  },

  /**
   * Elimina una actividad
   * - Valida que exista
   * - Elimina referencias en otras colecciones
   * - Retorna confirmación
   */
  async deleteActivity(req: Request, res: Response) {
  },

  /**
   * Agrega un dueño de energía a la actividad
   * - Valida que el usuario exista y tenga el rol correcto
   * - Actualiza la lista de dueños
   */
  async addEnergyOwnerToActivity(req: Request, res: Response) {
    try {
      const { id: activityId } = req.params;
      const { userId, role, notes } = req.body;

      // Validar campos requeridos
      if (!userId || !role) {
        return res.status(400).json({
          success: false,
          message: 'userId y role son campos requeridos'
        });
      }

      // Buscar la actividad
      const actividad = await ActividadModel.findById(activityId);
      if (!actividad) {
        return res.status(404).json({
          success: false,
          message: 'Actividad no encontrada'
        });
      }

      // Verificar si el usuario ya es dueño de energía
      const isExistingOwner = actividad.energyOwners.some(
        owner => owner.user.toString() === userId
      );

      if (isExistingOwner) {
        return res.status(400).json({
          success: false,
          message: 'El usuario ya es dueño de energía en esta actividad'
        });
      }

      // Agregar nuevo dueño de energía
      const newEnergyOwner = {
        user: userId,
        role,
        isBlocked: false,
        supervisors: [],
        dateAssigned: new Date(),
        notes: notes || ''
      };

      actividad.energyOwners.push(newEnergyOwner);

      // Agregar al historial
      actividad.historial.push({
        fecha: new Date(),
        accion: 'ENERGY_OWNER_ADDED',
        dueñoEnergia: userId,
        notas: notes || 'Nuevo dueño de energía agregado'
      });

      await actividad.save();

      // Obtener la actividad actualizada con las relaciones populadas
      const updatedActividad = await ActividadModel.findById(activityId)
        .populate({
          path: 'energyOwners.user',
          select: 'nombre email perfil'
        })
        .populate({
          path: 'energyOwners.supervisors.user',
          select: 'nombre email perfil'
        })
        .populate({
          path: 'energyOwners.supervisors.workers',
          select: 'nombre email perfil'
        });

      return res.status(200).json({
        success: true,
        message: 'Dueño de energía agregado exitosamente',
        data: updatedActividad
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al agregar dueño de energía',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  },

  /**
   * Remueve un dueño de energía de la actividad
   * - Valida permisos
   * - Elimina referencias asociadas
   */
  async removeEnergyOwner(req: Request, res: Response) {
  },

  /**
   * Bloquea un dueño de energía
   * - Actualiza estado isBlocked
   * - Registra supervisor asociado
   */
  async blockEnergyOwner(req: Request, res: Response) {
    try {
      const { id: activityId, ownerId } = req.params;
      const { userId } = req.body;

    

      // Buscar la actividad
      const actividad = await ActividadModel.findById(activityId);
      if (!actividad) {
        return res.status(404).json({
          success: false,
          message: 'Actividad no encontrada'
        });
      }

      // Encontrar el dueño de energía
      const energyOwnerIndex = actividad.energyOwners.findIndex(
        owner => owner._id.toString() === ownerId
      );

      if (energyOwnerIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Dueño de energía no encontrado en esta actividad'
        });
      }

      // Verificar si ya está bloqueado
      if (actividad.energyOwners[energyOwnerIndex].isBlocked) {
        return res.status(400).json({
          success: false,
          message: 'El dueño de energía ya está bloqueado'
        });
      }

      // Actualizar el estado de bloqueo
      actividad.energyOwners[energyOwnerIndex].isBlocked = true;

      actividad.energyOwners[energyOwnerIndex].blockDate = new Date();

      // Agregar al historial
      actividad.historial.push({
        fecha: new Date(),
        accion: 'ENERGY_OWNER_BLOCKED',
        dueñoEnergia: actividad.energyOwners[energyOwnerIndex].user,
    
      });

      await actividad.save();

      // Obtener la actividad actualizada con las relaciones populadas
      const updatedActividad = await ActividadModel.findById(activityId)
        .populate({
          path: 'energyOwners.user',
          select: 'nombre email perfil'
        })
        .populate({
          path: 'energyOwners.supervisors.user',
          select: 'nombre email perfil'
        })
        .populate({
          path: 'energyOwners.supervisors.workers',
          select: 'nombre email perfil'
        });

      return res.status(200).json({
        success: true,
        message: 'Dueño de energía bloqueado exitosamente',
        data: updatedActividad
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al bloquear dueño de energía',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  },

  /**
   * Desbloquea un dueño de energía
   * - Actualiza estado isBlocked
   * - Registra en historial
   */
  async unblockEnergyOwner(req: Request, res: Response) {
  },

  /**
   * Agrega un supervisor a un dueño de energía
   * - Valida roles y permisos
   * - Actualiza la estructura de supervisión
   */
  async addSupervisor(req: Request, res: Response) {
  },

  /**
   * Remueve un supervisor
   * - Valida dependencias
   * - Actualiza referencias
   */
  async removeSupervisor(req: Request, res: Response) {
  },

  /**
   * Bloquea un supervisor
   * - Actualiza estado
   * - Registra trabajador asociado
   */
  async blockSupervisor(req: Request, res: Response) {
  },

  /**
   * Desbloquea un supervisor
   * - Actualiza estado
   * - Registra en historial
   */
  async unblockSupervisor(req: Request, res: Response) {
  },

  /**
   * Agrega un trabajador a un supervisor
   * - Valida roles y permisos
   * - Actualiza lista de trabajadores
   */
  async addWorker(req: Request, res: Response) {
  },

  /**
   * Remueve un trabajador
   * - Actualiza referencias
   * - Registra en historial
   */
  async removeWorker(req: Request, res: Response) {
  },

  /**
   * Valida energía cero para la actividad
   * - Registra validador y mediciones
   * - Actualiza estado de equipos
   */
  async validateZeroEnergy(req: Request, res: Response) {
  },

  /**
   * Remueve validación de energía cero
   * - Actualiza estados
   * - Registra en historial
   */
  async removeZeroEnergyValidation(req: Request, res: Response) {
  },

  /**
   * Agrega un equipo a la actividad
   * - Valida existencia del equipo
   * - Actualiza referencias
   */
  async addEquipment(req: Request, res: Response) {
  },

  /**
   * Remueve un equipo de la actividad
   * - Actualiza referencias
   * - Registra en historial
   */
  async removeEquipment(req: Request, res: Response) {
  },

  /**
   * Actualiza información de un equipo
   * - Valida cambios permitidos
   * - Actualiza estado
   */
  async updateEquipment(req: Request, res: Response) {
  },

  /**
   * Marca actividad pendiente de nuevo dueño
   * - Actualiza estado
   * - Notifica cambios
   */
  async pendingNewEnergyOwner(req: Request, res: Response) {
  },

  /**
   * Agrega entrada al historial
   * - Registra cambios de estado
   * - Mantiene trazabilidad
   */
  async addToHistory(req: Request, res: Response) {
  },

  /**
   * Obtiene historial de la actividad
   * - Filtra por fechas
   * - Ordena cronológicamente
   */
  async getHistory(req: Request, res: Response) {
  }
};
