// src/models/documents.model.ts
import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

// Define the interface
export interface IDocument extends MongooseDocument {
  cloudinaryPublicId: any;
  url: string;
  public_id: string;
  originalname: string;
  mimetype: string;
  size: number;
  folder: string;
  // ✅ UPDATED: Added all frontend categories to enum
  category: 'image' | 'document' | 'spreadsheet' | 'presentation' | 'other' | 'uploaded' | 'generated' | 'template';
  uploadedBy?: mongoose.Types.ObjectId;
  description?: string;
  tags: string[];
  isArchived: boolean;
  uploadedAt: Date;
  lastAccessed: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const documentSchema = new Schema<IDocument>({
  url: {
    type: String,
    required: true,
    trim: true
  },
  public_id: {
    type: String,
    required: true,
    trim: true
  },
  originalname: {
    type: String,
    required: true,
    trim: true
  },
  mimetype: {
    type: String,
    required: true,
    enum: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/html',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip', 'application/x-zip-compressed',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.template'
    ]
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  folder: {
    type: String,
    default: 'documents',
    trim: true
  },
  // ✅ UPDATED: Added all frontend categories to enum
  category: {
    type: String,
    enum: ['image', 'document', 'spreadsheet', 'presentation', 'other', 'uploaded', 'generated', 'template'],
    default: 'document'
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  tags: [{
    type: String,
    trim: true
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes
documentSchema.index({ folder: 1, uploadedAt: -1 });
documentSchema.index({ mimetype: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ isArchived: 1 });

// Middleware to auto-set category based on mimetype if not already set
documentSchema.pre<IDocument>('save', function(next) {
  const doc = this;
  
  // Only auto-determine category if it's not explicitly set to a frontend value
  if (!doc.category || !['uploaded', 'generated', 'template'].includes(doc.category)) {
    if (doc.mimetype.startsWith('image/')) {
      doc.category = 'image';
    } else if (doc.mimetype === 'application/pdf' || 
               doc.mimetype.includes('text') || 
               doc.mimetype.includes('word') || 
               doc.mimetype.includes('document')) {
      doc.category = 'document';
    } else if (doc.mimetype.includes('spreadsheet') || doc.mimetype.includes('excel')) {
      doc.category = 'spreadsheet';
    } else if (doc.mimetype.includes('presentation') || doc.mimetype.includes('powerpoint')) {
      doc.category = 'presentation';
    } else {
      doc.category = 'other';
    }
  }
  
  next();
});

// Create and export the model
const Document = mongoose.model<IDocument>('Document', documentSchema);

export default Document;