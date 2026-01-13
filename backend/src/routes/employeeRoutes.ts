import express from 'express';
import multer from 'multer';
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} from '../controllers/employeeController';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Routes
router.post('/',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'employeeSignature', maxCount: 1 },
    { name: 'authorizedSignature', maxCount: 1 }
  ]),
  createEmployee
);

router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.put('/:id',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'employeeSignature', maxCount: 1 },
    { name: 'authorizedSignature', maxCount: 1 }
  ]),
  updateEmployee
);
router.delete('/:id', deleteEmployee);

export default router;