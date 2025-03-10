import mongoose, { Schema, Document } from 'mongoose';
import Counter from '../activity/counter.model';
import { EquipmentModel } from '../Equipment/equipment.model';

// Esquema para la validación de energía cero
const ZeroEnergyValidationSchema = new Schema({
  validatorId: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  validatorName: { type: String, required: true },
  instrumentUsed: { type: String, required: true },
  energyValue: { type: Number, required: true },
  validatedAt: { type: Date, default: Date.now },
  validator: {
    _id: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    nombre: String,
    perfil: String
  }
}, { _id: false });

// Esquema para trabajadores
const WorkerSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  nombre: { type: String, required: true }
}, { _id: false });

// Esquema para supervisores
const SupervisorSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  isBlocked: { type: Boolean, default: false },
  workers: [WorkerSchema]
}, { _id: false });

// Esquema para dueños de energía
const EnergyOwnerSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  isBlocked: { type: Boolean, default: false },
  blockReason: { type: String },
  blockDate: { type: Date },
  supervisors: [SupervisorSchema]
}, { _id: false });

// Esquema para el historial
const HistoryEntrySchema = new Schema({
  fecha: { type: Date, required: true },
  dueñoEnergia: { type: String, required: true },
  dueñoEnergiaPropuesto: String,
  dueñoEnergiaFinal: String
}, { _id: false });

// Esquema principal de actividad
const ActividadSchema = new Schema({
  activityId: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  blockType: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  energyOwners: [EnergyOwnerSchema],
  equipments: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Equipment'
  }],
  zeroEnergyValidation: ZeroEnergyValidationSchema,
  historial: [HistoryEntrySchema],
  pendingNewEnergyOwner: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware para auto-incrementar activityId
ActividadSchema.pre('save', async function(next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'activityId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.activityId = counter.seq;
  }
  next();
});

// Middleware para actualizar updatedAt
ActividadSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const ActividadModel = mongoose.model('Actividad', ActividadSchema);
