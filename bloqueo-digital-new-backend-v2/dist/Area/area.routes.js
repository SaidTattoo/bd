"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const area_controller_1 = require("./area.controller");
const router = (0, express_1.Router)();
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
router.post('/', area_controller_1.areaController.createArea);
router.get('/', area_controller_1.areaController.getAllAreas);
router.post('/:areaId/equipments', area_controller_1.areaController.addEquipmentToArea);
exports.default = router;
