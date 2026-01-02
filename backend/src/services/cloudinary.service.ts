import { v2 as cloudinary } from 'cloudinary';

export class CloudinaryService {
  async uploadImage(fileBuffer: Buffer, fileName: string) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'uploads',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  async deleteImage(publicId: string) {
    return await cloudinary.uploader.destroy(publicId);
  }
}

export default new CloudinaryService();