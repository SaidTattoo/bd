"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_controller_1 = require("./activity.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * components:
 *   schemas:
 *     Activity:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - blockType
 *       properties:
 *         activityId:
 *           type: number
 *           description: ID único de la actividad
 *         name:
 *           type: string
 *           description: Nombre de la actividad
 *         description:
 *           type: string
 *           description: Descripción de la actividad
 *         isBlocked:
 *           type: boolean
 *           description: Estado de bloqueo de la actividad
 *         blockType:
 *           type: string
 *           description: Tipo de bloqueo
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         energyOwners:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: ID del usuario dueño de energía
 *               isBlocked:
 *                 type: boolean
 *               supervisors:
 *                 type: array
 *                 items:
 *                   type: object
 *         equipments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 */
/**
 * @swagger
 * /activities:
 *   get:
 *     summary: Obtener todas las actividades
 *     tags: [Actividades]
 *     responses:
 *       200:
 *         description: Lista de actividades recuperada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *       404:
 *         description: No se encontraron actividades
 *       500:
 *         description: Error del servidor
 */
router.get('/', activity_controller_1.activityController.getAllActivities);
/**
 * @swagger
 * /activities/{id}:
 *   get:
 *     summary: Obtener una actividad por ID
 *     tags: [Actividades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la actividad
 *     responses:
 *       200:
 *         description: Actividad encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       404:
 *         description: Actividad no encontrada
 */
router.get('/:id', activity_controller_1.activityController.getActivityById);
/**
 * @swagger
 * /activities:
 *   post:
 *     summary: Crear una nueva actividad
 *     tags: [Actividades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Activity'
 *     responses:
 *       201:
 *         description: Actividad creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       400:
 *         description: Datos inválidos
 */
router.post('/', activity_controller_1.activityController.createActivity);
/**
 * @swagger
 * /activities/{id}/equipment:
 *   post:
 *     summary: Agregar equipo a una actividad
 *     tags: [Actividades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la actividad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del equipo
 *               type:
 *                 type: string
 *                 description: Tipo de equipo
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Estado del equipo
 *     responses:
 *       201:
 *         description: Equipo agregado exitosamente
 *       404:
 *         description: Actividad no encontrada
 */
/* router.post('/:id/equipment', activityController.addEquipment);
 */ /**
* @swagger
* /activities/{activityId}/equipment/{equipmentId}:
*   delete:
*     summary: Eliminar equipo de una actividad
*     tags: [Actividades]
*     parameters:
*       - in: path
*         name: activityId
*         required: true
*         schema:
*           type: string
*         description: ID de la actividad
*       - in: path
*         name: equipmentId
*         required: true
*         schema:
*           type: string
*         description: ID del equipo
*     responses:
*       200:
*         description: Equipo eliminado exitosamente
*       404:
*         description: Actividad o equipo no encontrado
*/
/* router.delete('/:activityId/equipment/:equipmentId', activityController.removeEquipment);
 */ /**
* @swagger
* /activities/{activityId}/energy-owners:
*   post:
*     summary: Agregar un dueño de energía a una actividad
*     tags: [Actividades]
*     parameters:
*       - in: path
*         name: activityId
*         required: true
*         schema:
*           type: string
*         description: ID de la actividad
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - userId
*             properties:
*               userId:
*                 type: string
*                 description: ID del usuario dueño de energía
*     responses:
*       200:
*         description: Dueño de energía agregado exitosamente
*       400:
*         description: El usuario debe tener perfil de Dueño de Energía
*       404:
*         description: Actividad o usuario no encontrado
*/
/* router.post('/:activityId/energy-owners', activityController.addEnergyOwner);
 */ /**
* @swagger
* /activities/{activityId}/validate-energy:
*   post:
*     summary: Validar energía cero de una actividad
*     tags: [Actividades]
*     parameters:
*       - in: path
*         name: activityId
*         required: true
*         schema:
*           type: string
*         description: ID de la actividad
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - validatorName
*               - instrumentUsed
*               - energyValue
*             properties:
*               validatorName:
*                 type: string
*                 description: Nombre del validador
*               instrumentUsed:
*                 type: string
*                 description: Instrumento utilizado para la medición
*               energyValue:
*                 type: string
*                 description: Valor de la energía medida
*     responses:
*       200:
*         description: Validación de energía actualizada exitosamente
*       404:
*         description: Actividad no encontrada
*/
router.post('/:activityId/validate-energy', activity_controller_1.activityController.validateZeroEnergy);
/**
 * swagger
 * /activities/{activityId}/assign-supervisor:
 *   post:
 *     summary: Asignar supervisor a un dueño de energía específico en una actividad
 *     tags: [Actividades]
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la actividad
 *         example: "6728f8ebba2c2b69b6c7cfce"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - energyOwnerId
 *               - supervisorId
 *             properties:
 *               energyOwnerId:
 *                 type: string
 *                 description: ID del dueño de energía
 *               supervisorId:
 *                 type: string
 *                 description: ID del supervisor a asignar
 *           example:
 *             energyOwnerId: "6728f3fbf73a8a6d2e887e96"
 *             supervisorId: "6728f406f73a8a6d2e887e98"
 *     responses:
 *       200:
 *         description: Supervisor asignado exitosamente
 *       400:
 *         description: Error de validación o usuario no es supervisor
 *       404:
 *         description: Actividad, dueño de energía o supervisor no encontrado
 */
