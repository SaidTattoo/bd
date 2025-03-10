import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AreaModel } from './area.model';
import { EquipmentModel } from '../Equipment/equipment.model';

export const areaController = {
  async getAllAreas(req: Request, res: Response) {
    try {
      const areas = await AreaModel.find()
        
      if (!areas || areas.length === 0) {
        return res.status(404).json({
          mensaje: 'No se encontraron áreas'
        });
      }
      res.json(areas);
    } catch (error) {
      res.status(500).json({
        error: 'Error al obtener áreas',
        detalles: (error as Error).message
      });
    }
  },
      //Crar area
    async createArea(req: Request, res: Response) {
        const { name, description, equipment } = req.body;
        const newArea = new AreaModel({
            name,
            description,
            deleted: false,
        });
        await newArea.save();
        res.status(201).json(newArea);
    }  ,
  //Agregar equipo a area??
    async addEquipmentToArea(req: Request, res: Response) {
        const { areaId, equipmentId } = req.body;
        const area = await AreaModel.findById(areaId);
        if (!area) {
            return res.status(404).json({ error: 'Área no encontrada' });
        }
        area.equipments.push(equipmentId);
        await area.save();
    },

  // Actualizar un área y preguntar a said
  async updateArea(req: Request, res: Response) {
    try {
      const updatedArea = await AreaModel.findByIdAndUpdate(
        req.params.id,              // ID del área a actualizar
        { $set: req.body },         // Datos actualizados
        { new: true, runValidators: true } // Opciones de actualización
      ).populate('equipments');     // Poblar referencias a equipos

      if (!updatedArea) {
        return res.status(404).json({
          mensaje: 'Área no encontrada',
        });
      }

      res.json(updatedArea);
    } catch (error) {
      res.status(400).json({
        error: 'Error al actualizar el área',
        detalles: (error as Error).message,
      });
    }
  },
  async deleteArea(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const result = await AreaModel.findByIdAndDelete(id);
      if (!result) {
        return res.status(404).json({ message: 'Área no encontrada' });
      }
      res.status(200).json({ message: 'Área eliminada exitosamente' });
    } catch (error) {
      console.error('Error al eliminar el área:', error);
      res.status(500).json({ message: 'Error al eliminar el área' });
    }
  },
};
