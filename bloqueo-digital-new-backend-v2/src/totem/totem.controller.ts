import { EquipmentModel } from "../Equipment/equipment.model";
import totem, { ICasillero } from "./totem.model";
import { Request, Response } from 'express';
import mongoose from 'mongoose';

/**
 * @swagger
 * /totem/{id}:
 *   get:
 *     summary: Obtener casilleros por ID de totem
 *     tags: [Totem]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Casilleros del totem
 *       404:
 *         description: Totem no encontrado
 */
export const getCasilleros = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: 'ID de tótem inválido' });
    }

    const totemFound = await totem.findById(id);
    if (!totemFound) {
      return res.status(404).json({ mensaje: 'Tótem no encontrado' });
    }

    res.status(200).json(totemFound.casilleros);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

/**
 * @swagger
 * /totem:
 *   post:
 *     summary: Crear un nuevo totem
 *     tags: [Totem]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               casilleros:
 *                 type: array
 *                 items:
 *                   type: object   
 *     responses:
 *       201:
 *         description: Totem creado
 *       400:
 *         description: Error en la solicitud
 */
export const createTotem = async (req: Request, res: Response) => {
  try {
    const newTotem = new totem(req.body);
    const savedTotem = await newTotem.save();
    res.status(201).json(savedTotem);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

//al cassillero se le pueden asignar equipos, si se le asignan equipos el casillero se marca como ocupado

/**
 * Abre un casillero específico de un tótem
 * @param req Solicitud HTTP con IDs de tótem y casillero
 * @param res Respuesta HTTP con confirmación
 * @returns Confirmación de apertura o error si falla
 */
export const openCasillero = async (req: Request, res: Response) => {
  try {
    const { id, casilleroId } = req.params;
    
    const totemFound = await totem.findById(id);
    if (!totemFound) {
      return res.status(404).json({ mensaje: 'Tótem no encontrado' });
    }
    
    const casillero = totemFound.casilleros.find(c => c._id.toString() === casilleroId);
    if (!casillero) {
      return res.status(404).json({ mensaje: 'Casillero no encontrado' });
    }
    
    // Actualizar estado a 'abierto'
    casillero.status = 'abierto';
    await totemFound.save();
    
    res.json({ mensaje: 'Casillero abierto exitosamente', casillero });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};


export const openAllLockers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const totemFound = await totem.findById(id);
    if (!totemFound) {
      return res.status(404).json({ mensaje: 'Tótem no encontrado' });
    }
    totemFound.casilleros.forEach(casillero => {
      casillero.status = 'abierto';
    });
    await totemFound.save();
    res.json({ mensaje: 'Todos los casilleros han sido abiertos exitosamente', casilleros: totemFound.casilleros });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
export const getCasilleroById = async (req: Request, res: Response) => {
  try {
    const { id, casilleroId } = req.params;
    const totemFound = await totem.findById(id);
    if (!totemFound) return res.status(404).json({ mensaje: 'Tótem no encontrado' });
    
    const casillero = totemFound.casilleros.find(c => c._id.toString() === casilleroId);
    if (!casillero) return res.status(404).json({ mensaje: 'Casillero no encontrado' });
    
    res.status(200).json(casillero);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
/**
 * Asigna equipos a un casillero específico
 * @param req Solicitud HTTP con IDs y datos de equipos
 * @param res Respuesta HTTP con el casillero actualizado
 * @returns Casillero con equipos asignados o error
 */
export const assignEquipmentToCasillero = async (req: Request, res: Response) => {
  try {
    const { id, casilleroId } = req.params;
    const { activityId, equipments } = req.body;
    
    // Verificar IDs válidos
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(casilleroId)) {
      return res.status(400).json({ mensaje: 'ID de tótem o casillero inválido' });
    }
    
    // Buscar el tótem y el casillero
    const totemFound = await totem.findById(id);
    if (!totemFound) {
      return res.status(404).json({ mensaje: 'Tótem no encontrado' });
    }
    
    const casillero = totemFound.casilleros.find(c => c._id.toString() === casilleroId);
    if (!casillero) {
      return res.status(404).json({ mensaje: 'Casillero no encontrado' });
    }
    
    // Asignar equipos al casillero
    casillero.equipos = equipments;
    casillero.activityId = activityId;
    casillero.status = 'ocupado';
    
    await totemFound.save();
    
    res.json({
      mensaje: 'Equipos asignados al casillero exitosamente',
      casillero
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

/**
 * Crea un nuevo casillero en un tótem existente
 * @param req Solicitud HTTP con ID del tótem y datos del casillero
 * @param res Respuesta HTTP con el casillero creado
 * @returns Casillero creado o error si falla
 */
export const createCasillero = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const casilleroData = req.body;
    
    const totemFound = await totem.findById(id);
    if (!totemFound) {
      return res.status(404).json({ mensaje: 'Tótem no encontrado' });
    }
    
    totemFound.casilleros.push(casilleroData);
    await totemFound.save();
    
    // Obtener el casillero recién creado
    const nuevoCasillero = totemFound.casilleros[totemFound.casilleros.length - 1];
    
    res.status(201).json({
      mensaje: 'Casillero creado exitosamente',
      casillero: nuevoCasillero
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

/**
 * Elimina equipos de un casillero específico
 * @param req Solicitud HTTP con IDs de tótem y casillero
 * @param res Respuesta HTTP con confirmación
 * @returns Casillero actualizado o error si falla
 */
export const removeEquipmentFromCasillero = async (req: Request, res: Response) => {
  try {
    const { id, casilleroId } = req.params;
    
    const totemFound = await totem.findById(id);
    if (!totemFound) {
      return res.status(404).json({ mensaje: 'Tótem no encontrado' });
    }
    
    const casillero = totemFound.casilleros.find(c => c._id.toString() === casilleroId);
    if (!casillero) {
      return res.status(404).json({ mensaje: 'Casillero no encontrado' });
    }
    
    // Limpiar el casillero
    casillero.equipos = [];
    casillero.activityId = undefined;
    casillero.status = 'disponible';
    
    await totemFound.save();
    
    res.json({
      mensaje: 'Equipos removidos del casillero exitosamente',
      casillero
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

/**
 * Limpia todos los casilleros de un tótem
 * @param req Solicitud HTTP con ID del tótem
 * @param res Respuesta HTTP con confirmación
 * @returns Confirmación de limpieza o error
 */
export const clearAllCasilleros = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const totemFound = await totem.findById(id);
    if (!totemFound) {
      return res.status(404).json({ mensaje: 'Tótem no encontrado' });
    }
    
    // Resetear todos los casilleros
    totemFound.casilleros.forEach(casillero => {
      casillero.equipos = [];
      casillero.activityId = undefined;
      casillero.status = 'disponible';
    });
    
    await totemFound.save();
    
    res.json({
      mensaje: 'Todos los casilleros han sido limpiados exitosamente',
      casilleros: totemFound.casilleros
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

/**
 * Actualiza el estado de un casillero
 * @param req Solicitud HTTP con IDs y nuevo estado
 * @param res Respuesta HTTP con el casillero actualizado
 * @returns Casillero con estado actualizado o error
 */
export const updateLockerStatus = async (req: Request, res: Response) => {
  try {
    const { id, casilleroId } = req.params;
    const { status } = req.body;
    
    const totemFound = await totem.findById(id);
    if (!totemFound) {
      return res.status(404).json({ mensaje: 'Tótem no encontrado' });
    }
    
    const casillero = totemFound.casilleros.find(c => c._id.toString() === casilleroId);
    if (!casillero) {
      return res.status(404).json({ mensaje: 'Casillero no encontrado' });
    }
    
    // Actualizar estado
    casillero.status = status;
    await totemFound.save();
    
    res.status(200).json({
      mensaje: 'Estado del casillero actualizado exitosamente',
      casillero
    });
  } catch (error) {
    console.error('Error al actualizar el estado del casillero:', error);
    res.status(500).json({
      mensaje: 'Error al actualizar el estado del casillero',
      detalles: (error as Error).message
    });
  }
};

/**
 * Obtiene todos los tótems registrados en el sistema
 * @param req Solicitud HTTP
 * @param res Respuesta HTTP con lista de tótems
 * @returns Lista de tótems o error si falla la consulta
 */
export const getAllTotems = async (req: Request, res: Response) => {
  try {
    const totems = await totem.find();
    res.status(200).json(totems);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
