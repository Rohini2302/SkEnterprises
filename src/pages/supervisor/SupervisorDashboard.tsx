import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  ClipboardList, 
  CheckCircle2, 
  FileText, 
  AlertTriangle,
  Clock,
  TrendingUp,
  MessageSquare,
  Calendar,
  BarChart3,
  Plus,
  Download,
  Search,
  RefreshCw,
  LogIn,
  LogOut,
  Coffee,
  Timer,
  UserCheck,
  ClipboardCheck,
  AlertCircle
} from "lucide-react";

// Define types for the data
interface DashboardStats {
  totalEmployees: number;
  assignedTasks: number;
  completedTasks: number;
  pendingReports: number;
  attendanceRate: number;
  overtimeHours: number;
  productivity: number;
  pendingRequests: number;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  employee: string;
  priority: string;
  timestamp: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  assignedTo: string;
  priority: string;
  progress: number;
}

interface AttendanceStatus {
  isCheckedIn: boolean;
  isOnBreak: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  totalHours: number;
  breakTime: number;
}

interface SupervisorAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  supervisorId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  totalHours: number;
  breakTime: number;
  status: string;
  shift: string;
  hours: number;
}

interface OutletContext {
  onMenuClick: () => void;
}

// API base URL - MAKE SURE THIS MATCHES YOUR BACKEND PORT
const API_BASE_URL = 'http://localhost:5001/api';

// Current employee info (in a real app, this would come from auth context)
const currentEmployee = {
  id: 'supervisor-001',
  name: 'Supervisor User',
  supervisorId: 'supervisor-001',
};

// Mock data generators (YOUR EXISTING CODE - UNCHANGED)
const generateMockStats = (): DashboardStats => ({
  totalEmployees: 24,
  assignedTasks: 45,
  completedTasks: 32,
  pendingReports: 8,
  attendanceRate: 92,
  overtimeHours: 12,
  productivity: 88,
  pendingRequests: 5
});

const generateMockActivities = (): Activity[] => [
  {
    id: '1',
    type: 'task',
    message: 'Completed monthly sales report',
    employee: 'John Doe',
    priority: 'high',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: '2',
    type: 'approval',
    message: 'Requested leave approval',
    employee: 'Sarah Smith',
    priority: 'medium',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: '3',
    type: 'completion',
    message: 'Finished project documentation',
    employee: 'Mike Johnson',
    priority: 'low',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  }
];

const generateMockTeam = (): TeamMember[] => [
  { id: '1', name: 'John Doe', role: 'Senior Developer', status: 'active' },
  { id: '2', name: 'Sarah Smith', role: 'QA Engineer', status: 'active' },
  { id: '3', name: 'Mike Johnson', role: 'Frontend Developer', status: 'remote' },
  { id: '4', name: 'Emily Brown', role: 'Backend Developer', status: 'on leave' },
  { id: '5', name: 'David Wilson', role: 'DevOps Engineer', status: 'active' }
];

const generateMockTasks = (): Task[] => [
  {
    id: '1',
    title: 'Update project documentation',
    dueDate: '2024-01-15',
    assignedTo: 'John Doe',
    priority: 'high',
    progress: 75
  },
  {
    id: '2',
    title: 'Fix login authentication bug',
    dueDate: '2024-01-12',
    assignedTo: 'Sarah Smith',
    priority: 'high',
    progress: 90
  },
  {
    id: '3',
    title: 'Design new dashboard layout',
    dueDate: '2024-01-20',
    assignedTo: 'Mike Johnson',
    priority: 'medium',
    progress: 40
  },
  {
    id: '4',
    title: 'Performance optimization',
    dueDate: '2024-01-18',
    assignedTo: 'Emily Brown',
    priority: 'low',
    progress: 20
  }
];

