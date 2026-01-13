// src/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { CloudinaryConfig } from '../interfaces/cloudinary.interface';

dotenv.config();

// Validate environment variables
const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
] as const;

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing environment variable: ${varName}`);
  }
});

// Cloudinary configuration
const cloudinaryConfig: CloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
  secure: true,
};

// Configure Cloudinary
cloudinary.config(cloudinaryConfig);

// Export configured Cloudinary instance
export { cloudinary };
export type { CloudinaryConfig };

// Helper function to test Cloudinary connection
export const testCloudinaryConnection = async (): Promise<boolean> => {
  try {
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection successful:', result);
    return true;
  } catch (error) {
    console.error('Cloudinary connection failed:', error);
    return false;
  }
};