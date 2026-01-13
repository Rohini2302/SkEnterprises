import { Router } from 'express';
import { machineController } from '../controllers/machineController';

const router = Router();

// CRUD routes
router.get('/', machineController.getMachines);
router.get('/:id', machineController.getMachineById);
router.post('/', machineController.createMachine);
router.put('/:id', machineController.updateMachine);
router.delete('/:id', machineController.deleteMachine);

// Add maintenance record
router.post('/:id/maintenance', machineController.addMaintenanceRecord);

export default router;