/* router.post('/:activityId/assign-supervisor', activityController.assignSupervisor);
 */ /**
* @swagger
* /activities/{activityId}/assign-worker:
*   post:
*     summary: Asignar trabajador a un supervisor específico en una actividad
*     tags: [Actividades]
*     parameters:
*       - in: path
*         name: activityId
*         required: true
*         schema:
*           type: string
*         description: ID de la actividad
*         example: "6728f8ebba2c2b69b6c7cfce"
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - energyOwnerId
*               - supervisorId
*               - workerId
*             properties:
*               energyOwnerId:
*                 type: string
*                 description: ID del dueño de energía
*               supervisorId:
*                 type: string
*                 description: ID del supervisor
*               workerId:
*                 type: string
*                 description: ID del trabajador a asignar
*           example:
*             energyOwnerId: "6728f3fbf73a8a6d2e887e96"
*             supervisorId: "6728f406f73a8a6d2e887e98"
*             workerId: "6728f3d4f73a8a6d2e887e94"
*     responses:
*       200:
*         description: Trabajador asignado exitosamente
*       400:
*         description: Error de validación o usuario no es trabajador
*       404:
*         description: Actividad, supervisor o trabajador no encontrado
*/
/* router.post('/:activityId/assign-worker', activityController.assignWorker); */
/**
 * @swagger
 * /activities/{activityId}/equipments:
 *   post:
 *     summary: Agregar equipo a una actividad
 *     tags: [Actividades]
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - equipmentId
 *             properties:
 *               equipmentId:
 *                 type: string
 *                 description: ID del equipo a agregar
 *     responses:
 *       200:
 *         description: Equipo agregado exitosamente
 *       404:
 *         description: Actividad o equipo no encontrado
 */
router.post('/:activityId/equipments', activity_controller_1.activityController.addEquipmentToActivity);
/**
 *
 * @swagger
 * /activities/{activityId}:
 *   delete:
 *     summary: Eliminar una actividad
 *     tags: [Actividades]
 *     parameters:
 *       - in: path
 *         name: activityId
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
router.delete('/:id', activity_controller_1.activityController.deleteActivity);
/**
 * @swagger
 * /activities/{activityId}/energy-owners:
 *   post:
 *     summary: Agregar un dueño de energía a una actividad
 *     tags: [Actividades]
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la actividad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario dueño de energía
 *     responses:
 *       200:
 *         description: Dueño de energía agregado exitosamente
 *       400:
 *         description: El usuario debe tener perfil de Dueño de Energía
 *       404:
 *         description: Actividad o usuario no encontrado
 */
router.post('/:activityId/energy-owners', activity_controller_1.activityController.addEnergyOwnerToActivity);
/**
 * @swagger
 * /activities/{activityId}/assign-supervisor:
 *   post:
 *     summary: Asignar supervisor a un dueño de energía específico en una actividad
 *     tags: [Actividades]
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la actividad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - energyOwnerId
 *               - supervisorId
 *             properties:
 *               energyOwnerId:
 *                 type: string
 *                 description: ID del dueño de energía
 *               supervisorId:
 *                 type: string
 *                 description: ID del supervisor a asignar
 *     responses:
 *       200:
 *         description: Supervisor asignado exitosamente
 *       400:
 *         description: Error de validación o usuario no es supervisor
 *       404:
 *         description: Actividad, dueño de energía o supervisor no encontrado
 */
router.post('/:activityId/', activity_controller_1.activityController.assignSupervisor);
/**
 * @swagger
 * /activities/{activityId}/assign-worker:
 *   post:
 *     summary: Asignar trabajador a un supervisor específico en una actividad
 *     tags: [Actividades]
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la actividad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - energyOwnerId
 *               - supervisorId
 *               - workerId
 *             properties:
 *               energyOwnerId:
 *                 type: string
 *                 description: ID del dueño de energía
 *               supervisorId:
 *                 type: string
 *                 description: ID del supervisor
 *               workerId:
 *                 type: string
 *                 description: ID del trabajador a asignar
 *     responses:
 *       200:
 *         description: Trabajador asignado exitosamente
 *       400:
 *         description: Error de validación o usuario no es trabajador
 *       404:
 *         description: Actividad, supervisor o trabajador no encontrado
 */
router.post('/:activityId/assign-worker', activity_controller_1.activityController.assignWorker);
router.post('/:activityId/remove-energy-owner', activity_controller_1.activityController.removeZeroEnergyValidation);
router.get('/:activityId/pending-new-energy-owner', activity_controller_1.activityController.pendingNewEnergyOwner);
exports.default = router;
