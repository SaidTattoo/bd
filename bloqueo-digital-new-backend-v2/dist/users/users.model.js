"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usuario = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fingerprintSchema = new mongoose_1.Schema({
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
const UsuarioSchema = new mongoose_1.Schema({
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
            validator: function (fingerprints) {
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
UsuarioSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified('password')) {
            this.password = yield bcryptjs_1.default.hash(this.password, 10);
        }
        this.fingerprintsComplete = this.fingerprints.length === 10;
        next();
    });
});
UsuarioSchema.methods.validateFingerprint = function (position, template) {
    return __awaiter(this, void 0, void 0, function* () {
        const fingerprint = this.fingerprints.find((f) => f.position === position);
        if (!fingerprint)
            return false;
        return fingerprint.template === template;
    });
};
UsuarioSchema.methods.hasAllFingerprints = function () {
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
const Usuario = mongoose_1.default.model('Usuario', UsuarioSchema);
exports.Usuario = Usuario;
exports.default = Usuario;
