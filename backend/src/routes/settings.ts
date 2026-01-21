// src/routes/settingsRoutes.ts
import express from 'express';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

// Import controllers
import {
  getProfile,
  updateProfile,
  updatePassword,
  getPermissions,
  updatePermissions,
  updateNotifications,
  getCurrentPasswordInfo,
  resetPasswordForTesting, // Add this import
} from '../controllers/settingsController';

// Debug/test endpoint
router.get('/test', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Settings API is working!',
    user: req.user ? {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    } : null,
    userId: req.userId,
    timestamp: new Date().toISOString()
  });
});

// Profile routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

// Password routes
router.put('/password', auth, updatePassword);

// Password health check (admin only)
//router.get('/password-health', auth, authorize('admin', 'superadmin'), checkPasswordHealth);

// DEBUG routes (remove in production)
// router.get('/debug-password', auth, debugPassword);
router.get('/password-info', auth, getCurrentPasswordInfo);
router.post('/reset-password-test', auth, resetPasswordForTesting);

// Notification preferences
router.put('/notifications', auth, updateNotifications);

// Permissions routes (admin only)
router.get('/permissions', auth, authorize('admin', 'superadmin'), getPermissions);
router.put('/permissions', auth, authorize('superadmin'), updatePermissions);

export default router;