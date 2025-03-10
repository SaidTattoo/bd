const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bodyParser = require('body-parser');

// Configuración a través de variables de entorno o valores por defecto
const PORT = process.env.PORT || 3003;
const HOST = '0.0.0.0'; // Escuchar en todas las interfaces, no solo localhost
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];

const app = express();

// Simplifica la configuración CORS para ambos
const corsOptions = {
  origin: "*", // Completamente permisivo para desarrollo
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Aplicar a Express
app.use(cors(corsOptions));
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Ruta al archivo de persistencia
const STORAGE_FILE = path.join(__dirname, 'equipment-state.json');

// Cargar estado inicial
let equiposEnUso = {};
let actividadesEquipos = {};
let clientesConectados = new Set();

try {
  if (fs.existsSync(STORAGE_FILE)) {
    const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
    equiposEnUso = data.equiposEnUso || {};
    
    // Convertir las actividades de arrays a Sets
    actividadesEquipos = {};
    if (data.actividadesEquipos) {
      Object.keys(data.actividadesEquipos).forEach(key => {
        // Asegurarse de que cada entrada sea un Set
        const actividadEquipos = data.actividadesEquipos[key];
        actividadesEquipos[key] = new Set(Array.isArray(actividadEquipos) ? actividadEquipos : []);
      });
    }
    
    console.log("✅ Estado cargado correctamente:", { 
      equipos: Object.keys(equiposEnUso).length,
      actividades: Object.keys(actividadesEquipos).length
    });
  } else {
    console.log("⚠️ No existe archivo de estado, se creará uno nuevo");
    saveState(); // Crear archivo inicial
  }
} catch (error) {
  console.error('❌ Error al cargar el estado:', error);
  // Inicializar con valores vacíos si hay error
  equiposEnUso = {};
  actividadesEquipos = {};
  saveState(); // Intentar crear archivo
}

// Función para guardar el estado
function saveState() {
  try {
    // Convertir los Sets a arrays para guardarlos como JSON
    const actividadesEquiposJSON = {};
    Object.keys(actividadesEquipos).forEach(key => {
      if (actividadesEquipos[key] instanceof Set) {
        actividadesEquiposJSON[key] = Array.from(actividadesEquipos[key]);
      } else {
        // Si por alguna razón no es un Set, lo convertimos a uno y luego a array
        actividadesEquiposJSON[key] = Array.from(new Set(Array.isArray(actividadesEquipos[key]) 
          ? actividadesEquipos[key] 
          : []));
      }
    });
    
    fs.writeFileSync(STORAGE_FILE, JSON.stringify({
      equiposEnUso,
      actividadesEquipos: actividadesEquiposJSON,
      timestamp: new Date().toISOString()
    }, null, 2));
    console.log("💾 Estado guardado correctamente");
  } catch (error) {
    console.error('❌ Error al guardar el estado:', error);
  }
}

// Función para emitir la lista actualizada de clientes
function broadcastClients() {
  io.emit("actualizar-clientes", Array.from(clientesConectados));
  console.log(`📱 Clientes conectados: ${clientesConectados.size}`);
}

// Middleware para manejar errores de Socket.io
io.use((socket, next) => {
  socket.on("error", (error) => {
    console.error(`❌ Error en socket ${socket.id}:`, error);
  });
  next();
});

// Endpoint para verificar si el servidor está activo
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "UP", 
    timestamp: new Date().toISOString(),
    clients: clientesConectados.size,
    equipments: Object.keys(equiposEnUso).length
  });
});

io.engine.on("connection_error", (err) => {
  console.log("Conexión fallida - detalles completos:", err);
  console.log("Headers:", err.req?.headers);
  console.log("URL:", err.req?.url);
});

