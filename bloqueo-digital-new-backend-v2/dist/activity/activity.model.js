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
exports.ActivityModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const counter_model_1 = __importDefault(require("./counter.model"));
const ZeroEnergyValidationSchema = new mongoose_1.Schema({
    validatorName: { type: String, required: true },
    instrumentUsed: { type: String, required: true },
    energyValue: { type: String, required: true }
}, { _id: false });
const SupervisorSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    isBlocked: { type: Boolean, default: false },
    workers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Usuario' }]
}, { _id: false });
const EnergyOwnerSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    isBlocked: { type: Boolean, default: false },
    supervisors: [SupervisorSchema]
}, { _id: false });
const ActivitySchema = new mongoose_1.Schema({
    activityId: { type: Number, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    isBlocked: { type: Boolean, default: false, required: true },
    blockType: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    energyOwners: [EnergyOwnerSchema],
    equipments: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Equipment' }],
    zeroEnergyValidation: { type: ZeroEnergyValidationSchema, required: false },
    pendingNewEnergyOwner: { type: Boolean, default: false }
}, {
    timestamps: true,
    versionKey: false
});
ActivitySchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isNew) {
            try {
                const counter = yield counter_model_1.default.findByIdAndUpdate({ _id: 'activityId' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
                this.activityId = counter.seq;
                next();
            }
            catch (error) {
                next(error);
            }
        }
        else {
            next();
        }
    });
});
exports.ActivityModel = mongoose_1.default.model('Activity', ActivitySchema);
