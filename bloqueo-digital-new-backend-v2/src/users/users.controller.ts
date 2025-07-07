import { Request, Response } from 'express';
import { IFingerprint } from './users.types';
import bcrypt from 'bcryptjs';
import Usuario from './users.model';

export const userController = {
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await Usuario.find().select('-password').lean();
      
      if (!users || users.length === 0) {
        return res.status(404).json({
          mensaje: 'No se encontraron usuarios'
        });
      }

      res.json(users);
    } catch (error) {
      res.status(500).json({
        error: 'Error al obtener usuarios',
        detalles: (error as Error).message
      });
    }
  },


  async getEnergyOwners(req: Request, res: Response) {
    try {
      const users = await Usuario.find({perfil: 'duenoDeEnergia'}).select('-password').lean();
      res.json(users);
    } catch (error) {
      res.status(500).json({
        error: 'Error al obtener los energistas',
        detalles: (error as Error).message
      });
    }
  },

  async getUsersByProfile(req: Request, res: Response) {
    try {
      const { profile } = req.params;
      const validProfiles = ['trabajador', 'supervisor', 'duenoDeEnergia'];
      
      if (!validProfiles.includes(profile)) {
        return res.status(400).json({
          mensaje: 'Perfil no válido. Los perfiles válidos son: trabajador, supervisor, duenoDeEnergia'
        });
      }

      const users = await Usuario.find({ perfil: profile }).select('-password').lean();
      
      if (!users || users.length === 0) {
        return res.status(404).json({
          mensaje: `No se encontraron usuarios con perfil: ${profile}`
        });
      }

      res.json(users);
    } catch (error) {
      res.status(500).json({
        error: 'Error al obtener usuarios por perfil',
        detalles: (error as Error).message
      });
    }
  },

  async getUserById(req: Request, res: Response) {
    try {
      const user = await Usuario.findById(req.params.id).select('-password');
      
      if (!user) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({
        error: 'Error al obtener el usuario',
        detalles: (error as Error).message
      });
    }
  },

  async createUser(req: Request, res: Response) {

    try {
      const newUser = new Usuario(req.body);
      await newUser.save();
      

      const userResponse = newUser.toJSON();
      delete userResponse.password;

      console.log(userResponse);

      res.status(201).json({
        mensaje: 'Usuario creado exitosamente',
        usuario: userResponse
      });
    } catch (error) {
      res.status(400).json({
        error: 'Error al crear el usuario',
        detalles: (error as Error).message
      });
    }
  },

  async updateUser(req: Request, res: Response) {
    try {
      if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, 10);
      }

      const user = await Usuario.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }

      res.json({
        mensaje: 'Usuario actualizado exitosamente',
        usuario: user
      });
    } catch (error) {
      res.status(400).json({
        error: 'Error al actualizar el usuario',
        detalles: (error as Error).message
      });
    }
  },

  async deleteUser(req: Request, res: Response) {
    try {
      const user = await Usuario.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }

      res.json({
        mensaje: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error al eliminar el usuario',
        detalles: (error as Error).message
      });
    }
  },

  async addFingerprint(req: Request, res: Response) {
    try {
      const { position, template, quality } = req.body;
      const user = await Usuario.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }

      const newFingerprint: IFingerprint = {
        position,
        template,
        quality,
        capturedAt: new Date()
      };

      // Verificar si ya existe una huella para esa posición
      const existingIndex = user.fingerprints.findIndex(f => f.position === position);
      if (existingIndex >= 0) {
        user.fingerprints[existingIndex] = newFingerprint;
      } else {
        user.fingerprints.push(newFingerprint);
      }

      user.fingerprintsComplete = user.fingerprints.length === 10;
      await user.save();

      res.json({
        mensaje: 'Huella digital agregada exitosamente',
        usuario: user
      });
    } catch (error) {
      res.status(400).json({
        error: 'Error al agregar la huella digital',
        detalles: (error as Error).message
      });
    }
  },
  async findUserByFingerPrint(req: Request, res: Response) {
    try {
      const { template } = req.query;
      const user = await Usuario.findOne({ 'fingerprints.template': template });
      res.json(user);
    } catch (error) {
      res.status(400).json({
        error: 'Error al encontrar el usuario por huella digital',
        detalles: (error as Error).message
      });
    }
  },
  async validateFingerprint(req: Request, res: Response) {
    try {
      const { position, template } = req.body;
      const user = await Usuario.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }

      const isValid = await user.validateFingerprint(position, template);

      res.json({
        valido: isValid,
        mensaje: isValid ? 'Huella digital válida' : 'Huella digital inválida'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Error al validar la huella digital',
        detalles: (error as Error).message
      });
    }
  },
  async loginByEmailandPassword(req: Request, res: Response) {
    const { email, password } = req.body;
    try {
      const user: any = await Usuario.findOne({ email });
      if (!user) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          mensaje: 'Contraseña incorrecta'
        });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({
        error: 'Error al iniciar sesión',
        detalles: (error as Error).message
      });
    }
  }
};



