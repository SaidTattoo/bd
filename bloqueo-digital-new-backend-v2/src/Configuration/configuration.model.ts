import mongoose, { Schema, Document } from 'mongoose';

export interface ITheme {
  id: string;
  name: string;
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  cardColor: string;
  borderColor: string;
  sidebarHeaderColor: string;
  sidebarLinkColor: string;
  isDefault?: boolean;
}

export interface IConfiguration extends Document {
_id: string;
logo?: string; // base64 string
nombreSistema?: string;
version?: string;
currentTheme?: string;
themes?: ITheme[];
  configuracionGeneral?: {
    timeoutSesion?: number;
    idioma?: string;
    zona_horaria?: string;
    [key: string]: any;
  };
  configuracionSeguridad?: {
    intentosMaximoLogin?: number;
    tiempoBloqueo?: number;
    requiereHuella?: boolean;
    [key: string]: any;
  };
  configuracionNotificaciones?: {
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    pushEnabled?: boolean;
    [key: string]: any;
  };
  configuracionTotems?: {
    timeoutCasillero?: number;
    intentosMaximos?: number;
    [key: string]: any;
  };
  configuracionBD?: {
    backupAutomatico?: boolean;
    frecuenciaBackup?: string;
    [key: string]: any;
  };
  configuracionLogs?: {
    nivelLog?: string;
    retencionDias?: number;
    [key: string]: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const ConfigurationSchema: Schema = new Schema({
logo: {
type: String,
required: false
},
nombreSistema: {
type: String,
required: false,
default: 'Sistema de Bloqueo Digital'
},
version: {
type: String,
required: false,
default: '2.0.0'
},
currentTheme: {
type: String,
required: false,
default: 'dark'
},
themes: {
type: [{
  id: { type: String, required: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  primaryColor: { type: String, required: true },
  secondaryColor: { type: String, required: true },
  accentColor: { type: String, required: true },
  backgroundColor: { type: String, required: true },
  textColor: { type: String, required: true },
  cardColor: { type: String, required: true },
  borderColor: { type: String, required: true },
  sidebarHeaderColor: { type: String, required: true, default: '#9ca3af' },
  sidebarLinkColor: { type: String, required: true, default: '#d1d5db' },
  isDefault: { type: Boolean, default: false }
}],
required: false,
default: function() {
  return [
    {
      id: 'default',
      name: 'default',
      displayName: 'Tema Claro',
      primaryColor: '#0891b2',
      secondaryColor: '#0e7490',
      accentColor: '#06b6d4',
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      cardColor: '#ffffff',
      borderColor: '#e2e8f0',
      sidebarHeaderColor: '#6b7280',
      sidebarLinkColor: '#374151',
      isDefault: false
    },
    {
      id: 'dark',
      name: 'dark',
      displayName: 'Tema Oscuro',
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      accentColor: '#8b5cf6',
      backgroundColor: '#0f172a',
      textColor: '#f1f5f9',
      cardColor: '#1e293b',
      borderColor: '#334155',
      sidebarHeaderColor: '#9ca3af',
      sidebarLinkColor: '#d1d5db',
      isDefault: true
    },
    {
      id: 'green',
      name: 'green',
      displayName: 'Tema Verde',
      primaryColor: '#059669',
      secondaryColor: '#047857',
      accentColor: '#10b981',
      backgroundColor: '#f0fdf4',
      textColor: '#1f2937',
      cardColor: '#ffffff',
      borderColor: '#d1fae5',
      sidebarHeaderColor: '#065f46',
      sidebarLinkColor: '#047857',
      isDefault: false
    }
  ];
}
},
  configuracionGeneral: {
    type: Schema.Types.Mixed,
    required: false,
    default: {}
  },
  configuracionSeguridad: {
    type: Schema.Types.Mixed,
    required: false,
    default: {}
  },
  configuracionNotificaciones: {
    type: Schema.Types.Mixed,
    required: false,
    default: {}
  },
  configuracionTotems: {
    type: Schema.Types.Mixed,
    required: false,
    default: {}
  },
  configuracionBD: {
    type: Schema.Types.Mixed,
    required: false,
    default: {}
  },
  configuracionLogs: {
    type: Schema.Types.Mixed,
    required: false,
    default: {}
  }
}, {
  timestamps: true
});

// Asegurar que solo haya una configuración en la base de datos
ConfigurationSchema.index({}, { unique: true });

export default mongoose.model<IConfiguration>('Configuration', ConfigurationSchema); 