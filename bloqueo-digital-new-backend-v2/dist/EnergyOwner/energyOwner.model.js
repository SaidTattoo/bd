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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Definir el esquema de EnergyOwner
const EnergyOwnerSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    isBlocked: { type: Boolean, default: false },
    supervisors: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Supervisor' }], // Referencia a Supervisores
    changeEnergyOwner: { type: Boolean, default: false },
});
// Configurar toJSON para eliminar __v y otros campos no deseados
EnergyOwnerSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    },
});
// Registrar el modelo
exports.default = mongoose_1.default.model('EnergyOwner', EnergyOwnerSchema);
