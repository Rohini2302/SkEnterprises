// backend/src/utils/upload.ts
import { Request } from 'express';
import multer from 'multer';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Memory storage (files stored in memory buffer)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept images and PDFs
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
  }
};

// Create multer instance
export const multerUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 15 // Max 15 files
  }
});

// Upload buffer to Cloudinary
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  options: {
    folder: string;
    transformation?: any[];
    public_id?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
  }
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    // Convert buffer to base64
    const b64 = Buffer.from(buffer).toString('base64');
    let dataURI = '';
    
    // Determine MIME type for data URI
    const mimeType = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46 
      ? 'application/pdf' 
      : 'image/jpeg';
    
    dataURI = `data:${mimeType};base64,${b64}`;
    
    // Upload to Cloudinary
    cloudinary.uploader.upload(
      dataURI,
      {
        folder: options.folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
        resource_type: options.resource_type || 'image',
        transformation: options.transformation,
        public_id: options.public_id,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    );
  });
};

// Upload employee photo
export const uploadEmployeePhoto = async (buffer: Buffer): Promise<UploadApiResponse> => {
  return uploadBufferToCloudinary(buffer, {
    folder: 'employee-photos',
    transformation: [
      {
        width: 500,
        height: 500,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto:best'
      }
    ]
  });
};

// Upload signature
export const uploadSignature = async (buffer: Buffer): Promise<UploadApiResponse> => {
  return uploadBufferToCloudinary(buffer, {
    folder: 'employee-signatures',
    transformation: [
      {
        width: 400,
        height: 200,
        crop: 'fill',
        background: 'white',
        quality: 'auto:best'
      }
    ]
  });
};

// Upload document
export const uploadDocument = async (buffer: Buffer, filename: string): Promise<UploadApiResponse> => {
  const publicId = filename.replace(/\.[^/.]+$/, ""); // Remove extension
  
  return uploadBufferToCloudinary(buffer, {
    folder: 'employee-documents',
    resource_type: 'auto',
    public_id: publicId
  });
};

// Delete from Cloudinary
export const deleteFromCloudinary = (publicId: string): Promise<any> => {
  return cloudinary.uploader.destroy(publicId);
};

export { cloudinary };