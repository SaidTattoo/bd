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
exports.clearAllCasilleros = exports.removeEquipmentFromCasillero = exports.createCasillero = exports.assignEquipmentToCasillero = exports.createTotem = exports.getCasilleros = void 0;
const equipment_model_1 = require("../Equipment/equipment.model");
const totem_model_1 = __importDefault(require("./totem.model"));
/**
 * @swagger
 * /totem/{id}:
 *   get:
 *     summary: Obtener casilleros por ID de totem
 *     tags: [Totem]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Casilleros del totem
 *       404:
 *         description: Totem no encontrado
 */
const getCasilleros = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const newtotem = yield totem_model_1.default.findById(id);
        if (!newtotem) {
            return res.status(404).json({ message: 'Totem not found' });
        }
        res.status(200).json(newtotem.casilleros);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.getCasilleros = getCasilleros;
/**
 * @swagger
 * /totem:
 *   post:
 *     summary: Crear un nuevo totem
 *     tags: [Totem]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               casilleros:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Totem creado
 *       400:
 *         description: Error en la solicitud
 */
const createTotem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const newtotem = yield totem_model_1.default.create(req.body);
    res.status(201).json(newtotem);
});
exports.createTotem = createTotem;
//al cassillero se le pueden asignar equipos, si se le asignan equipos el casillero se marca como ocupado
const assignEquipmentToCasillero = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, casilleroId } = req.params;
    const { equipos, activityId } = req.body;
    console.log('Received activityId:', activityId); // Log para verificar el activityId recibido
    const newtotem = yield totem_model_1.default.findById(id);
    if (!newtotem) {
        return res.status(404).json({ message: 'Totem not found' });
    }
    const casillero = newtotem.casilleros.find(casillero => casillero._id.toString() === casilleroId);
    if (!casillero) {
        return res.status(404).json({ message: 'Casillero not found' });
    }
    const equipmentIds = equipos.map((equipo) => equipo);
    if (equipmentIds.includes(null) || equipmentIds.includes(undefined)) {
        return res.status(400).json({ message: 'Uno o más IDs de equipos son inválidos' });
    }
    casillero.equipos.push(...equipmentIds);
    casillero.activityId = activityId;
    casillero.status = 'ocupado';
    try {
        yield newtotem.save();
        const updatedTotem = yield totem_model_1.default.findById(id); // Recargar el documento para verificar
        console.log('Totem saved successfully with updated casillero:', updatedTotem);
        res.status(200).json(updatedTotem);
    }
    catch (error) {
        console.error('Error al guardar el tótem:', error);
        return res.status(500).json({ message: 'Error al guardar el tótem', error: error.message });
    }
});
exports.assignEquipmentToCasillero = assignEquipmentToCasillero;
/**
 * @swagger
 * /totem/{id}/casillero:
 *   post:
 *     summary: Crear un nuevo casillero en un totem
 *     tags: [Totem]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               equipos:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Casillero creado
 *       400:
 *         description: Error en la solicitud
 */
const createCasillero = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { _id } = req.params;
    const newtotem = yield totem_model_1.default.findById(_id);
    if (!newtotem) {
        return res.status(404).json({ message: 'Totem not found' });
    }
    // Agregar un casillero al tótem
    console.log('Casilleros antes de agregar:', newtotem.casilleros);
    newtotem.casilleros.push(req.body);
    console.log('Casilleros después de agregar:', newtotem.casilleros);
    try {
        yield newtotem.save();
        res.status(201).json(newtotem);
    }
    catch (error) {
        console.error('Error al guardar el tótem:', error);
        return res.status(500).json({ message: 'Error al guardar el tótem', error: error.message });
    }
});
exports.createCasillero = createCasillero;
const removeEquipmentFromCasillero = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, casilleroId } = req.params;
    console.log('id:', id);
    console.log('casilleroId:', casilleroId);
    const newtotem = yield totem_model_1.default.findById(id);
    if (!newtotem) {
        return res.status(404).json({ message: 'Totem not found' });
    }
    const casillero = newtotem.casilleros.find(casillero => casillero._id.toString() === casilleroId);
    if (!casillero) {
        return res.status(404).json({ message: 'Casillero not found' });
    }
    // Obtener los IDs de los equipos antes de eliminarlos
    const equipmentIds = casillero.equipos.map(equipo => equipo._id);
    // Quitar todos los equipos y eliminar el ID de la actividad
    casillero.equipos = [];
    delete casillero.activityId; // Eliminar el campo activityId
    console.log('ActivityId eliminado:', casillero.activityId); // Log para verificar la eliminación
    casillero.status = 'disponible';
    try {
        // Actualizar el estado de zeroEnergyValidated a false para los equipos removidos
        yield equipment_model_1.EquipmentModel.updateMany({ _id: { $in: equipmentIds } }, { $set: { zeroEnergyValidated: false } });
        yield newtotem.save();
        const updatedTotem = yield totem_model_1.default.findById(id); // Recargar el documento para verificar
        console.log('Totem actualizado:', updatedTotem);
        res.status(200).json(updatedTotem);
    }
    catch (error) {
        console.error('Error al guardar el tótem:', error);
        return res.status(500).json({ message: 'Error al guardar el tótem', error: error.message });
    }
});
exports.removeEquipmentFromCasillero = removeEquipmentFromCasillero;
const clearAllCasilleros = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const newtotem = yield totem_model_1.default.findById(id);
        if (!newtotem) {
            return res.status(404).json({ message: 'Totem not found' });
        }
        // Limpiar todos los casilleros
        newtotem.casilleros.forEach(casillero => {
            casillero.equipos = [];
            delete casillero.activityId; // Eliminar el campo activityId si existe
            casillero.status = 'disponible';
        });
        yield newtotem.save();
        res.status(200).json({
            message: 'Todos los casilleros han sido limpiados exitosamente',
            newtotem
        });
    }
    catch (error) {
        console.error('Error al limpiar los casilleros:', error);
        res.status(500).json({ message: 'Error al limpiar los casilleros', error: error.message });
    }
});
exports.clearAllCasilleros = clearAllCasilleros;
