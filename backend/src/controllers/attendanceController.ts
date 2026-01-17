import { Request, Response } from 'express';
import Attendance, { IAttendance } from '../models/Attendance';
import mongoose from 'mongoose';

// Check in function
export const checkIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, employeeName, department } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({ 
      employeeId, 
      date: today 
    });

    if (existingAttendance) {
      res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
      return;
    }

    // Create new attendance record
    const attendance = new Attendance({
      employeeId,
      employeeName,
      date: today,
      checkInTime: currentTime,
      status: 'present',
      isCheckedIn: true,
      department,
      totalHours: 0
    });

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Checked in successfully',
      data: attendance
    });
  } catch (error: any) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking in'
    });
  }
};

// Check out function
export const checkOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    // Find today's attendance
    const attendance = await Attendance.findOne({ 
      employeeId, 
      date: today 
    });

    if (!attendance) {
      res.status(404).json({
        success: false,
        message: 'No check-in record found for today'
      });
      return;
    }

    if (attendance.checkOutTime) {
      res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
      return;
    }

    // Calculate total hours
    const checkInTime = new Date(`2000-01-01T${attendance.checkInTime}`);
    const checkOutTime = new Date(`2000-01-01T${currentTime}`);
    let totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    
    // Subtract break time if any
    if (attendance.breakTime) {
      totalHours -= attendance.breakTime / 60;
    }

    // Update attendance
    attendance.checkOutTime = currentTime;
    attendance.totalHours = parseFloat(totalHours.toFixed(2));
    attendance.isCheckedIn = false;
    
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      data: attendance
    });
  } catch (error: any) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking out'
    });
  }
};

// Break in function
export const breakIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const attendance = await Attendance.findOne({ 
      employeeId, 
      date: today 
    });

    if (!attendance) {
      res.status(404).json({
        success: false,
        message: 'No attendance record found'
      });
      return;
    }

    if (attendance.isOnBreak) {
      res.status(400).json({
        success: false,
        message: 'Already on break'
      });
      return;
    }

    attendance.breakStartTime = currentTime;
    attendance.isOnBreak = true;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Break started',
      data: attendance
    });
  } catch (error: any) {
    console.error('Break-in error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error starting break'
    });
  }
};

// Break out function
export const breakOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const attendance = await Attendance.findOne({ 
      employeeId, 
      date: today 
    });

    if (!attendance) {
      res.status(404).json({
        success: false,
        message: 'No attendance record found'
      });
      return;
    }

    if (!attendance.isOnBreak) {
      res.status(400).json({
        success: false,
        message: 'Not currently on break'
      });
      return;
    }

    // Calculate break duration in minutes
    const breakStart = new Date(`2000-01-01T${attendance.breakStartTime}`);
    const breakEnd = new Date(`2000-01-01T${currentTime}`);
    const breakDuration = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);

    attendance.breakEndTime = currentTime;
    attendance.breakTime = (attendance.breakTime || 0) + breakDuration;
    attendance.isOnBreak = false;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Break ended',
      breakDuration: `${breakDuration.toFixed(0)} minutes`,
      data: attendance
    });
  } catch (error: any) {
    console.error('Break-out error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error ending break'
    });
  }
};

// Get today's status
export const getTodayStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({ 
      employeeId, 
      date: today 
    });

    if (!attendance) {
      res.status(200).json({
        success: true,
        data: null,
        message: 'No attendance record for today'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error: any) {
    console.error('Get today status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching today\'s status'
    });
  }
};

// Get attendance history
export const getAttendanceHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    
    let query: any = {};
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: attendance,
      count: attendance.length
    });
  } catch (error: any) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching attendance history'
    });
  }
};

// Get team attendance
export const getTeamAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supervisorId, date } = req.query;
    const today = date || new Date().toISOString().split('T')[0];

    let query: any = { date: today };
    
    if (supervisorId) {
      query.supervisorId = supervisorId;
    }

    const attendance = await Attendance.find(query)
      .sort({ checkInTime: 1 });

    res.status(200).json({
      success: true,
      data: attendance,
      count: attendance.length,
      date: today
    });
  } catch (error: any) {
    console.error('Get team attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching team attendance'
    });
  }
};

// Get all attendance (admin)
export const getAllAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50, date, department } = req.query;
    
    let query: any = {};
    
    if (date) {
      query.date = date;
    }
    
    if (department) {
      query.department = department;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [attendance, total] = await Promise.all([
      Attendance.find(query)
        .sort({ date: -1, checkInTime: 1 })
        .skip(skip)
        .limit(limitNum),
      Attendance.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: attendance,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching attendance records'
    });
  }
};

// Update attendance (admin/supervisor)
export const updateAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid attendance ID'
      });
      return;
    }

    const attendance = await Attendance.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!attendance) {
      res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error: any) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating attendance'
    });
  }
};

