import { Schema, model } from 'mongoose';
import { LockerStatus } from './locker.types';

const LockerSchema = new Schema({
  totemId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Totem', 
    required: true 
  },
  status: { 
    type: String, 
    enum: Object.values(LockerStatus),
    default: LockerStatus.AVAILABLE 
  },
  activityId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Activity',
    default: null 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

export const LockerModel = model('Locker', LockerSchema); 