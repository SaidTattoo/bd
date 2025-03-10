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
Object.defineProperty(exports, "__esModule", { value: true });
exports.equipmentController = void 0;
const activity_model_1 = require("../activity/activity.model");
const equipment_model_1 = require("./equipment.model");
exports.equipmentController = {
    getAllEquipment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const equipment = yield equipment_model_1.EquipmentModel.find({ deleted: false })
                    .populate('area', 'name description')
                    .populate('activities', 'name description blockType');
                if (!equipment || equipment.length === 0) {
                    return res.status(404).json({
                        mensaje: 'No se encontraron equipos'
                    });
                }
                res.json(equipment);
            }
            catch (error) {
                res.status(500).json({
                    error: 'Error al obtener equipos',
                    detalles: error.message
                });
            }
        });
    },
    getEquipmentById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const equipment = yield equipment_model_1.EquipmentModel.findOne({
                    _id: req.params.id,
                    deleted: false
                })
                    .populate('area', 'name description')
                    .populate('activities', 'name description blockType');
                if (!equipment) {
                    return res.status(404).json({
                        mensaje: 'Equipo no encontrado'
                    });
                }
                res.json(equipment);
            }
            catch (error) {
                res.status(500).json({
                    error: 'Error al obtener el equipo',
                    detalles: error.message
                });
            }
        });
    },
    createEquipment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newEquipment = new equipment_model_1.EquipmentModel(req.body);
                yield newEquipment.save();
                const populatedEquipment = yield equipment_model_1.EquipmentModel.findById(newEquipment._id)
                    .populate('area', 'name description')
                    .populate('activities', 'name description blockType');
                res.status(201).json({
                    mensaje: 'Equipo creado exitosamente',
                    equipo: populatedEquipment
                });
            }
            catch (error) {
                res.status(400).json({
                    error: 'Error al crear el equipo',
                    detalles: error.message
                });
            }
        });
    },
    updateEquipment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const equipment = yield equipment_model_1.EquipmentModel.findOneAndUpdate({
                    _id: req.params.id,
                    deleted: false,
                    locked: false
                }, { $set: req.body }, { new: true, runValidators: true })
                    .populate('area', 'name description')
                    .populate('activities', 'name description blockType');
                if (!equipment) {
                    return res.status(404).json({
                        mensaje: 'Equipo no encontrado o bloqueado'
                    });
                }
                res.json({
                    mensaje: 'Equipo actualizado exitosamente',
                    equipo: equipment
                });
            }
            catch (error) {
                res.status(400).json({
                    error: 'Error al actualizar el equipo',
                    detalles: error.message
                });
            }
        });
    },
    deleteEquipment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const equipment = yield equipment_model_1.EquipmentModel.findOne({
                    _id: req.params.id,
                    deleted: false,
                    locked: false
                });
                if (!equipment) {
                    return res.status(404).json({
                        mensaje: 'Equipo no encontrado o bloqueado'
                    });
                }
                // Soft delete
                equipment.deleted = true;
                yield equipment.save();
                // Eliminar referencias en actividades
                yield activity_model_1.ActivityModel.updateMany({ equipments: equipment._id }, { $pull: { equipments: equipment._id } });
                res.json({
                    mensaje: 'Equipo eliminado exitosamente'
                });
            }
            catch (error) {
                res.status(500).json({
                    error: 'Error al eliminar el equipo',
                    detalles: error.message
                });
            }
        });
    },
    toggleLock(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const equipment = yield equipment_model_1.EquipmentModel.findOne({
                    _id: req.params.id,
                    deleted: false
                });
                if (!equipment) {
                    return res.status(404).json({
                        mensaje: 'Equipo no encontrado'
                    });
                }
                equipment.locked = !equipment.locked;
                yield equipment.save();
                res.json({
                    mensaje: `Equipo ${equipment.locked ? 'bloqueado' : 'desbloqueado'} exitosamente`,
                    equipo: equipment
                });
            }
            catch (error) {
                res.status(500).json({
                    error: 'Error al cambiar el estado de bloqueo del equipo',
                    detalles: error.message
                });
            }
        });
    },
    assignActivity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { equipmentId } = req.params;
                const { activityId } = req.body;
                const equipment = yield equipment_model_1.EquipmentModel.findOne({
                    _id: equipmentId,
                    deleted: false,
                    locked: false
                });
                const activity = yield activity_model_1.ActivityModel.findById(activityId);
                if (!equipment || !activity) {
                    return res.status(404).json({
                        mensaje: 'Equipo o actividad no encontrados'
                    });
                }
                // Verificar si ya existe la relación
                if (equipment.activities.includes(activityId)) {
                    return res.status(400).json({
                        mensaje: 'La actividad ya está asignada a este equipo'
                    });
                }
                // Actualizar ambos modelos
                equipment.activities.push(activityId);
                activity.equipments.push(equipmentId);
                yield Promise.all([
                    equipment.save(),
                    activity.save()
                ]);
                const updatedEquipment = yield equipment_model_1.EquipmentModel.findById(equipmentId)
                    .populate('area', 'name description')
                    .populate('activities', 'name description blockType');
                res.json({
                    mensaje: 'Actividad asignada exitosamente',
                    equipo: updatedEquipment
                });
            }
            catch (error) {
                res.status(500).json({
                    error: 'Error al asignar la actividad',
                    detalles: error.message
                });
            }
        });
    },
    removeActivity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { equipmentId, activityId } = req.params;
                const equipment = yield equipment_model_1.EquipmentModel.findOne({
                    _id: equipmentId,
                    deleted: false,
                    locked: false
                });
                const activity = yield activity_model_1.ActivityModel.findById(activityId);
                if (!equipment || !activity) {
                    return res.status(404).json({
                        mensaje: 'Equipo o actividad no encontrados'
                    });
                }
                // Eliminar las referencias en ambos modelos
                equipment.activities = equipment.activities.filter(id => id.toString() !== activityId);
                activity.equipments = activity.equipments.filter(id => id.toString() !== equipmentId);
                yield Promise.all([
                    equipment.save(),
                    activity.save()
                ]);
                const updatedEquipment = yield equipment_model_1.EquipmentModel.findById(equipmentId)
                    .populate('area', 'name description')
                    .populate('activities', 'name description blockType');
                res.json({
                    mensaje: 'Actividad removida exitosamente',
                    equipo: updatedEquipment
                });
            }
            catch (error) {
                res.status(500).json({
                    error: 'Error al remover la actividad',
                    detalles: error.message
                });
            }
        });
    }
};
