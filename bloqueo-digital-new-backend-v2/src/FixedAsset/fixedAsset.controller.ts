import { Request, Response } from 'express';
import { FixedAssetModel } from './fixedAsset.model';
import { EquipmentModel } from '../Equipment/equipment.model';

export const fixedAssetController = {
  async getAllFixedAssets(req: Request, res: Response) {
    try {
      const fixedAssets = await FixedAssetModel.find()
        .populate('equipment', 'name description');
      
      res.json(fixedAssets);
    } catch (error) {
      res.status(500).json({
        error: 'Error al obtener los activos fijos',
        detalles: (error as Error).message
      });
    }
  },

  async getFixedAssetById(req: Request, res: Response) {
    try {
      const fixedAsset = await FixedAssetModel.findById(req.params.id)
        .populate('equipment', 'name description');
      
      if (!fixedAsset) {
        return res.status(404).json({
          mensaje: 'Activo fijo no encontrado'
        });
      }

      res.json(fixedAsset);
    } catch (error) {
      res.status(500).json({
        error: 'Error al obtener el activo fijo',
        detalles: (error as Error).message
      });
    }
  },

  async createFixedAsset(req: Request, res: Response) {
    try {
      const { equipmentId, ...fixedAssetData } = req.body;

      // Verificar que el equipo existe
      const equipment = await EquipmentModel.findById(equipmentId);
      if (!equipment) {
        return res.status(404).json({
          mensaje: 'Equipo no encontrado'
        });
      }

      const fixedAsset = new FixedAssetModel({
        ...fixedAssetData,
        equipment: equipmentId
      });

      await fixedAsset.save();

      const populatedFixedAsset = await FixedAssetModel.findById(fixedAsset._id)
        .populate('equipment', 'name description');

      res.status(201).json({
        mensaje: 'Activo fijo creado exitosamente',
        activoFijo: populatedFixedAsset
      });
    } catch (error) {
      res.status(400).json({
        error: 'Error al crear el activo fijo',
        detalles: (error as Error).message
      });
    }
  },

  async updateFixedAsset(req: Request, res: Response) {
    try {
      const fixedAsset = await FixedAssetModel.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      ).populate('equipment', 'name description');

      if (!fixedAsset) {
        return res.status(404).json({
          mensaje: 'Activo fijo no encontrado'
        });
      }

      res.json({
        mensaje: 'Activo fijo actualizado exitosamente',
        activoFijo: fixedAsset
      });
    } catch (error) {
      res.status(400).json({
        error: 'Error al actualizar el activo fijo',
        detalles: (error as Error).message
      });
    }
  },

  async deleteFixedAsset(req: Request, res: Response) {
    try {
      const fixedAsset = await FixedAssetModel.findByIdAndDelete(req.params.id);

      if (!fixedAsset) {
        return res.status(404).json({
          mensaje: 'Activo fijo no encontrado'
        });
      }

      res.json({
        mensaje: 'Activo fijo eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error al eliminar el activo fijo',
        detalles: (error as Error).message
      });
    }
  },

  async getFixedAssetsByEquipment(req: Request, res: Response) {
    try {
      const { equipmentId } = req.params;

      const fixedAssets = await FixedAssetModel.find({ equipment: equipmentId })
        .populate('equipment', 'name description');

      res.json(fixedAssets);
    } catch (error) {
      res.status(500).json({
        error: 'Error al obtener los activos fijos del equipo',
        detalles: (error as Error).message
      });
    }
  }
}; 