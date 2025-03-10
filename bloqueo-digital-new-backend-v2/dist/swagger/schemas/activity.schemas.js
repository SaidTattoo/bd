"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitySchema = void 0;
exports.ActivitySchema = {
    type: 'object',
    required: ['name', 'description', 'blockType'],
    properties: {
        name: {
            type: 'string',
            description: 'Nombre de la actividad'
        },
        description: {
            type: 'string',
            description: 'Descripción detallada de la actividad'
        },
        isBlocked: {
            type: 'boolean',
            description: 'Estado de bloqueo de ala actividad'
        },
        blockType: {
            type: 'string',
            description: 'Tipo de bloqueo'
        },
        energyOwners: {
            type: 'array',
            items: {
                $ref: '#/components/schemas/EnergyOwner'
            }
        },
        equipments: {
            type: 'array',
            items: {
                $ref: '#/components/schemas/Equipment'
            }
        },
        zeroEnergyValidation: {
            $ref: '#/components/schemas/ZeroEnergyValidation'
        }
    }
};
