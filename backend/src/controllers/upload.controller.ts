// src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import Document from '../models/documents.model';
import streamifier from 'streamifier';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export class UploadController {
  // Upload single document
  static async uploadSingle(req: Request, res: Response): Promise<void> {
    try {
      console.log('📤 Starting upload process...');
      
      if (!req.file) {
        console.log('❌ No file in request');
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      console.log('📁 File details:', {
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        folder: req.body.folder || 'documents',
        category: req.body.category || 'uploaded'
      });

      // Validate file size
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        res.status(400).json({
          success: false,
          message: 'File size exceeds 10MB limit'
        });
        return;
      }

      // Upload to Cloudinary
      console.log('☁️ Uploading to Cloudinary...');
      
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: req.body.folder || 'documents',
            timeout: 60000 // 60 seconds timeout
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error);
              reject(new Error(`Cloudinary upload failed: ${error.message}`));
            } else if (!result) {
              reject(new Error('Cloudinary upload failed: No result returned'));
            } else {
              console.log('✅ Cloudinary upload successful:', {
                public_id: result.public_id,
                url: result.secure_url,
                format: result.format
              });
              resolve(result);
            }
          }
        );

        // Handle stream errors
        uploadStream.on('error', (error) => {
          console.error('❌ Stream error:', error);
          reject(error);
        });

        // Pipe the file buffer to Cloudinary
        streamifier.createReadStream(req.file!.buffer).pipe(uploadStream);
      });

      // Get category from request or default to 'uploaded'
      const category = req.body.category || 'uploaded';
      
      // Prepare tags
      const tags = req.body.tags ? req.body.tags.split(',').map((tag: string) => tag.trim()) : [];
      
      // Add specific tag based on category
      if (category === 'template') {
        tags.push('template');
      }

      // Create document in database
      const document = new Document({
        url: result.secure_url,
        public_id: result.public_id,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        folder: result.folder || 'documents',
        category: category,
        description: req.body.description || '',
        tags: tags,
        uploadedAt: new Date(),
        lastAccessed: new Date()
      });

      console.log('💾 Saving to database:', {
        originalname: req.file.originalname,
        public_id: result.public_id,
        category: category,
        folder: document.folder
      });

      await document.save();
      
      console.log('✅ Document saved to database with ID:', document._id);
      
      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          size: req.file.size,
          originalname: req.file.originalname,
          documentId: document._id,
          mimetype: req.file.mimetype,
          category: category,
          folder: document.folder
        }
      });

    } catch (error: any) {
      console.error('❌ Upload error:', error);
      
      let errorMessage = 'Failed to upload document';
      
      if (error.name === 'ValidationError') {
        // Detailed validation error
        const validationErrors = Object.values(error.errors).map((e: any) => e.message);
        errorMessage = `Validation error: ${validationErrors.join(', ')}`;
        console.error('🔍 Validation errors:', validationErrors);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      res.status(500).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  // Get all documents with pagination
  static async getAllDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, category } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      const query: any = { isArchived: false };
      if (category) {
        query.category = category;
      }
      
      const documents = await Document.find(query)
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(Number(limit));
      
      const total = await Document.countDocuments(query);
      
      res.json({
        success: true,
        message: 'Documents fetched successfully',
        data: documents,
        count: documents.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page)
      });
    } catch (error: any) {
      console.error('❌ Error fetching documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents',
        error: error.message
      });
    }
  }

  // Get documents by category
  static async getDocumentsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const documents = await Document.find({ 
        category,
        isArchived: false 
      }).sort({ uploadedAt: -1 });
      
      res.json({
        success: true,
        message: `Documents in category ${category} fetched successfully`,
        data: documents
      });
    } catch (error: any) {
      console.error('❌ Error fetching documents by category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents',
        error: error.message
      });
    }
  }

  // Get document by ID
  static async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if ID is valid MongoDB ObjectId
      if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid document ID format'
        });
        return;
      }
      
      const document = await Document.findById(id);
      
      if (!document) {
        res.status(404).json({
          success: false,
          message: 'Document not found'
        });
        return;
      }
      
      // Update last accessed time
      document.lastAccessed = new Date();
      await document.save();
      
      res.json({
        success: true,
        message: 'Document fetched successfully',
        data: document
      });
    } catch (error: any) {
      console.error('❌ Error fetching document by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document',
        error: error.message
      });
    }
  }

  // Create document metadata
  static async createDocument(req: Request, res: Response): Promise<void> {
    try {
      console.log('📝 Creating document metadata:', req.body);
      
      const document = new Document({
        ...req.body,
        uploadedAt: new Date(),
        lastAccessed: new Date()
      });
      
      await document.save();
      
      res.status(201).json({
        success: true,
        message: 'Document metadata created successfully',
        data: document
      });
    } catch (error: any) {
      console.error('❌ Error creating document metadata:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create document',
        error: error.message
      });
    }
  }

  // Update document
  static async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      console.log('✏️ Updating document:', id, updates);
      
      // Check if ID is valid MongoDB ObjectId
      if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid document ID format'
        });
        return;
      }
      
      const document = await Document.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!document) {
        res.status(404).json({
          success: false,
          message: 'Document not found'
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Document updated successfully',
        data: document
      });
    } catch (error: any) {
      console.error('❌ Error updating document:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to update document',
        error: error.message
      });
    }
  }

  // Delete document
  static async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      console.log('🗑️ Deleting document:', id);
      
      // Check if ID is valid MongoDB ObjectId
      if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid document ID format. Must be a valid MongoDB ObjectId'
        });
        return;
      }
      
      const document = await Document.findById(id);
      
      if (!document) {
        res.status(404).json({
          success: false,
          message: 'Document not found'
        });
        return;
      }
      
      // Delete from Cloudinary
      try {
        console.log('☁️ Deleting from Cloudinary:', document.public_id);
        await cloudinary.uploader.destroy(document.public_id);
        console.log('✅ Deleted from Cloudinary:', document.public_id);
      } catch (cloudinaryError) {
        console.warn('⚠️ Cloudinary delete failed, but continuing with database delete:', cloudinaryError);
      }
      
      // Delete from database
      await Document.findByIdAndDelete(id);
      
      console.log('✅ Deleted from database:', id);
      
      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error: any) {
      console.error('❌ Error deleting document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      });
    }
  }

  // Search documents
  static async searchDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      
      console.log('🔍 Searching documents for:', q);
      
      if (!q || q.toString().trim() === '') {
        const documents = await Document.find({ isArchived: false }).sort({ uploadedAt: -1 });
        res.json({
          success: true,
          message: 'All documents fetched',
          data: documents
        });
        return;
      }
      
      const searchQuery = q.toString();
      
      const query = {
        isArchived: false,
        $or: [
          { originalname: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { tags: { $regex: searchQuery, $options: 'i' } },
          { category: { $regex: searchQuery, $options: 'i' } }
        ]
      };
      
      const documents = await Document.find(query).sort({ uploadedAt: -1 });
      
      console.log(`✅ Search found ${documents.length} documents`);
      
      res.json({
        success: true,
        message: 'Search completed successfully',
        data: documents
      });
    } catch (error: any) {
      console.error('❌ Error searching documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search documents',
        error: error.message
      });
    }
  }

  // Delete from Cloudinary by public ID
  static async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { publicId } = req.params;
      
      console.log('☁️ Deleting file from Cloudinary:', publicId);
      
      const result = await cloudinary.uploader.destroy(publicId);
      
      res.json({
        success: true,
        message: 'File deleted from Cloudinary',
        data: result
      });
    } catch (error: any) {
      console.error('❌ Error deleting file from Cloudinary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete file from Cloudinary',
        error: error.message
      });
    }
  }
}