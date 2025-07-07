export interface Activity {
    _id?: string | undefined;
    id?: number;
    name: string;
    description: string;
    createdAt: string;
    blockType: string;
    status: 'pendiente' | 'en_proceso' | 'finalizada';
    zeroEnergyValidation?: EnergyValidation;
    lockers: Locker[];
    energyOwners: EnergyOwner[];
    equipments: Equipment[];
    pendingNewEnergyOwner: boolean;
    isBlocked: boolean;
    selectedNewOwner: string
    assignedLockers: Array<{
      totemId: string;
      lockerId: string;
      assignedAt?: Date;
      _id?: string;
    }>;
  }
  
  export interface EnergyValidation {
    validatorName: string;
    instrumentUsed: string;
    energyValue: number;
  }
  
  export interface Locker {
    _id: string;
    number: string;
    equipments: any[];
    status: 'disponible' | 'ocupado' | 'mantenimiento' | 'abierto';
  }
  
  export interface Area {
    _id: string;
    name: string;
  }
  export type LockerStatus = 'disponible' | 'ocupado' | 'mantenimiento' | 'abierto';
  export interface Equipment {
    _id: string;
    name: string;
    description: string;
    area: Area;
    deleted: boolean;
    locked: boolean;
    activities: Activity[];
    zeroEnergyValidated: boolean;
    lastValidationDate?: string;
    lastValidatedBy?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface User {
    _id: string;
    nombre: string;
    email: string;
    telefono: string;
    rut: string;
    empresa: string;
    disciplina: string;
    perfil: 'trabajador' | 'duenoDeEnergia' | 'supervisor';
    fingerprints: Fingerprint[];
    fingerprintsComplete: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Fingerprint {
    position: FingerPosition;
    template: string;
    quality: number;
    capturedAt: string;
  }
  
  export type FingerPosition = 
    | 'leftThumb' 
    | 'leftIndex' 
    | 'leftMiddle' 
    | 'leftRing' 
    | 'leftPinky'
    | 'rightThumb' 
    | 'rightIndex' 
    | 'rightMiddle' 
    | 'rightRing' 
    | 'rightPinky';
  
  export interface EnergyOwner {
    user: User;
    isBlocked: boolean;
    supervisors: any[];
  }