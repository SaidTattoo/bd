export enum LockerStatus {
  AVAILABLE = 'disponible',
  OCCUPIED = 'ocupado',
  OPEN = 'abierto',
  CLOSED = 'cerrado',
  ERROR = 'error',
  MAINTENANCE = 'mantenimiento'
}

export interface LockerStateChange {
  equipos: string[];
  activityId: string;
  status: LockerStatus;
} 