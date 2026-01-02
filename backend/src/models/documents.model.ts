// models/Documents.model.ts
import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
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
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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
  category: {
    type: String,
    enum: ['image', 'document', 'spreadsheet', 'presentation', 'other'],
    default: 'document'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to User model if you have one
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
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Add indexes for better query performance
documentSchema.index({ folder: 1, uploadedAt: -1 });
documentSchema.index({ mimetype: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ uploadedBy: 1 });

// Middleware to update category based on mimetype
documentSchema.pre('save', function(next) {
  const doc = this;
  
  if (doc.mimetype.startsWith('image/')) {
    doc.category = 'image';
  } else if (doc.mimetype === 'application/pdf') {
    doc.category = 'document';
  } else if (doc.mimetype.includes('spreadsheet')) {
    doc.category = 'spreadsheet';
  } else if (doc.mimetype.includes('presentation')) {
    doc.category = 'presentation';
  }
  
  next();
});

const Document = mongoose.model('Document', documentSchema);
export default Document;