const SupervisorDashboard = () => {
  const { onMenuClick } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  
  // State for data with proper types
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    assignedTasks: 0,
    completedTasks: 0,
    pendingReports: 0,
    attendanceRate: 0,
    overtimeHours: 0,
    productivity: 0,
    pendingRequests: 0
  });
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<string>('');
  
  // Attendance state with proper initial values
  const [attendance, setAttendance] = useState<AttendanceStatus>({
    isCheckedIn: false,
    isOnBreak: false,
    checkInTime: null,
    checkOutTime: null,
    breakStartTime: null,
    breakEndTime: null,
    totalHours: 0,
    breakTime: 0
  });

  // Supervisor attendance records state
  const [supervisorAttendanceRecords, setSupervisorAttendanceRecords] = useState<SupervisorAttendanceRecord[]>([]);

  // Fetch all data
  useEffect(() => {
    loadData();
    loadAttendanceStatus();
    loadSupervisorAttendanceRecords();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Use mock data instead of API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats(generateMockStats());
      setActivities(generateMockActivities());
      setTeam(generateMockTeam());
      setTasks(generateMockTasks());
      
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to mock data even if there's an error
      setStats(generateMockStats());
      setActivities(generateMockActivities());
      setTeam(generateMockTeam());
      setTasks(generateMockTasks());
    } finally {
      setLoading(false);
    }
  };

  // Load attendance status from backend API
  const loadAttendanceStatus = async () => {
    try {
      console.log('🔄 Loading attendance status from API...');
      setApiStatus('Loading attendance status...');
      
      const response = await fetch(`${API_BASE_URL}/attendance/status/${currentEmployee.id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 API Response data:', data);
        
        if (data.success && data.data) {
          const apiAttendance = data.data;
          const newAttendance = {
            isCheckedIn: apiAttendance.isCheckedIn || false,
            isOnBreak: apiAttendance.isOnBreak || false,
            checkInTime: apiAttendance.checkInTime || null,
            checkOutTime: apiAttendance.checkOutTime || null, // Will be null if not checked out yet
            breakStartTime: apiAttendance.breakStartTime || null,
            breakEndTime: apiAttendance.breakEndTime || null,
            totalHours: Number(apiAttendance.totalHours) || 0,
            breakTime: Number(apiAttendance.breakTime) || 0,
          };
          
          setAttendance(newAttendance);
          localStorage.setItem('supervisorAttendance', JSON.stringify(newAttendance));
          console.log('✅ Attendance loaded from API');
          setApiStatus('');
          return;
        }
      } else {
        console.log('⚠️ API failed, using localStorage');
        setApiStatus('API connection failed, using local data');
      }
      
      // Fallback to localStorage if API fails
      const savedAttendance = localStorage.getItem('supervisorAttendance');
      if (savedAttendance) {
        const parsedAttendance = JSON.parse(savedAttendance);
        setAttendance({
          ...parsedAttendance,
          totalHours: Number(parsedAttendance.totalHours) || 0,
          breakTime: Number(parsedAttendance.breakTime) || 0,
        });
        console.log('📁 Attendance loaded from localStorage');
        setApiStatus('Using local data');
      }
    } catch (error) {
      console.error('❌ Error loading attendance status:', error);
      setApiStatus('Error loading attendance data');
      // Fallback to localStorage
      const savedAttendance = localStorage.getItem('supervisorAttendance');
      if (savedAttendance) {
        const parsedAttendance = JSON.parse(savedAttendance);
        setAttendance({
          ...parsedAttendance,
          totalHours: Number(parsedAttendance.totalHours) || 0,
          breakTime: Number(parsedAttendance.breakTime) || 0,
        });
      }
    }
  };

  // Load supervisor attendance records from MongoDB
  const loadSupervisorAttendanceRecords = async () => {
    try {
      console.log('🔄 Loading supervisor attendance history...');
      
      // Use the history endpoint to get all records
      const response = await fetch(`${API_BASE_URL}/attendance/history?employeeId=${currentEmployee.id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Supervisor attendance history response:', data);
        
        if (data.success && Array.isArray(data.data)) {
          // Convert API data to expected format
          const records = data.data.map((record: any, index: number) => {
            // Determine status based on actual data
            let status = "Absent";
            if (record.checkInTime && record.checkOutTime) {
              status = "Present";
            } else if (record.checkInTime && !record.checkOutTime) {
              status = "In Progress";
            } else if (record.status === "Weekly Off") {
              status = "Weekly Off";
            }
            
            // Get date from record
            const recordDate = record.date ? record.date : 
                             new Date(Date.now() - index * 86400000).toISOString().split('T')[0];
            
            return {
              id: record._id || `record-${index}`,
              employeeId: record.employeeId || currentEmployee.id,
              employeeName: record.employeeName || currentEmployee.name,
              supervisorId: record.supervisorId || currentEmployee.supervisorId,
              date: recordDate,
              checkInTime: record.checkInTime ? formatTimeForDisplay(record.checkInTime) : "-",
              checkOutTime: record.checkOutTime ? formatTimeForDisplay(record.checkOutTime) : "-",
              breakStartTime: record.breakStartTime || null,
              breakEndTime: record.breakEndTime || null,
              totalHours: Number(record.totalHours) || 0,
              breakTime: Number(record.breakTime) || 0,
              status: status,
              shift: "Supervisor Shift",
              hours: Number(record.totalHours) || 0
            };
          });
          
          // Sort by date (newest first)
          records.sort((a: SupervisorAttendanceRecord, b: SupervisorAttendanceRecord) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          setSupervisorAttendanceRecords(records);
          console.log(`✅ Loaded ${records.length} supervisor attendance records`);
        } else {
          console.log('⚠️ No history data available, creating sample data');
          createSampleAttendanceRecords();
        }
      } else {
        console.log('⚠️ History endpoint failed, creating sample data');
        createSampleAttendanceRecords();
      }
    } catch (error) {
      console.error('❌ Error loading supervisor attendance history:', error);
      createSampleAttendanceRecords();
    }
  };

  // Helper function for fallback data
  const createSampleAttendanceRecords = () => {
    const today = new Date().toISOString().split('T')[0];
    const sampleRecords: SupervisorAttendanceRecord[] = [
      {
        id: "today",
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        supervisorId: currentEmployee.supervisorId,
        date: today,
        checkInTime: attendance.checkInTime ? formatTimeForDisplay(attendance.checkInTime) : "-",
        checkOutTime: attendance.checkOutTime ? formatTimeForDisplay(attendance.checkOutTime) : "-", // Will be "-" if not checked out
        breakStartTime: attendance.breakStartTime,
        breakEndTime: attendance.breakEndTime,
        totalHours: attendance.totalHours || 0,
        breakTime: attendance.breakTime || 0,
        status: attendance.isCheckedIn ? 
               (attendance.checkOutTime ? "Present" : "In Progress") : 
               "Absent",
        shift: "Supervisor Shift",
        hours: attendance.totalHours || 0
      },
      {
        id: "1",
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        supervisorId: currentEmployee.supervisorId,
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        checkInTime: "08:45 AM",
        checkOutTime: "05:15 PM",
        breakStartTime: null,
        breakEndTime: null,
        totalHours: 8.5,
        breakTime: 0.5,
        status: "Present",
        shift: "Supervisor Shift",
        hours: 8.5
      },
      {
        id: "2",
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        supervisorId: currentEmployee.supervisorId,
        date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        checkInTime: "09:00 AM",
        checkOutTime: "04:30 PM",
        breakStartTime: null,
        breakEndTime: null,
        totalHours: 7.5,
        breakTime: 0.5,
        status: "Present",
        shift: "Supervisor Shift",
        hours: 7.5
      },
      {
        id: "3",
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        supervisorId: currentEmployee.supervisorId,
        date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        checkInTime: "-",
        checkOutTime: "-",
        breakStartTime: null,
        breakEndTime: null,
        totalHours: 0,
        breakTime: 0,
        status: "Absent",
        shift: "Supervisor Shift",
        hours: 0
      }
    ];
    
    setSupervisorAttendanceRecords(sampleRecords);
  };

  // Save attendance status to both localStorage and update local state
  const saveAttendanceStatus = (newAttendance: AttendanceStatus) => {
    const sanitizedAttendance = {
      ...newAttendance,
      totalHours: Number(newAttendance.totalHours) || 0,
      breakTime: Number(newAttendance.breakTime) || 0,
    };
    
    setAttendance(sanitizedAttendance);
    localStorage.setItem('supervisorAttendance', JSON.stringify(sanitizedAttendance));
  };

  // Attendance handlers with backend API integration
  const handleCheckIn = async () => {
    try {
      console.log('🔄 Attempting check-in...');
      
      const payload = {
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        supervisorId: currentEmployee.supervisorId,
      };
      
      const response = await fetch(`${API_BASE_URL}/attendance/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const now = new Date().toISOString();
        const newAttendance = {
          ...attendance,
          isCheckedIn: true,
          checkInTime: now,
          checkOutTime: null, // Reset checkout time when checking in
        };
        
        // Update local state
        saveAttendanceStatus(newAttendance);
        
        // Add activity
        addActivity('checkin', `Checked in at ${formatTimeForDisplay(now)}`);
        
        // Reload supervisor records
        loadSupervisorAttendanceRecords();
        
        // Show success message
        alert('✅ Successfully checked in!');
      } else {
        throw new Error(data.message || 'Failed to check in');
      }
    } catch (error: any) {
      console.error('❌ Check-in error:', error);
      alert(`❌ Check-in failed: ${error.message}`);
      
      // Fallback: Update local state only
      const now = new Date().toISOString();
      const newAttendance = {
        ...attendance,
        isCheckedIn: true,
        checkInTime: now,
        checkOutTime: null, // Reset checkout time
      };
      saveAttendanceStatus(newAttendance);
      addActivity('checkin', `Checked in at ${formatTimeForDisplay(now)} (Offline)`);
    }
  };

  const handleCheckOut = async () => {
    try {
      console.log('🔄 Attempting check-out...');
      
      const payload = {
        employeeId: currentEmployee.id,
      };
      
      const response = await fetch(`${API_BASE_URL}/attendance/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const now = new Date().toISOString();
        const totalHours = calculateTotalHours(attendance.checkInTime, now);
        
        const newAttendance = {
          ...attendance,
          isCheckedIn: false,
          isOnBreak: false,
          checkOutTime: now, // Set actual checkout time
          totalHours: totalHours,
        };
        
        // Update local state
        saveAttendanceStatus(newAttendance);
        
        // Add activity
        addActivity('checkout', `Checked out at ${formatTimeForDisplay(now)} - Total: ${totalHours.toFixed(2)}h`);
        
        // Reload supervisor records
        loadSupervisorAttendanceRecords();
        
        // Show success message
        alert(`✅ Successfully checked out! Total hours: ${totalHours.toFixed(2)}`);
      } else {
        throw new Error(data.message || 'Failed to check out');
      }
    } catch (error: any) {
      console.error('❌ Check-out error:', error);
      alert(`❌ Check-out failed: ${error.message}`);
      
      // Fallback: Update local state only
      const now = new Date().toISOString();
      const totalHours = calculateTotalHours(attendance.checkInTime, now);
      const newAttendance = {
        ...attendance,
        isCheckedIn: false,
        isOnBreak: false,
        checkOutTime: now, // Set actual checkout time
        totalHours: totalHours,
      };
      saveAttendanceStatus(newAttendance);
      addActivity('checkout', `Checked out at ${formatTimeForDisplay(now)} - Total: ${totalHours.toFixed(2)}h (Offline)`);
    }
  };

  const handleBreakIn = async () => {
    try {
      console.log('🔄 Attempting break-in...');
      
      const payload = {
        employeeId: currentEmployee.id,
      };
      
      const response = await fetch(`${API_BASE_URL}/attendance/breakin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const now = new Date().toISOString();
        const newAttendance = {
          ...attendance,
          isOnBreak: true,
          breakStartTime: now,
        };
        
        // Update local state
        saveAttendanceStatus(newAttendance);
        
        // Add activity
        addActivity('break', `Started break at ${formatTimeForDisplay(now)}`);
        
        // Show success message
        alert('✅ Break started!');
      } else {
        throw new Error(data.message || 'Failed to start break');
      }
    } catch (error: any) {
      console.error('❌ Break-in error:', error);
      alert(`❌ Break-in failed: ${error.message}`);
      
      // Fallback: Update local state only
      const now = new Date().toISOString();
      const newAttendance = {
        ...attendance,
        isOnBreak: true,
        breakStartTime: now,
      };
      saveAttendanceStatus(newAttendance);
      addActivity('break', `Started break at ${formatTimeForDisplay(now)} (Offline)`);
    }
  };

  const handleBreakOut = async () => {
    try {
      console.log('🔄 Attempting break-out...');
      
      const payload = {
        employeeId: currentEmployee.id,
      };
      
      const response = await fetch(`${API_BASE_URL}/attendance/breakout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const now = new Date().toISOString();
        const breakTime = calculateBreakTime(attendance.breakStartTime, now);
        const totalBreakTime = (Number(attendance.breakTime) || 0) + breakTime;
        
        const newAttendance = {
          ...attendance,
          isOnBreak: false,
          breakEndTime: now,
          breakTime: totalBreakTime,
        };
        
        // Update local state
        saveAttendanceStatus(newAttendance);
        
        // Add activity
        addActivity('break', `Ended break at ${formatTimeForDisplay(now)} - Duration: ${breakTime.toFixed(2)}h`);
        
        // Show success message
        alert(`✅ Break ended! Duration: ${breakTime.toFixed(2)} hours.`);
      } else {
        throw new Error(data.message || 'Failed to end break');
      }
    } catch (error: any) {
      console.error('❌ Break-out error:', error);
      alert(`❌ Break-out failed: ${error.message}`);
      
      // Fallback: Update local state only
      const now = new Date().toISOString();
      const breakTime = calculateBreakTime(attendance.breakStartTime, now);
      const totalBreakTime = (Number(attendance.breakTime) || 0) + breakTime;
      const newAttendance = {
        ...attendance,
        isOnBreak: false,
        breakEndTime: now,
        breakTime: totalBreakTime,
      };
      saveAttendanceStatus(newAttendance);
      addActivity('break', `Ended break at ${formatTimeForDisplay(now)} - Duration: ${breakTime.toFixed(2)}h (Offline)`);
    }
  };

  // Helper functions for time calculations
  const calculateTotalHours = (start: string | null, end: string | null): number => {
    if (!start || !end) return 0;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return (endTime - startTime) / (1000 * 60 * 60);
  };

  const calculateBreakTime = (start: string | null, end: string | null): number => {
    if (!start || !end) return 0;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return (endTime - startTime) / (1000 * 60 * 60);
  };

  const formatTimeForDisplay = (timestamp: string | null): string => {
    if (!timestamp || timestamp === "-") return "-";
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const addActivity = (type: string, message: string) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      type,
      message,
      employee: 'You',
      priority: 'medium',
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
  };

  // Filter data based on search
  const filteredData = {
    activities: activities.filter(item => 
      item.message?.toLowerCase().includes(search.toLowerCase()) ||
      item.employee?.toLowerCase().includes(search.toLowerCase())
    ),
    tasks: tasks.filter(item =>
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.assignedTo?.toLowerCase().includes(search.toLowerCase())
    )
  };

  // Simple action handlers
  const handleAction = (action: string, id?: string) => {
    const actions: { [key: string]: (id?: string) => void } = {
      assignTask: () => alert('Opening task assignment...'),
      generateReport: () => alert('Generating report...'),
      approveRequests: () => window.location.href = '/supervisor/approvals',
      scheduleMeeting: () => window.location.href = '/supervisor/meetings/schedule',
      performanceReview: () => window.location.href = '/supervisor/performance/reviews',
      exportData: () => alert('Exporting data...'),
      viewAllActivities: () => window.location.href = '/supervisor/activities',
      manageEmployees: () => window.location.href = '/supervisor/employees',
      viewTask: (id?: string) => window.location.href = `/supervisor/tasks/${id}`,
      viewEmployee: (id?: string) => window.location.href = `/supervisor/employees/${id}`,
      viewAttendance: () => navigate('/supervisor/attendance'),
      taskManagement: () => navigate('/supervisor/tasks')
    };
    
    if (actions[action]) {
      actions[action](id);
    }
  };

  // Simple styling helpers
  const getColor = (type: string, value: string) => {
    const colors: { [key: string]: { [key: string]: string } } = {
      priority: {
        high: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
        medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
        low: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      },
      status: {
        active: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
        'on leave': 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        remote: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      },
      icon: {
        task: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        approval: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        completion: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        checkin: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        checkout: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        break: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
      },
      progress: {
        high: 'bg-red-600 dark:bg-red-500',
        medium: 'bg-yellow-500 dark:bg-yellow-400',
        low: 'bg-blue-600 dark:bg-blue-500'
      }
    };
    
    return colors[type]?.[value] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  };

  // Format time simply
  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Safe number formatting for display
  const formatNumber = (value: number): string => {
    return Number(value).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader 
        title="Supervisor Dashboard" 
        subtitle="Manage team and operations"
        onMenuClick={onMenuClick}
      />

      <div className="p-6 space-y-6">
        {/* Header with Shortcut Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="flex gap-2">
              <Button 
                onClick={() => handleAction('viewAttendance')}
                className="flex-1 sm:flex-none flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <UserCheck className="h-4 w-4" />
                Employee Attendance
              </Button>
              <Button 
                onClick={() => handleAction('taskManagement')}
                className="flex-1 sm:flex-none flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <ClipboardCheck className="h-4 w-4" />
                Task Management
              </Button>
            </div>
            <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* API Status Alert */}
        {apiStatus && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">API Status</p>
              <p className="text-sm text-yellow-700">{apiStatus}</p>
            </div>
          </div>
        )}

        {/* Attendance Controls */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-600" />
              Attendance Control
            </CardTitle>
            <CardDescription>
              Manage your work hours and breaks - Data stored in MongoDB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Check In/Out */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Work Status</span>
                  <Badge className={attendance.isCheckedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {attendance.isCheckedIn ? 'Checked In' : 'Checked Out'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCheckIn}
                    disabled={attendance.isCheckedIn}
                    className="flex-1 flex items-center gap-2"
                    variant={attendance.isCheckedIn ? "outline" : "default"}
                  >
                    <LogIn className="h-4 w-4" />
                    Check In
                  </Button>
                  <Button
                    onClick={handleCheckOut}
                    disabled={!attendance.isCheckedIn}
                    className="flex-1 flex items-center gap-2"
                    variant={!attendance.isCheckedIn ? "outline" : "default"}
                  >
                    <LogOut className="h-4 w-4" />
                    Check Out
                  </Button>
                </div>
                {attendance.checkInTime && (
                  <p className="text-xs text-gray-500">
                    Checked in: {formatTimeForDisplay(attendance.checkInTime)}
                  </p>
                )}
                {attendance.checkOutTime && (
                  <p className="text-xs text-green-500">
                    Checked out: {formatTimeForDisplay(attendance.checkOutTime)}
                  </p>
                )}
              </div>

              {/* Break In/Out */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Break Status</span>
                  <Badge className={attendance.isOnBreak ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}>
                    {attendance.isOnBreak ? 'On Break' : 'Active'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBreakIn}
                    disabled={!attendance.isCheckedIn || attendance.isOnBreak}
                    className="flex-1 flex items-center gap-2"
                    variant={(!attendance.isCheckedIn || attendance.isOnBreak) ? "outline" : "default"}
                  >
                    <Coffee className="h-4 w-4" />
                    Break In
                  </Button>
                  <Button
                    onClick={handleBreakOut}
                    disabled={!attendance.isOnBreak}
                    className="flex-1 flex items-center gap-2"
                    variant={!attendance.isOnBreak ? "outline" : "default"}
                  >
                    <Timer className="h-4 w-4" />
                    Break Out
                  </Button>
                </div>
                {attendance.breakStartTime && attendance.isOnBreak && (
                  <p className="text-xs text-gray-500">
                    Break started: {formatTimeForDisplay(attendance.breakStartTime)}
                  </p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Hours:</span>
                  <p className="font-medium">{formatNumber(attendance.totalHours)}h</p>
                </div>
                <div>
                  <span className="text-gray-500">Break Time:</span>
                  <p className="font-medium">{formatNumber(attendance.breakTime)}h</p>
                </div>
                <div>
                  <span className="text-gray-500">Employee ID:</span>
                  <p className="font-medium text-sm">{currentEmployee.id}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p className="font-medium">
                    {attendance.isCheckedIn ? 
                      (attendance.checkOutTime ? "Completed" : "Working") : 
                      "Not Started"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Employees" value={stats.totalEmployees || 0} icon={Users} />
          <StatCard title="Assigned Tasks" value={stats.assignedTasks || 0} icon={ClipboardList} />
          <StatCard title="Completed Tasks" value={stats.completedTasks || 0} icon={CheckCircle2} />
          <StatCard title="Pending Reports" value={stats.pendingReports || 0} icon={FileText} />
          <StatCard title="Attendance Rate" value={`${stats.attendanceRate || 0}%`} icon={Users} />
          <StatCard title="Overtime Hours" value={stats.overtimeHours || 0} icon={Clock} />
          <StatCard title="Productivity" value={`${stats.productivity || 0}%`} icon={TrendingUp} />
          <StatCard title="Pending Requests" value={stats.pendingRequests || 0} icon={AlertTriangle} />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search activities, tasks..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activities & Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activities */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Recent Activities
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handleAction('viewAllActivities')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredData.activities.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`p-2 rounded-full ${getColor('icon', activity.type)}`}>
                      {activity.type === 'task' && <ClipboardList className="h-4 w-4" />}
                      {activity.type === 'approval' && <FileText className="h-4 w-4" />}
                      {activity.type === 'completion' && <CheckCircle2 className="h-4 w-4" />}
                      {activity.type === 'checkin' && <LogIn className="h-4 w-4" />}
                      {activity.type === 'checkout' && <LogOut className="h-4 w-4" />}
                      {activity.type === 'break' && <Coffee className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(activity.timestamp)} • {activity.employee}
                      </p>
                    </div>
                    <Badge className={getColor('priority', activity.priority)}>
                      {activity.priority}
                    </Badge>
                  </div>
                ))}
                {filteredData.activities.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No activities found</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Upcoming Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredData.tasks.map(task => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-500">
                          Due: {task.dueDate} • {task.assignedTo}
                        </p>
                      </div>
                      <Badge className={getColor('priority', task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getColor('progress', task.priority)}`}
                        style={{ width: `${task.progress || 0}%` }}
                      />
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full mt-3"
                      onClick={() => handleAction('viewTask', task.id)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
                {filteredData.tasks.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No tasks found</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Team
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handleAction('manageEmployees')}>
                    Manage
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {team.map(member => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleAction('viewEmployee', member.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                        {member.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    </div>
                    <Badge className={getColor('status', member.status)}>
                      {member.status}
                    </Badge>
                  </div>
                ))}
                {team.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No team members</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => handleAction('assignTask')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Task
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleAction('generateReport')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleAction('approveRequests')}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve Requests
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleAction('scheduleMeeting')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleAction('viewAttendance')}>
                  <Timer className="h-4 w-4 mr-2" />
                  View Attendance
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleAction('exportData')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;