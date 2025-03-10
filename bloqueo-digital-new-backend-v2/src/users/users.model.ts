import mongoose, { Schema } from 'mongoose';
import { IUsuario, FingerPosition, IFingerprint } from './users.types';
import bcrypt from 'bcryptjs';

const fingerprintSchema = new Schema<IFingerprint>({
  position: {
    type: String,
    enum: [
      'rightThumb', 'rightIndex', 'rightMiddle', 'rightRing', 'rightLittle',
      'leftThumb', 'leftIndex', 'leftMiddle', 'leftRing', 'leftLittle'
    ],
    required: true
  },
  template: {
    type: String,
    required: true
  },
  quality: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  capturedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const UsuarioSchema = new Schema({
  nombre: { 
    type: String, 
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  telefono: { 
    type: String,
    trim: true
  },
  rut: { 
    type: String, 
    required: [true, 'El RUT es requerido'],
    unique: true,
    trim: true
  },
  empresa: { 
    type: String, 
    required: [true, 'La empresa es requerida'],
    trim: true
  },
  disciplina: { 
    type: String, 
    required: [true, 'La disciplina es requerida'],
    trim: true
  },
  perfil: { 
    type: String, 
    required: [true, 'El perfil es requerido'],
    enum: {
      values: ['trabajador', 'supervisor', 'duenoDeEnergia'],
      message: 'Perfil no válido'
    }
  },
  fingerprints: {
    type: [fingerprintSchema],
    validate: {
      validator: function(fingerprints: IFingerprint[]) {
        const positions = fingerprints.map(f => f.position);
        return new Set(positions).size === positions.length;
      },
      message: 'No puede haber huellas digitales duplicadas'
    }
  },
  fingerprintsComplete: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

UsuarioSchema.index({ email: 1 });
UsuarioSchema.index({ rut: 1 });

UsuarioSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.fingerprintsComplete = this.fingerprints.length === 10;
  next();
});

UsuarioSchema.methods.validateFingerprint = async function(
  position: FingerPosition, 
  template: string
): Promise<boolean> {
  const fingerprint = this.fingerprints.find((f: any) => f.position === position);
  if (!fingerprint) return false;
  return fingerprint.template === template;
};

UsuarioSchema.methods.hasAllFingerprints = function(): boolean {
  return this.fingerprints.length === 10;
};

UsuarioSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});



// Exportar como default y nombrado
const Usuario = mongoose.model<IUsuario>('Usuario', UsuarioSchema);
export { Usuario };
export default Usuario;