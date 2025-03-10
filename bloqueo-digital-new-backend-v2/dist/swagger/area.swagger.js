"use strict";
/**
 * @swagger
 * /areas:
 *   post:
 *     summary: Crear un nuevo area
 *     tags: [Areas]
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
 *               createdBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: Area creado
 *       500:
 *         description: Error en el servidor
 * @swagger
 * /areas:
 *   get:
 *     summary: Obtener todas las areas
 *     tags: [Areas]
 *     responses:
 *       200:
 *         description: Areas obtenidas
 *       500:
 *         description: Error en el servidor
 * @swagger
 * /areas/{id}:
 *   get:
 *     summary: Obtener una area por ID
 *     tags: [Areas]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Area obtenida
 *       404:
 *         description: Area no encontrada
 *       500:
 *         description: Error en el servidor
 * @swagger
 * /areas/{id}:
 *   delete:
 *     summary: Eliminar una area por ID
 *     tags: [Areas]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Area eliminada
 *       404:
 *         description: Area no encontrada
 *       500:
 *         description: Error en el servidor
 * @swagger
 * /areas/{id}:
 *   put:
 *     summary: Actualizar una area por ID
 *     tags: [Areas]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
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
 *               createdBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Area actualizada
 *       404:
 *         description: Area no encontrada
 *       500:
 *         description: Error en el servidor
 * @swagger
 * /areas/historic:
 *   get:
 *     summary: Obtener todas las areas eliminadas
 *     tags: [Areas]
 *     responses:
 *       200:
 *         description: Areas eliminadas
 *       500:
 *         description: Error en el servidor
 */
