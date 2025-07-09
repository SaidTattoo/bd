import mongoose, { Schema } from 'mongoose';
import { IEmpresa, IContacto, IDireccion, EmpresaStatus, EmpresaSector, IEmpresaModel } from './empresa.types';

const ContactoSchema = new Schema<IContacto>({
  nombre: {
    type: String,
    required: [true, 'El nombre del contacto es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  cargo: {
    type: String,
    required: [true, 'El cargo es requerido'],
    trim: true,
    maxlength: [100, 'El cargo no puede exceder 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'El formato del email no es válido'
    ]
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true,
    match: [
      /^[\+]?[1-9][\d]{0,15}$/,
      'El formato del teléfono no es válido'
    ]
  }
}, { _id: false });

const DireccionSchema = new Schema<IDireccion>({
  calle: {
    type: String,
    required: [true, 'La calle es requerida'],
    trim: true,
    maxlength: [200, 'La calle no puede exceder 200 caracteres']
  },
  numero: {
    type: String,
    required: [true, 'El número es requerido'],
    trim: true,
    maxlength: [20, 'El número no puede exceder 20 caracteres']
  },
  ciudad: {
    type: String,
    required: [true, 'La ciudad es requerida'],
    trim: true,
    maxlength: [100, 'La ciudad no puede exceder 100 caracteres']
  },
  region: {
    type: String,
    required: [true, 'La región es requerida'],
    trim: true,
    maxlength: [100, 'La región no puede exceder 100 caracteres']
  },
  codigoPostal: {
    type: String,
    required: [true, 'El código postal es requerido'],
    trim: true,
    maxlength: [20, 'El código postal no puede exceder 20 caracteres']
  },
  pais: {
    type: String,
    required: [true, 'El país es requerido'],
    trim: true,
    maxlength: [100, 'El país no puede exceder 100 caracteres'],
    default: 'Chile'
  }
}, { _id: false });

const EmpresaSchema = new Schema<IEmpresa>({
  nombre: {
    type: String,
    required: [true, 'El nombre de la empresa es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [200, 'El nombre no puede exceder 200 caracteres']
  },
  rut: {
    type: String,
    required: [true, 'El RUT es requerido'],
    unique: true,
    trim: true,
    validate: {
      validator: function(rut: string) {
        return /^[0-9]+-[0-9Kk]{1}$/.test(rut);
      },
      message: 'El formato del RUT no es válido (ejemplo: 12345678-9)'
    }
  },
  razonSocial: {
    type: String,
    required: [true, 'La razón social es requerida'],
    trim: true,
    maxlength: [200, 'La razón social no puede exceder 200 caracteres']
  },
  sector: {
    type: String,
    required: [true, 'El sector es requerido'],
    enum: {
      values: ['mineria', 'construccion', 'manufactura', 'servicios', 'tecnologia', 'energia', 'agricultura', 'salud', 'educacion', 'otro'],
      message: 'El sector no es válido'
    }
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  direccion: {
    type: DireccionSchema,
    required: [true, 'La dirección es requerida']
  },
  contactoPrincipal: {
    type: ContactoSchema,
    required: [true, 'El contacto principal es requerido']
  },
  contactosAdicionales: {
    type: [ContactoSchema],
    default: [],
    validate: {
      validator: function(contactos: IContacto[]) {
        return contactos.length <= 10;
      },
      message: 'No se pueden tener más de 10 contactos adicionales'
    }
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true,
    match: [
      /^[\+]?[1-9][\d]{0,15}$/,
      'El formato del teléfono no es válido'
    ]
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'El formato del email no es válido'
    ]
  },
  sitioWeb: {
    type: String,
    trim: true,
    validate: {
      validator: function(url: string) {
        if (!url) return true; // Campo opcional
        return /^https?:\/\/.+/.test(url);
      },
      message: 'El sitio web debe ser una URL válida'
    }
  },
  fechaFundacion: {
    type: Date,
    validate: {
      validator: function(fecha: Date) {
        if (!fecha) return true; // Campo opcional
        return fecha <= new Date();
      },
      message: 'La fecha de fundación no puede ser futura'
    }
  },
  numeroEmpleados: {
    type: Number,
    min: [0, 'El número de empleados no puede ser negativo'],
    max: [1000000, 'El número de empleados no puede exceder 1,000,000']
  },
  status: {
    type: String,
    required: [true, 'El estado es requerido'],
    enum: {
      values: ['activa', 'inactiva', 'suspendida'],
      message: 'El estado no es válido'
    },
    default: 'activa'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  logo: {
    type: String,
    trim: true,
    validate: {
      validator: function(url: string) {
        if (!url) return true; // Campo opcional
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg)$/i.test(url);
      },
      message: 'El logo debe ser una URL válida de imagen'
    }
  },
  certificaciones: {
    type: [String],
    default: [],
    validate: {
      validator: function(certificaciones: string[]) {
        return certificaciones.length <= 20;
      },
      message: 'No se pueden tener más de 20 certificaciones'
    }
  },
  observaciones: {
    type: String,
    trim: true,
    maxlength: [2000, 'Las observaciones no pueden exceder 2000 caracteres']
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices para optimizar consultas
EmpresaSchema.index({ rut: 1 });
EmpresaSchema.index({ nombre: 1 });
EmpresaSchema.index({ sector: 1 });
EmpresaSchema.index({ status: 1 });
EmpresaSchema.index({ isActive: 1 });
EmpresaSchema.index({ 'contactoPrincipal.email': 1 });
EmpresaSchema.index({ createdAt: -1 });

// Middleware pre-save para validaciones adicionales
EmpresaSchema.pre('save', function(next) {
  // Validar que el RUT tenga el formato correcto
  if (this.isModified('rut') && !this.isValidRut()) {
    return next(new Error('El RUT no es válido'));
  }

  // Sincronizar status con isActive
  if (this.isModified('status')) {
    this.isActive = this.status === 'activa';
  }

  next();
});

// Métodos de instancia
EmpresaSchema.methods.isValidRut = function(): boolean {
  const rut = this.rut.replace(/\./g, '');
  const [numero, dv] = rut.split('-');
  
  if (!numero || !dv) return false;
  
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero.charAt(i)) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  const dvCalculado = resto < 2 ? resto : 11 - resto;
  const dvIngresado = dv.toLowerCase() === 'k' ? 10 : parseInt(dv);
  
  return dvCalculado === dvIngresado;
};

EmpresaSchema.methods.getTotalEmpleados = async function(): Promise<number> {
  // Aquí podrías hacer una consulta a la colección de usuarios
  // para obtener el número real de empleados
  const Usuario = mongoose.model('Usuario');
  const count = await Usuario.countDocuments({ empresa: this.nombre });
  return count;
};

EmpresaSchema.methods.getContactByEmail = function(email: string): IContacto | undefined {
  if (this.contactoPrincipal.email === email) {
    return this.contactoPrincipal;
  }
  
  return this.contactosAdicionales?.find((contacto: IContacto) => contacto.email === email);
};

// Configuración de transformación JSON
EmpresaSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Métodos estáticos
EmpresaSchema.statics.findByRut = function(rut: string) {
  return this.findOne({ rut: rut.trim() });
};

EmpresaSchema.statics.findActiveBySector = function(sector: EmpresaSector) {
  return this.find({ sector, isActive: true });
};

EmpresaSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalEmpresas: { $sum: 1 },
        empresasActivas: { $sum: { $cond: [{ $eq: ['$status', 'activa'] }, 1, 0] } },
        empresasInactivas: { $sum: { $cond: [{ $eq: ['$status', 'inactiva'] }, 1, 0] } },
        empresasSuspendidas: { $sum: { $cond: [{ $eq: ['$status', 'suspendida'] }, 1, 0] } },
        totalEmpleados: { $sum: '$numeroEmpleados' }
      }
    }
  ]);

  const porSector = await this.aggregate([
    {
      $group: {
        _id: '$sector',
        count: { $sum: 1 }
      }
    }
  ]);

  const empresasPorSector: Record<string, number> = {};
  porSector.forEach(item => {
    empresasPorSector[item._id] = item.count;
  });

  return {
    ...stats[0],
    empresasPorSector
  };
};

const Empresa = mongoose.model<IEmpresa, IEmpresaModel>('Empresa', EmpresaSchema);

export { Empresa };
export default Empresa; 