import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario } from '../users/users.model';
import axios from 'axios';
import zlib from 'zlib';
import https from 'https';

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validar que se proporcionen las credenciales
      if (!email || !password) {
        return res.status(400).json({
          mensaje: 'Email y contraseña son requeridos'
        });
      }

      // Buscar usuario por email
      const usuario = await Usuario.findOne({ email });

      if (!usuario) {
        return res.status(401).json({
          mensaje: 'Credenciales inválidas'
        });
      }

      // Verificar que el usuario tenga contraseña
      if (!usuario.password) {
        return res.status(401).json({
          mensaje: 'Error en las credenciales del usuario'
        });
      }

      // Verificar contraseña
      const isMatch = await bcrypt.compare(password, usuario.password);

      if (!isMatch) {
        return res.status(401).json({
          mensaje: 'Credenciales inválidas'
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        { 
          id: usuario._id,
          email: usuario.email,
          perfil: usuario.perfil 
        },
        process.env.JWT_SECRET || 'tu_jwt_secret',
        { expiresIn: '24h' }
      );

      // Actualizar último login
      usuario.lastLogin = new Date();
      await usuario.save();

      // Enviar respuesta
      res.json({
        mensaje: 'Login exitoso',
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          perfil: usuario.perfil,
          empresa: usuario.empresa,
          disciplina: usuario.disciplina,
          fingerprintsComplete: usuario.fingerprintsComplete
        },
        token
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        mensaje: 'Error en el servidor',
        error: (error as Error).message
      });
    }
  },

 async loginByFingerprint (req: Request, res: Response){
    const { template } = req.body;
  
    try {
      // Obtener todos los usuarios con huellas
      const users = await Usuario.find({ 'fingerprints.template': { $exists: true, $ne: null } });

      for (const user of users) {
        for (const userFingerprint of user.fingerprints) {
          const body = new URLSearchParams();
          body.append('Template1', template);
          body.append('Template2', userFingerprint.template);

          const response = await axios.post('https://localhost:8443/SGIFPCompare', body.toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              origin: 'http://localhost',
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Ignorar verificación del certificado
          });

          // Verificar si las huellas coinciden
          if (response.data.match) {
            return res.status(200).json({
              message: 'Autenticación exitosa',
              user: user.toJSON()
            });
          }
        }
      }

      res.status(401).json({ message: 'No se encontró una huella coincidente' });
    } catch (error) {
      console.error('Error en la autenticación:', error);
      res.status(500).json({ message: 'Error en el servidor', detalles: (error as Error).message });
    }
  },

  async validateToken(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          mensaje: 'Token no proporcionado'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret') as jwt.JwtPayload;
      
      const usuario = await Usuario.findById(decoded.id).select('-password');

      if (!usuario) {
        return res.status(401).json({
          mensaje: 'Usuario no encontrado'
        });
      }

      res.json({
        mensaje: 'Token válido',
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          perfil: usuario.perfil,
          empresa: usuario.empresa,
          disciplina: usuario.disciplina,
          fingerprintsComplete: usuario.fingerprintsComplete
        }
      });
    } catch (error) {
      res.status(401).json({
        mensaje: 'Token inválido',
        error: (error as Error).message
      });
    }
  },

  async changePassword(req: Request, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).usuario.id; // Asumiendo que viene del middleware de auth

      const usuario = await Usuario.findById(userId);

      if (!usuario || !usuario.password) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const isMatch = await bcrypt.compare(currentPassword, usuario.password);

      if (!isMatch) {
        return res.status(401).json({
          mensaje: 'Contraseña actual incorrecta'
        });
      }

      // Actualizar contraseña
      usuario.password = await bcrypt.hash(newPassword, 10);
      await usuario.save();

      res.json({
        mensaje: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        mensaje: 'Error al cambiar la contraseña',
        error: (error as Error).message
      });
    }
  },


 /*  async captureFingerprint(req: Request, res: Response) {
    try {
      const body = new URLSearchParams();
      body.append('Timeout', '10000');
      body.append('Quality', '50');
      body.append('licstr', ''); // Reemplaza con el valor correcto
      body.append('templateFormat', 'ISO');
      body.append('imageWSQRate', '0.75');
  
      const response = await axios.post('http://your-fingerprint-sdk-url', body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          origin: 'http://localhost',
        },
      });
  
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: 'Error al capturar la huella dactilar', detalles: (error as Error).message });
    }
  }, */
 async  compareFingerprint(req: Request, res: Response) {
    try {
      const { fingerprint1, fingerprint2 } = req.body;
  
      const body = new URLSearchParams();
      body.append('Template1', fingerprint1);
      body.append('Template2', fingerprint2);
  
      const response = await axios.post('https://localhost:8443/SGIFPCompare', body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          origin: 'http://localhost',
        },
      });
  
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: 'Error al comparar las huellas dactilares', detalles: (error as Error).message });
    }
  }

};