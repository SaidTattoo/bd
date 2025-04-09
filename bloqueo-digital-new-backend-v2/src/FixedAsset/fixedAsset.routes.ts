import { Router } from 'express';
import { fixedAssetController } from './fixedAsset.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FixedAsset:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - description
 *         - equipment
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del activo fijo
 *         code:
 *           type: string
 *           description: Código único del activo fijo
 *         description:
 *           type: string
 *           description: Descripción del activo fijo
 *         equipment:
 *           type: string
 *           format: objectId
 *           description: ID del equipo asociado
 *         status:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *           description: Estado del activo fijo
 */

/**
 * @swagger
 * /fixed-assets:
 *   get:
 *     summary: Obtener todos los activos fijos
 *     tags: [Activos Fijos]
 *     responses:
 *       200:
 *         description: Lista de activos fijos recuperada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FixedAsset'
 */
router.get('/', fixedAssetController.getAllFixedAssets);

/**
 * @swagger
 * /fixed-assets/{id}:
 *   get:
 *     summary: Obtener un activo fijo por ID
 *     tags: [Activos Fijos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activo fijo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FixedAsset'
 */
router.get('/:id', fixedAssetController.getFixedAssetById);

/**
 * @swagger
 * /fixed-assets:
 *   post:
 *     summary: Crear un nuevo activo fijo
 *     tags: [Activos Fijos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FixedAsset'
 *     responses:
 *       201:
 *         description: Activo fijo creado exitosamente
 */
router.post('/', fixedAssetController.createFixedAsset);

/**
 * @swagger
 * /fixed-assets/{id}:
 *   put:
 *     summary: Actualizar un activo fijo
 *     tags: [Activos Fijos]
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
 *             $ref: '#/components/schemas/FixedAsset'
 *     responses:
 *       200:
 *         description: Activo fijo actualizado exitosamente
 */
router.put('/:id', fixedAssetController.updateFixedAsset);

/**
 * @swagger
 * /fixed-assets/{id}:
 *   delete:
 *     summary: Eliminar un activo fijo
 *     tags: [Activos Fijos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activo fijo eliminado exitosamente
 */
router.delete('/:id', fixedAssetController.deleteFixedAsset);

/**
 * @swagger
 * /fixed-assets/equipment/{equipmentId}:
 *   get:
 *     summary: Obtener activos fijos por equipo
 *     tags: [Activos Fijos]
 *     parameters:
 *       - in: path
 *         name: equipmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de activos fijos del equipo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FixedAsset'
 */
router.get('/equipment/:equipmentId', fixedAssetController.getFixedAssetsByEquipment);

export default router; 