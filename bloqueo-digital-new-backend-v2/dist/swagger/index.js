"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Gestión de Actividades',
            version: '1.0.0',
            description: 'API para gestionar actividades, equipos y usuarios'
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Servidor de desarrollo'
            }
        ],
        components: {
            schemas: {
                Fingerprint: {
                    type: 'object',
                    required: ['position', 'template', 'quality'],
                    properties: {
                        position: {
                            type: 'string',
                            enum: [
                                'rightThumb', 'rightIndex', 'rightMiddle', 'rightRing', 'rightLittle',
                                'leftThumb', 'leftIndex', 'leftMiddle', 'leftRing', 'leftLittle'
                            ],
                            description: 'Posición del dedo'
                        },
                        template: {
                            type: 'string',
                            description: 'Template de la huella digital en formato base64'
                        },
                        quality: {
                            type: 'number',
                            minimum: 0,
                            maximum: 100,
                            description: 'Calidad de la captura de la huella (0-100)'
                        },
                        capturedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Fecha y hora de captura'
                        }
                    }
                },
                Usuario: {
                    type: 'object',
                    required: ['nombre', 'email', 'rut', 'empresa', 'disciplina', 'perfil'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'ID único del usuario'
                        },
                        nombre: {
                            type: 'string',
                            description: 'Nombre completo del usuario'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Correo electrónico'
                        },
                        telefono: {
                            type: 'string',
                            description: 'Número de teléfono'
                        },
                        rut: {
                            type: 'string',
                            description: 'RUT chileno'
                        },
                        empresa: {
                            type: 'string',
                            description: 'Empresa a la que pertenece'
                        },
                        disciplina: {
                            type: 'string',
                            description: 'Disciplina o área de trabajo'
                        },
                        perfil: {
                            type: 'string',
                            enum: ['trabajador', 'supervisor', 'duenoDeEnergia'],
                            description: 'Rol del usuario'
                        },
                        fingerprints: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Fingerprint'
                            },
                            description: 'Huellas digitales registradas'
                        },
                        fingerprintsComplete: {
                            type: 'boolean',
                            description: 'Indica si se han registrado todas las huellas'
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Estado del usuario'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Fecha de creación'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Fecha de última actualización'
                        }
                    }
                },
                Equipment: {
                    type: 'object',
                    required: ['name', 'type'],
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Nombre del equipo'
                        },
                        type: {
                            type: 'string',
                            description: 'Tipo de equipo'
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'inactive'],
                            description: 'Estado del equipo'
                        },
                        description: {
                            type: 'string',
                            description: 'Descripción detallada del equipo'
                        },
                        serialNumber: {
                            type: 'string',
                            description: 'Número de serie'
                        },
                        manufacturer: {
                            type: 'string',
                            description: 'Fabricante'
                        },
                        modelNumber: {
                            type: 'string',
                            description: 'Número de modelo'
                        },
                        lastMaintenanceDate: {
                            type: 'string',
                            format: 'date',
                            description: 'Fecha del último mantenimiento'
                        },
                        nextMaintenanceDate: {
                            type: 'string',
                            format: 'date',
                            description: 'Fecha del próximo mantenimiento'
                        },
                        location: {
                            type: 'string',
                            description: 'Ubicación del equipo'
                        }
                    }
                }
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./src/**/*.routes.ts', './src/**/*.swagger.ts']
};
const setupSwagger = (app) => {
    const specs = (0, swagger_jsdoc_1.default)(options);
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }'
    }));
};
exports.setupSwagger = setupSwagger;