io.on("connection", (socket) => {
  console.log(`Tótem conectado: ${socket.id} desde ${socket.handshake.address}`);
  
  // Agregar el nuevo cliente a la lista
  clientesConectados.add(socket.id);
  broadcastClients();

  // Enviar el estado actual de equipos en uso al nuevo cliente
  socket.emit("actualizar-equipos", equiposEnUso);

  // Manejar solicitud de lista de clientes
  socket.on("get-clients", () => {
    socket.emit("actualizar-clientes", Array.from(clientesConectados));
  });

  // Evento cuando un tótem marca un equipo como en uso
  socket.on("usar-equipo", (data) => {
    try {
      const { equipoId, actividadId, actividadNombre } = data;
      
      if (!equipoId || !actividadId) {
        socket.emit("error-equipo", {
          error: true,
          mensaje: "Datos incompletos"
        });
        return;
      }
      
      // Verificar si el equipo ya está en uso en esta actividad
      if (actividadesEquipos[actividadId] && actividadesEquipos[actividadId].has(equipoId)) {
        socket.emit("error-equipo", {
          error: true,
          mensaje: "El equipo ya existe en la actividad"
        });
        return;
      }

      // Registrar el equipo en uso con el nombre de la actividad
      equiposEnUso[equipoId] = { 
        totem: socket.id, 
        actividad: actividadId,
        actividadNombre: actividadNombre || "Actividad sin nombre"
      };
      
      // Registrar el equipo en la actividad
      if (!actividadesEquipos[actividadId]) {
        actividadesEquipos[actividadId] = new Set();
      } else if (!(actividadesEquipos[actividadId] instanceof Set)) {
        // Corrección: si no es un Set, convertirlo a uno
        console.log(`⚠️ Corrigiendo actividadesEquipos[${actividadId}] que no es un Set`);
        actividadesEquipos[actividadId] = new Set(Array.isArray(actividadesEquipos[actividadId]) 
          ? actividadesEquipos[actividadId] 
          : []);
      }
      
      actividadesEquipos[actividadId].add(equipoId);

      console.log(`✅ Equipo ${equipoId} ocupado por actividad ${actividadId} (${actividadNombre})`);
      
      saveState();
      io.emit("actualizar-equipos", equiposEnUso);
    } catch (error) {
      console.error('❌ Error al usar equipo:', error);
      socket.emit("error-equipo", {
        error: true,
        mensaje: "Error al procesar la solicitud"
      });
    }
  });

  // Evento cuando un tótem libera un equipo
  socket.on("liberar-equipo", (data) => {
    try {
      const { equipoId, actividadId } = data;
      
      if (!equipoId) {
        socket.emit("error-equipo", {
          error: true,
          mensaje: "ID de equipo no proporcionado"
        });
        return;
      }
      
      // Verificar si la actividad existe en el registro
      if (actividadesEquipos[actividadId]) {
        // Verificar si actividadesEquipos[actividadId] es un Set
        if (typeof actividadesEquipos[actividadId].delete !== 'function') {
          // Si no es un Set, lo convertimos a uno
          console.log(`⚠️ La actividad ${actividadId} no tiene un Set válido. Creando uno nuevo.`);
          actividadesEquipos[actividadId] = new Set(Array.isArray(actividadesEquipos[actividadId]) 
            ? actividadesEquipos[actividadId] 
            : []);
        }
        
        // Ahora podemos eliminar con seguridad
        actividadesEquipos[actividadId].delete(equipoId);
        
        // Si no quedan equipos en la actividad, eliminar la actividad
        if (actividadesEquipos[actividadId].size === 0) {
          delete actividadesEquipos[actividadId];
        }
      }
      
      if (equiposEnUso[equipoId]) {
        console.log(`🔓 Equipo ${equipoId} liberado`);
        delete equiposEnUso[equipoId];
        saveState();
        io.emit("actualizar-equipos", equiposEnUso);
      }
    } catch (error) {
      console.error('❌ Error al liberar equipo:', error);
      socket.emit("error-equipo", {
        error: true,
        mensaje: "Error al procesar la solicitud"
      });
    }
  });

  // Cuando un tótem se desconecta
  socket.on("disconnect", () => {
    console.log(`❌ Tótem desconectado: ${socket.id}`);
    clientesConectados.delete(socket.id);
    broadcastClients();
  });
});

// Endpoint para obtener el estado actual
app.get('/api/equipment-state', (req, res) => {
  try {
    // Convertir Sets a arrays para la respuesta API
    const actividadesEquiposResponse = {};
    Object.keys(actividadesEquipos).forEach(key => {
      if (actividadesEquipos[key] instanceof Set) {
        actividadesEquiposResponse[key] = Array.from(actividadesEquipos[key]);
      } else {
        actividadesEquiposResponse[key] = [];
      }
    });

    res.json({ 
      equiposEnUso, 
      actividadesEquipos: actividadesEquiposResponse
    });
  } catch (error) {
    console.error('❌ Error al obtener estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Middleware para proporcionar información sobre el servidor
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sistema de gestión de equipos - API WebSocket',
    status: 'running',
    endpoints: [
      '/health',
      '/api/equipment-state'
    ],
    websocket: `ws://${req.headers.host}`
  });
});

// Manejo de errores para Express
app.use((err, req, res, next) => {
  console.error('❌ Error en Express:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Capturar errores no manejados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no manejado:', error);
  // No cerrar el servidor, solo registrar el error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});

// Iniciar el servidor
server.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor WebSocket corriendo en http://${HOST}:${PORT}`);
  console.log(`📊 Estadísticas: ${Object.keys(equiposEnUso).length} equipos, ${Object.keys(actividadesEquipos).length} actividades`);
  console.log(`🌐 Aceptando conexiones de: ${ALLOWED_ORIGINS.join(', ')}`);
});

// Después de actualizar un casillero
const updateLocker = async (lockerId, status) => {
  // Lógica para actualizar el casillero en la base de datos
  
  // Emitir evento a los clientes
  io.emit('locker-status-changed', { lockerId, status });
}
