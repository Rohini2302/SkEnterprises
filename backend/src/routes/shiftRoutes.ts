import { Router } from 'express';
import {
  getShifts,
  getShift,
  createShift,
  updateShift,
  deleteShift,
  assignEmployeeToShift,
  removeEmployeeFromShift,
  getShiftStats
} from '../controllers/shiftController';

const router = Router();

// Shift routes
router.get('/', getShifts);
router.get('/stats', getShiftStats);
router.get('/:id', getShift);
router.post('/', createShift);
router.put('/:id', updateShift);
router.delete('/:id', deleteShift);
router.post('/:id/assign', assignEmployeeToShift);
router.post('/:id/remove', removeEmployeeFromShift);

export default router;