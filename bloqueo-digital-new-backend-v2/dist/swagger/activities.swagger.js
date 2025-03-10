"use strict";
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isBlocked:
 *                 type: boolean
 *               blockType:
 *                 type: string
 *               energyOwners:
 *                 type: array
 *                 items:
 *                   type: object
 *               equipments:
 *                 type: array
 *                 items:
 *                   type: object
 *               zeroEnergyValidation:
 *                 type: object
 *                 properties:
 *                   validatorName:
 *                     type: string
 *                   instrumentUsed:
 *                     type: string
 *                   energyValue:
 *                     type: string
 *     responses:
 *       201:
 *         description: Actividad creada
 *       500:
 *         description: Error en el servidor
 *
 *   get:
 *     summary: Obtener todas las actividades
 *     tags: [Actividades]
 *     responses:
 *       200:
 *         description: Lista de actividades
 *
 * /activities/{id}:
 *   get:
 *     summary: Obtener una actividad por ID
 *     tags: [Actividades]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Actividad encontrada
 *       404:
 *         description: Actividad no encontrada
 *       500:
 *         description: Error en el servidor
 *
 * /activities/{activityId}/energyOwners/{energyOwnerId}:
 *   get:
 *     summary: Obtener un dueño de energía por ID dentro de una actividad
 *     tags: [Actividades]
 *     parameters:
 *       - name: activityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: energyOwnerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dueño de energía encontrado
 *       404:
 *         description: Dueño de energía no encontrado
 *       500:
 *         description: Error en el servidor
 *
 *   put:
 *     summary: Actualizar el estado de bloqueo de un EnergyOwner
 *     tags: [Gestión de Usuarios en Actividades]
 *     parameters:
 *       - name: activityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: energyOwnerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isBlocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado de bloqueo actualizado
 *       404:
 *         description: Actividad o dueño de energía no encontrado
 *       500:
 *         description: Error en el servidor
 *
 *   delete:
 *     summary: Quitar un EnergyOwner de una actividad
 *     tags: [Gestión de Usuarios en Actividades]
 *     parameters:
 *       - name: activityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: energyOwnerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: EnergyOwner eliminado
 *       404:
 *         description: EnergyOwner no encontrado o tiene supervisores asignados
 *       500:
 *         description: Error en el servidor
 *
 * /activities/{activityId}/updateIsBlockedStatus:
 *   put:
 *     summary: Actualizar el estado de bloqueo de una actividad
 *     tags: [Actividades]
 *     parameters:
 *       - name: activityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de bloqueo actualizado
 *       404:
 *         description: Actividad no encontrada
 *       500:
 *         description: Error en el servidor
 *
 * /activities/{activityId}/energyOwners/{energyOwnerId}/supervisors/{supervisorId}:
 *   post:
 *     summary: Asignar un Supervisor a un EnergyOwner
 *     tags: [Gestión de Usuarios en Actividades]
 *     parameters:
 *       - name: activityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: energyOwnerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: supervisorId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supervisor asignado
 *       404:
 *         description: EnergyOwner o Supervisor no encontrado
 *       500:
 *         description: Error en el servidor
 *
 *   delete:
 *     summary: Quitar un Supervisor de un EnergyOwner
 *     tags: [Gestión de Usuarios en Actividades]
 *     parameters:
 *       - name: activityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: energyOwnerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: supervisorId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supervisor eliminado
 *       404:
 *         description: EnergyOwner o Supervisor no encontrado
 *       500:
 *         description: Error en el servidor
 *
 * /activities/{activityId}/energyOwners/{energyOwnerId}/workers/{workerId}:
 *   post:
 *     summary: Asignar un Trabajador a un Supervisor
 *     tags: [Gestión de Usuarios en Actividades]
 *     parameters:
 *       - name: activityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: energyOwnerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: supervisorId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: workerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trabajador asignado
 *       404:
 *         description: EnergyOwner, Supervisor o Trabajador no encontrado
 *       500:
 *         description: Error en el servidor
 *
 *   delete:
 *     summary: Quitar un Trabajador de un Supervisor
 *     tags: [Gestión de Usuarios en Actividades]
 *     parameters:
 *       - name: activityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: energyOwnerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: supervisorId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: workerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trabajador eliminado
 *       404:
 *         description: EnergyOwner, Supervisor o Trabajador no encontrado
 *       500:
 *         description: Error en el servidor
 *
 * tags:
 *   - name: Gestión de Usuarios en Actividades
 *     description: Endpoints para agregar y eliminar usuarios de una actividad
 */
