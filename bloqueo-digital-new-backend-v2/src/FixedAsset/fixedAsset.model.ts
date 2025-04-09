import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFixedAsset extends Document {
  name: string;
  code: string;
  description: string;
  equipment: Types.ObjectId;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

const FixedAssetSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: { 
    type: String,
    required: true,
    trim: true
  },
  equipment: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  }
}, {
  timestamps: true,
  versionKey: false
});

export const FixedAssetModel = mongoose.model<IFixedAsset>('FixedAsset', FixedAssetSchema); 