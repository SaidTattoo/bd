import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import activityRoutes from './activity/activity.routes';
import authRoutes from './auth/auth.routes';
import areaRoutes from './Area/area.routes';
import connectDB from './database';
import { setupSwagger } from './swagger';
import usersRoutes from './users/users.routes';
import totemRoutes from './totem/totem.routes';
import equipmentRoutes from './Equipment/equipment.routes';
import fixedAssetRoutes from './FixedAsset/fixedAsset.routes';
import configurationRoutes from './Configuration/configuration.routes';
import bodyParser from 'body-parser';
import { io } from 'socket.io-client';

dotenv.config();

// Agregar un log para verificar
console.log('Variables de entorno cargadas:', {
  EMAIL_USER_SET: !!process.env.EMAIL_USER,
  EMAIL_PASSWORD_SET: !!process.env.EMAIL_PASSWORD
});

const app = express();
const port = process.env.PORT || 3000;

// ⚠️ Asegúrate de que el servidor WebSocket está corriendo en este puerto
// const socket = io("http://localhost:3002/");

let clientesConectados: any[] = []; // Lista de clientes conectados

// Middleware para parsear JSON
app.use(bodyParser.json({ limit: '2000mb' }));
app.use(bodyParser.urlencoded({ limit: '2000mb', extended: true }));
// Configurar CORS
app.use(cors());

// ⚡ Manejar la conexión al WebSocket
// socket.on("connect", () => {
//   console.log("✅ Conectado al servidor WebSocket");
// });

// socket.on("actualizar-clientes", (clientes) => {
//   console.log("🔄 Clientes conectados:", clientes);
// });

// Configurar Swagger
setupSwagger(app);

// Rutas de la aplicación
app.use('/activities', activityRoutes);
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/areas', areaRoutes);
app.use('/totem', totemRoutes);
app.use('/equipment', equipmentRoutes);
app.use('/fixed-assets', fixedAssetRoutes);
app.use('/configuracion', configurationRoutes);

// 📌 Nueva ruta para obtener los clientes conectados
app.get('/clientes-conectados', (req: Request, res: Response) => {
  res.json(clientesConectados);
});

app.get('/', (req: Request, res: Response) => {
  res.send('API en funcionamiento');
});

// Manejo de errores global
app.use((err: Error, req: Request, res: Response, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    mensaje: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Función para iniciar el servidor con conexión a MongoDB
const startServer = async () => {
  let retries = 5;
  
  while (retries > 0) {
    const isConnected = await connectDB();
    if (isConnected) {
      app.listen(port, () => {
        console.log(`✅ Servidor ejecutándose en http://localhost:${port}`);
        console.log(`📄 Documentación API: http://localhost:${port}/api-docs`);
      });
      return;
    }
    console.log(`🔄 Reintentando conexión a MongoDB... ${retries} intentos restantes`);
    retries--;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.error('❌ No se pudo conectar a MongoDB después de múltiples intentos');
  process.exit(1);
};
 
startServer();
