import { OpenAPIV3 } from 'openapi-types';

export const ComponentSchemas: { [key: string]: OpenAPIV3.SchemaObject } = {
  EnergyOwner: {
    type: 'object',
    properties: {
      user: {
        type: 'string',
        format: 'objectId',
        description: 'ID del usuario dueño de energía'
      },
      isBlocked: {
        type: 'boolean',
        description: 'Estado de bloqueo del dueño de energía'
      },
      supervisors: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Supervisor'
        }
      }
    }
  },
  Supervisor: {
    type: 'object',
    properties: {
      user: {
        type: 'string',
        format: 'objectId',
        description: 'ID del usuario supervisor'
      },
      isBlocked: {
        type: 'boolean',
        description: 'Estado de bloqueo del supervisor'
      },
      workers: {
        type: 'array',
        items: {
          type: 'string',
          format: 'objectId',
          description: 'IDs de los trabajadores'
        }
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
      }
    }
  },
  ZeroEnergyValidation: {
    type: 'object',
    properties: {
      validatorName: {
        type: 'string',
        description: 'Nombre del validador'
      },
      instrumentUsed: {
        type: 'string',
        description: 'Instrumento utilizado'
      },
      energyValue: {
        type: 'string',
        description: 'Valor de energía'
      }
    }
  }
};