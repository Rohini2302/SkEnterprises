import express from 'express';
import * as attendanceController from '../controllers/attendanceController';

const router = express.Router();

// Check in/out routes
router.post('/checkin', attendanceController.checkIn);
router.post('/checkout', attendanceController.checkOut);
router.post('/breakin', attendanceController.breakIn);
router.post('/breakout', attendanceController.breakOut);

// Get attendance data
router.get('/status/:employeeId', attendanceController.getTodayStatus);
router.get('/history', attendanceController.getAttendanceHistory);
router.get('/team', attendanceController.getTeamAttendance);
router.get('/', attendanceController.getAllAttendance);

// NEW: Manager-specific attendance endpoint
router.get('/manager', attendanceController.getManagerAttendance);

// Update attendance (admin/supervisor)
router.put('/:id', attendanceController.updateAttendance);

// Manual attendance entry
router.post('/manual', attendanceController.manualAttendance);

// Weekly summary
router.get('/weekly-summary', attendanceController.getWeeklySummary);

export default router;