// src/interfaces/cloudinary.interface.ts

export interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
  secure?: boolean;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  overwrite?: boolean;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  type?: 'upload' | 'private' | 'authenticated';
  transformation?: Array<Record<string, any>>;
  tags?: string[];
  [key: string]: any;
}

export interface CloudinaryUploadResult {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  pages?: number;
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  access_mode: string;
  original_filename: string;
  original_extension: string;
}

export interface CloudinaryDeleteResult {
  result: string;
  [key: string]: any;
}

export interface CloudinarySearchOptions {
  expression?: string;
  max_results?: number;
  next_cursor?: string;
  sort_by?: Array<{ [key: string]: string }>;
  aggregate?: string[];
  with_field?: string[];
  [key: string]: any;
}

export interface CloudinarySearchResult {
  total_count: number;
  time: number;
  next_cursor?: string;
  resources: CloudinaryUploadResult[];
  [key: string]: any;
}

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
  quality?: string | number;
  format?: string;
  [key: string]: any;
}

export interface DocumentMetadata {
  name: string;
  url: string;
  publicId: string;
  format: string;
  size: string;
  category: "uploaded" | "generated" | "template";
  description?: string;
  folder?: string;
}

//for employee-photo
export interface CloudinaryParams {
  folder: string;
  allowed_formats: string[];
  transformation: Array<{ width: number; height: number; crop: string }>;
}