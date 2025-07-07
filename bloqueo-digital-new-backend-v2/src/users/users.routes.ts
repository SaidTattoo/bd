import { Router } from 'express';
import { userController } from './users.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Fingerprint:
 *       type: object
 *       required:
 *         - position
 *         - template
 *         - quality
 *       properties:
 *         position:
 *           type: string
 *           enum: [rightThumb, rightIndex, rightMiddle, rightRing, rightLittle, leftThumb, leftIndex, leftMiddle, leftRing, leftLittle]
 *           description: Posición del dedo
 *         template:
 *           type: string
 *           description: Template de la huella digital en formato base64
 *         quality:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Calidad de la captura de la huella (0-100)
 *         capturedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de captura
 *     
 *     Usuario:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - rut
 *         - empresa
 *         - disciplina
 *         - perfil
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único del usuario
 *         nombre:
 *           type: string
 *           description: Nombre completo del usuario
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico
 *         telefono:
 *           type: string
 *           description: Número de teléfono
 *         rut:
 *           type: string
 *           description: RUT chileno
 *         empresa:
 *           type: string
 *           description: Empresa a la que pertenece
 *         disciplina:
 *           type: string
 *           description: Disciplina o área de trabajo
 *         perfil:
 *           type: string
 *           enum: [trabajador, supervisor, duenoDeEnergia]
 *           description: Rol del usuario
 *         fingerprints:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Fingerprint'
 *           description: Huellas digitales registradas
 *         fingerprintsComplete:
 *           type: boolean
 *           description: Indica si se han registrado todas las huellas
 *         isActive:
 *           type: boolean
 *           description: Estado del usuario
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
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios recuperada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 */
router.get('/', userController.getAllUsers);
router.get('/energy-owners', userController.getEnergyOwners);

/**
 * @swagger
 * /users/profile/{profile}:
 *   get:
 *     summary: Obtener usuarios por perfil
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: profile
 *         required: true
 *         schema:
 *           type: string
 *           enum: [trabajador, supervisor, duenoDeEnergia]
 *         description: Perfil de usuario a filtrar
 *     responses:
 *       200:
 *         description: Lista de usuarios con el perfil especificado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Perfil no válido
 *       404:
 *         description: No se encontraron usuarios con el perfil especificado
 */
router.get('/profile/:profile', userController.getUsersByProfile);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 */
router.get('/:id', userController.getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 usuario:
 *                   $ref: '#/components/schemas/Usuario'
 */
router.post('/', userController.createUser);

/**
 * @swagger
 * /users/{id}/fingerprints:
 *   post:
 *     summary: Agregar una huella digital
 *     tags: [Usuarios]
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
 *             $ref: '#/components/schemas/Fingerprint'
 *     responses:
 *       200:
 *         description: Huella digital agregada exitosamente
 */
router.post('/:id/fingerprints', userController.addFingerprint);

/**
 * @swagger
 * /users/{id}/fingerprints/validate:
 *   post:
 *     summary: Validar una huella digital
 *     tags: [Usuarios]
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
 *             type: object
 *             required:
 *               - position
 *               - template
 *             properties:
 *               position:
 *                 type: string
 *                 enum: [rightThumb, rightIndex, rightMiddle, rightRing, rightLittle, leftThumb, leftIndex, leftMiddle, leftRing, leftLittle]
 *               template:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado de la validación
 */
router.post('/:id/fingerprints/validate', userController.validateFingerprint);

router.get('/fingerprints/find', userController.findUserByFingerPrint);

router.post('/login', userController.loginByEmailandPassword);


export default router;