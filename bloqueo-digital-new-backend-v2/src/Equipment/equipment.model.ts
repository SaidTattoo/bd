import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEquipment extends Document {
  name: string;
  description: string;
  area: Types.ObjectId;
  deleted: boolean;
  locked: boolean;
  activities: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export const EquipmentSchema = new Schema({
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
  area: {
    type: Schema.Types.ObjectId,
    ref: 'Area'
  },
  zeroEnergyValidated: {
    type: Boolean,
    default: false
  },
  lastValidationDate: {
    type: Date,
    default: null
  },
  lastValidatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deleted: {
    type: Boolean,
    default: false
  },
  locked: {
    type: Boolean,
    default: false
  },
  activities: [{
    type: Schema.Types.ObjectId,
    ref: 'Activity'
  }]
}, {
  timestamps: true,
  versionKey: false
});

export const EquipmentModel = mongoose.model<IEquipment>('Equipment', EquipmentSchema);