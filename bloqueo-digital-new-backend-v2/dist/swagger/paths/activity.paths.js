"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityPaths = void 0;
exports.ActivityPaths = {
    '/activities': {
        get: {
            tags: ['Actividades'],
            summary: 'Obtener todas las actividades',
            responses: {
                '200': {
                    description: 'Lista de actividades',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/Activity'
                                }
                            }
                        }
                    }
                }
            }
        },
        post: {
            tags: ['Actividades'],
            summary: 'Crear una nueva actividad',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Activity'
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Actividad creada exitosamente'
                }
            }
        }
    },
    '/activities/{id}': {
        get: {
            tags: ['Actividades'],
            summary: 'Obtener actividad por ID',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string'
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Actividad encontrada',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Activity'
                            }
                        }
                    }
                }
            }
        }
    },
    '/activities/{id}/equipment': {
        post: {
            tags: ['Equipos'],
            summary: 'Agregar equipo a una actividad',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string'
                    }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Equipment'
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Equipo agregado exitosamente'
                }
            }
        }
    }
};
