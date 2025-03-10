import { Document, Types } from 'mongoose';
import { IPopulatedActivity } from '../activity/activity.types';
import { IArea } from '../Area/area.model';

export interface IEquipmentBase {
  name: string;
  description: string;
  deleted: boolean;
  locked: boolean;
  activities: Types.ObjectId[];
  areas: Types.ObjectId[];
}

export interface IEquipmentPopulated extends Omit<IEquipmentBase, 'activities' | 'areas'> {
  activities: IPopulatedActivity[];
  areas: IArea[];
}

export interface IEquipment extends IEquipmentBase, Document {
  createdAt: Date;
  updatedAt: Date;
}