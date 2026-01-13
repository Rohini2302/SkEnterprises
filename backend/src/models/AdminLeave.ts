// models/AdminLeave.ts
import mongoose, { Schema, Document } from 'mongoose';

export type LeaveType = 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface IAdminLeave extends Document {
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  fromDate: Date;
  toDate: Date;
  totalDays: number;
  reason: string;
  appliedDate: Date;
  appliedBy: string;
  department: string;
  contactNumber?: string;
  status: LeaveStatus;
  remarks?: string;
  cancellationReason?: string;
  
  // New fields for superadmin approval
  approvedBy?: string;        // Superadmin who approved
  approvedAt?: Date;          // When it was approved
  rejectedBy?: string;        // Superadmin who rejected
  rejectedAt?: Date;          // When it was rejected
  superadminRemarks?: string; // Remarks from superadmin
  
  // Request type identifier
  requestType: 'admin-leave'; // To identify this is an admin leave
  
  createdAt: Date;
  updatedAt: Date;
}

const AdminLeaveSchema: Schema = new Schema({
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true
  },
  leaveType: {
    type: String,
    enum: ['annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid'],
    required: true
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
    min: 1
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  appliedBy: {
    type: String,
    required: true
  },
  department: {
    type: String,
    default: 'Administration'
  },
  contactNumber: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  remarks: {
    type: String,
    trim: true
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  
  // New fields for superadmin approval
  approvedBy: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  rejectedBy: {
    type: String
  },
  rejectedAt: {
    type: Date
  },
  superadminRemarks: {
    type: String,
    trim: true
  },
  
  // Request type identifier
  requestType: {
    type: String,
    default: 'admin-leave',
    enum: ['admin-leave']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
AdminLeaveSchema.index({ employeeId: 1, status: 1 });
AdminLeaveSchema.index({ fromDate: 1, toDate: 1 });
AdminLeaveSchema.index({ status: 1, appliedDate: -1 });
AdminLeaveSchema.index({ requestType: 1 }); // Index for filtering

// Pre-save middleware to update approval/rejection dates
AdminLeaveSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    if (this.status === 'approved') {
      this.approvedAt = now;
    } else if (this.status === 'rejected') {
      this.rejectedAt = now;
    }
  }
  next();
});

const AdminLeave = mongoose.model<IAdminLeave>('AdminLeave', AdminLeaveSchema);

export default AdminLeave;