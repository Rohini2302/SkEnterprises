import multer from 'multer';
import { Request } from 'express';
import { validateWorkQueryFile } from '../utils/WorkQueryCloudinaryUtils';

// Configure memory storage
const storage = multer.memoryStorage();

// Custom file filter
const workQueryFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (validateWorkQueryFile(file.mimetype, file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error(
      `File type ${file.mimetype} (${file.originalname}) is not allowed. ` +
      `Allowed: Images (jpg, png, gif, webp, bmp), ` +
      `Videos (mp4, mov, avi, webm), ` +
      `Documents (pdf, doc, docx, txt, xlsx, ppt)`
    ));
  }
};

// Configure multer
export const workQueryFileUpload = multer({
  storage: storage,
  fileFilter: workQueryFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file
    files: 10, // Max 10 files
    fields: 20 // Max 20 form fields
  }
});

/**
 * Handle file upload errors
 */
export const handleFileUploadErrors = (
  err: any,
  req: Request,
  res: any,
  next: any
) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer error:', err.code, err.message);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum file size is 25MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed per query.'
      });
    }
    if (err.code === 'LIMIT_FIELD_KEY') {
      return res.status(400).json({
        success: false,
        message: 'Too many form fields.'
      });
    }
  } else if (err) {
    console.error('❌ File upload error:', err.message);
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }
  next();
};