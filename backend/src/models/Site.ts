// models/Site.js
import mongoose, { Schema, Document } from 'mongoose';

export interface ISite extends Document {
  // Basic Information
  name: string;
  clientId?: string;
  clientName: string;
  location: string;
  areaSqft: number;
  
  // Manager
  manager?: string;
  
  // NEW: Manager and Supervisor Limits
  managerCount: number; // ADD THIS
  supervisorCount: number; // ADD THIS
  
  // Services
  services: string[];
  
  // Staff Deployment
  staffDeployment: Array<{
    role: string;
    count: number;
  }>;
  
  // Contract Details
  contractValue: number;
  contractEndDate: Date;
  
  // Status
  status: 'active' | 'inactive';
  
  // System Fields
  createdAt: Date;
  updatedAt: Date;
}

const SiteSchema: Schema = new Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true
    },
    clientId: {
      type: String,
      trim: true,
      default: undefined
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    areaSqft: {
      type: Number,
      required: [true, 'Area is required'],
      min: [1, 'Area must be greater than 0']
    },
    
    manager: {
      type: String,
      trim: true,
      default: undefined
    },
    
    // NEW FIELDS: Manager and Supervisor Limits
    managerCount: { // ADD THIS
      type: Number,
      default: 0,
      min: [0, 'Manager count cannot be negative']
    },
    supervisorCount: { // ADD THIS
      type: Number,
      default: 0,
      min: [0, 'Supervisor count cannot be negative']
    },
    
    // Services
    services: {
      type: [String],
      default: [],
      validate: {
        validator: function(services: string[]) {
          const validServices = [
            'Housekeeping',
            'Security',
            'Parking',
            'Waste Management'
          ];
          return services.every(service => validServices.includes(service));
        },
        message: 'Invalid service type'
      }
    },
    
    // Staff Deployment
    staffDeployment: {
      type: [{
        role: {
          type: String,
          required: true,
          enum: [
            'Manager',
            'Supervisor',
            'Housekeeping Staff',
            'Security Guard',
            'Parking Attendant',
            'Waste Collector'
          ]
        },
        count: {
          type: Number,
          required: true,
          min: [0, 'Staff count cannot be negative']
        }
      }],
      default: []
    },
    
    // Contract Details
    contractValue: {
      type: Number,
      required: [true, 'Contract value is required'],
      min: [0, 'Contract value cannot be negative']
    },
    contractEndDate: {
      type: Date,
      required: [true, 'Contract end date is required']
    },
    
    // Status
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
SiteSchema.index({ name: 1 });
SiteSchema.index({ clientName: 1 });
SiteSchema.index({ status: 1 });
SiteSchema.index({ contractEndDate: 1 });
SiteSchema.index({ location: 'text' });

// Virtual for total staff count
SiteSchema.virtual('totalStaff').get(function(this: ISite) {
  return this.staffDeployment.reduce((total, item) => total + item.count, 0);
});

// NEW: Virtual for available manager slots
SiteSchema.virtual('availableManagerSlots').get(function(this: ISite) {
  const currentManagers = this.staffDeployment
    .filter(item => item.role === 'Manager')
    .reduce((total, item) => total + item.count, 0);
  return Math.max(0, this.managerCount - currentManagers);
});

// NEW: Virtual for available supervisor slots
SiteSchema.virtual('availableSupervisorSlots').get(function(this: ISite) {
  const currentSupervisors = this.staffDeployment
    .filter(item => item.role === 'Supervisor')
    .reduce((total, item) => total + item.count, 0);
  return Math.max(0, this.supervisorCount - currentSupervisors);
});

export default mongoose.model<ISite>('Site', SiteSchema);
