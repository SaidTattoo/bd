"use strict";
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
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://root:root@bloqueo_digital_database:27017/sigmadb?authSource=admin';
        /* mongoose.connect('mongodb://localhost:27018/nombre_de_tu_base_de_datos', { useNewUrlParser: true, useUnifiedTopology: true }); */
        const options = {
            autoIndex: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        };
        yield mongoose_1.default.connect(mongoUri, options);
        console.log('MongoDB conectado exitosamente');
        return true;
    }
    catch (error) {
        console.error('Error de conexión MongoDB:', error);
        return false;
    }
});
exports.default = connectDB;
