// backend/src/utils/CloudinaryUtils.ts
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
});

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  url: string;
  bytes: number;
  format: string;
  width: number;
  height: number;
}

// Upload image to Cloudinary with error handling
export const uploadImageToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = 'employee-photos'
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer || fileBuffer.length === 0) {
      reject(new Error('Empty file buffer provided'));
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
          {
            width: 500,
            height: 500,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto:best',
          },
        ],
      },
      (error: any, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`Failed to upload image: ${error.message}`));
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            url: result.url,
            bytes: result.bytes,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        } else {
          reject(new Error('Cloudinary upload failed: No result returned'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// Upload signature to Cloudinary
export const uploadSignatureToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = 'employee-signatures'
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer || fileBuffer.length === 0) {
      reject(new Error('Empty file buffer provided'));
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
          {
            width: 400,
            height: 200,
            crop: 'fill',
            background: 'white',
            quality: 'auto:best',
          },
        ],
      },
      (error: any, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`Failed to upload signature: ${error.message}`));
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            url: result.url,
            bytes: result.bytes,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        } else {
          reject(new Error('Cloudinary upload failed: No result returned'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// Delete image from Cloudinary
export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    if (!publicId) {
      console.warn('No publicId provided for deletion');
      return;
    }
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result !== 'ok') {
      throw new Error(`Failed to delete image: ${result.result}`);
    }
    
    console.log(`Successfully deleted image with publicId: ${publicId}`);
  } catch (error: any) {
    console.error('Error deleting image from Cloudinary:', error);
    // Don't throw the error - we don't want to fail the entire operation
    // just because we couldn't delete from Cloudinary
  }
};

// Upload multiple files
export const uploadMultipleToCloudinary = async (
  files: { buffer: Buffer; originalname: string }[],
  folder: string = 'employee-documents'
): Promise<CloudinaryUploadResult[]> => {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadPromises = files.map((file) => {
    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      if (!file.buffer || file.buffer.length === 0) {
        reject(new Error(`Empty file buffer for ${file.originalname}`));
        return;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}`,
          allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
          resource_type: 'auto',
        },
        (error: any, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error(`Cloudinary upload error for ${file.originalname}:`, error);
            reject(new Error(`Failed to upload ${file.originalname}: ${error.message}`));
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              url: result.url,
              bytes: result.bytes,
              format: result.format,
              width: result.width,
              height: result.height,
            });
          } else {
            reject(new Error(`Upload failed for ${file.originalname}`));
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  });

  return Promise.all(uploadPromises);
};

export { cloudinary };