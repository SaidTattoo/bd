import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ActivityModel } from './activity.model';
import { isValidObjectId } from 'mongoose';
import { IZeroEnergyValidation } from './activity.types';
import Usuario from '../users/users.model';
import { EquipmentModel } from '../Equipment/equipment.model';
import mongoose from 'mongoose';
import { LockerModel } from '../locker/locker.model';
import totemModel from '../totem/totem.model';

export const activityController = {
  /**
   * Obtiene todas las actividades con sus relaciones
   * - Popula las relaciones de dueños de energía y equipos
   * - Retorna un error 404 si no hay actividades
   * - Usa lean() para mejor rendimiento
   */
  async getAllActivities(req: Request, res: Response) {
    try {
      const activities = await ActivityModel.find({ status: { $ne: 'finalizada' } })
        .populate('energyOwners.user')
        .populate('equipments')
        .lean();

     
     
      res.json(activities);
    } catch (error) {
      console.error('Error al obtener actividades:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor al obtener actividades' 
      });
    }
  },

  /**
   * Obtiene una actividad específica por su ID
   * - Popula las relaciones de dueños de energía y equipos
   * - Retorna un error 404 si la actividad no existe
   */
  
  async getActivityById(req: Request, res: Response) {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ mensaje: 'ID de actividad inválido' });
    }
    const activity = await ActivityModel.findById(id)
    .populate('energyOwners.user')
    .populate('energyOwners.supervisors.user')
    .populate('energyOwners.supervisors.workers')  // Popula los trabajadores con los datos completos
    .populate('equipments');
  
    if (!activity) {
      return res.status(404).json({ mensaje: 'Actividad no encontrada' });
    }
    res.json(activity);
  },
  
  async validateZeroEnergy(req: Request, res: Response) {
    try {
      console.log('Parámetros recibidos:', req.params);
      console.log('Cuerpo de la solicitud:', req.body);
      
      // Acepta ambos formatos de parámetro (id o activityId)
      const { id, activityId = id } = req.params;
      const { validatorName, validator, instrumentUsed, energyValue } = req.body;

      // Usamos el ID que esté disponible
      const mongoId = activityId || id;
      
      // Validar el formato del ID
      if (!mongoose.Types.ObjectId.isValid(mongoId)) {
        return res.status(400).json({
          mensaje: 'ID de actividad inválido',
          error: true
        });
      }

      // Obtener la actividad completa
      const activity = await ActivityModel.findById(mongoId);
      if (!activity) {
        return res.status(404).json({
          mensaje: 'Actividad no encontrada',
          error: true
        });
      }
      
      // Verificar si la actividad tiene equipos asignados
      if (!activity.equipments || activity.equipments.length === 0) {
        return res.status(400).json({
          mensaje: 'No se puede validar energía cero sin equipos asignados a la actividad',
          error: true
        });
      }

      // Convertir energyValue a string si viene como número
      const energyValueStr = typeof energyValue === 'number' ? String(energyValue) : energyValue;

      activity.zeroEnergyValidation = {
        validatorName,
        instrumentUsed,
        energyValue: energyValueStr,
        validationDate: new Date()
      };

      await activity.save();

      if (activity.equipments?.length > 0) {
        await EquipmentModel.updateMany(
          { _id: { $in: activity.equipments } },
          { $set: { zeroEnergyValidated: true } }
        );
      }

      res.json({
        mensaje: 'Validación de energía cero actualizada exitosamente',
        actividad: activity,
        error: false
      });

    } catch (error) {
      console.error('Error completo en validateZeroEnergy:', error);
      res.status(500).json({
        mensaje: 'Error al validar energía cero',
        detalles: (error as Error).message,
        error: true
      });
    }
  },
  async removeZeroEnergyValidation(req: Request, res: Response) {
    const { activityId } = req.params;

    // Eliminar solo el campo zeroEnergyValidation de la actividad
    const activity = await ActivityModel.findByIdAndUpdate(
      activityId,
      { $unset: { zeroEnergyValidation: "" } }, // Cambiar a "" para eliminar el campo
      { new: true } // Asegura que se devuelva el documento actualizado
    );

    if (!activity) {
      return res.status(404).json({ mensaje: 'Actividad no encontrada' });
    }

    res.json({
      mensaje: 'Validación de energía cero eliminada exitosamente',
      actividad: activity
    });
  },
  /**
   * Crea una nueva actividad
   * - Asigna la fecha de creación automáticamente
   * - Valida los datos requeridos
   * - Retorna la actividad creada
   */
  async createActivity(req: Request, res: Response) {
    try {
      const { energyOwners, equipments, name, ...rest } = req.body;

      const energyOwnersWithIds = energyOwners?.map((owner: any) => ({
        user: new Types.ObjectId(owner.user),
        isBlocked: false,
        supervisors: []
      })) || [];

      const newActivity = new ActivityModel({
        name,
        description: rest.description,
        blockType: rest.blockType || 'Operativo',
        isBlocked: false,
        energyOwners: energyOwnersWithIds,
        equipments: equipments?.map((id: string) => new Types.ObjectId(id)) || [],
        zeroEnergyValidation: {
          validatorName: '',
          instrumentUsed: '',
          energyValue: '',
          validationDate: null
        },
        createdAt: new Date()
      });

      await newActivity.save();
      
      const populatedActivity = await ActivityModel.findById(newActivity._id)
        .populate('energyOwners.user')
        .populate('equipments');

      res.status(201).json(populatedActivity);
    } catch (error) {
      res.status(400).json({ 
        error: 'Error al crear la actividad',
        detalles: (error as Error).message
      });
    }
  },

  /**
   * Actualiza una actividad existente
   * - Valida que la actividad exista
   * - Actualiza solo los campos proporcionados
   * - Retorna la actividad actualizada
   */
  async updateActivity(req: Request, res: Response) {
    const { id } = req.params;
    console.log('Recibiendo solicitud de actualización para ID:', id);
    console.log('Datos recibidos para actualizar:', req.body);
  
    try {
      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'ID de actividad inválido' });
      }
  
      const updatedActivity = await ActivityModel.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
      ).populate('energyOwners.user').populate('equipments');
  
      if (!updatedActivity) {
        return res.status(404).json({ message: 'Actividad no encontrada' });
      }
  
      res.status(200).json({
        message: 'Actividad actualizada correctamente',
        actividad: updatedActivity
      });
    } catch (error) {
      console.error('Error al actualizar la actividad:', error);
      res.status(500).json({
        message: 'Error al actualizar la actividad',
        detalles: (error as Error).message
      });
    }
  },
  
  async removeEquipmentFromActivity(req: Request, res: Response) {
    try {
        const { activityId, equipmentId } = req.params;
        
        const activity = await ActivityModel.findById(activityId);
        if (!activity) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }

        // Convertir los ObjectIds a strings para la comparación
        activity.equipments = activity.equipments.filter(
            id => id.toString() !== equipmentId
        );

        await activity.save();

        // Actualizar el equipo
        await EquipmentModel.findByIdAndUpdate(equipmentId, 
            { $set: { zeroEnergyValidated: false } }
        );

        res.status(200).json({ 
            message: 'Equipo eliminado exitosamente',
            activityId,
            equipmentId
        });
    } catch (error) {
        console.error('Error al eliminar equipo:', error);
        res.status(500).json({ 
            error: 'Error al eliminar el equipo de la actividad', 
            details: (error as Error).message 
        });
    }
  },

  async changeEnergyOwner(req: Request, res: Response) {
    try {
        const { activityId } = req.params;
        const { userId } = req.body;

        // Buscar la actividad
        const activity = await ActivityModel.findById(activityId);
        if (!activity) {
            return res.status(404).json({ mensaje: 'Actividad no encontrada' });
        }

        // Verificar que el nuevo usuario existe y es dueño de energía
        const newUser = await Usuario.findById(userId);
        if (!newUser) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        // Obtener los supervisores actuales del primer dueño de energía
        const currentSupervisors = activity.energyOwners[0]?.supervisors || [];

        // Crear el nuevo dueño de energía manteniendo los supervisores existentes
        const newEnergyOwner = {
            user: userId,
            isBlocked: false,
            supervisors: currentSupervisors
        };

        // Reemplazar el array de energyOwners con el nuevo dueño y resetear pendingNewEnergyOwner
        activity.energyOwners = [newEnergyOwner];
        activity.pendingNewEnergyOwner = false; // Establecer en false
        activity.selectedNewOwner = undefined; // Limpiar el selectedNewOwner

        await activity.save();

        // Obtener la actividad actualizada con populate para enviar al frontend
        const updatedActivity = await ActivityModel.findById(activityId)
            .populate('energyOwners.user')
            .populate('energyOwners.supervisors.user')
            .populate('energyOwners.supervisors.workers')
            .populate('equipments');

        res.json({
            mensaje: 'Dueño de energía cambiado exitosamente',
            actividad: updatedActivity
        });

    } catch (error) {
        console.error('Error al cambiar dueño de energía:', error);
        res.status(500).json({
            error: 'Error al cambiar dueño de energía',
            detalles: (error as Error).message
        });
    }
  },
  async addEnergyOwnerToActivity(req: Request, res: Response) {
    try {
      const { activityId } = req.params;
      const { userId } = req.body;
      console.log(req.body);
      // Buscar la actividad en la base de datos
      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        return res.status(404).json({ mensaje: 'Actividad no encontrada' });
      }
  
      // Buscar el usuario en la base de datos
      const user = await Usuario.findById(userId);
      if (!user) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }
  
      // Verificar que el usuario tenga el perfil adecuado
      if (user.perfil !== 'duenoDeEnergia') {
        return res.status(400).json({ mensaje: 'El usuario debe tener perfil de Dueño de Energía' });
      }
  
      // Crear el nuevo dueño de energía y agregarlo a la actividad
      const newEnergyOwner :any = {
        user: new Types.ObjectId(userId),
        isBlocked: false,
        supervisors: []
      };
  
      activity.energyOwners.push(newEnergyOwner);

      activity.isBlocked = true;

      await activity.save();
  
      // Devolver la actividad actualizada con los datos populados
      const updatedActivity = await ActivityModel.findById(activityId)
        .populate('energyOwners.user')
        .populate('energyOwners.supervisors.user')
        .populate('energyOwners.supervisors.workers')
        .populate('equipments');
  
      res.json({ 
        mensaje: 'Dueño de energía agregado exitosamente', 
        actividad: updatedActivity
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al agregar dueño de energía', detalles: (error as Error).message });
    }
  },
  async assignSupervisor(req: Request, res: Response) {
    try {
      const { activityId } = req.params;
      const { energyOwnerId, supervisorId } = req.body;
  
      console.log(req.body);

      // Buscar la actividad
      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        return res.status(200).json({ mensaje: 'Actividad no encontrada', error: true });
      }
  
      // Buscar el dueño de energía dentro de la actividad
      const energyOwner = activity.energyOwners.find(owner => owner.user.toString() === energyOwnerId);
      console.log(energyOwner);
      if (!energyOwner) {
        return res.status(200).json({ mensaje: 'Dueño de energía no encontrado en la actividad', error: true });
      }
  
      // Verificar que el usuario a agregar como supervisor exista y sea válido
      const user = await Usuario.findById(supervisorId);
      if (!user || user.perfil !== 'supervisor') {
        return res.status(200).json({ mensaje: 'Usuario no es válido o no es un supervisor', error: true });
      }
  
      // Agregar el supervisor al dueño de energía
      const newSupervisor:any = {
        user: user,
        isBlocked: false,
        workers: []
      };
      energyOwner.supervisors.push(newSupervisor);
      await activity.save();
  
      // Obtener la actividad actualizada con populate para enviar al frontend
      const updatedActivity = await ActivityModel.findById(activityId)
        .populate('energyOwners.user')
        .populate('energyOwners.supervisors.user')
        .populate('energyOwners.supervisors.workers')
        .populate('equipments');
  
      res.status(200).json({ mensaje: 'Supervisor asignado exitosamente', actividad: updatedActivity, error: false });
    } catch (error) {
      res.status(200).json({ mensaje: 'Error al asignar supervisor', detalles: (error as Error).message, error: true });
    }
  }, 
  async assignWorker(req: Request, res: Response) {
    try {
      const { activityId } = req.params;
      const { energyOwnerId, supervisorId, workerId } = req.body;
  
      // Find the activity
      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        return res.status(404).json({ mensaje: 'Actividad no encontrada' });
      }
  
      // Find the energy owner within the activity
      const energyOwner = activity.energyOwners.find(owner => owner.user.toString() === energyOwnerId);
      if (!energyOwner) {
        return res.status(404).json({ mensaje: 'Dueño de energía no encontrado en la actividad' });
      }
  
      // Find the supervisor within the energy owner
      const supervisor = energyOwner.supervisors.find(sup => sup.user.toString() === supervisorId);
      if (!supervisor) {
        return res.status(404).json({ mensaje: 'Supervisor no encontrado para el dueño de energía' });
      }
  
      // Fetch the worker document
      const user :any = await Usuario.findById(workerId);
      if (!user) {
        return res.status(404).json({ mensaje: 'Trabajador no encontrado' });
      }
      
      // Check if the worker already exists in the supervisor's workers array
      if (supervisor.workers.some(worker => worker._id.toString() === workerId)) {
        return res.status(400).json({ mensaje: 'El trabajador ya existe en el supervisor' });
      }
  
      // Add the full user document to the supervisor's workers array
      supervisor.workers.push(user);
      await activity.save();
  
      // Obtener la actividad actualizada con populate para enviar al frontend
      const updatedActivity = await ActivityModel.findById(activityId)
        .populate('energyOwners.user')
        .populate('energyOwners.supervisors.user')
        .populate({
          path: 'energyOwners.supervisors.workers',
          model: 'Usuario'  // Ensure the model reference is correct here
        })
        .populate('equipments');
  
      res.json({ mensaje: 'Trabajador asignado exitosamente', actividad: updatedActivity });
    } catch (error) {
      res.status(500).json({ error: 'Error al asignar trabajador', detalles: (error as Error).message });
    }
  },
  async deleteActivity(req: Request, res: Response) {                                        //revisar con said
    const { id } = req.params;  
    try {
        const result = await ActivityModel.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ message: 'Actividad no encontrada' });
        }
        res.status(200).json({ message: 'Actividad eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar la actividad:', error);
        res.status(500).json({ message: 'Error al eliminar la actividad' });
    }
  },
  async editActivity(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const updatedActivity = await ActivityModel.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
      ).populate('equipments');

      if (!updatedActivity) {
        return res.status(404).json({ message: 'Actividad no encontrada' });
      }

      res.status(200).json(updatedActivity);
    } catch (error) {
      console.error('Error al editar la actividad:', error);
      res.status(400).json({
        message: 'Error al editar la actividad',
        detalles: (error as Error).message,
      });
    }
  },


  async pendingNewEnergyOwner(req: Request, res: Response) {
    try {
        const { activityId, selectedOwner } = req.params;
        const activity: any = await ActivityModel.findById(activityId);

        if (!activity) {
            return res.status(404).json({
                mensaje: 'Actividad no encontrada'
            });
        }

        // Actualizar la actividad
        const updateData = {
            pendingNewEnergyOwner: true,
            selectedNewOwner: selectedOwner
        };

        // Usar findByIdAndUpdate para asegurar que los nuevos campos se incluyan
        const updatedActivity = await ActivityModel.findByIdAndUpdate(
            activityId,
            updateData,
            { 
                new: true,  // Retorna el documento actualizado
                runValidators: true
            }
        )
        .populate('energyOwners.user')
        .populate('energyOwners.supervisors.user')
        .populate('energyOwners.supervisors.workers')
        .populate('equipments');

        console.log('Actividad actualizada:', updatedActivity); // Para debug
        res.json(updatedActivity);
    } catch (error) {
        console.error('Error completo:', error); // Para debug
        res.status(500).json({
            error: 'Error al actualizar la actividad',
            detalles: (error as Error).message
        });
    }
  },
  async addEquipmentToActivity(req: Request, res: Response) {
    try {
      const { activityId } = req.params;
      const { _id } = req.body;

      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }

      if (activity.equipments.includes(_id)) {
        return res.status(400).json({ error: 'El equipo ya existe en la actividad' });
      }

      activity.equipments.push(_id);
      await activity.save();

      res.status(200).json({ message: 'Equipo agregado exitosamente' });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error al agregar el equipo a la actividad',
        detalles: (error as Error).message 
      });
    }
  },
  async desbloquearActividad(req: Request, res: Response) {
    try {
      console.log('=== Iniciando desbloquearActividad ===');
      console.log('Params:', req.params);
      console.log('Body:', req.body);

      const { activityId } = req.params;
      const { _id } = req.body.user;
      
      console.log('ID de actividad:', activityId);
      console.log('ID de usuario:', _id);
      
      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        console.log('Actividad no encontrada para ID:', activityId);
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }

      const user = await Usuario.findById(_id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Guardar información de los casilleros antes de modificar la actividad
      const assignedLocker = activity.assignedLockers && activity.assignedLockers.length > 0 
        ? activity.assignedLockers[0] // Tomamos solo el primer casillero ya que solo debe haber uno por actividad
        : null;
      console.log('Casillero asignado antes de desbloquear:', assignedLocker);

      if(user.perfil === 'trabajador') {
        activity.energyOwners.forEach((owner: any) => {
          owner.supervisors.forEach((supervisor: any) => {
            supervisor.workers = supervisor.workers.filter((worker: any) => worker._id.toString() !== _id);
          });
        });
      }

      if (user.perfil === 'supervisor') {
        // Verificar si el supervisor tiene trabajadores asignados
        activity.energyOwners.forEach((owner: any) => {
          const supervisor = owner.supervisors.find((sup: any) => sup.user.toString() === _id);
          if (supervisor && supervisor.workers.length > 0) {
            throw new Error('No se puede desbloquear el supervisor porque tiene trabajadores asignados');
          }
        });

        // Si no tiene trabajadores, proceder a eliminarlo
        activity.energyOwners.forEach((owner: any) => {
          owner.supervisors = owner.supervisors.filter((supervisor: any) => supervisor.user.toString() !== _id);
        });
      }

      if (user.perfil === 'duenoDeEnergia') {
        // Verificar si el dueño de energía tiene supervisores asignados
        const energyOwner = activity.energyOwners.find((owner: any) => owner.user.toString() === _id);
        if (energyOwner && energyOwner.supervisors.length > 0) {
          throw new Error('No se puede desbloquear el dueño de energía porque tiene supervisores asignados');
        }

        // Si no tiene supervisores, proceder a eliminarlo
        activity.energyOwners = activity.energyOwners.filter((owner: any) => owner.user.toString() !== _id);
      }

      // Si era el último dueño de energía, finalizar la actividad
      if (activity.energyOwners.length === 0) {
        activity.isBlocked = false;
        activity.status = 'finalizada';
        activity.finishedAt = new Date();
        
        // Eliminar asignaciones de casilleros al finalizar la actividad
        activity.assignedLockers = [];
      }

      // Guardar los cambios en la actividad
      await activity.save();
      
      // Actualizar el estado del casillero a "disponible" si existe un casillero asignado
      let lockerUpdateResult = null;
      
      if (assignedLocker) {
        try {
          console.log(`Actualizando casillero: ${assignedLocker.lockerId} del tótem: ${assignedLocker.totemId}`);
          
          // 1. Actualizar el estado del casillero en la colección de casilleros
          const casillero = await LockerModel.findById(assignedLocker.lockerId);
          if (casillero) {
            casillero.status = 'disponible' as any;
            // Eliminar la referencia a la actividad si existe
            if (casillero.activityId) {
              delete (casillero as any).activityId;
            }
            await casillero.save();
            console.log(`Casillero ${assignedLocker.lockerId} marcado como disponible`);
          } else {
            console.log(`No se encontró el casillero con ID: ${assignedLocker.lockerId}`);
          }
          
          // 2. Intentar actualizar el estado del casillero en el tótem si existe
          const totem = await totemModel.findById(assignedLocker.totemId);
          if (totem && totem.casilleros) {
            const casilleroEnTotem = totem.casilleros.find(
              (c: any) => c._id.toString() === assignedLocker.lockerId
            );
            
            if (casilleroEnTotem) {
              casilleroEnTotem.status = 'disponible';
              casilleroEnTotem.equipos = []; // Limpiar equipos
              await totem.save();
              console.log(`Casillero actualizado en el tótem ${assignedLocker.totemId}`);
            }
          } else {
            console.log(`No se encontró el tótem con ID: ${assignedLocker.totemId} o no tiene casilleros`);
          }
          
          lockerUpdateResult = { success: true, lockerId: assignedLocker.lockerId };
        } catch (error) {
          console.error(`Error al actualizar el casillero ${assignedLocker.lockerId}:`, error);
          lockerUpdateResult = { success: false, lockerId: assignedLocker.lockerId, error };
        }
      }
      
      res.json({ 
        message: 'Usuario desbloqueado exitosamente',
        activityStatus: activity.status,
        lockerUpdated: lockerUpdateResult
      });

    } catch (error) {
      console.error('Error en desbloquearActividad:', error);
      res.status(400).json({ 
        error: 'Error al desbloquear usuario',
        message: (error as Error).message
      });
    }
  },
  async resetEquipmentStatus(req: Request, res: Response) {
    try {
      const { activityId } = req.params;

      // Buscar la actividad
      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        return res.status(404).json({ 
          mensaje: 'Actividad no encontrada',
          error: true 
        });
      }

      // Actualizar todos los equipos asociados a la actividad
      if (activity.equipments?.length > 0) {
        await EquipmentModel.updateMany(
          { _id: { $in: activity.equipments } },
          { $set: { zeroEnergyValidated: false } }
        );
      }

      res.json({
        mensaje: 'Estado de equipos reseteado exitosamente',
        error: false
      });

    } catch (error) {
      console.error('Error al resetear estado de equipos:', error);
      res.status(500).json({
        mensaje: 'Error al resetear el estado de los equipos',
        detalles: (error as Error).message,
        error: true
      });
    }
  },
  async clearLocker(req: Request, res: Response) {
    try {
      const { activityId } = req.params;
      console.log('Limpiando casillero para actividad:', activityId); // Debug log

      // Buscar la actividad
      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        console.log('Actividad no encontrada:', activityId); // Debug log
        return res.status(404).json({
          mensaje: 'Actividad no encontrada',
          error: true
        });
      }

      // Buscar y actualizar el casillero asociado
      const locker = await LockerModel.findOneAndUpdate(
        { activityId: activityId },
        { 
          $set: {
            isOccupied: false,
            activityId: null,
            lastUsedBy: null
          }
        },
        { new: true }
      );

      console.log('Casillero actualizado:', locker); // Debug log

      if (!locker) {
        return res.status(404).json({
          mensaje: 'No se encontró casillero asociado a esta actividad',
          error: true
        });
      }

      res.json({
        mensaje: 'Casillero liberado exitosamente',
        error: false,
        locker
      });

    } catch (error) {
      console.error('Error completo al liberar el casillero:', error);
      res.status(500).json({
        mensaje: 'Error al liberar el casillero',
        detalles: (error as Error).message,
        error: true
      });
    }
  },
  async desbloquearSupervisor(req: Request, res: Response) {
    console.log('=== Iniciando desbloquearSupervisor ===');
    console.log('Params:', req.params);
    console.log('Body completo:', JSON.stringify(req.body, null, 2));
    try {
      const { activityId } = req.params;
      const { supervisorId, reason, validationData, selectedOption, subOptions, user } = req.body;
      
      // Extraer el ID del supervisor desde supervisorId o user._id
      const realSupervisorId = supervisorId || user?._id;
      console.log('SupervisorId extraído:', realSupervisorId);
      
      if (!realSupervisorId) {
        console.error('Error: supervisorId no recibido en la solicitud');
        return res.status(400).json({ error: 'ID de supervisor no proporcionado' });
      }
      
      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }
      
      // Crear objeto de ruptura con la información recibida
      const rupturaInfo = {
        razon: reason || 'Desbloqueo de supervisor',
        fecha: new Date(),
        validador: validationData?.user?._id || user?._id,
        opcionSeleccionada: selectedOption || 1,
        detallesOpcion: selectedOption !== 2 ? req.body?.detallesOpcion || '' : '',
        subOpcionesMarcadas: selectedOption === 2 && subOptions ? 
          subOptions.filter((opt: any) => opt.checked).map((opt: any) => opt.text) : []
      };
      
      // Verificar si el supervisor tiene trabajadores asignados
      let supervisorEncontrado = false;
      let tieneTrabjadores = false;
      
      activity.energyOwners.forEach((owner: any) => {
        owner.supervisors.forEach((supervisor: any) => {
          if (supervisor.user.toString() === realSupervisorId) {
            supervisorEncontrado = true;
            if (supervisor.workers && supervisor.workers.length > 0) {
              tieneTrabjadores = true;
            }
          }
        });
      });
      
      if (!supervisorEncontrado) {
        return res.status(404).json({ error: 'Supervisor no encontrado en la actividad' });
      }
      
      if (tieneTrabjadores) {
        return res.status(400).json({ 
          error: 'No se puede desbloquear al supervisor porque tiene trabajadores asignados',
          message: 'Debe desbloquear primero a todos los trabajadores asociados'
        });
      }
      
      // Si no tiene trabajadores, eliminar al supervisor en lugar de solo marcarlo como no bloqueado
      activity.energyOwners.forEach((owner: any) => {
        owner.supervisors = owner.supervisors.filter((supervisor: any) => 
          supervisor.user.toString() !== realSupervisorId
        );
      });
      
      // Añadir al historial de rupturas de la actividad
      if (!activity.rupturas) {
        activity.rupturas = [];
      }
      
      activity.rupturas.push({
        ...rupturaInfo,
        tipo: 'supervisor',
        idUsuario: realSupervisorId
      });
      
      await activity.save();
      
      // Obtener la actividad actualizada con populate para enviar al frontend
      const updatedActivity = await ActivityModel.findById(activityId)
        .populate('energyOwners.user')
        .populate('energyOwners.supervisors.user')
        .populate('energyOwners.supervisors.workers')
        .populate('equipments');
      
      console.log('Actividad actualizada:', activity);
      res.status(200).json({ mensaje: 'Supervisor desbloqueado exitosamente', activity: updatedActivity });
    } catch (error) {
      console.error('Error al desbloquear supervisor:', error);
      res.status(500).json({ error: 'Error al desbloquear supervisor' });
    }
  },
  async desbloquearTrabajador(req: Request, res: Response) {
    console.log('=== Iniciando desbloquearTrabajador ===');
    console.log('Params:', req.params);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    try {
      const { activityId } = req.params;
      const { 
        trabajadorId, 
        reason, 
        validationData, 
        selectedOption, 
        subOptions 
      } = req.body;
      
      // Extraer el ID del trabajador de la estructura correcta
      const realTrabajadorId = trabajadorId || req.body.user?._id;
      console.log('trabajadorId extraído:', realTrabajadorId);
      
      if (!realTrabajadorId) {
        return res.status(400).json({ error: 'trabajadorId es requerido' });
      }

      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }
      
      // Crear objeto de ruptura con la información recibida
      const rupturaInfo = {
        razon: reason || 'Desbloqueo de trabajador',
        fecha: new Date(),
        validador: validationData?.user?._id || req.body.user?._id,
        opcionSeleccionada: selectedOption || 1,
        detallesOpcion: selectedOption !== 2 ? req.body?.detallesOpcion || '' : '',
        subOpcionesMarcadas: selectedOption === 2 && subOptions ? 
          subOptions.filter((opt: any) => opt?.checked).map((opt: any) => opt?.text) : []
      };
      
      // Buscar al trabajador y añadir información de ruptura
      let trabajadorEncontrado = false;
      
      activity.energyOwners.forEach((owner: any) => {
        owner.supervisors.forEach((supervisor: any) => {
          if (supervisor.workers && supervisor.workers.length > 0) {
            const workerIndex = supervisor.workers.findIndex(
              (worker: any) => worker.toString() === realTrabajadorId || 
                             (worker._id && worker._id.toString() === realTrabajadorId)
            );
            
            if (workerIndex !== -1) {
              trabajadorEncontrado = true;
              // Eliminar al trabajador de la lista
              supervisor.workers.splice(workerIndex, 1);
            }
          }
        });
      });
      
      if (!trabajadorEncontrado) {
        return res.status(404).json({ 
          error: 'Trabajador no encontrado en la actividad',
          trabajadorId: realTrabajadorId
        });
      }
      
      // Añadir al historial de rupturas de la actividad
      if (!activity.rupturas) {
        activity.rupturas = [];
      }
      
      activity.rupturas.push({
        ...rupturaInfo,
        tipo: 'trabajador',
        idUsuario: realTrabajadorId
      });
      
      await activity.save();
      
      // Obtener la actividad actualizada con populate para enviar al frontend
      const updatedActivity = await ActivityModel.findById(activityId)
        .populate('energyOwners.user')
        .populate('energyOwners.supervisors.user')
        .populate('energyOwners.supervisors.workers')
        .populate('equipments');
      
      console.log('Trabajador desbloqueado exitosamente');
      res.status(200).json({ 
        mensaje: 'Trabajador desbloqueado exitosamente', 
        activityId,
        trabajadorId: realTrabajadorId,
        activity: updatedActivity 
      });
    } catch (error) {
      console.error('Error al desbloquear trabajador:', error);
      res.status(500).json({ 
        error: 'Error al desbloquear trabajador',
        message: (error as Error).message
      });
    }
  },
  async rupturaBloqueo(req: Request, res: Response) {
    console.log('=== Iniciando rupturaBloqueo ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    try {
      const { activityId } = req.params;
      const { _id } = req.body.user;
      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error al desbloquear trabajador' });
    }
  },
  async desbloquearDuenoEnergia(req: Request, res: Response) {
    console.log('=== Iniciando desbloquearDuenoEnergia ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    try {
      const { activityId } = req.params;
      const { userId, reason, validationData, selectedOption, subOptions, user } = req.body;
      
      // Extraer el ID del dueño de energía desde userId o user._id
      const realUserId = userId || user?._id;
      console.log('UserId extraído:', realUserId);
      
      if (!realUserId) {
        return res.status(400).json({ error: 'ID de usuario no proporcionado' });
      }
      
      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        return res.status(404).json({ error: 'Actividad no encontrada' });
      }
      
      // Guardar información de los casilleros antes de modificar la actividad
      const assignedLocker = activity.assignedLockers && activity.assignedLockers.length > 0 
        ? activity.assignedLockers[0] // Tomamos solo el primer casillero ya que solo debe haber uno por actividad
        : null;
      console.log('Casillero asignado antes de desbloquear:', assignedLocker);
      
      // Verificar si el dueño de energía tiene supervisores asignados
      const energyOwnerIndex = activity.energyOwners.findIndex(
        (owner: any) => owner.user.toString() === realUserId
      );
      
      if (energyOwnerIndex === -1) {
        return res.status(404).json({ error: 'Dueño de energía no encontrado en la actividad' });
      }
      
      const energyOwner = activity.energyOwners[energyOwnerIndex];
      if (energyOwner.supervisors && energyOwner.supervisors.length > 0) {
        return res.status(400).json({ 
          error: 'No se puede desbloquear el dueño de energía porque tiene supervisores asignados' 
        });
      }
      
      // Proceder a eliminarlo
      activity.energyOwners = activity.energyOwners.filter(
        (owner: any) => owner.user.toString() !== realUserId
      );
      
      // Preparar información de ruptura si aplica
      const validatorId = validationData?.user?._id || user?._id;
      const detallesOpcion = req.body.detallesOpcion || '';
      
      const rupturaInfo: any = {
        razon: reason || 'Desbloqueo de dueño de energía',
        fecha: new Date(),
        validador: validatorId,
        opcionSeleccionada: selectedOption || 1,
        detallesOpcion
      };
      
      // Agregar subOpciones si existen y están marcadas
      if (subOptions && Array.isArray(subOptions)) {
        rupturaInfo.subOpcionesMarcadas = subOptions
          .filter((opt: any) => opt.checked)
          .map((opt: any) => opt.text);
      }
      
      // Añadir al historial de rupturas de la actividad
      if (!activity.rupturas) {
        activity.rupturas = [];
      }
      
      activity.rupturas.push({
        ...rupturaInfo,
        tipo: 'duenoEnergia',
        idUsuario: realUserId
      });
      
      // Si era el último dueño de energía, finalizar la actividad
      if (activity.energyOwners.length === 0) {
        activity.isBlocked = false;
        activity.status = 'finalizada';
        activity.finishedAt = new Date();
        
        // Limpiar todas las asignaciones de casilleros
        activity.assignedLockers = [];
      }
      
      await activity.save();
      
      // Actualizar el estado del casillero a "disponible" si existe un casillero asignado
      let lockerUpdateResult = null;
      
      if (assignedLocker) {
        try {
          console.log(`Actualizando casillero: ${assignedLocker.lockerId} del tótem: ${assignedLocker.totemId}`);
          
          // 1. Actualizar el estado del casillero en la colección de casilleros
          const casillero = await LockerModel.findById(assignedLocker.lockerId);
          if (casillero) {
            casillero.status = 'disponible' as any;
            // Eliminar la referencia a la actividad si existe
            if (casillero.activityId) {
              delete (casillero as any).activityId;
            }
            await casillero.save();
            console.log(`Casillero ${assignedLocker.lockerId} marcado como disponible`);
          } else {
            console.log(`No se encontró el casillero con ID: ${assignedLocker.lockerId}`);
          }
          
          // 2. Intentar actualizar el estado del casillero en el tótem si existe
          const totem = await totemModel.findById(assignedLocker.totemId);
          if (totem && totem.casilleros) {
            const casilleroEnTotem = totem.casilleros.find(
              (c: any) => c._id.toString() === assignedLocker.lockerId
            );
            
            if (casilleroEnTotem) {
              casilleroEnTotem.status = 'disponible';
              casilleroEnTotem.equipos = []; // Limpiar equipos
              await totem.save();
              console.log(`Casillero actualizado en el tótem ${assignedLocker.totemId}`);
            }
          } else {
            console.log(`No se encontró el tótem con ID: ${assignedLocker.totemId} o no tiene casilleros`);
          }
          
          lockerUpdateResult = { success: true, lockerId: assignedLocker.lockerId };
        } catch (error) {
          console.error(`Error al actualizar el casillero ${assignedLocker.lockerId}:`, error);
          lockerUpdateResult = { success: false, lockerId: assignedLocker.lockerId, error };
        }
      }
      
      // Obtener la actividad actualizada con populate para enviar al frontend
      const updatedActivity = await ActivityModel.findById(activityId)
        .populate('energyOwners.user')
        .populate('energyOwners.supervisors.user')
        .populate('energyOwners.supervisors.workers')
        .populate('equipments');
      
      console.log('Dueño de energía desbloqueado exitosamente');
      res.status(200).json({ 
        mensaje: 'Dueño de energía desbloqueado exitosamente', 
        activityId,
        userId: realUserId,
        activity: updatedActivity,
        lockerUpdated: lockerUpdateResult
      });
    } catch (error) {
      console.error('Error al desbloquear dueño de energía:', error);
      res.status(500).json({ 
        error: 'Error al desbloquear dueño de energía',
        message: (error as Error).message
      });
    }
  },
  async assignLockerToActivity(req: Request, res: Response) {
    try {
      const { activityId } = req.params;
      const { lockerId, totemId } = req.body;

      // Validar que se recibieron los datos necesarios
      if (!lockerId || !totemId) {
        return res.status(400).json({
          mensaje: 'Se requiere el ID del casillero y del tótem',
          error: true
        });
      }

      // Buscar la actividad
      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        return res.status(404).json({
          mensaje: 'Actividad no encontrada',
          error: true
        });
      }

      // Verificar si la actividad ya tiene un casillero asignado (regla: solo un casillero por actividad)
      if (activity.assignedLockers && activity.assignedLockers.length > 0) {
        return res.status(400).json({
          mensaje: 'Esta actividad ya tiene un casillero asignado. Solo se permite un casillero por actividad.',
          error: true
        });
      }

      // Agregar el nuevo casillero a la actividad
      (activity as any).assignedLockers.push({
        lockerId,
        totemId,
        assignedAt: new Date()
      });

      await activity.save();

      // Obtener la actividad actualizada con todos los campos populados
      const updatedActivity = await ActivityModel.findById(activityId)
        .populate('energyOwners.user')
        .populate('energyOwners.supervisors.user')
        .populate('energyOwners.supervisors.workers')
        .populate('equipments');

      res.status(200).json({
        mensaje: 'Casillero asignado exitosamente',
        actividad: updatedActivity,
        error: false
      });

    } catch (error) {
      console.error('Error al asignar casillero:', error);
      res.status(500).json({
        mensaje: 'Error al asignar el casillero a la actividad',
        detalles: (error as Error).message,
        error: true
      });
    }
  },

  /**
   * Desasigna un casillero específico de una actividad
   * - Remueve el casillero de la lista de casilleros asignados
   * - Valida que el casillero esté realmente asignado a la actividad
   * - Retorna la actividad actualizada
   */
  async unassignLockerFromActivity(req: Request, res: Response) {
    try {
      const { activityId, lockerId } = req.params;

      // Validar que se recibieron los datos necesarios
      if (!lockerId) {
        return res.status(400).json({
          mensaje: 'Se requiere el ID del casillero',
          error: true
        });
      }

      // Buscar la actividad
      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        return res.status(404).json({
          mensaje: 'Actividad no encontrada',
          error: true
        });
      }

      // Verificar si la actividad tiene casilleros asignados
      if (!activity.assignedLockers || activity.assignedLockers.length === 0) {
        return res.status(400).json({
          mensaje: 'Esta actividad no tiene casilleros asignados',
          error: true
        });
      }

      // Buscar el casillero específico en los asignados
      const lockerIndex = (activity as any).assignedLockers.findIndex(
        (locker: any) => locker.lockerId === lockerId
      );

      if (lockerIndex === -1) {
        return res.status(400).json({
          mensaje: 'El casillero especificado no está asignado a esta actividad',
          error: true
        });
      }

      // Remover el casillero de la lista
      (activity as any).assignedLockers.splice(lockerIndex, 1);

      await activity.save();

      // Obtener la actividad actualizada con todos los campos populados
      const updatedActivity = await ActivityModel.findById(activityId)
        .populate('energyOwners.user')
        .populate('energyOwners.supervisors.user')
        .populate('energyOwners.supervisors.workers')
        .populate('equipments');

      res.status(200).json({
        success: true,
        mensaje: 'Casillero desasignado exitosamente',
        actividad: updatedActivity,
        removedLockerId: lockerId,
        error: false
      });

    } catch (error) {
      console.error('Error al desasignar casillero:', error);
      res.status(500).json({
        success: false,
        mensaje: 'Error al desasignar el casillero de la actividad',
        detalles: (error as Error).message,
        error: true
      });
    }
  },

  /**
   * Genera un reporte detallado de una actividad
   * - Incluye información de la actividad, equipos, dueños de energía y validaciones
   * - Calcula estadísticas y estado de la actividad
   */
  async generateReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          mensaje: 'ID de actividad inválido',
          error: true
        });
      }

      const activity = await ActivityModel.findById(id)
        .populate('energyOwners.user')
        .populate('energyOwners.supervisors.user')
        .populate('energyOwners.supervisors.workers')
        .populate('equipments');

      if (!activity) {
        return res.status(404).json({
          mensaje: 'Actividad no encontrada',
          error: true
        });
      }

      // Generar el reporte estructurado
      const report = {
        _id: activity._id,
        name: activity.name,
        description: activity.description,
        blockType: activity.blockType,
        status: activity.status || (activity.isBlocked ? 'en_proceso' : 'pendiente'),
        createdAt: activity.createdAt,
        updatedAt: (activity as any).updatedAt,
        finishedAt: (activity as any).finishedAt,
        
        // Validación de energía cero
        zeroEnergyValidation: activity.zeroEnergyValidation || {
          validatorName: 'No asignado',
          instrumentUsed: 'No especificado',
          energyValue: 'No medido'
        },
        
        // Dueños de energía con supervisores y trabajadores
        energyOwners: activity.energyOwners.map((owner: any) => ({
          name: owner.user.nombre,
          email: owner.user.email,
          empresa: owner.user.empresa,
          isBlocked: owner.isBlocked,
          supervisors: owner.supervisors.map((supervisor: any) => ({
            name: supervisor.user.nombre,
            email: supervisor.user.email,
            empresa: supervisor.user.empresa,
            isBlocked: supervisor.isBlocked,
            workers: supervisor.workers.map((worker: any) => worker.nombre || worker.name || 'Sin nombre')
          }))
        })),
        
        // Equipos involucrados
        equipments: activity.equipments.map((equipment: any) => ({
          name: equipment.name,
          area: equipment.area?.name || 'Sin área',
          zeroEnergyValidated: equipment.zeroEnergyValidated || false
        })),
        
        // Estadísticas
        totalEquipments: activity.equipments.length,
        totalEnergyOwners: activity.energyOwners.length,
        totalSupervisors: activity.energyOwners.reduce((total: number, owner: any) => 
          total + (owner.supervisors?.length || 0), 0),
        totalWorkers: activity.energyOwners.reduce((total: number, owner: any) => 
          total + (owner.supervisors?.reduce((subTotal: number, supervisor: any) => 
            subTotal + (supervisor.workers?.length || 0), 0) || 0), 0),
        
        // Casilleros asignados
        assignedLockers: activity.assignedLockers || [],
        
        // Historial de rupturas si existe
        rupturas: activity.rupturas || []
      };

      res.json(report);
    } catch (error) {
      console.error('Error al generar reporte:', error);
      res.status(500).json({
        mensaje: 'Error al generar el reporte',
        detalles: (error as Error).message,
        error: true
      });
    }
  },

  /**
   * Asigna un dueño de energía a una actividad y la bloquea
   * - Valida que el usuario tenga el perfil de dueño de energía
   * - Agrega el usuario como dueño de energía
   * - Marca la actividad como bloqueada
   * - Retorna la actividad actualizada
   */
  async assignEnergyOwner(req: Request, res: Response) {
    try {
      const { activityId } = req.params;
      const { userId } = req.body;

      // Validar que se recibieron los datos necesarios
      if (!userId) {
        return res.status(400).json({
          mensaje: 'Se requiere el ID del usuario',
          error: true
        });
      }

      // Buscar la actividad
      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        return res.status(404).json({
          mensaje: 'Actividad no encontrada',
          error: true
        });
      }

      // Buscar el usuario
      const user = await Usuario.findById(userId);
      if (!user) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado',
          error: true
        });
      }

      // Verificar que el usuario sea dueño de energía
      if (user.perfil !== 'duenoDeEnergia') {
        return res.status(403).json({
          mensaje: 'Solo los dueños de energía pueden ser asignados a actividades',
          error: true
        });
      }

      // Verificar que la actividad no esté ya bloqueada
      if (activity.isBlocked) {
        return res.status(400).json({
          mensaje: 'La actividad ya está bloqueada',
          error: true
        });
      }

      // Verificar que tenga equipos asignados
      if (!activity.equipments || activity.equipments.length === 0) {
        return res.status(400).json({
          mensaje: 'No se puede bloquear una actividad sin equipos asignados',
          error: true
        });
      }

      // Verificar que tenga validación de energía cero
      if (!activity.zeroEnergyValidation || !activity.zeroEnergyValidation.validatorName) {
        return res.status(400).json({
          mensaje: 'No se puede bloquear una actividad sin validación de energía cero',
          error: true
        });
      }

      // Crear el objeto de dueño de energía
      const energyOwner = {
        user: userId,
        isBlocked: false,
        supervisors: [],
        ruptura: null
      };

      // Actualizar la actividad
      const updatedActivity = await ActivityModel.findByIdAndUpdate(
        activityId,
        {
          $push: { energyOwners: energyOwner },
          isBlocked: true,
          blockType: 'Operativo'
        },
        { new: true }
      ).populate('energyOwners.user equipments');

      if (!updatedActivity) {
        return res.status(500).json({
          mensaje: 'Error al actualizar la actividad',
          error: true
        });
      }

      console.log('✅ Dueño de energía asignado y actividad bloqueada:', {
        activityId: activityId,
        userId: userId,
        userName: user.nombre,
        energyOwnersCount: updatedActivity.energyOwners.length
      });

      return res.status(200).json({
        mensaje: 'Dueño de energía asignado y actividad bloqueada exitosamente',
        activity: updatedActivity,
        energyOwners: updatedActivity.energyOwners,
        isBlocked: true
      });

    } catch (error) {
      console.error('❌ Error en assignEnergyOwner:', error);
      return res.status(500).json({
        mensaje: 'Error interno del servidor al asignar dueño de energía',
        error: true,
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  },

  /**
   * Limpia todas las actividades dejándolas con la estructura básica
   * Elimina usuarios asignados, validaciones de energía cero, equipos, etc.
   */
  async cleanAllActivities(req: Request, res: Response) {
    try {
      console.log('Iniciando limpieza de todas las actividades...');
      
      // Estructura básica para limpiar actividades
      const cleanStructure = {
        isBlocked: false,
        energyOwners: [],
        equipments: [],
        zeroEnergyValidation: {
          validatorName: "",
          instrumentUsed: "",
          energyValue: ""
        },
        pendingNewEnergyOwner: false,
        status: "pendiente",
        finishedAt: null,
        assignedLockers: [],
        rupturas: [],
        updatedAt: new Date()
      };

      // Actualizar todas las actividades
      const result = await ActivityModel.updateMany(
        {}, // Sin filtros, actualiza todas
        { $set: cleanStructure }
      );

      console.log(`Actividades limpiadas: ${result.modifiedCount} de ${result.matchedCount}`);

      return res.status(200).json({
        success: true,
        message: `Se limpiaron ${result.modifiedCount} actividades exitosamente`,
        data: {
          matched: result.matchedCount,
          modified: result.modifiedCount
        }
      });

    } catch (error) {
      console.error('Error al limpiar todas las actividades:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al limpiar las actividades',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  },

  /**
   * Limpia una actividad específica dejándola con la estructura básica
   */
  async cleanActivity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      console.log('Limpiando actividad:', id);

      // Verificar que la actividad existe
      const activity = await ActivityModel.findById(id);
      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Actividad no encontrada'
        });
      }

      // Estructura básica para limpiar la actividad
      const cleanStructure = {
        isBlocked: false,
        energyOwners: [],
        equipments: [],
        zeroEnergyValidation: {
          validatorName: "",
          instrumentUsed: "",
          energyValue: ""
        },
        pendingNewEnergyOwner: false,
        status: "pendiente",
        finishedAt: null,
        assignedLockers: [],
        rupturas: [],
        updatedAt: new Date()
      };

      // Actualizar la actividad específica
      const actividadActualizada = await ActivityModel.findByIdAndUpdate(
        id,
        { $set: cleanStructure },
        { new: true }
      );

      console.log('Actividad limpiada exitosamente:', actividadActualizada?.name);

      return res.status(200).json({
        success: true,
        message: 'Actividad limpiada exitosamente',
        data: actividadActualizada
      });

    } catch (error) {
      console.error('Error al limpiar la actividad:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al limpiar la actividad',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
};
