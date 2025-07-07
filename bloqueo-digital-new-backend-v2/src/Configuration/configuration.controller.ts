import { Request, Response } from 'express';
import Configuration, { IConfiguration } from './configuration.model';
import mongoose from 'mongoose';

class ConfigurationController {

  // Obtener configuración (crear una por defecto si no existe)
  async getConfiguration(req: Request, res: Response): Promise<void> {
    try {
      let configuration = await Configuration.findOne();
      
      // Si no existe configuración, crear una por defecto
      if (!configuration) {
        configuration = new Configuration({
          nombreSistema: 'Sistema de Bloqueo Digital',
          version: '2.0.0',
          configuracionGeneral: {},
          configuracionSeguridad: {},
          configuracionNotificaciones: {},
          configuracionTotems: {},
          configuracionBD: {},
          configuracionLogs: {}
        });
        await configuration.save();
      }
      
      res.status(200).json(configuration);
    } catch (error) {
      console.error('Error getting configuration:', error);
      res.status(500).json({ 
        message: 'Error al obtener la configuración',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Actualizar configuración completa
  async updateConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const updateData = req.body;
      
      let configuration = await Configuration.findOne();
      
      if (!configuration) {
        // Crear nueva configuración si no existe
        configuration = new Configuration(updateData);
      } else {
        // Actualizar configuración existente
        Object.assign(configuration, updateData);
      }
      
      await configuration.save();
      res.status(200).json(configuration);
    } catch (error) {
      console.error('Error updating configuration:', error);
      res.status(500).json({ 
        message: 'Error al actualizar la configuración',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Subir/actualizar logo específicamente
  async updateLogo(req: Request, res: Response): Promise<void> {
    try {
      const { logo } = req.body;
      
      if (!logo && logo !== '') {
        res.status(400).json({ message: 'Logo es requerido' });
        return;
      }

      // Validar que el logo sea base64 válido (si no está vacío)
      if (logo && logo !== '') {
        const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
        if (!base64Regex.test(logo)) {
          res.status(400).json({ message: 'El logo debe ser una imagen en formato base64 válido' });
          return;
        }
      }
      
      let configuration = await Configuration.findOne();
      
      if (!configuration) {
        // Crear nueva configuración con el logo
        configuration = new Configuration({ logo });
      } else {
        // Actualizar solo el logo
        configuration.logo = logo;
      }
      
      await configuration.save();
      res.status(200).json(configuration);
    } catch (error) {
      console.error('Error updating logo:', error);
      res.status(500).json({ 
        message: 'Error al actualizar el logo',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener solo el logo
  async getLogo(req: Request, res: Response): Promise<void> {
    try {
      const configuration = await Configuration.findOne().select('logo');
      
      if (!configuration) {
        res.status(200).json({ logo: null });
        return;
      }
      
      res.status(200).json({ logo: configuration.logo || null });
    } catch (error) {
      console.error('Error getting logo:', error);
      res.status(500).json({ 
        message: 'Error al obtener el logo',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Actualizar sección específica de configuración
  async updateConfigurationSection(req: Request, res: Response): Promise<void> {
    try {
      const { section } = req.params;
      const sectionData = req.body;
      
      const validSections = [
        'configuracionGeneral',
        'configuracionSeguridad', 
        'configuracionNotificaciones',
        'configuracionTotems',
        'configuracionBD',
        'configuracionLogs'
      ];
      
      if (!validSections.includes(section)) {
        res.status(400).json({ message: 'Sección de configuración inválida' });
        return;
      }
      
      let configuration = await Configuration.findOne();
      
      if (!configuration) {
        // Crear nueva configuración
        configuration = new Configuration();
      }
      
      // Actualizar la sección específica
      (configuration as any)[section] = sectionData;
      
      await configuration.save();
      res.status(200).json(configuration);
    } catch (error) {
      console.error('Error updating configuration section:', error);
      res.status(500).json({ 
        message: 'Error al actualizar la sección de configuración',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Resetear configuración a valores por defecto
  async resetConfiguration(req: Request, res: Response): Promise<void> {
    try {
      await Configuration.deleteMany({});
      
      const defaultConfiguration = new Configuration({
        nombreSistema: 'Sistema de Bloqueo Digital',
        version: '2.0.0',
        configuracionGeneral: {},
        configuracionSeguridad: {},
        configuracionNotificaciones: {},
        configuracionTotems: {},
        configuracionBD: {},
        configuracionLogs: {}
      });
      
      await defaultConfiguration.save();
      res.status(200).json(defaultConfiguration);
    } catch (error) {
      console.error('Error resetting configuration:', error);
      res.status(500).json({ 
        message: 'Error al resetear la configuración',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Verificar estado de conexión a la base de datos
  async checkDatabaseConnection(req: Request, res: Response): Promise<void> {
    try {
      const dbState = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      const isConnected = dbState === 1;
      const stateText = states[dbState as keyof typeof states] || 'unknown';

      let connectionInfo: any = {
        isConnected,
        state: stateText,
        host: mongoose.connection.host || 'N/A',
        name: mongoose.connection.name || 'N/A',
        readyState: dbState
      };

      // Información adicional si está conectado
      if (isConnected) {
        try {
          // Verificar que podemos hacer operaciones básicas
          const testQuery = await Configuration.countDocuments();
          connectionInfo.canQuery = true;
          connectionInfo.documentsCount = testQuery;
          
          // Obtener información de la base de datos
          if (mongoose.connection.db) {
            const admin = mongoose.connection.db.admin();
            const serverInfo = await admin.serverStatus();
            
            connectionInfo.mongoVersion = serverInfo.version;
            connectionInfo.uptime = serverInfo.uptime;
          }
          
          connectionInfo.lastPing = new Date().toISOString();
        } catch (queryError) {
          connectionInfo.canQuery = false;
          connectionInfo.queryError = (queryError as Error).message;
        }
      }

      res.status(200).json(connectionInfo);
    } catch (error) {
      console.error('Error checking database connection:', error);
      res.status(500).json({ 
        isConnected: false,
        state: 'error',
        message: 'Error al verificar la conexión a la base de datos',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Intentar reconectar a la base de datos
  async reconnectDatabase(req: Request, res: Response): Promise<void> {
    try {
      const currentState = mongoose.connection.readyState;
      
      if (currentState === 1) {
        res.status(200).json({ 
          message: 'La base de datos ya está conectada',
          isConnected: true 
        });
        return;
      }

      // Intentar reconectar
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloqueo-digital');
      
      res.status(200).json({ 
        message: 'Reconexión exitosa a la base de datos',
        isConnected: true,
        reconnectedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error reconnecting to database:', error);
      res.status(500).json({ 
        message: 'Error al reconectar a la base de datos',
        isConnected: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener temas disponibles
  async getThemes(req: Request, res: Response): Promise<void> {
    try {
      let configuration = await Configuration.findOne();
      
      if (!configuration || !configuration.themes) {
        // Crear configuración con temas por defecto si no existe
        configuration = new Configuration();
        await configuration.save();
      }

      res.status(200).json({
        currentTheme: configuration.currentTheme || 'default',
        themes: configuration.themes || []
      });
    } catch (error) {
      console.error('Error getting themes:', error);
      res.status(500).json({ 
        message: 'Error al obtener los temas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Cambiar tema actual
  async changeTheme(req: Request, res: Response): Promise<void> {
    try {
      const { themeId } = req.body;
      
      if (!themeId) {
        res.status(400).json({ message: 'ID del tema es requerido' });
        return;
      }

      let configuration = await Configuration.findOne();
      
      if (!configuration) {
        configuration = new Configuration();
      }

      // Verificar que el tema existe
      const themeExists = configuration.themes?.some(theme => theme.id === themeId);
      
      if (!themeExists) {
        res.status(400).json({ message: 'El tema especificado no existe' });
        return;
      }

      configuration.currentTheme = themeId;
      await configuration.save();

      res.status(200).json({
        message: 'Tema cambiado exitosamente',
        currentTheme: configuration.currentTheme,
        themes: configuration.themes
      });
    } catch (error) {
      console.error('Error changing theme:', error);
      res.status(500).json({ 
        message: 'Error al cambiar el tema',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Actualizar un tema específico
  async updateTheme(req: Request, res: Response): Promise<void> {
    try {
      const { themeId } = req.params;
      const {
        name,
        displayName,
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        textColor,
        cardColor,
        borderColor,
        sidebarHeaderColor,
        sidebarLinkColor
      } = req.body;
      
      let configuration = await Configuration.findOne();
      
      if (!configuration) {
        res.status(404).json({ message: 'Configuración no encontrada' });
        return;
      }

      if (!configuration.themes) {
        res.status(404).json({ message: 'No hay temas configurados' });
        return;
      }

      const themeIndex = configuration.themes.findIndex(theme => theme.id === themeId);
      
      if (themeIndex === -1) {
        res.status(404).json({ message: 'Tema no encontrado' });
        return;
      }

      const theme = configuration.themes[themeIndex];

      // No permitir editar temas predeterminados
      if (theme.isDefault || ['default', 'dark', 'green'].includes(theme.id)) {
        res.status(400).json({ message: 'No se pueden editar los temas predeterminados' });
        return;
      }

      // Validar campos requeridos
      if (!name || !displayName || !primaryColor || !secondaryColor || !accentColor || !backgroundColor || !textColor || !cardColor || !borderColor || !sidebarHeaderColor || !sidebarLinkColor) {
        res.status(400).json({ message: 'Todos los campos de color son requeridos' });
        return;
      }

      // Validar formato de colores (hex)
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      const colors = [primaryColor, secondaryColor, accentColor, backgroundColor, textColor, cardColor, borderColor, sidebarHeaderColor, sidebarLinkColor];
      
      for (const color of colors) {
        if (!hexColorRegex.test(color)) {
          res.status(400).json({ message: `Color inválido: ${color}. Use formato hexadecimal (#FFFFFF)` });
          return;
        }
      }

      // Verificar que el nombre no exista en otros temas (excepto el actual)
      const nameExists = configuration.themes.some((t, index) => 
        index !== themeIndex && t.name.toLowerCase() === name.toLowerCase()
      );
      if (nameExists) {
        res.status(400).json({ message: 'Ya existe un tema con ese nombre' });
        return;
      }

      // Actualizar el tema
      configuration.themes[themeIndex] = {
        ...theme,
        name: name.toLowerCase().replace(/\s+/g, '_'),
        displayName,
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        textColor,
        cardColor,
        borderColor,
        sidebarHeaderColor,
        sidebarLinkColor
      };

      await configuration.save();

      res.status(200).json({
        message: 'Tema actualizado exitosamente',
        theme: configuration.themes[themeIndex],
        themes: configuration.themes
      });
    } catch (error) {
      console.error('Error updating theme:', error);
      res.status(500).json({ 
        message: 'Error al actualizar el tema',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener tema específico por ID
  async getTheme(req: Request, res: Response): Promise<void> {
    try {
      const { themeId } = req.params;
      
      let configuration = await Configuration.findOne();
      
      if (!configuration || !configuration.themes) {
        res.status(404).json({ message: 'No hay temas configurados' });
        return;
      }

      const theme = configuration.themes.find(theme => theme.id === themeId);
      
      if (!theme) {
        res.status(404).json({ message: 'Tema no encontrado' });
        return;
      }

      res.status(200).json({ theme });
    } catch (error) {
      console.error('Error getting theme:', error);
      res.status(500).json({ 
        message: 'Error al obtener el tema',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear tema personalizado
  async createCustomTheme(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        displayName,
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        textColor,
        cardColor,
        borderColor,
        sidebarHeaderColor,
        sidebarLinkColor
      } = req.body;

      // Validar campos requeridos
      if (!name || !displayName || !primaryColor || !secondaryColor || !accentColor || !backgroundColor || !textColor || !cardColor || !borderColor || !sidebarHeaderColor || !sidebarLinkColor) {
        res.status(400).json({ message: 'Todos los campos de color son requeridos' });
        return;
      }

      // Validar formato de colores (hex)
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      const colors = [primaryColor, secondaryColor, accentColor, backgroundColor, textColor, cardColor, borderColor, sidebarHeaderColor, sidebarLinkColor];
      
      for (const color of colors) {
        if (!hexColorRegex.test(color)) {
          res.status(400).json({ message: `Color inválido: ${color}. Use formato hexadecimal (#FFFFFF)` });
          return;
        }
      }

      let configuration = await Configuration.findOne();
      
      if (!configuration) {
        configuration = new Configuration();
      }

      if (!configuration.themes) {
        configuration.themes = [];
      }

      // Generar ID único para el tema personalizado
      const customThemeId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Verificar que el nombre no exista
      const nameExists = configuration.themes.some(theme => theme.name.toLowerCase() === name.toLowerCase());
      if (nameExists) {
        res.status(400).json({ message: 'Ya existe un tema con ese nombre' });
        return;
      }

      // Crear el nuevo tema personalizado
      const newTheme = {
        id: customThemeId,
        name: name.toLowerCase().replace(/\s+/g, '_'),
        displayName,
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        textColor,
        cardColor,
        borderColor,
        sidebarHeaderColor,
        sidebarLinkColor,
        isDefault: false
      };

      // Agregar el tema a la configuración
      configuration.themes.push(newTheme);
      await configuration.save();

      res.status(201).json({
        message: 'Tema personalizado creado exitosamente',
        theme: newTheme,
        themes: configuration.themes
      });
    } catch (error) {
      console.error('Error creating custom theme:', error);
      res.status(500).json({ 
        message: 'Error al crear el tema personalizado',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Eliminar tema personalizado
  async deleteCustomTheme(req: Request, res: Response): Promise<void> {
    try {
      const { themeId } = req.params;
      
      let configuration = await Configuration.findOne();
      
      if (!configuration || !configuration.themes) {
        res.status(404).json({ message: 'No hay temas configurados' });
        return;
      }

      const themeIndex = configuration.themes.findIndex(theme => theme.id === themeId);
      
      if (themeIndex === -1) {
        res.status(404).json({ message: 'Tema no encontrado' });
        return;
      }

      const theme = configuration.themes[themeIndex];

      // No permitir eliminar temas por defecto
      if (theme.isDefault || ['default', 'dark', 'green'].includes(theme.id)) {
        res.status(400).json({ message: 'No se pueden eliminar los temas predeterminados' });
        return;
      }

      // Si el tema a eliminar es el actual, cambiar al tema por defecto
      if (configuration.currentTheme === themeId) {
        configuration.currentTheme = 'dark'; // Cambiar al tema oscuro por defecto
      }

      // Eliminar el tema
      configuration.themes.splice(themeIndex, 1);
      await configuration.save();

      res.status(200).json({
        message: 'Tema personalizado eliminado exitosamente',
        currentTheme: configuration.currentTheme,
        themes: configuration.themes
      });
    } catch (error) {
      console.error('Error deleting custom theme:', error);
      res.status(500).json({ 
        message: 'Error al eliminar el tema personalizado',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Resetear temas a valores por defecto
  async resetThemes(req: Request, res: Response): Promise<void> {
    try {
      let configuration = await Configuration.findOne();
      
      if (!configuration) {
        configuration = new Configuration();
      }

      // Resetear a temas por defecto
      configuration.themes = [
        {
          id: 'default',
          name: 'default',
          displayName: 'Tema Por Defecto',
          primaryColor: '#0891b2',
          secondaryColor: '#0e7490',
          accentColor: '#06b6d4',
          backgroundColor: '#f8fafc',
          textColor: '#1e293b',
          cardColor: '#ffffff',
          borderColor: '#e2e8f0',
          sidebarHeaderColor: '#6b7280',
          sidebarLinkColor: '#374151',
          isDefault: true
        },
        {
          id: 'dark',
          name: 'dark',
          displayName: 'Tema Oscuro',
          primaryColor: '#6366f1',
          secondaryColor: '#4f46e5',
          accentColor: '#8b5cf6',
          backgroundColor: '#0f172a',
          textColor: '#f1f5f9',
          cardColor: '#1e293b',
          borderColor: '#334155',
          sidebarHeaderColor: '#9ca3af',
          sidebarLinkColor: '#d1d5db',
          isDefault: false
        },
        {
          id: 'green',
          name: 'green',
          displayName: 'Tema Verde',
          primaryColor: '#059669',
          secondaryColor: '#047857',
          accentColor: '#10b981',
          backgroundColor: '#f0fdf4',
          textColor: '#1f2937',
          cardColor: '#ffffff',
          borderColor: '#d1fae5',
          sidebarHeaderColor: '#065f46',
          sidebarLinkColor: '#047857',
          isDefault: false
        }
      ];
      
      configuration.currentTheme = 'default';
      await configuration.save();

      res.status(200).json({
        message: 'Temas reseteados exitosamente',
        currentTheme: configuration.currentTheme,
        themes: configuration.themes
      });
    } catch (error) {
      console.error('Error resetting themes:', error);
      res.status(500).json({ 
        message: 'Error al resetear los temas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}

export default new ConfigurationController(); 