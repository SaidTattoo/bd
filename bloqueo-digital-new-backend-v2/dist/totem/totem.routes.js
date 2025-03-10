"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const totem_controller_1 = require("./totem.controller");
const router = (0, express_1.Router)();
router.get('/:id', totem_controller_1.getCasilleros);
router.post('/', totem_controller_1.createTotem);
router.post('/:id/casillero/:casilleroId', totem_controller_1.assignEquipmentToCasillero);
/* router.post('/:id/casillero', createCasillero); */
router.delete('/:id/casillero/:casilleroId', totem_controller_1.removeEquipmentFromCasillero);
router.delete('/:id/casilleros', totem_controller_1.clearAllCasilleros);
exports.default = router;