// Manual attendance entry
export const manualAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const attendanceData = req.body;

    // Validate required fields
    const requiredFields = ['employeeId', 'employeeName', 'date', 'checkInTime'];
    for (const field of requiredFields) {
      if (!attendanceData[field]) {
        res.status(400).json({
          success: false,
          message: `${field} is required`
        });
        return;
      }
    }

    // Check if record already exists
    const existing = await Attendance.findOne({
      employeeId: attendanceData.employeeId,
      date: attendanceData.date
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Attendance record already exists for this date'
      });
      return;
    }

    const attendance = new Attendance(attendanceData);
    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Manual attendance recorded successfully',
      data: attendance
    });
  } catch (error: any) {
    console.error('Manual attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error recording manual attendance'
    });
  }
};

// Weekly summary
export const getWeeklySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, weekStart } = req.query;
    
    // Default to current week
    const startDate = weekStart ? new Date(weekStart as string) : new Date();
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // End of week (Saturday)
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    let query: any = {
      date: { $gte: startDateStr, $lte: endDateStr }
    };
    
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const attendance = await Attendance.find(query).sort({ date: 1 });

    // Calculate summary
    const totalDays = 7;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const halfDays = attendance.filter(a => a.status === 'half-day').length;
    const leaveDays = attendance.filter(a => a.status === 'leave').length;
    const totalHours = attendance.reduce((sum, a) => sum + a.totalHours, 0);

    res.status(200).json({
      success: true,
      data: {
        weekStart: startDateStr,
        weekEnd: endDateStr,
        attendance,
        summary: {
          totalDays,
          presentDays,
          absentDays,
          halfDays,
          leaveDays,
          totalHours: totalHours.toFixed(2),
          averageHours: (totalHours / (presentDays + halfDays) || 0).toFixed(2)
        }
      }
    });
  } catch (error: any) {
    console.error('Get weekly summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching weekly summary'
    });
  }
};

