import mongoose, { Schema, Document, Types } from 'mongoose';
import { IEquipment } from '../Equipment/equipment.types';

export interface IArea extends Document {
  name: string;
  description: string;
  equipments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const AreaSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    required: true,
    trim: true
  },
  equipments: [{
    type: Schema.Types.ObjectId,
    ref: 'Equipment'
  }]
}, {
  timestamps: true,
  versionKey: false
});

export const AreaModel = mongoose.model<IArea>('Area', AreaSchema);