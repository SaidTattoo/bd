import { Document } from 'mongoose';

export type FingerPosition = 
  | 'rightThumb' 
  | 'rightIndex' 
  | 'rightMiddle' 
  | 'rightRing' 
  | 'rightLittle'
  | 'leftThumb' 
  | 'leftIndex' 
  | 'leftMiddle' 
  | 'leftRing' 
  | 'leftLittle';

export type UserRole = 'trabajador' | 'supervisor' | 'duenoDeEnergia';

export interface IFingerprint {
  position: FingerPosition;
  template: string;
  quality: number;
  capturedAt: Date;
}

export interface IUsuarioBase {
  nombre: string;
  email: string;
  password?: string; // Hacemos password opcional
  telefono?: string;
  rut: string;
  empresa: string;
  disciplina: string;
  perfil: UserRole;
  fingerprints: IFingerprint[];
  fingerprintsComplete: boolean;
  lastLogin?: Date;
  isActive: boolean;
}

export interface IUsuario extends IUsuarioBase, Document {
  createdAt: Date;
  updatedAt: Date;
  validateFingerprint(position: FingerPosition, template: string): Promise<boolean>;
  hasAllFingerprints(): boolean;
}