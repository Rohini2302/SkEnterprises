import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  name: string;
  status: 'operational' | 'maintenance' | 'down';
  assignedTeam: string;
  lastChecked: Date;
  description?: string;
  createdBy: string;
  createdByRole: string;
  updatedBy?: string;
  updatedByRole?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'down'],
    default: 'operational'
  },
  assignedTeam: {
    type: String,
    required: true
  },
  lastChecked: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
  },
  createdBy: {
    type: String,
    required: true
  },
  createdByRole: {
    type: String,
    enum: ['superadmin', 'admin', 'manager', 'employee'],
    required: true,
    default: 'superadmin'
  },
  updatedBy: {
    type: String
  },
  updatedByRole: {
    type: String,
    enum: ['superadmin', 'admin', 'manager', 'employee']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model<IService>('Service', ServiceSchema);