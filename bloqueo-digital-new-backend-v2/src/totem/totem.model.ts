//totem contiene un array de casilleros

import mongoose, { Document, Schema } from 'mongoose';
import { EquipmentModel, EquipmentSchema } from '../Equipment/equipment.model';

export interface ITotem extends Document {
    _id: string;
    name: string;
    description: string;
    casilleros: ICasillero[];
}

export interface ICasillero extends Document {
    _id: string;
    name: string;
    description: string;
    equipos: IEquipment[];
    activityId?: string; 
    status: 'disponible' | 'ocupado' | 'mantenimiento' | 'abierto';
}
export interface IEquipment extends Document {
    _id: string;
    name: string;
    description: string;
    status: 'disponible' | 'ocupado' | 'mantenimiento' ;
}

const CasilleroSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    equipos: [{
        type: Schema.Types.ObjectId,
        ref: 'Equipment'
    }],
    activityId: { type: String, required: false },
    status: { 
        type: String, 
        enum: ['disponible', 'ocupado', 'mantenimiento', 'abierto'], 
        default: 'disponible' 
    }
});

const TotemSchema: Schema = new Schema({
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true },
    description: { type: String, required: true },
    casilleros: { type: [CasilleroSchema], required: true },
});

export default mongoose.model<ITotem>('Totem', TotemSchema);
