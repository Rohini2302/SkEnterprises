import express from 'express';
import {
  // Existing functions from YOUR actual controller
  getAllLeaves,
  getEmployeeLeaves,
  getSupervisorLeaves,
  applyForLeave,
  updateLeaveStatus,
  getSupervisorEmployees,
  getLeaveStats,
  getAllDepartments,
  getEmployeeCountByDepartment,
} from '../controllers/leaveController';

const router = express.Router();

// Test routes
router.get('/test/employees', async (req, res) => {
  try {
    const Employee = (await import('../models/Employee')).default;
    const employees = await Employee.find().limit(10);
    const departments = await Employee.distinct('department');
    const totalCount = await Employee.countDocuments();
    const activeCount = await Employee.countDocuments({ status: 'active' });
    
    res.json({
      success: true,
      totalCount,
      activeCount,
      departments,
      sampleEmployees: employees.map(emp => ({
        id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        department: emp.department,
        position: emp.position,
        phone: emp.phone,
        email: emp.email,
        status: emp.status
      }))
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Add test employee
router.post('/test/add-employee', async (req, res) => {
  try {
    const { employeeId, name, department, position, phone, email } = req.body;
    const Employee = (await import('../models/Employee')).default;
    
    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }
    
    const employee = new Employee({
      employeeId,
      name,
      department,
      position,
      phone,
      email,
      status: 'active'
    });
    
    await employee.save();
    
    res.json({
      success: true,
      message: 'Employee added successfully',
      employee
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get all departments
router.get('/departments', getAllDepartments);

// Get employee count by department
router.get('/employee-count', getEmployeeCountByDepartment);

// Main routes (using your actual functions)
router.post('/apply', applyForLeave);
router.get('/employee/:employeeId', getEmployeeLeaves);
router.get('/supervisor', getSupervisorLeaves);
router.get('/supervisor/employees', getSupervisorEmployees);
router.get('/', getAllLeaves);
router.put('/:id/status', updateLeaveStatus);
router.get('/stats', getLeaveStats);

// Manager apply leave route (FIXED VERSION)
router.post('/manager/apply', async (req, res) => {
  try {
    // Import Leave model dynamically
    const Leave = (await import('../models/Leaves')).default;
    
    // Store manager leave separately or with isManagerLeave flag
    const leaveData = {
      ...req.body,
      isManagerLeave: true,
      type: 'manager'
    };
    
    // Save to database (could be separate collection or same with flag)
    const leave = await Leave.create(leaveData);
    res.status(201).json({ message: 'Manager leave submitted successfully', leave });
  } catch (error: any) {
    console.error('Error submitting manager leave:', error);
    res.status(400).json({ message: error.message || 'Failed to submit manager leave' });
  }
});

// Manager leaves route (FIXED VERSION)
router.get('/manager', async (req, res) => {
  try {
    const { name } = req.query;
    // Import Leave model dynamically
    const Leave = (await import('../models/Leaves')).default;
    
    // Fetch manager leaves (either from separate collection or filtered)
    const managerLeaves = await Leave.find({ 
      appliedBy: name,
      isManagerLeave: true 
    }).sort({ createdAt: -1 });
    res.json(managerLeaves);
  } catch (error: any) {
    console.error('Error fetching manager leaves:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch manager leaves' });
  }
});

// ============= NEW ADMIN ENDPOINTS FOR SUPERADMIN =============

// Get all leaves for superadmin (simple version - ALL leaves)
router.get('/admin/all', async (req: express.Request, res: express.Response) => {
  try {
    const { 
      status, 
      department, 
      employeeName, 
      page = 1, 
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const Leave = (await import('../models/Leaves')).default;
    
    let query: any = {};
    
    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (department && department !== 'all') {
      query.department = department;
    }
    
    if (employeeName) {
      query.employeeName = { $regex: employeeName, $options: 'i' };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Determine sort order
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const leaves = await Leave.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Leave.countDocuments(query);

    // Get stats
    const stats = await Leave.aggregate([
      { $match: query },
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
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching all leaves for admin:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching leaves', 
      error: error.message 
    });
  }
});

// Get supervisor/employee leaves for superadmin (excluding managers and admins)
router.get('/admin/supervisor-employee', async (req: express.Request, res: express.Response) => {
  try {
    const { 
      status, 
      department, 
      employeeName, 
      employeeId,
      page = 1, 
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const Leave = (await import('../models/Leaves')).default;
    
    // Build query for supervisor/employee leaves
    let query: any = {};
    
    // Exclude manager leaves (isManagerLeave = true)
    query.isManagerLeave = { $ne: true };
    
    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (department && department !== 'all') {
      query.department = department;
    }
    
    if (employeeName) {
      query.employeeName = { $regex: employeeName, $options: 'i' };
    }
    
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Determine sort order
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const leaves = await Leave.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Leave.countDocuments(query);

    // Get stats
    const stats = await Leave.aggregate([
      { $match: query },
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
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching supervisor/employee leaves:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching leaves', 
      error: error.message 
    });
  }
});

// Get manager leaves for superadmin (manager leaves only)
router.get('/admin/managers', async (req: express.Request, res: express.Response) => {
  try {
    const { 
      status, 
      department, 
      managerName, 
      page = 1, 
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const Leave = (await import('../models/Leaves')).default;
    
    // Build query for manager leaves
    let query: any = {};
    
    // Only include manager leaves
    query.isManagerLeave = true;
    
    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (department && department !== 'all') {
      query.department = department;
    }
    
    if (managerName) {
      query.employeeName = { $regex: managerName, $options: 'i' };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Determine sort order
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const leaves = await Leave.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Leave.countDocuments(query);

    // Get stats
    const stats = await Leave.aggregate([
      { $match: query },
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
        isManagerLeave: true
      })),
      stats: formattedStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching manager leaves:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching manager leaves', 
      error: error.message 
    });
  }
});

// Get combined manager and admin leaves for superadmin
router.get('/admin/manager-admin', async (req: express.Request, res: express.Response) => {
  try {
    const { 
      status, 
      managerName,
      department,
      page = 1, 
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Import models dynamically
    const Leave = (await import('../models/Leaves')).default;
    const AdminLeave = (await import('../models/AdminLeave')).default;
    
    // Build queries for both manager and admin leaves
    let managerQuery: any = { isManagerLeave: true };
    let adminQuery: any = { requestType: 'admin-leave' };
    
    // Apply filters to both queries
    if (status && status !== 'all') {
      managerQuery.status = status;
      adminQuery.status = status;
    }
    
    if (managerName) {
      managerQuery.employeeName = { $regex: managerName, $options: 'i' };
      adminQuery.employeeName = { $regex: managerName, $options: 'i' };
    }
    
    if (department && department !== 'all') {
      managerQuery.department = department;
      adminQuery.department = department;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Determine sort order
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute both queries
    const [managerLeaves, adminLeaves] = await Promise.all([
      Leave.find(managerQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(Math.floor(limitNum / 2))
        .lean(),
      AdminLeave.find(adminQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(Math.floor(limitNum / 2))
        .lean()
    ]);

    // Combine and format results
    const combinedLeaves = [
      ...managerLeaves.map(leave => ({
        ...leave,
        id: leave._id.toString(),
        requestType: 'manager',
        isManagerLeave: true
      })),
      ...adminLeaves.map(leave => ({
        ...leave,
        id: leave._id.toString(),
        requestType: 'admin-leave',
        isManagerLeave: false
      }))
    ];

    // Get total counts for stats
    const [managerTotal, adminTotal] = await Promise.all([
      Leave.countDocuments(managerQuery),
      AdminLeave.countDocuments(adminQuery)
    ]);

    const total = managerTotal + adminTotal;

    // Get stats for each type
    const [managerStats, adminStats] = await Promise.all([
      Leave.aggregate([
        { $match: managerQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      AdminLeave.aggregate([
        { $match: adminQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Combine stats
    const combinedStats = {
      total,
      pending: (managerStats.find(s => s._id === 'pending')?.count || 0) + 
               (adminStats.find(s => s._id === 'pending')?.count || 0),
      approved: (managerStats.find(s => s._id === 'approved')?.count || 0) + 
                (adminStats.find(s => s._id === 'approved')?.count || 0),
      rejected: (managerStats.find(s => s._id === 'rejected')?.count || 0) + 
                (adminStats.find(s => s._id === 'rejected')?.count || 0),
      cancelled: (managerStats.find(s => s._id === 'cancelled')?.count || 0) + 
                 (adminStats.find(s => s._id === 'cancelled')?.count || 0)
    };

    res.status(200).json({
      success: true,
      leaves: combinedLeaves,
      stats: combinedStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching manager/admin leaves:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching manager/admin leaves', 
      error: error.message 
    });
  }
});

export default router;