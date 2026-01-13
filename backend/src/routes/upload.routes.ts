import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/upload.controller';

const router = Router();

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 File upload attempt:', file.originalname, 'Type:', file.mimetype);
    
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/html',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip', 'application/x-zip-compressed',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.template'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      console.log('✅ File type allowed');
      cb(null, true);
    } else {
      console.warn('❌ File type not allowed:', file.mimetype);
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: images, PDF, Word, Excel, PowerPoint, text files.`));
    }
  },
});

// ============ MULTER ERROR HANDLER ============
// Place the error handler BEFORE any routes
const handleMulterError = (error: any, req: any, res: any, next: any) => {
  console.error('❌ Multer error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload error'
    });
  }
  next();
};

// ============ FILE UPLOAD ROUTES ============
router.post('/upload/single', upload.single('file'), handleMulterError, UploadController.uploadSingle);

// ============ DOCUMENT CRUD ROUTES ============
// Get all documents with pagination
router.get('/documents', UploadController.getAllDocuments);

// Get documents by category
router.get('/documents/category/:category', UploadController.getDocumentsByCategory);

// Get document by ID
router.get('/documents/:id', UploadController.getDocumentById);

// Create document metadata (without file upload)
router.post('/documents', UploadController.createDocument);

// Update document
router.patch('/documents/:id', UploadController.updateDocument);

// Delete document (with Cloudinary cleanup)
router.delete('/documents/:id', UploadController.deleteDocument);

// Search documents
router.get('/documents/search/all', UploadController.searchDocuments);

// Delete from Cloudinary by public ID
router.delete('/upload/:publicId', UploadController.deleteFile);

export default router;