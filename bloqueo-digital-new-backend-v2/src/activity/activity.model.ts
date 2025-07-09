import mongoose, { Schema } from 'mongoose';
import Counter from './counter.model';
import { IPopulatedActivity } from './activity.types';

// Esquema para almacenar información de ruptura de bloqueo
const RupturaSchema = new Schema({
  razon: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  validador: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  opcionSeleccionada: { type: Number },
  detallesOpcion: { type: String },
  subOpcionesMarcadas: { type: [String] }
}, { _id: false });

// Esquema para almacenar el histórico de acciones de usuarios
const UserHistorySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  action: { type: String, enum: ['bloqueo', 'desbloqueo'], required: true },
  userProfile: { type: String, enum: ['trabajador', 'supervisor', 'duenoDeEnergia'], required: true },
  timestamp: { type: Date, default: Date.now },
  // Para supervisores: qué trabajador bloqueó
  blockedWorker: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  // Para trabajadores: quién lo bloqueó (supervisor)
  blockedBy: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  // Información adicional
  details: { type: String },
  // Referencia al casillero si aplica
  lockerInfo: {
    lockerId: { type: String },
    totemId: { type: String },
    lockerName: { type: String }
  }
}, { _id: true });

const ZeroEnergyValidationSchema = new Schema({
  validatorName: { type: String, required: false, default: '' },
  instrumentUsed: { type: String, required: false, default: '' },
  energyValue: { type: String, required: false, default: '' }
}, { _id: false });

const SupervisorSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  isBlocked: { type: Boolean, default: false },
  workers: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }],
  ruptura: { type: RupturaSchema, default: null } // Información de ruptura si ocurrió
}, { _id: false });

const EnergyOwnerSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  isBlocked: { type: Boolean, default: false },
  supervisors: [SupervisorSchema],
  ruptura: { type: RupturaSchema, default: null } // Información de ruptura si ocurrió
}, { _id: false });

const ActivitySchema = new Schema({
  activityId: { type: Number, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  isBlocked: { type: Boolean, default: false, required: true },
  blockType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  energyOwners: [EnergyOwnerSchema],
  equipments: [{ type: Schema.Types.ObjectId, ref: 'Equipment' }],
  assignedLockers: [{
    lockerId: { type: String, required: true },
    totemId: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now }
  }],
  zeroEnergyValidation: {
    type: ZeroEnergyValidationSchema,
    default: {
      validatorName: '',
      instrumentUsed: '',
      energyValue: '',
      validationDate: null
    },
    required: false
  },
  pendingNewEnergyOwner: { type: Boolean, default: false },
  selectedNewOwner: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  status: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'finalizada'],
    default: 'pendiente'
  },
  finishedAt: {
    type: Date,
    default: null
  },
  // Historial de rupturas para la actividad en general
  rupturas: [RupturaSchema],
  // Historial de acciones de usuarios (bloqueos/desbloqueos)
  userHistory: [UserHistorySchema]
}, {
  timestamps: true,
  versionKey: false
});

ActivitySchema.pre<IPopulatedActivity>('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'activityId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.activityId = counter.seq;
      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

export const ActivityModel = mongoose.model<IPopulatedActivity>('Activity', ActivitySchema);