import { Router } from 'express';
import { activityController } from './activity.controller';

const router = Router();

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
router.get('/', activityController.getAllActivities);
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
router.get('/:id', activityController.getActivityById);

/**
 * @swagger
 * /activities/{id}/report:
 *   get:
 *     summary: Generar reporte de una actividad
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
 *         description: Reporte generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 blockType:
 *                   type: string
 *                 status:
 *                   type: string
 *                 energyOwners:
 *                   type: array
 *                   items:
 *                     type: object
 *                 equipments:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalEquipments:
 *                   type: number
 *                 totalEnergyOwners:
 *                   type: number
 *       404:
 *         description: Actividad no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/:id/report', activityController.generateReport);
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
router.post('/', activityController.createActivity);
/**
 * @swagger
 * /activities/{id}:
 *   put:
 *     summary: Editar una actividad        
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
 *               - description
 *               - equipment
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre de la actividad
 *               description:
 *                 type: string
 *                 description: Descripción de la actividad
 *               equipment:
 *                 type: array
 *                 items:
 *                   type: string   
 *                   description: ID del equipo
 *     responses:
 *       200:
 *         description: Actividad editada exitosamente
 *       404:
 *         description: Actividad no encontrada
 */
router.put('/:id', activityController.editActivity);
/**
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
router.delete('/:id', activityController.deleteActivity);

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
router.post('/:activityId/equipments', activityController.addEquipmentToActivity);
/**
 * @swagger
 * /activities/{activityId}/equipments:
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
router.delete('/:activityId/equipments/:equipmentId', activityController.removeEquipmentFromActivity);
/**
 * @swagger
 * /activities/{activityId}/reset-equipment:
 *   post:
 *     summary: Restablecer estado del equipo de una actividad
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
 *         description: Estado del equipo restablecido exitosamente
 *       404:
 *         description: Actividad no encontrada
 */
router.post('/:activityId/reset-equipment', activityController.resetEquipmentStatus);

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
router.post('/:activityId/energy-owners', activityController.addEnergyOwnerToActivity);
/**
 * @swagger
 * /activities/{activityId}/change-energy-owner:
 *   post:
 *     summary: Cambiar dueño de energía de una actividad
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
 *               - newUserId
 *             properties:
 *               newUserId:
 *                 type: string
 *                 description: ID del nuevo usuario dueño de energía
 *     responses:
 *       200:
 *         description: Dueño de energía cambiado exitosamente
 *       400:
 *         description: El usuario debe tener perfil de Dueño de Energía
 *       404:
 *         description: Actividad o usuario no encontrado
 */
router.post('/:activityId/change-energy-owner', activityController.changeEnergyOwner);
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
router.post('/:activityId/assign-supervisor', activityController.assignSupervisor);
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
router.post('/:activityId/assign-worker', activityController.assignWorker);
/**
 * @swagger
 * /activities/{activityId}/remove-energy-owner:
 *   post:
 *     summary: Remover validación de energía cero de una actividad
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
 *         description: Validación de energía cero removida exitosamente
 *       404:
 *         description: Actividad no encontrada
 */
router.post('/:activityId/remove-energy-owner', activityController.removeZeroEnergyValidation);
/**
 * @swagger
 * /activities/{activityId}/desbloquear:
 *   post:
 *     summary: Desbloquear una actividad
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
 *         description: Actividad desbloqueada exitosamente
 *       404:
 *         description: Actividad no encontrada
 */
router.post('/:activityId/desbloquear', activityController.desbloquearActividad);
/**
 * @swagger
 * /activities/{activityId}/desbloquear-supervisor:
 *   post:
 *     summary: Desbloquear supervisor de una actividad
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
 *         description: Supervisor desbloqueado exitosamente
 *       404:
 *         description: Actividad no encontrada
 */
router.post('/:activityId/desbloquear-supervisor', activityController.desbloquearSupervisor);
/**
 * @swagger
 * /activities/{activityId}/desbloquear-trabajador:
 *   post:
 *     summary: Desbloquear trabajador de una actividad
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
 *         description: Trabajador desbloqueado exitosamente
 *       404:
 *         description: Actividad no encontrada
 */
router.post('/:activityId/desbloquear-trabajador', activityController.desbloquearTrabajador);
/**
 * @swagger
 * /activities/{activityId}/clear-locker:
 *   post:
 *     summary: Limpiar casillero de una actividad
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
 *         description: Casillero limpiado exitosamente
 *       404:
 *         description: Actividad no encontrada
 */
