import { Request, Response } from 'express';

import { ActivityModel } from '../activity/activity.model';
import { EquipmentModel } from './equipment.model';
export const equipmentController = {
  async getAllEquipment(req: Request, res: Response) {
    try {
      const equipment = await EquipmentModel.find({ deleted: false })
        .populate('area', 'name description')
        .populate('activities', 'name description blockType');
      
      if (!equipment || equipment.length === 0) {
        return res.status(404).json({
          mensaje: 'No se encontraron equipos'
        });
      }

      res.json(equipment);
    } catch (error) {
      res.status(500).json({
        error: 'Error al obtener equipos',
        detalles: (error as Error).message
      });
    }
  },

  async getEquipmentById(req: Request, res: Response) {
    try {
      const equipment = await EquipmentModel.findOne({
        _id: req.params.id,
        deleted: false
      })
        .populate('area', 'name description')
        .populate('activities', 'name description blockType');
      
      if (!equipment) {
        return res.status(404).json({
          mensaje: 'Equipo no encontrado'
        });
      }

      res.json(equipment);
    } catch (error) {
      res.status(500).json({
        error: 'Error al obtener el equipo',
        detalles: (error as Error).message
      });
    }
  },

  async createEquipment(req: Request, res: Response) {
    try {
      const newEquipment = new EquipmentModel(req.body);
      await newEquipment.save();
      
      const populatedEquipment = await EquipmentModel.findById(newEquipment._id)
        .populate('area', 'name description')
        .populate('activities', 'name description blockType');

      res.status(201).json({
        mensaje: 'Equipo creado exitosamente',
        equipo: populatedEquipment
      });
    } catch (error) {
      res.status(400).json({
        error: 'Error al crear el equipo',
        detalles: (error as Error).message
      });
    }
  },

  async updateEquipment(req: Request, res: Response) {
    try {
      const equipment = await EquipmentModel.findOneAndUpdate(
        { 
          _id: req.params.id,
          deleted: false,
          locked: false
        },
        { $set: req.body },
        { new: true, runValidators: true }
      )
        .populate('area', 'name description')
        .populate('activities', 'name description blockType');

      if (!equipment) {
        return res.status(404).json({
          mensaje: 'Equipo no encontrado o bloqueado'
        });
      }

      res.json({
        mensaje: 'Equipo actualizado exitosamente',
        equipo: equipment
      });
    } catch (error) {
      res.status(400).json({
        error: 'Error al actualizar el equipo',
        detalles: (error as Error).message
      });
    }
  },

  async deleteEquipment(req: Request, res: Response) {
    try {
      const equipment = await EquipmentModel.findOne({
        _id: req.params.id,
        deleted: false,
        locked: false
      });

      if (!equipment) {
        return res.status(404).json({
          mensaje: 'Equipo no encontrado o bloqueado'
        });
      }

      // Soft delete
      equipment.deleted = true;
      await equipment.save();

      // Eliminar referencias en actividades
      await ActivityModel.updateMany(
        { equipments: equipment._id },
        { $pull: { equipments: equipment._id } }
      );

      res.json({
        mensaje: 'Equipo eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error al eliminar el equipo',
        detalles: (error as Error).message
      });
    }
  },

  async toggleLock(req: Request, res: Response) {
    try {
      const equipment = await EquipmentModel.findOne({
        _id: req.params.id,
        deleted: false
      });

      if (!equipment) {
        return res.status(404).json({
          mensaje: 'Equipo no encontrado'
        });
      }

      equipment.locked = !equipment.locked;
      await equipment.save();

      res.json({
        mensaje: `Equipo ${equipment.locked ? 'bloqueado' : 'desbloqueado'} exitosamente`,
        equipo: equipment
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error al cambiar el estado de bloqueo del equipo',
        detalles: (error as Error).message
      });
    }
  },

  async assignActivity(req: Request, res: Response) {
    try {
      const { equipmentId } = req.params;
      const { activityId } = req.body;

      const equipment = await EquipmentModel.findOne({
        _id: equipmentId,
        deleted: false,
        locked: false
      });

      const activity = await ActivityModel.findById(activityId);

      if (!equipment || !activity) {
        return res.status(404).json({
          mensaje: 'Equipo o actividad no encontrados'
        });
      }

      // Verificar si ya existe la relación
      if (equipment.activities.includes(activityId)) {
        return res.status(400).json({
          mensaje: 'La actividad ya está asignada a este equipo'
        });
      }

      // Actualizar ambos modelos
      equipment.activities.push(activityId as any);
      activity.equipments.push(equipmentId as any);

      await Promise.all([
        equipment.save(),
        activity.save()
      ]);

      const updatedEquipment = await EquipmentModel.findById(equipmentId)
        .populate('area', 'name description')
        .populate('activities', 'name description blockType');

      res.json({
        mensaje: 'Actividad asignada exitosamente',
        equipo: updatedEquipment
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error al asignar la actividad',
        detalles: (error as Error).message
      });
    }
  },

  async removeActivity(req: Request, res: Response) {
    try {
      const { equipmentId, activityId } = req.params;

      const equipment = await EquipmentModel.findOne({
        _id: equipmentId,
        deleted: false,
        locked: false
      });

      const activity = await ActivityModel.findById(activityId);

      if (!equipment || !activity) {
        return res.status(404).json({
          mensaje: 'Equipo o actividad no encontrados'
        });
      }

      // Eliminar las referencias en ambos modelos
      equipment.activities = equipment.activities.filter(
        id => id.toString() !== activityId
      );
      activity.equipments = activity.equipments.filter(
        id => id.toString() !== equipmentId
      );

      await Promise.all([
        equipment.save(),
        activity.save()
      ]);

      const updatedEquipment = await EquipmentModel.findById(equipmentId)
        .populate('area', 'name description')
        .populate('activities', 'name description blockType');

      res.json({
        mensaje: 'Actividad removida exitosamente',
        equipo: updatedEquipment
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error al remover la actividad',
        detalles: (error as Error).message
      });
    }
  }
};