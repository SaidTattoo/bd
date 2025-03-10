import { Router } from 'express';
import { areaController } from './area.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Area
 *   description: API para gestionar áreas
 * /areas:  
 *   post:
 *     summary: Crear una nueva área
 *     tags: [Area]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - equipment        
 *     responses:
 *       201:
 *         description: Área creada exitosamente
 *       400:
 *         description: Error al crear la área
 */

/**
 * @swagger
 * /areas/{id}:
 *   delete: 
 *     summary: Eliminar una área
 *     tags: [Area]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la actividad
 *     responses:
 *       200:
 *         description: Actividad eliminada exitosamente
 *       404:
 *         description: Actividad no encontrada
 */

router.delete('/:id', areaController.deleteArea);

router.post('/', areaController.createArea);
router.get('/', areaController.getAllAreas);
router.post('/:areaId/equipments', areaController.addEquipmentToArea);

export default router;