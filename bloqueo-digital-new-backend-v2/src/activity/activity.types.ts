import { Document, Types } from 'mongoose';

export interface IRuptura {
  razon: string;
  fecha: Date;
  validador?: Types.ObjectId;
  opcionSeleccionada?: number;
  detallesOpcion?: string;
  subOpcionesMarcadas?: string[];
  tipo?: string;
  idUsuario?: string | Types.ObjectId;
}

export interface IPopulatedUser {
  _id: Types.ObjectId;
  nombre: string;
}

export interface IPopulatedEquipment {
  _id: Types.ObjectId;
  name: string;
  type: string;
}

export interface IZeroEnergyValidation {
  validatorName: string;
  validator?: string;
  instrumentUsed: string;
  energyValue: string;
  validationDate: Date;
}

export interface IPopulatedSupervisor {
  user: IPopulatedUser;
  isBlocked: boolean;
  workers: IPopulatedUser[];
  ruptura?: IRuptura;
}

export interface IPopulatedEnergyOwner {
  user: IPopulatedUser;
  isBlocked: boolean;
  supervisors: IPopulatedSupervisor[];
  workers?: IPopulatedUser[];
  ruptura?: IRuptura;
}

export interface IPopulatedActivity extends Omit<Document, '_id'> {
  _id: Types.ObjectId;
  activityId: number;
  name: string;
  description: string;
  isBlocked: boolean;
  blockType: string;
  createdAt: Date;
  energyOwners: IPopulatedEnergyOwner[];
  equipments: IPopulatedEquipment[];
  zeroEnergyValidation?: IZeroEnergyValidation;
  pendingNewEnergyOwner?: boolean;
  selectedNewOwner?: Types.ObjectId;
  status: 'pendiente' | 'en_proceso' | 'finalizada';
  finishedAt?: Date;
  rupturas?: IRuptura[];
}