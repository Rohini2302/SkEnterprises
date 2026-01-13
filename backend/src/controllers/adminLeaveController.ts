// controllers/adminLeaveController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import AdminLeave from '../models/AdminLeave';

// Apply for admin leave
export const applyAdminLeave = async (req: Request, res: Response) => {
  try {
    const {
      leaveType,
      fromDate,
      toDate,
      reason,
      appliedBy,
      employeeName,
      contactNumber,
      department
    } = req.body;

    // Validate required fields
    if (!leaveType || !fromDate || !toDate || !reason || !appliedBy || !employeeName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Calculate total days
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const timeDiff = to.getTime() - from.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    // Generate employee ID if not provided (for admin)
    const employeeId = `ADMIN-${new Date().getFullYear()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Create new admin leave record
    const newLeave = new AdminLeave({
      employeeId,
      employeeName,
      leaveType,
      fromDate: from,
      toDate: to,
      totalDays,
      reason,
      appliedDate: new Date(),
      appliedBy,
      department: department || 'Administration',
      contactNumber,
      status: 'pending', // Always starts as pending for superadmin approval
      requestType: 'admin-leave'
    });

    await newLeave.save();

    res.status(201).json({
      success: true,
      message: 'Admin leave request submitted successfully. Waiting for superadmin approval.',
      leave: newLeave
    });
  } catch (error: any) {
    console.error('Error applying admin leave:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying for leave',
      error: error.message
    });
  }
};

// Get all admin leaves (for admin view - only their own leaves)
export const getAdminLeaves = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate, employeeName, userId } = req.query;
    
    let filter: any = { requestType: 'admin-leave' };
    
    // If userId is provided, filter by appliedBy (for admins to see only their own leaves)
    if (userId) {
      filter.appliedBy = userId;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (startDate && endDate) {
      filter.appliedDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    if (employeeName) {
      filter.employeeName = { $regex: employeeName, $options: 'i' };
    }
    
    const leaves = await AdminLeave.find(filter)
      .sort({ appliedDate: -1 });
    
    res.status(200).json({
      success: true,
      leaves,
      count: leaves.length
    });
  } catch (error: any) {
    console.error('Error fetching admin leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin leaves',
      error: error.message
    });
  }
};

// Get ALL admin leaves for superadmin view (no filtering by user)
export const getAllAdminLeavesForSuperadmin = async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      startDate, 
      endDate, 
      employeeName,
      department,
      appliedBy,
      page = 1, 
      limit = 50,
      sortBy = 'appliedDate',
      sortOrder = 'desc'
    } = req.query;

    const query: any = { requestType: 'admin-leave' };
    
    // Apply filters if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (department && department !== 'all') {
      query.department = department;
    }
    
    if (appliedBy) {
      query.appliedBy = { $regex: appliedBy, $options: 'i' };
    }
    
    if (employeeName) {
      query.employeeName = { $regex: employeeName, $options: 'i' };
    }
    
    if (startDate && endDate) {
      query.appliedDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Determine sort order
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const leaves = await AdminLeave.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await AdminLeave.countDocuments(query);

    // Get unique departments and appliedBy for filter
    const departments = await AdminLeave.distinct('department');
    const appliedByList = await AdminLeave.distinct('appliedBy');

    // Calculate stats
    const stats = await AdminLeave.aggregate([
      { $match: { requestType: 'admin-leave' } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format stats
    const formattedStats = {
      total,
      pending: stats.find(s => s._id === 'pending')?.count || 0,
      approved: stats.find(s => s._id === 'approved')?.count || 0,
      rejected: stats.find(s => s._id === 'rejected')?.count || 0,
      cancelled: stats.find(s => s._id === 'cancelled')?.count || 0
    };

    res.status(200).json({
      success: true,
      leaves: leaves.map(leave => ({
        ...leave,
        id: leave._id.toString()
      })),
      stats: formattedStats,
      filters: {
        departments: ['all', ...departments],
        appliedByList: ['all', ...appliedByList]
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching all admin leaves for superadmin:', error);
    res.status(500).json({ 
      message: 'Error fetching admin leaves', 
      error: error.message 
    });
  }
};

// Update admin leave status (for superadmin only)
export const updateAdminLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, superadminRemarks, approvedBy, rejectedBy } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Only "approved" or "rejected" allowed'
      });
    }
    
    // Check if superadmin name is provided
    if (status === 'approved' && !approvedBy) {
      return res.status(400).json({
        success: false,
        message: 'Superadmin name is required for approval'
      });
    }
    
    if (status === 'rejected' && !rejectedBy) {
      return res.status(400).json({
        success: false,
        message: 'Superadmin name is required for rejection'
      });
    }
    
    const leave = await AdminLeave.findById(id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }
    
    // Update leave status with superadmin info
    leave.status = status;
    leave.superadminRemarks = superadminRemarks;
    leave.updatedAt = new Date();
    
    if (status === 'approved') {
      leave.approvedBy = approvedBy;
      leave.approvedAt = new Date();
    } else if (status === 'rejected') {
      leave.rejectedBy = rejectedBy;
      leave.rejectedAt = new Date();
    }
    
    await leave.save();
    
    res.status(200).json({
      success: true,
      message: `Admin leave request ${status} by superadmin`,
      leave
    });
  } catch (error: any) {
    console.error('Error updating admin leave status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave status',
      error: error.message
    });
  }
};

// Cancel admin leave (admin can cancel their own pending leave)
export const cancelAdminLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cancellationReason, cancelledBy } = req.body;
    
    const leave = await AdminLeave.findById(id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }
    
    // Only allow cancellation if status is pending
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be cancelled'
      });
    }
    
    leave.status = 'cancelled';
    if (cancellationReason) {
      leave.cancellationReason = cancellationReason;
    }
    if (cancelledBy) {
      leave.appliedBy = cancelledBy; // Update who cancelled it
    }
    leave.updatedAt = new Date();
    
    await leave.save();
    
    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      leave
    });
  } catch (error: any) {
    console.error('Error cancelling admin leave:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling leave request',
      error: error.message
    });
  }
};

// Get admin leave statistics
export const getAdminLeaveStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query; // For admin to see their own stats
    
    let filter: any = { requestType: 'admin-leave' };
    
    // If userId provided, filter by appliedBy
    if (userId) {
      filter.appliedBy = userId;
    }
    
    const adminLeaves = await AdminLeave.find(filter);
    
    const stats = {
      total: adminLeaves.length,
      pending: adminLeaves.filter((l: any) => l.status === 'pending').length,
      approved: adminLeaves.filter((l: any) => l.status === 'approved').length,
      rejected: adminLeaves.filter((l: any) => l.status === 'rejected').length,
      cancelled: adminLeaves.filter((l: any) => l.status === 'cancelled').length,
      totalDays: adminLeaves.reduce((sum: number, leave: any) => sum + leave.totalDays, 0)
    };
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching admin leave stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin leave statistics',
      error: error.message
    });
  }
};