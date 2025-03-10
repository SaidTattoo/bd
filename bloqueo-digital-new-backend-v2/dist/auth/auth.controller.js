"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_model_1 = require("../users/users.model");
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
exports.authController = {
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                // Validar que se proporcionen las credenciales
                if (!email || !password) {
                    return res.status(400).json({
                        mensaje: 'Email y contraseña son requeridos'
                    });
                }
                // Buscar usuario por email
                const usuario = yield users_model_1.Usuario.findOne({ email });
                if (!usuario) {
                    return res.status(401).json({
                        mensaje: 'Credenciales inválidas'
                    });
                }
                // Verificar que el usuario tenga contraseña
                if (!usuario.password) {
                    return res.status(401).json({
                        mensaje: 'Error en las credenciales del usuario'
                    });
                }
                // Verificar contraseña
                const isMatch = yield bcryptjs_1.default.compare(password, usuario.password);
                if (!isMatch) {
                    return res.status(401).json({
                        mensaje: 'Credenciales inválidas'
                    });
                }
                // Generar token JWT
                const token = jsonwebtoken_1.default.sign({
                    id: usuario._id,
                    email: usuario.email,
                    perfil: usuario.perfil
                }, process.env.JWT_SECRET || 'tu_jwt_secret', { expiresIn: '24h' });
                // Actualizar último login
                usuario.lastLogin = new Date();
                yield usuario.save();
                // Enviar respuesta
                res.json({
                    mensaje: 'Login exitoso',
                    usuario: {
                        id: usuario._id,
                        nombre: usuario.nombre,
                        email: usuario.email,
                        perfil: usuario.perfil,
                        empresa: usuario.empresa,
                        disciplina: usuario.disciplina,
                        fingerprintsComplete: usuario.fingerprintsComplete
                    },
                    token
                });
            }
            catch (error) {
                console.error('Error en login:', error);
                res.status(500).json({
                    mensaje: 'Error en el servidor',
                    error: error.message
                });
            }
        });
    },
    loginByFingerprint(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { template } = req.body;
            try {
                // Obtener todos los usuarios con huellas
                const users = yield users_model_1.Usuario.find({ 'fingerprints.template': { $exists: true, $ne: null } });
                for (const user of users) {
                    for (const userFingerprint of user.fingerprints) {
                        const body = new URLSearchParams();
                        body.append('Template1', template);
                        body.append('Template2', userFingerprint.template);
                        const response = yield axios_1.default.post('https://localhost:8443/SGIFPCompare', body.toString(), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                origin: 'http://localhost',
                            },
                            httpsAgent: new https_1.default.Agent({ rejectUnauthorized: false }) // Ignorar verificación del certificado
                        });
                        // Verificar si las huellas coinciden
                        if (response.data.match) {
                            return res.status(200).json({
                                message: 'Autenticación exitosa',
                                user: user.toJSON()
                            });
                        }
                    }
                }
                res.status(401).json({ message: 'No se encontró una huella coincidente' });
            }
            catch (error) {
                console.error('Error en la autenticación:', error);
                res.status(500).json({ message: 'Error en el servidor', detalles: error.message });
            }
        });
    },
    validateToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
                if (!token) {
                    return res.status(401).json({
                        mensaje: 'Token no proporcionado'
                    });
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret');
                const usuario = yield users_model_1.Usuario.findById(decoded.id).select('-password');
                if (!usuario) {
                    return res.status(401).json({
                        mensaje: 'Usuario no encontrado'
                    });
                }
                res.json({
                    mensaje: 'Token válido',
                    usuario: {
                        id: usuario._id,
                        nombre: usuario.nombre,
                        email: usuario.email,
                        perfil: usuario.perfil,
                        empresa: usuario.empresa,
                        disciplina: usuario.disciplina,
                        fingerprintsComplete: usuario.fingerprintsComplete
                    }
                });
            }
            catch (error) {
                res.status(401).json({
                    mensaje: 'Token inválido',
                    error: error.message
                });
            }
        });
    },
    changePassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { currentPassword, newPassword } = req.body;
                const userId = req.usuario.id; // Asumiendo que viene del middleware de auth
                const usuario = yield users_model_1.Usuario.findById(userId);
                if (!usuario || !usuario.password) {
                    return res.status(404).json({
                        mensaje: 'Usuario no encontrado'
                    });
                }
                // Verificar contraseña actual
                const isMatch = yield bcryptjs_1.default.compare(currentPassword, usuario.password);
                if (!isMatch) {
                    return res.status(401).json({
                        mensaje: 'Contraseña actual incorrecta'
                    });
                }
                // Actualizar contraseña
                usuario.password = yield bcryptjs_1.default.hash(newPassword, 10);
                yield usuario.save();
                res.json({
                    mensaje: 'Contraseña actualizada exitosamente'
                });
            }
            catch (error) {
                res.status(500).json({
                    mensaje: 'Error al cambiar la contraseña',
                    error: error.message
                });
            }
        });
    },
    /*  async captureFingerprint(req: Request, res: Response) {
       try {
         const body = new URLSearchParams();
         body.append('Timeout', '10000');
         body.append('Quality', '50');
         body.append('licstr', ''); // Reemplaza con el valor correcto
         body.append('templateFormat', 'ISO');
         body.append('imageWSQRate', '0.75');
     
         const response = await axios.post('http://your-fingerprint-sdk-url', body.toString(), {
           headers: {
             'Content-Type': 'application/x-www-form-urlencoded',
             origin: 'http://localhost',
           },
         });
     
         res.json(response.data);
       } catch (error) {
         res.status(500).json({ error: 'Error al capturar la huella dactilar', detalles: (error as Error).message });
       }
     }, */
    compareFingerprint(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { fingerprint1, fingerprint2 } = req.body;
                const body = new URLSearchParams();
                body.append('Template1', fingerprint1);
                body.append('Template2', fingerprint2);
                const response = yield axios_1.default.post('https://localhost:8443/SGIFPCompare', body.toString(), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        origin: 'http://localhost',
                    },
                });
                res.json(response.data);
            }
            catch (error) {
                res.status(500).json({ error: 'Error al comparar las huellas dactilares', detalles: error.message });
            }
        });
    }
};
