// controllers/managerLeaveController.ts
import { Request, Response } from 'express';
import ManagerLeave from '../models/ManagerLeave';

// Apply for manager leave
export const applyManagerLeave = async (req: Request, res: Response) => {
  try {
    const {
      managerId,
      managerName,
      managerDepartment,
      managerPosition,
      managerEmail,
      managerContact,
      leaveType,
      fromDate,
      toDate,
      reason,
      appliedBy
    } = req.body;

    // Validate required fields
    if (!managerId || !managerName || !managerDepartment || !managerContact || 
        !leaveType || !fromDate || !toDate || !reason || !appliedBy) {
      return res.status(400).json({
        success: false,
        message: 'All required fields are missing'
      });
    }

    // Calculate total days
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const timeDiff = to.getTime() - from.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    if (totalDays < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range'
      });
    }

    // Create new manager leave record
    const newLeave = new ManagerLeave({
      managerId,
      managerName,
      managerDepartment,
      managerPosition: managerPosition || 'Manager',
      managerEmail: managerEmail || '',
      managerContact,
      leaveType,
      fromDate: from,
      toDate: to,
      totalDays,
      reason,
      appliedBy,
      appliedDate: new Date(),
      status: 'pending', // Manager leaves go to superadmin for approval
      requestType: 'manager-leave'
    });

    await newLeave.save();

    res.status(201).json({
      success: true,
      message: 'Manager leave request submitted successfully. Waiting for superadmin approval.',
      leave: newLeave
    });
  } catch (error: any) {
    console.error('Error applying manager leave:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying for manager leave',
      error: error.message
    });
  }
};

// Get manager's own leaves
export const getManagerLeaves = async (req: Request, res: Response) => {
  try {
    const { managerId, status, startDate, endDate } = req.query;
    
    if (!managerId) {
      return res.status(400).json({
        success: false,
        message: 'Manager ID is required'
      });
    }
    
    let filter: any = { 
      managerId: managerId as string,
      requestType: 'manager-leave'
    };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (startDate && endDate) {
      filter.appliedDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    const leaves = await ManagerLeave.find(filter)
      .sort({ appliedDate: -1 });
    
    res.status(200).json({
      success: true,
      leaves,
      count: leaves.length
    });
  } catch (error: any) {
    console.error('Error fetching manager leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching manager leaves',
      error: error.message
    });
  }
};

// Get all manager leaves for superadmin view
export const getAllManagerLeavesForSuperadmin = async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      startDate, 
      endDate, 
      managerName,
      managerDepartment,
      page = 1, 
      limit = 50,
      sortBy = 'appliedDate',
      sortOrder = 'desc'
    } = req.query;

    const query: any = { requestType: 'manager-leave' };
    
    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (managerDepartment && managerDepartment !== 'all') {
      query.managerDepartment = managerDepartment;
    }
    
    if (managerName) {
      query.managerName = { $regex: managerName, $options: 'i' };
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
    const leaves = await ManagerLeave.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await ManagerLeave.countDocuments(query);

    // Get unique departments for filter
    const departments = await ManagerLeave.distinct('managerDepartment');

    // Calculate stats
    const stats = await ManagerLeave.aggregate([
      { $match: { requestType: 'manager-leave' } },
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
        id: leave._id.toString(),
        // Add compatibility fields for frontend
        employeeId: leave.managerId,
        employeeName: leave.managerName,
        department: leave.managerDepartment,
        contactNumber: leave.managerContact
      })),
      stats: formattedStats,
      filters: {
        departments: ['all', ...departments]
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching all manager leaves for superadmin:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching manager leaves', 
      error: error.message 
    });
  }
};

// Update manager leave status (superadmin only)
export const updateManagerLeaveStatus = async (req: Request, res: Response) => {
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
    
    const leave = await ManagerLeave.findById(id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Manager leave request not found'
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
      message: `Manager leave request ${status} by superadmin`,
      leave
    });
  } catch (error: any) {
    console.error('Error updating manager leave status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating manager leave status',
      error: error.message
    });
  }
};

// Cancel manager leave (manager can cancel their own pending leave)
export const cancelManagerLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cancellationReason, cancelledBy } = req.body;
    
    const leave = await ManagerLeave.findById(id);
    
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
      leave.appliedBy = cancelledBy;
    }
    leave.updatedAt = new Date();
    
    await leave.save();
    
    res.status(200).json({
      success: true,
      message: 'Manager leave request cancelled successfully',
      leave
    });
  } catch (error: any) {
    console.error('Error cancelling manager leave:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling manager leave request',
      error: error.message
    });
  }
};

// Get manager leave statistics
export const getManagerLeaveStats = async (req: Request, res: Response) => {
  try {
    const { managerId } = req.query;
    
    let filter: any = { requestType: 'manager-leave' };
    
    // If managerId provided, filter for specific manager
    if (managerId) {
      filter.managerId = managerId;
    }
    
    const managerLeaves = await ManagerLeave.find(filter);
    
    const stats = {
      total: managerLeaves.length,
      pending: managerLeaves.filter(l => l.status === 'pending').length,
      approved: managerLeaves.filter(l => l.status === 'approved').length,
      rejected: managerLeaves.filter(l => l.status === 'rejected').length,
      cancelled: managerLeaves.filter(l => l.status === 'cancelled').length,
      totalDays: managerLeaves.reduce((sum, leave) => sum + leave.totalDays, 0)
    };
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching manager leave stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching manager leave statistics',
      error: error.message
    });
  }
};