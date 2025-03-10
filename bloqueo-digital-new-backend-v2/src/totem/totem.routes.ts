import { Router } from 'express';
import { assignEquipmentToCasillero, clearAllCasilleros, createCasillero, createTotem, getCasilleros, openCasillero, removeEquipmentFromCasillero, updateLockerStatus, getAllTotems, openAllLockers, getCasilleroById } from './totem.controller';

const router = Router();

router.get('/:id', getCasilleros);
router.post('/', createTotem);

router.post('/:id/casillero/:casilleroId', assignEquipmentToCasillero);

/* router.post('/:id/casillero', createCasillero); */

router.delete('/:id/casillero/:casilleroId', removeEquipmentFromCasillero);

router.delete('/:id/casilleros', clearAllCasilleros);

router.post('/:id/casillero/:casilleroId/abrir', openCasillero);

router.patch('/:id/casillero/:casilleroId', updateLockerStatus);

router.post('/:id/casillero/:casilleroId/update-status', updateLockerStatus);

router.get('/', getAllTotems);

router.post('/:id/casillero/:casilleroId/abrir-todos', openAllLockers);
router.get('/:id/casillero/:casilleroId', getCasilleroById);
export default router;