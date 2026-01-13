// routes/adminLeaveRoutes.ts
import express from 'express';
import {
  applyAdminLeave,
  getAdminLeaves,
  getAdminLeaveStats,
  updateAdminLeaveStatus,
  cancelAdminLeave,
  getAllAdminLeavesForSuperadmin
} from '../controllers/adminLeaveController';

const router = express.Router();

// Admin leave routes (for admins)
router.post('/apply', applyAdminLeave);
router.get('/', getAdminLeaves); // Gets only admin's own leaves
router.get('/stats', getAdminLeaveStats);
router.put('/:id/cancel', cancelAdminLeave);

// Superadmin routes (for managing admin leaves)
router.get('/superadmin/all', getAllAdminLeavesForSuperadmin); // Gets all admin leaves
router.put('/superadmin/:id/status', updateAdminLeaveStatus); // Approve/reject admin leaves

export default router;