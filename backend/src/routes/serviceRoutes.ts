import express from 'express';
import {
  getAllServices,
  createService,
  updateServiceStatus
} from '../controllers/serviceController';

const router = express.Router();

router.get('/', getAllServices);
router.post('/', createService);
router.patch('/:id/status', updateServiceStatus);

export default router;