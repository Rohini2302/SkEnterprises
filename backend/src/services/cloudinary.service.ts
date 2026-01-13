// cloudinary.service.ts
import { cloudinary } from '../config/cloudinary';
import { 
  CloudinaryUploadOptions, 
  CloudinaryUploadResult, 
  CloudinarySearchOptions, 
  CloudinaryDeleteResult 
} from '../interfaces/cloudinary.interface';

export class CloudinaryService {
  static async uploadImage(
    filePath: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(filePath, options, (error, result) => {
        if (error) reject(error);
        else resolve(result as unknown as CloudinaryUploadResult);
      });
    });
  }

  static async uploadFromBuffer(
    buffer: Buffer,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) reject(error);
          else resolve(result as unknown as CloudinaryUploadResult);
        }
      );
      stream.end(buffer);
    });
  }

  static async deleteImage(publicId: string): Promise<CloudinaryDeleteResult> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) reject(error);
        else resolve(result as CloudinaryDeleteResult);
      });
    });
  }

  static async searchResources(options: CloudinarySearchOptions = {}) {
    return cloudinary.search
      .expression(options.expression || '')
      .max_results(options.max_results || 10)
      .execute();
  }

  static generateUrl(publicId: string, transformations: any = {}) {
    return cloudinary.url(publicId, { ...transformations });
  }

  static getPublicIdFromUrl(url: string): string {
    const matches = url.match(/\/([^/]+)\.(?:jpg|jpeg|png|gif|webp|svg|mp4|mov|avi|mkv|pdf|doc|docx|xls|xlsx|txt)$/i);
    return matches ? matches[1] : '';
  }
}

export default CloudinaryService;