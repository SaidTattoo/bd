import mongoose, { Document, Schema } from 'mongoose';
import { ISupervisor } from '../Supervisor/supervisor.model';

// Definir la interfaz para EnergyOwner
export interface IEnergyOwner extends Document {
  name: string;
  isBlocked: boolean;
  supervisors: ISupervisor[];
  changeEnergyOwner: boolean;
}

// Definir el esquema de EnergyOwner
const EnergyOwnerSchema: Schema = new Schema({
  name: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  supervisors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supervisor' }], // Referencia a Supervisores
  changeEnergyOwner: { type: Boolean, default: false },
});

// Configurar toJSON para eliminar __v y otros campos no deseados
EnergyOwnerSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

// Registrar el modelo
export default mongoose.model<IEnergyOwner>('EnergyOwner', EnergyOwnerSchema);