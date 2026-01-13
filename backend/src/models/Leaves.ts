import mongoose, { Schema, Document } from 'mongoose';

export interface ILeave extends Document {
  employeeId: string;
  employeeName: string;
  department: string;
  contactNumber: string;
  leaveType: 'annual' | 'sick' | 'casual' | 'other';
  fromDate: Date;
  toDate: Date;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedBy: string;
  appliedFor: string;
  remarks?: string;
  approvedBy?: string;
  rejectedBy?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  cancellationReason?: string;
  managerRemarks?: string;
  attachmentUrl?: string;
  emergencyContact?: string;
  handoverTo?: string;
  handoverCompleted?: boolean;
  handoverRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema: Schema = new Schema({
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    index: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  leaveType: {
    type: String,
    enum: ['annual', 'sick', 'casual', 'other'],
    required: true,
    default: 'casual'
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true,
    min: 0.5,
    max: 90
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },
  appliedBy: {
    type: String,
    required: true
  },
  appliedFor: {
    type: String,
    required: true
  },
  // Manager/Supervisor fields
  remarks: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: String
  },
  rejectedBy: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  managerRemarks: {
    type: String,
    trim: true
  },
  // Additional fields for leave management
  attachmentUrl: {
    type: String
  },
  emergencyContact: {
    type: String
  },
  handoverTo: {
    type: String,
    trim: true
  },
  handoverCompleted: {
    type: Boolean,
    default: false
  },
  handoverRemarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Add indexes for better query performance
LeaveSchema.index({ department: 1, status: 1 });
LeaveSchema.index({ employeeId: 1, status: 1 });
LeaveSchema.index({ fromDate: 1, toDate: 1 });
LeaveSchema.index({ createdAt: -1 });

// Virtual for checking if leave is active
LeaveSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.fromDate <= now && this.toDate >= now;
});

// Virtual for checking if leave is upcoming
LeaveSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  return this.fromDate > now;
});

// Virtual for checking if leave is past
LeaveSchema.virtual('isPast').get(function() {
  const now = new Date();
  return this.toDate < now;
});

// Pre-save middleware to update approval/rejection dates
LeaveSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    if (this.status === 'approved') {
      this.approvedAt = now;
      if (!this.approvedBy && this.isModified('status')) {
        // This would typically be set by the controller
        this.approvedBy = 'System';
      }
    } else if (this.status === 'rejected') {
      this.rejectedAt = now;
      if (!this.rejectedBy && this.isModified('status')) {
        this.rejectedBy = 'System';
      }
    }
  }
  next();
});

// Static method to get leave summary by department
LeaveSchema.statics.getDepartmentSummary = async function(department: string) {
  return this.aggregate([
    { $match: { department } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDays: { $sum: '$totalDays' },
        averageDays: { $avg: '$totalDays' }
      }
    }
  ]);
};

// Static method to get employee leave history
LeaveSchema.statics.getEmployeeHistory = async function(employeeId: string, limit = 10) {
  return this.find({ employeeId })
    .sort({ fromDate: -1 })
    .limit(limit);
};

// Static method to get pending leaves count by department
LeaveSchema.statics.getPendingCount = async function(department: string) {
  return this.countDocuments({ 
    department, 
    status: 'pending',
    fromDate: { $gte: new Date() } // Only future leaves
  });
};

// Static method to check for overlapping leaves
LeaveSchema.statics.hasOverlappingLeave = async function(
  employeeId: string, 
  fromDate: Date, 
  toDate: Date, 
  excludeId?: string
) {
  const query: any = {
    employeeId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { fromDate: { $lte: toDate }, toDate: { $gte: fromDate } }
    ]
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.findOne(query);
};

// Instance method to get leave status in human readable format
// Instance method to get status in human readable format
LeaveSchema.methods.getStatusText = function() {
  const statusMap: {[key: string]: string} = {
    'pending': 'Pending Approval',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'cancelled': 'Cancelled'
  };
  return statusMap[this.status] || this.status;
};

// Instance method to get leave type in human readable format
LeaveSchema.methods.getLeaveTypeText = function() {
  const typeMap: {[key: string]: string} = {
    'annual': 'Annual Leave',
    'sick': 'Sick Leave',
    'casual': 'Casual Leave',
    'other': 'Other Leave'
  };
  return typeMap[this.leaveType] || this.leaveType;
};

// Instance method to format leave dates
LeaveSchema.methods.getFormattedDates = function() {
  const formatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  return {
    fromDate: this.fromDate.toLocaleDateString('en-US', formatOptions),
    toDate: this.toDate.toLocaleDateString('en-US', formatOptions),
    appliedDate: this.createdAt.toLocaleDateString('en-US', formatOptions),
    approvedDate: this.approvedAt ? this.approvedAt.toLocaleDateString('en-US', formatOptions) : null,
    rejectedDate: this.rejectedAt ? this.rejectedAt.toLocaleDateString('en-US', formatOptions) : null
  };
};

// Instance method to check if leave conflicts with another date range
LeaveSchema.methods.conflictsWith = function(fromDate: Date, toDate: Date) {
  return (
    (this.fromDate <= toDate && this.toDate >= fromDate) ||
    (fromDate <= this.toDate && toDate >= this.fromDate)
  );
};

// Instance method to get leave duration in text
LeaveSchema.methods.getDurationText = function() {
  if (this.totalDays === 1) {
    return '1 day';
  } else if (this.totalDays < 1) {
    return 'Half day';
  } else {
    return '${this.totalDays} days';
  }
};

// Instance method to check if leave is for current user
LeaveSchema.methods.isForUser = function(employeeId: string) {
  return this.employeeId === employeeId;
};

// Instance method to check if leave requires handover
LeaveSchema.methods.requiresHandover = function() {
  return this.totalDays > 3; // Example: Requires handover for leaves longer than 3 days
};

export default mongoose.model<ILeave>('Leave', LeaveSchema);