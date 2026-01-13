// models/ManagerLeave.ts
import mongoose, { Schema, Document } from 'mongoose';

export type ManagerLeaveType = 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid' | 'casual';
export type ManagerLeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface IManagerLeave extends Document {
  // Manager information (NOT employee)
  managerId: string;
  managerName: string;
  managerDepartment: string;
  managerPosition: string;
  managerEmail: string;
  managerContact: string;
  
  // Leave information
  leaveType: ManagerLeaveType;
  fromDate: Date;
  toDate: Date;
  totalDays: number;
  reason: string;
  
  // Application details
  appliedBy: string; // Usually same as managerName
  appliedDate: Date;
  
  // Status tracking
  status: ManagerLeaveStatus;
  remarks?: string;
  
  // Approval/Rejection info
  approvedBy?: string;    // Superadmin who approved
  approvedAt?: Date;
  rejectedBy?: string;    // Superadmin who rejected
  rejectedAt?: Date;
  superadminRemarks?: string;
  
  // Cancellation
  cancellationReason?: string;
  
  // System tracking
  requestType: 'manager-leave'; // To differentiate from other leave types
  createdAt: Date;
  updatedAt: Date;
}

const ManagerLeaveSchema: Schema = new Schema({
  // Manager information
  managerId: {
    type: String,
    required: true,
    index: true
  },
  managerName: {
    type: String,
    required: true
  },
  managerDepartment: {
    type: String,
    required: true
  },
  managerPosition: {
    type: String,
    default: 'Manager'
  },
  managerEmail: {
    type: String,
    trim: true
  },
  managerContact: {
    type: String,
    required: true
  },
  
  // Leave information
  leaveType: {
    type: String,
    enum: ['annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid', 'casual'],
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
  
  // Application details
  appliedBy: {
    type: String,
    required: true
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },
  remarks: {
    type: String,
    trim: true
  },
  
  // Approval/Rejection
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
  
  // Cancellation
  cancellationReason: {
    type: String,
    trim: true
  },
  
  // System tracking
  requestType: {
    type: String,
    default: 'manager-leave',
    enum: ['manager-leave']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ManagerLeaveSchema.index({ managerId: 1, status: 1 });
ManagerLeaveSchema.index({ managerDepartment: 1 });
ManagerLeaveSchema.index({ appliedDate: -1 });
ManagerLeaveSchema.index({ requestType: 1 });

const ManagerLeave = mongoose.model<IManagerLeave>('ManagerLeave', ManagerLeaveSchema);

export default ManagerLeave;