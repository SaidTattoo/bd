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
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const activity_routes_1 = __importDefault(require("./activity/activity.routes"));
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const area_routes_1 = __importDefault(require("./Area/area.routes"));
const database_1 = __importDefault(require("./database"));
const swagger_1 = require("./swagger");
const users_routes_1 = __importDefault(require("./users/users.routes"));
const totem_routes_1 = __importDefault(require("./totem/totem.routes"));
const equipment_routes_1 = __importDefault(require("./Equipment/equipment.routes"));
const body_parser_1 = __importDefault(require("body-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware para parsear JSON
app.use(express_1.default.json());
app.use(body_parser_1.default.json({ limit: '2000mb' }));
app.use(body_parser_1.default.urlencoded({ limit: '2000mb', extended: true }));
// Configurar CORS
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Configurar Swagger
(0, swagger_1.setupSwagger)(app);
// Rutas de la aplicación
app.use('/activities', activity_routes_1.default);
app.use('/auth', auth_routes_1.default);
app.use('/users', users_routes_1.default);
app.use('/areas', area_routes_1.default);
app.use('/totem', totem_routes_1.default);
app.use('/equipment', equipment_routes_1.default); // Aseguramos que la ruta esté registrada
app.get('/', (req, res) => {
    res.send('API en funcionamiento');
});
// Manejo de errores global
app.use((err, req, res, _next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    let retries = 5;
    while (retries > 0) {
        const isConnected = yield (0, database_1.default)();
        if (isConnected) {
            app.listen(port, () => {
                console.log(`Servidor ejecutándose en http://localhost:${port}`);
                console.log(`Documentación API disponible en http://localhost:${port}/api-docs`);
            });
            return;
        }
        console.log(`Reintentando conexión a MongoDB... ${retries} intentos restantes`);
        retries--;
        yield new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.error('No se pudo conectar a MongoDB después de múltiples intentos');
    process.exit(1);
});
startServer();
