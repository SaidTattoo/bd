import { Router } from 'express';
import { equipmentController } from './equipment.controller';

const router = Router();



/**
 * @swagger
 * /equipment:
 *   get:
 *     summary: Obtener todos los equipos
 *     tags: [Equipos]
 *     responses:
 *       200:
 *         description: Lista de equipos recuperada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Equipment'
 */
router.get('/', equipmentController.getAllEquipment);

/**
 * @swagger
 * /equipment/{id}:
 *   get:
 *     summary: Obtener un equipo por ID
 *     tags: [Equipos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Equipo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Equipment'
 */
router.get('/:id', equipmentController.getEquipmentById);

/**
 * esquema de equipo para swagger
 * 
 *  @swagger
 *  components:
 *    schemas:
 *      Equipment:
 *        type: object  
 * 
 */

/**
 * @swagger
 * /equipment:
 *   post:
 *     summary: Crear un nuevo equipo
 *     tags: [Equipos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:    
 *           schema:
 *             $ref: '#/components/schemas/Equipment'
 *     responses:
 *       201:
 *         description: Equipo creado exitosamente
 */
router.post('/', equipmentController.createEquipment);

/**
 * @swagger
 * /equipment/{id}:
 *   put:
 *     summary: Actualizar un equipo
 *     tags: [Equipos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Equipment'
 *     responses:
 *       200:
 *         description: Equipo actualizado exitosamente
 */
router.put('/:id', equipmentController.updateEquipment);

/**
 * @swagger
 * /equipment/{id}:
 *   delete:
 *     summary: Eliminar un equipo
 *     tags: [Equipos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Equipo eliminado exitosamente
 */
router.delete('/:id', equipmentController.deleteEquipment);

export default router;