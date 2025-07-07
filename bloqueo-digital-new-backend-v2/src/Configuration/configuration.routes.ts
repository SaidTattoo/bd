import { Router } from 'express';
import ConfigurationController from './configuration.controller';

const router = Router();

// GET /api/configuracion - Obtener configuración completa
router.get('/', ConfigurationController.getConfiguration);

// PUT /api/configuracion - Actualizar configuración completa
router.put('/', ConfigurationController.updateConfiguration);

// GET /api/configuracion/logo - Obtener solo el logo
router.get('/logo', ConfigurationController.getLogo);

// PUT /api/configuracion/logo - Actualizar solo el logo
router.put('/logo', ConfigurationController.updateLogo);

// PUT /api/configuracion/section/:section - Actualizar sección específica
router.put('/section/:section', ConfigurationController.updateConfigurationSection);

// DELETE /api/configuracion/reset - Resetear configuración a valores por defecto
router.delete('/reset', ConfigurationController.resetConfiguration);

// GET /api/configuracion/database/status - Verificar estado de conexión a la base de datos
router.get('/database/status', ConfigurationController.checkDatabaseConnection);

// POST /api/configuracion/database/reconnect - Intentar reconectar a la base de datos
router.post('/database/reconnect', ConfigurationController.reconnectDatabase);

// GET /api/configuracion/themes - Obtener temas disponibles
router.get('/themes', ConfigurationController.getThemes);

// GET /api/configuracion/themes/:themeId - Obtener tema específico por ID
router.get('/themes/:themeId', ConfigurationController.getTheme);

// POST /api/configuracion/themes/change - Cambiar tema actual
router.post('/themes/change', ConfigurationController.changeTheme);

// PUT /api/configuracion/themes/:themeId - Actualizar un tema específico
router.put('/themes/:themeId', ConfigurationController.updateTheme);

// POST /api/configuracion/themes/reset - Resetear temas a valores por defecto
router.post('/themes/reset', ConfigurationController.resetThemes);

// POST /api/configuracion/themes/custom - Crear tema personalizado
router.post('/themes/custom', ConfigurationController.createCustomTheme);

// DELETE /api/configuracion/themes/custom/:themeId - Eliminar tema personalizado
router.delete('/themes/custom/:themeId', ConfigurationController.deleteCustomTheme);

export default router; 