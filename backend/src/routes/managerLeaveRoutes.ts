// routes/managerLeaveRoutes.ts
import express from 'express';
import {
  applyManagerLeave,
  getManagerLeaves,
  getManagerLeaveStats,
  cancelManagerLeave,
  getAllManagerLeavesForSuperadmin,
  updateManagerLeaveStatus
} from '../controllers/managerLeaveController';

const router = express.Router();

// Manager routes (for managers themselves)
router.post('/apply', applyManagerLeave);
router.get('/', getManagerLeaves); // Gets only manager's own leaves
router.get('/stats', getManagerLeaveStats);
router.put('/:id/cancel', cancelManagerLeave);

// Superadmin routes (for managing manager leaves)
router.get('/superadmin/all', getAllManagerLeavesForSuperadmin); // Gets all manager leaves
router.put('/superadmin/:id/status', updateManagerLeaveStatus); // Approve/reject manager leaves

export default router;