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
exports.areaController = void 0;
const area_model_1 = require("./area.model");
exports.areaController = {
    getAllAreas(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const areas = yield area_model_1.AreaModel.find();
                if (!areas || areas.length === 0) {
                    return res.status(404).json({
                        mensaje: 'No se encontraron áreas'
                    });
                }
                res.json(areas);
            }
            catch (error) {
                res.status(500).json({
                    error: 'Error al obtener áreas',
                    detalles: error.message
                });
            }
        });
    },
    createArea(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, description, equipment } = req.body;
            const newArea = new area_model_1.AreaModel({
                name,
                description,
                deleted: false,
            });
            yield newArea.save();
            res.status(201).json(newArea);
        });
    },
    addEquipmentToArea(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { areaId, equipmentId } = req.body;
            const area = yield area_model_1.AreaModel.findById(areaId);
            if (!area) {
                return res.status(404).json({ error: 'Área no encontrada' });
            }
            area.equipments.push(equipmentId);
            yield area.save();
        });
    }
};
