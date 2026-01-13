import { Router } from 'express';
import {
  createEPFForm,
  getEPFForms,
  getEPFForm,
  updateEPFFormStatus
} from '../controllers/epfController';

const router = Router();

// EPF Form routes
router.get('/', getEPFForms);
router.get('/:id', getEPFForm);
router.post('/', createEPFForm);
router.put('/:id/status', updateEPFFormStatus);

export default router;