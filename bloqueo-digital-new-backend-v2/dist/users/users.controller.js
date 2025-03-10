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
exports.userController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const users_model_1 = __importDefault(require("./users.model"));
exports.userController = {
    getAllUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield users_model_1.default.find().select('-password').lean();
                if (!users || users.length === 0) {
                    return res.status(404).json({
                        mensaje: 'No se encontraron usuarios'
                    });
                }
                res.json(users);
            }
            catch (error) {
                res.status(500).json({
                    error: 'Error al obtener usuarios',
                    detalles: error.message
                });
            }
        });
    },
    getEnergyOwners(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield users_model_1.default.find({ perfil: 'duenoDeEnergia' }).select('-password').lean();
                res.json(users);
            }
            catch (error) {
                res.status(500).json({
                    error: 'Error al obtener los energistas',
                    detalles: error.message
                });
            }
        });
    },
    getUserById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield users_model_1.default.findById(req.params.id).select('-password');
                if (!user) {
                    return res.status(404).json({
                        mensaje: 'Usuario no encontrado'
                    });
                }
                res.json(user);
            }
            catch (error) {
                res.status(500).json({
                    error: 'Error al obtener el usuario',
                    detalles: error.message
                });
            }
        });
    },
    createUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newUser = new users_model_1.default(req.body);
                yield newUser.save();
                const userResponse = newUser.toJSON();
                delete userResponse.password;
                console.log(userResponse);
                res.status(201).json({
                    mensaje: 'Usuario creado exitosamente',
                    usuario: userResponse
                });
            }
            catch (error) {
                res.status(400).json({
                    error: 'Error al crear el usuario',
                    detalles: error.message
                });
            }
        });
    },
    updateUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.body.password) {
                    req.body.password = yield bcryptjs_1.default.hash(req.body.password, 10);
                }
                const user = yield users_model_1.default.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }).select('-password');
                if (!user) {
                    return res.status(404).json({
                        mensaje: 'Usuario no encontrado'
                    });
                }
                res.json({
                    mensaje: 'Usuario actualizado exitosamente',
                    usuario: user
                });
            }
            catch (error) {
                res.status(400).json({
                    error: 'Error al actualizar el usuario',
                    detalles: error.message
                });
            }
        });
    },
    deleteUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield users_model_1.default.findByIdAndDelete(req.params.id);
                if (!user) {
                    return res.status(404).json({
                        mensaje: 'Usuario no encontrado'
                    });
                }
                res.json({
                    mensaje: 'Usuario eliminado exitosamente'
                });
            }
            catch (error) {
                res.status(500).json({
                    error: 'Error al eliminar el usuario',
                    detalles: error.message
                });
            }
        });
    },
    addFingerprint(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { position, template, quality } = req.body;
                const user = yield users_model_1.default.findById(req.params.id);
                if (!user) {
                    return res.status(404).json({
                        mensaje: 'Usuario no encontrado'
                    });
                }
                const newFingerprint = {
                    position,
                    template,
                    quality,
                    capturedAt: new Date()
                };
                // Verificar si ya existe una huella para esa posición
                const existingIndex = user.fingerprints.findIndex(f => f.position === position);
                if (existingIndex >= 0) {
                    user.fingerprints[existingIndex] = newFingerprint;
                }
                else {
                    user.fingerprints.push(newFingerprint);
                }
                user.fingerprintsComplete = user.fingerprints.length === 10;
                yield user.save();
                res.json({
                    mensaje: 'Huella digital agregada exitosamente',
                    usuario: user
                });
            }
            catch (error) {
                res.status(400).json({
                    error: 'Error al agregar la huella digital',
                    detalles: error.message
                });
            }
        });
    },
    findUserByFingerPrint(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { template } = req.query;
                const user = yield users_model_1.default.findOne({ 'fingerprints.template': template });
                res.json(user);
            }
            catch (error) {
                res.status(400).json({
                    error: 'Error al encontrar el usuario por huella digital',
                    detalles: error.message
                });
            }
        });
    },
    validateFingerprint(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { position, template } = req.body;
                const user = yield users_model_1.default.findById(req.params.id);
                if (!user) {
                    return res.status(404).json({
                        mensaje: 'Usuario no encontrado'
                    });
                }
                const isValid = yield user.validateFingerprint(position, template);
                res.json({
                    valido: isValid,
                    mensaje: isValid ? 'Huella digital válida' : 'Huella digital inválida'
                });
            }
            catch (error) {
                res.status(400).json({
                    error: 'Error al validar la huella digital',
                    detalles: error.message
                });
            }
        });
    },
    loginByEmailandPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            try {
                const user = yield users_model_1.default.findOne({ email });
                if (!user) {
                    return res.status(404).json({
                        mensaje: 'Usuario no encontrado'
                    });
                }
                const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
                if (!isPasswordValid) {
                    return res.status(401).json({
                        mensaje: 'Contraseña incorrecta'
                    });
                }
                res.json(user);
            }
            catch (error) {
                res.status(400).json({
                    error: 'Error al iniciar sesión',
                    detalles: error.message
                });
            }
        });
    }
};
