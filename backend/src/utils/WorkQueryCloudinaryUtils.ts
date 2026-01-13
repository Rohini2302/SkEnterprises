import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// Configure Cloudinary (make sure your .env has these values)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Interface for work query proof files
export interface WorkQueryProofFile {
  name: string;
  type: 'image' | 'video' | 'document' | 'other';
  url: string;
  public_id: string;
  size: string;
  format?: string;
  bytes?: number;
  uploadDate: Date;
}

// Cloudinary upload result interface
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  url: string;
  bytes: number;
  format: string;
  width?: number;
  height?: number;
  resource_type: string;
}

/**
 * Upload a single work query proof file to Cloudinary
 */
export const uploadWorkQueryProofFile = async (
  fileBuffer: Buffer,
  originalName: string,
  mimetype: string,
  fileSize: number,
  folder: string = 'work-query-proofs'
): Promise<WorkQueryProofFile> => {
  return new Promise((resolve, reject) => {
    // Determine resource type based on mimetype
    const resourceType = getResourceType(mimetype);
    const allowedFormats = getAllowedFormats(resourceType);
    
    // Generate unique filename
    const timestamp = Date.now();
    const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const publicId = `${folder}/${timestamp}_${safeName.split('.')[0]}`;

    const uploadOptions: any = {
      folder: folder,
      public_id: publicId,
      allowed_formats: allowedFormats,
      resource_type: resourceType,
      tags: ['work-query', 'proof', 'supervisor']
    };

    // Apply transformations only for images
    if (resourceType === 'image') {
      uploadOptions.transformation = [
        {
          width: 1200,
          height: 800,
          crop: 'limit',
          quality: 'auto:good',
        },
      ];
    }

    // For documents, use raw resource type
    if (resourceType === 'raw') {
      uploadOptions.resource_type = 'raw';
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`Failed to upload ${originalName}: ${error.message}`));
        } else if (result) {
          // Map to work query proof file interface
          const proofFile: WorkQueryProofFile = {
            name: originalName,
            type: getFileType(mimetype),
            url: result.secure_url,
            public_id: result.public_id,
            size: formatFileSize(fileSize),
            format: result.format,
            bytes: result.bytes,
            uploadDate: new Date()
          };
          resolve(proofFile);
        } else {
          reject(new Error('Cloudinary upload failed: No result returned'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Upload multiple work query proof files to Cloudinary
 */
export const uploadMultipleWorkQueryProofs = async (
  files: Array<{
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }>,
  folder: string = 'work-query-proofs'
): Promise<WorkQueryProofFile[]> => {
  const uploadPromises = files.map(file =>
    uploadWorkQueryProofFile(file.buffer, file.originalname, file.mimetype, file.size, folder)
  );

  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple files to Cloudinary:', error);
    throw new Error('Failed to upload some files to Cloudinary');
  }
};

/**
 * Delete work query proof files from Cloudinary
 */
export const deleteWorkQueryProofs = async (publicIds: string[]): Promise<void> => {
  if (publicIds.length === 0) return;

  try {
    // Delete multiple files in parallel
    const deletePromises = publicIds.map(publicId =>
      cloudinary.uploader.destroy(publicId)
    );
    
    await Promise.all(deletePromises);
    console.log(`Successfully deleted ${publicIds.length} files from Cloudinary`);
  } catch (error: any) {
    console.error('Error deleting work query proofs from Cloudinary:', error);
    throw new Error(`Failed to delete files from Cloudinary: ${error.message}`);
  }
};

/**
 * Update work query proof files - remove old, add new
 */
export const updateWorkQueryProofs = async (
  existingPublicIds: string[],
  newFiles: Array<{
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }>,
  folder: string = 'work-query-proofs'
): Promise<WorkQueryProofFile[]> => {
  try {
    // Delete existing files
    if (existingPublicIds.length > 0) {
      await deleteWorkQueryProofs(existingPublicIds);
    }

    // Upload new files
    if (newFiles.length > 0) {
      return await uploadMultipleWorkQueryProofs(newFiles, folder);
    }

    return [];
  } catch (error) {
    console.error('Error updating work query proofs:', error);
    throw error;
  }
};

/**
 * Get Cloudinary resources in the work query proofs folder
 */
export const getWorkQueryProofsFromCloudinary = async (
  folder: string = 'work-query-proofs',
  maxResults: number = 100
): Promise<any[]> => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: maxResults,
      resource_type: 'auto'
    });
    return result.resources || [];
  } catch (error: any) {
    console.error('Error fetching Cloudinary resources:', error);
    throw new Error(`Failed to fetch files from Cloudinary: ${error.message}`);
  }
};

/**
 * Generate a signed URL for temporary file access (if needed)
 */
export const generateSignedUrl = async (
  publicId: string,
  expirationSeconds: number = 3600
): Promise<string> => {
  try {
    const url = cloudinary.url(publicId, {
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + expirationSeconds
    });
    return url;
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Helper function to determine resource type from mimetype
 */
const getResourceType = (mimetype: string): 'image' | 'video' | 'raw' => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.includes('pdf') || 
      mimetype.includes('document') || 
      mimetype.includes('text') ||
      mimetype.includes('sheet') ||
      mimetype.includes('presentation')) return 'raw';
  return 'raw'; // default to raw for other types
};

/**
 * Helper function to determine file type for database
 */
const getFileType = (mimetype: string): 'image' | 'video' | 'document' | 'other' => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.includes('pdf') || 
      mimetype.includes('document') || 
      mimetype.includes('text')) return 'document';
  return 'other';
};

/**
 * Helper function to get allowed formats based on resource type
 */
const getAllowedFormats = (resourceType: string): string[] => {
  switch (resourceType) {
    case 'image':
      return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
    case 'video':
      return ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv'];
    case 'raw':
      return ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls', 'ppt', 'pptx', 'csv'];
    default:
      return ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'mp4', 'mov'];
  }
};

/**
 * Helper function to format file size
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate if file type is allowed for work query proofs
 */
export const validateWorkQueryFile = (mimetype: string, filename: string): boolean => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    
    // Videos
    'video/mp4',
    'video/mov',
    'video/avi',
    'video/webm',
    'video/mkv',
    'video/flv',
    
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv'
  ];

  const fileExtension = filename.split('.').pop()?.toLowerCase();
  const allowedExtensions = [
    'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp',
    'mp4', 'mov', 'avi', 'webm', 'mkv', 'flv',
    'pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls', 'ppt', 'pptx', 'csv'
  ];

  // Check both mimetype and file extension
  return allowedMimeTypes.includes(mimetype) && 
         (!fileExtension || allowedExtensions.includes(fileExtension));
};

export { cloudinary };