router.post('/:activityId/clear-locker', activityController.clearLocker);
/**
 * @swagger
 * /activities/{activityId}/pending-new-energy-owner:
 *   get:
 *     summary: Obtener dueños de energía pendientes para una actividad
 *     tags: [Actividades]
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la actividad
 *       - in: query
 *         name: selectedOwner
 *         schema:
 *           type: string
 *         description: ID del dueño de energía seleccionado
 *     responses:
 *       200:
 *         description: Lista de dueños de energía pendientes recuperada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Activity'
 *       404:
 *         description: Actividad no encontrada
 */
router.get('/:activityId/pending-new-energy-owner/:selectedOwner', activityController.pendingNewEnergyOwner);
/**
 * @swagger
 * /activities/{activityId}/send-email:
 *   post:
 *     summary: Enviar email con detalles de la actividad
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
 *               - to
 *               - subject
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *                 description: Email del destinatario
 *               subject:
 *                 type: string
 *                 description: Asunto del email
 *               message:
 *                 type: string
 *                 description: Mensaje adicional para incluir en el email
 *     responses:
 *       200:
 *         description: Email enviado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Actividad no encontrada
 *       500:
 *         description: Error al enviar el email
 */
/* router.post('/:activityId/send-email', activityController.sendActivityEmail); */
/**
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
 *     responses:
 *       200:
 *         description: Validación de energía cero realizada exitosamente
 *       404:
 *         description: Actividad no encontrada
 */
router.post('/:activityId/validate-energy', activityController.validateZeroEnergy);
/**
 * @swagger
 * /activities/{activityId}/desbloquear-dueno-energia:
 *   post:
 *     summary: Desbloquear a un dueño de energía
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
 *         description: Dueño de energía desbloqueado exitosamente
 *       404:
 *         description: Actividad no encontrada
 */
router.post('/:activityId/desbloquear-dueno-energia', activityController.desbloquearDuenoEnergia);
/**
 * @swagger
 * /activities/{activityId}/assign-locker:
 *   post:
 *     summary: Asignar un casillero a una actividad
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
 *               - lockerId
 *               - totemId
 *             properties:
 *               lockerId:
 *                 type: string
 *                 description: ID del casillero a asignar
 *               totemId:
 *                 type: string
 *                 description: ID del tótem al que pertenece el casillero
 *     responses:
 *       200:
 *         description: Casillero asignado exitosamente
 *       400:
 *         description: Datos inválidos o casillero ya asignado
 *       404:
 *         description: Actividad no encontrada
 *       500:
 *         description: Error del servidor
 */
router.post('/:activityId/assign-locker', activityController.assignLockerToActivity);

/**
 * @swagger
 * /activities/{activityId}/unassign-locker/{lockerId}:
 *   delete:
 *     summary: Desasignar un casillero de una actividad
 *     tags: [Actividades]
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la actividad
 *       - in: path
 *         name: lockerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del casillero a desasignar
 *     responses:
 *       200:
 *         description: Casillero desasignado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 activity:
 *                   $ref: '#/components/schemas/Activity'
 *       404:
 *         description: Actividad o casillero no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:activityId/unassign-locker/:lockerId', activityController.unassignLockerFromActivity);

/**
 * @swagger
 * /activities/{activityId}/assign-energy-owner:
 *   post:
 *     summary: Asignar un dueño de energía a una actividad y bloquearla
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
 *         description: Dueño de energía asignado y actividad bloqueada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 activity:
 *                   $ref: '#/components/schemas/Activity'
 *                 energyOwners:
 *                   type: array
 *                   items:
 *                     type: object
 *                 isBlocked:
 *                   type: boolean
 *       400:
 *         description: Datos inválidos o actividad ya bloqueada
 *       403:
 *         description: Usuario no es dueño de energía
 *       404:
 *         description: Actividad o usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:activityId/assign-energy-owner', activityController.assignEnergyOwner);

/**
 * @swagger
 * /activities/clean-all:
 *   post:
 *     summary: Limpiar todas las actividades dejándolas con estructura básica
 *     tags: [Actividades]
 *     responses:
 *       200:
 *         description: Actividades limpiadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     matched:
 *                       type: number
 *                     modified:
 *                       type: number
 *       500:
 *         description: Error del servidor
 */
router.post('/clean-all', activityController.cleanAllActivities);

/**
 * @swagger
 * /activities/{id}/clean:
 *   post:
 *     summary: Limpiar una actividad específica dejándola con estructura básica
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
 *         description: Actividad limpiada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       404:
 *         description: Actividad no encontrada
 *       500:
 *         description: Error del servidor
 */
router.post('/:id/clean', activityController.cleanActivity);

export default router;