// Helper function to format time
const formatTime = (hourDecimal: number): string => {
  const hour = Math.floor(hourDecimal);
  const minute = Math.floor((hourDecimal - hour) * 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

// Helper function to calculate attendance statistics
const calculateAttendanceStats = (records: any[]): any => {
  const presentCount = records.filter((r: any) => r.status === "Present").length;
  const lateCount = records.filter((r: any) => r.status === "Late").length;
  const halfDayCount = records.filter((r: any) => r.status === "Half Day").length;
  const leaveCount = records.filter((r: any) => r.status === "Leave").length;
  const absentCount = records.filter((r: any) => r.status === "Absent").length;
  
  const totalHours = records.reduce((sum: number, record: any) => sum + parseFloat(record.totalHours), 0);
  const totalOvertime = records.reduce((sum: number, record: any) => sum + parseFloat(record.overtime), 0);
  
  const totalEmployees = [...new Set(records.map((r: any) => r.employeeId))].length;
  const totalDays = records.length / totalEmployees || 1;
  
  const workingDays = presentCount + lateCount + halfDayCount;
  const attendanceRate = workingDays > 0 ? ((presentCount + lateCount * 0.8 + halfDayCount * 0.5) / workingDays) * 100 : 0;
  
  const managerRecords = records.filter((r: any) => r.role === "manager");
  const supervisorRecords = records.filter((r: any) => r.role === "supervisor");
  
  const managerAttendance = managerRecords.length > 0 
    ? (managerRecords.filter((r: any) => r.status === "Present").length / managerRecords.length) * 100
    : 0;
    
  const supervisorAttendance = supervisorRecords.length > 0
    ? (supervisorRecords.filter((r: any) => r.status === "Present").length / supervisorRecords.length) * 100
    : 0;
  
  return {
    totalEmployees,
    totalDays: Math.round(totalDays),
    presentDays: presentCount,
    absentDays: absentCount,
    lateDays: lateCount,
    halfDays: halfDayCount,
    leaveDays: leaveCount,
    averageHours: (totalHours / workingDays || 0).toFixed(1),
    totalOvertime: totalOvertime.toFixed(1),
    attendanceRate: Math.round(attendanceRate),
    managerAttendance: Math.round(managerAttendance),
    supervisorAttendance: Math.round(supervisorAttendance)
  };
};

// Helper function to generate sample attendance data
const generateSampleAttendanceData = (
  userId: string, 
  startDateStr: string, 
  endDateStr: string, 
  viewMode: string, 
  siteFilter?: string
): any[] => {
  const records: any[] = [];
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  
  // Sample employees for team view
  const sampleEmployees = [
    { id: userId, name: 'John Manager', role: 'manager', department: 'Operations', site: 'Site A' },
    { id: 'sup001', name: 'Alex Supervisor', role: 'supervisor', department: 'Production', site: 'Site A' },
    { id: 'sup002', name: 'Sam Wilson', role: 'supervisor', department: 'Quality', site: 'Site A' },
    { id: 'sup003', name: 'Taylor Smith', role: 'supervisor', department: 'Maintenance', site: 'Site B' },
    { id: 'sup004', name: 'Jordan Brown', role: 'supervisor', department: 'Logistics', site: 'Site B' }
  ];

  // Determine which employees to include based on view mode
  let employeesToInclude: any[] = [];
  
  if (viewMode === 'my') {
    // Only include the manager
    employeesToInclude = sampleEmployees.filter(emp => emp.id === userId);
  } else if (viewMode === 'team') {
    // Include supervisors on same site(s)
    const manager = sampleEmployees.find(emp => emp.id === userId);
    if (manager) {
      if (siteFilter && siteFilter !== 'All Sites') {
        employeesToInclude = sampleEmployees.filter(emp => 
          emp.role === 'supervisor' && emp.site === siteFilter
        );
      } else {
        employeesToInclude = sampleEmployees.filter(emp => 
          emp.role === 'supervisor' && emp.site === manager.site
        );
      }
    }
  }

  // Generate records for each day and each employee
  const currentDate = new Date(startDate);
  let recordId = 1;
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    employeesToInclude.forEach(employee => {
      // Generate attendance status based on probabilities
      let status: string, hours: number, checkIn: string, checkOut: string, breaks: number, breakDuration: string, overtime: number;
      
      if (isWeekend && Math.random() < 0.7) {
        status = 'Leave';
        hours = 0;
        checkIn = '-';
        checkOut = '-';
        breaks = 0;
        breakDuration = '0m';
        overtime = 0;
      } else {
        const rand = Math.random();
        if (rand < 0.65) {
          status = 'Present';
          hours = 8.0 + (Math.random() * 0.5);
        } else if (rand < 0.80) {
          status = 'Late';
          hours = 7.5 + (Math.random() * 0.5);
        } else if (rand < 0.90) {
          status = 'Half Day';
          hours = 4.0 + (Math.random() * 1.0);
        } else if (rand < 0.95) {
          status = 'Absent';
          hours = 0;
        } else {
          status = 'Leave';
          hours = 0;
        }
        
        overtime = Math.max(0, hours - 8.0);
        breaks = status !== 'Absent' && status !== 'Leave' ? Math.floor(Math.random() * 2) + 1 : 0;
        breakDuration = status !== 'Absent' && status !== 'Leave' ? '45m' : '0m';
        
        // Generate check-in/out times
        if (status === 'Present' || status === 'Late' || status === 'Half Day') {
          const checkInHour = status === 'Late' ? 9 + Math.random() : 8 + Math.random() * 0.5;
          const checkOutHour = checkInHour + hours;
          
          checkIn = formatTime(checkInHour);
          checkOut = formatTime(checkOutHour);
        } else {
          checkIn = '-';
          checkOut = '-';
        }
      }
      
      records.push({
        id: `${employee.id}-${recordId++}`,
        employeeId: employee.id,
        employeeName: employee.name,
        role: employee.role,
        date: dateStr,
        day: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        checkIn,
        checkOut,
        status,
        totalHours: hours.toFixed(1),
        breaks,
        breakDuration,
        overtime: overtime.toFixed(1),
        site: employee.site,
        department: employee.department
      });
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return records;
};

// Manager attendance function
export const getManagerAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, month, site, role, viewMode = 'my' } = req.query;
    const token = req.headers.authorization?.split(' ')[1];

    console.log('Manager attendance request:', { userId, month, site, role, viewMode });

    // Validate required parameters
    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    // Parse month to date range
    let startDate: Date, endDate: Date;
    if (month) {
      startDate = new Date(`${month}-01`);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    } else {
      // Default to current month if no month specified
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Format dates for query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Initialize sample data
    const sampleData: any = {
      success: true,
      records: [],
      stats: {
        totalEmployees: 0,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        halfDays: 0,
        leaveDays: 0,
        averageHours: "0.0",
        totalOvertime: "0.0",
        attendanceRate: 0,
        managerAttendance: 0,
        supervisorAttendance: 0
      },
      managerSites: ['Site A', 'Site B'],
      totalRecords: 0,
      dateRange: {
        start: startDateStr,
        end: endDateStr
      }
    };

    // Generate sample records if in development mode
    if (process.env.NODE_ENV === 'development') {
      // Generate sample attendance records
      const sampleRecords = generateSampleAttendanceData(
        userId as string, 
        startDateStr, 
        endDateStr, 
        viewMode as string, 
        site as string
      );
      
      sampleData.records = sampleRecords;
      sampleData.totalRecords = sampleRecords.length;
      
      // Calculate stats from sample data
      const stats = calculateAttendanceStats(sampleRecords);
      sampleData.stats = stats;
    }

    res.json(sampleData);

  } catch (error: any) {
    console.error('Error in getManagerAttendance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching manager attendance data'
    });
  }
};

// Export all functions as a default object
export default {
  checkIn,
  checkOut,
  breakIn,
  breakOut,
  getTodayStatus,
  getAttendanceHistory,
  getTeamAttendance,
  getAllAttendance,
  updateAttendance,
  manualAttendance,
  getWeeklySummary,
  getManagerAttendance
};