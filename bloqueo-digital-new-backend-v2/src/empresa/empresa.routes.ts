import { Router } from 'express';
import {
  createEmpresa,
  getAllEmpresas,
  getEmpresaById,
  getEmpresaByRut,
  updateEmpresa,
  deleteEmpresa,
  changeEmpresaStatus,
  getEmpresasBySector,
  getEmpresaStats,
  checkEmpresaExists,
  getEmpresaEmployeeCount,
  searchEmpresas
} from './empresa.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Empresa:
 *       type: object
 *       required:
 *         - nombre
 *         - rut
 *         - razonSocial
 *         - sector
 *         - direccion
 *         - contactoPrincipal
 *         - telefono
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           description: ID único de la empresa
 *         nombre:
 *           type: string
 *           description: Nombre de la empresa
 *         rut:
 *           type: string
 *           description: RUT de la empresa
 *         razonSocial:
 *           type: string
 *           description: Razón social de la empresa
 *         sector:
 *           type: string
 *           enum: [mineria, construccion, manufactura, servicios, tecnologia, energia, agricultura, salud, educacion, otro]
 *           description: Sector de la empresa
 *         descripcion:
 *           type: string
 *           description: Descripción de la empresa
 *         direccion:
 *           type: object
 *           properties:
 *             calle:
 *               type: string
 *             numero:
 *               type: string
 *             ciudad:
 *               type: string
 *             region:
 *               type: string
 *             codigoPostal:
 *               type: string
 *             pais:
 *               type: string
 *         contactoPrincipal:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *             cargo:
 *               type: string
 *             email:
 *               type: string
 *             telefono:
 *               type: string
 *         contactosAdicionales:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               cargo:
 *                 type: string
 *               email:
 *                 type: string
 *               telefono:
 *                 type: string
 *         telefono:
 *           type: string
 *           description: Teléfono principal de la empresa
 *         email:
 *           type: string
 *           description: Email principal de la empresa
 *         sitioWeb:
 *           type: string
 *           description: Sitio web de la empresa
 *         fechaFundacion:
 *           type: string
 *           format: date
 *           description: Fecha de fundación
 *         numeroEmpleados:
 *           type: number
 *           description: Número de empleados
 *         status:
 *           type: string
 *           enum: [activa, inactiva, suspendida]
 *           description: Estado de la empresa
 *         isActive:
 *           type: boolean
 *           description: Si la empresa está activa
 *         logo:
 *           type: string
 *           description: URL del logo de la empresa
 *         certificaciones:
 *           type: array
 *           items:
 *             type: string
 *           description: Certificaciones de la empresa
 *         observaciones:
 *           type: string
 *           description: Observaciones adicionales
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 */

/**
 * @swagger
 * /api/empresas:
 *   post:
 *     summary: Crear nueva empresa
 *     tags: [Empresas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Empresa'
 *     responses:
 *       201:
 *         description: Empresa creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Empresa'
 *       400:
 *         description: Error en los datos proporcionados
 */
router.post('/', createEmpresa);

/**
 * @swagger
 * /api/empresas:
 *   get:
 *     summary: Obtener todas las empresas con paginación y filtros
 *     tags: [Empresas]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: sector
 *         schema:
 *           type: string
 *           enum: [mineria, construccion, manufactura, servicios, tecnologia, energia, agricultura, salud, educacion, otro]
 *         description: Filtrar por sector
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [activa, inactiva, suspendida]
 *         description: Filtrar por estado
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [nombre, fechaCreacion, numeroEmpleados]
 *         description: Campo para ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Lista de empresas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     empresas:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Empresa'
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 */
router.get('/', getAllEmpresas);

/**
 * @swagger
 * /api/empresas/search:
 *   get:
 *     summary: Buscar empresas
 *     tags: [Empresas]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Búsqueda completada exitosamente
 *       400:
 *         description: Parámetro de búsqueda inválido
 */
router.get('/search', searchEmpresas);

/**
 * @swagger
 * /api/empresas/stats:
 *   get:
 *     summary: Obtener estadísticas de empresas
 *     tags: [Empresas]
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalEmpresas:
 *                       type: number
 *                     empresasActivas:
 *                       type: number
 *                     empresasInactivas:
 *                       type: number
 *                     empresasSuspendidas:
 *                       type: number
 *                     empresasPorSector:
 *                       type: object
 *                     totalEmpleados:
 *                       type: number
 */
router.get('/stats', getEmpresaStats);

/**
 * @swagger
 * /api/empresas/sector/{sector}:
 *   get:
 *     summary: Obtener empresas por sector
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: sector
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mineria, construccion, manufactura, servicios, tecnologia, energia, agricultura, salud, educacion, otro]
 *         description: Sector de la empresa
 *     responses:
 *       200:
 *         description: Empresas obtenidas exitosamente
 *       400:
 *         description: Sector inválido
 */
router.get('/sector/:sector', getEmpresasBySector);

/**
 * @swagger
 * /api/empresas/rut/{rut}:
 *   get:
 *     summary: Obtener empresa por RUT
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: rut
 *         required: true
 *         schema:
 *           type: string
 *         description: RUT de la empresa
 *     responses:
 *       200:
 *         description: Empresa obtenida exitosamente
 *       404:
 *         description: Empresa no encontrada
 */
router.get('/rut/:rut', getEmpresaByRut);

/**
 * @swagger
 * /api/empresas/{id}:
 *   get:
 *     summary: Obtener empresa por ID
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la empresa
 *     responses:
 *       200:
 *         description: Empresa obtenida exitosamente
 *       404:
 *         description: Empresa no encontrada
 */
router.get('/:id', getEmpresaById);

/**
 * @swagger
 * /api/empresas/{id}:
 *   put:
 *     summary: Actualizar empresa
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la empresa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Empresa'
 *     responses:
 *       200:
 *         description: Empresa actualizada exitosamente
 *       404:
 *         description: Empresa no encontrada
 *       400:
 *         description: Error en los datos proporcionados
 */
router.put('/:id', updateEmpresa);

/**
 * @swagger
 * /api/empresas/{id}:
 *   delete:
 *     summary: Eliminar empresa (soft delete)
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la empresa
 *     responses:
 *       200:
 *         description: Empresa eliminada exitosamente
 *       404:
 *         description: Empresa no encontrada
 */
router.delete('/:id', deleteEmpresa);

/**
 * @swagger
 * /api/empresas/{id}/status:
 *   patch:
 *     summary: Cambiar estado de empresa
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la empresa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [activa, inactiva, suspendida]
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       400:
 *         description: Estado inválido
 *       404:
 *         description: Empresa no encontrada
 */
router.patch('/:id/status', changeEmpresaStatus);

/**
 * @swagger
 * /api/empresas/{id}/exists:
 *   get:
 *     summary: Verificar si una empresa existe
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la empresa
 *     responses:
 *       200:
 *         description: Verificación completada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 */
router.get('/:id/exists', checkEmpresaExists);

/**
 * @swagger
 * /api/empresas/{id}/employees/count:
 *   get:
 *     summary: Obtener número de empleados de una empresa
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la empresa
 *     responses:
 *       200:
 *         description: Conteo obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *       404:
 *         description: Empresa no encontrada
 */
router.get('/:id/employees/count', getEmpresaEmployeeCount);

export default router; 