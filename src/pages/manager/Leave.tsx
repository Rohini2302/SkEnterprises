import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, RefreshCw, Users, AlertCircle, Database, Search, Building, Check, X, Calendar, Clock, Filter, Download, User, Hash, Eye, FileText, Mail, Phone, MapPin, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useRole } from "@/context/RoleContext";

interface LeaveRequest {
  _id: string;
  id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedBy: string;
  appliedFor: string;
  createdAt: string;
  contactNumber: string;
  remarks?: string;
  approvedBy?: string;
  rejectedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancellationReason?: string;
  managerRemarks?: string;
  emergencyContact?: string;
  handoverTo?: string;
  handoverCompleted?: boolean;
  handoverRemarks?: string;
  attachmentUrl?: string;
  isManagerLeave?: boolean;
  managerId?: string;
}

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  department: string;
  contactNumber: string;
  position: string;
  email: string;
  isActive?: boolean;
}

interface ManagerInfo {
  _id: string;
  employeeId?: string;
  name: string;
  department: string;
  contactNumber?: string;
  email?: string;
  role: string;
  phone?: string;
  position?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ManagerLeave = () => {
  const { user: authUser, isAuthenticated } = useRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [managerDepartment, setManagerDepartment] = useState<string>("");
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all');
  const [myLeavesFilter, setMyLeavesFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all');
  const [activeTab, setActiveTab] = useState('team-leaves');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0
  });

  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
    appliedBy: "",
  });

  const [managerInfo, setManagerInfo] = useState<ManagerInfo>({
    _id: "",
    name: "",
    department: "",
    contactNumber: "",
    email: "",
    role: "manager",
    phone: "",
    position: "Manager"
  });

  // Get manager info from auth context
  useEffect(() => {
    if (authUser && isAuthenticated) {
      // Get stored user from localStorage as fallback
      const storedUser = localStorage.getItem('sk_user');
      let userData = authUser;
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userData = { ...authUser, ...parsedUser };
        } catch (e) {
          console.error("Error parsing stored user:", e);
        }
      }
      
      const managerData: ManagerInfo = {
        _id: userData._id || userData.id || `mgr_${Date.now()}`,
        employeeId: userData.employeeId || userData.id || `MGR${Date.now().toString().slice(-6)}`,
        name: userData.name || userData.firstName + " " + userData.lastName || "Manager",
        department: userData.department || "",
        contactNumber: userData.phone || userData.contactNumber || "0000000000",
        email: userData.email || "",
        role: userData.role || "manager",
        phone: userData.phone || userData.contactNumber || "",
        position: userData.position || "Manager"
      };
      
      setManagerInfo(managerData);

      // Set form data with manager info
      setFormData(prev => ({
        ...prev,
        appliedBy: managerData.name
      }));

      // Set manager department
      if (managerData.department) {
        setManagerDepartment(managerData.department);
      }
    }
  }, [authUser, isAuthenticated]);

  // Check API connection and fetch departments on component mount
  useEffect(() => {
    checkApiConnection();
    fetchDepartments();
  }, []);

  // Fetch employees and leave requests when department changes
  useEffect(() => {
    if (managerDepartment && apiStatus === 'connected') {
      fetchEmployees();
      fetchLeaveRequests();
      fetchMyLeaves();
    }
  }, [managerDepartment, apiStatus]);

  useEffect(() => {
    if (leaveRequests.length > 0) {
      updateStats();
    }
  }, [leaveRequests]);

  const updateStats = () => {
    const stats = {
      total: leaveRequests.length,
      pending: leaveRequests.filter(l => l.status === 'pending').length,
      approved: leaveRequests.filter(l => l.status === 'approved').length,
      rejected: leaveRequests.filter(l => l.status === 'rejected').length,
      cancelled: leaveRequests.filter(l => l.status === 'cancelled').length,
    };
    setStats(stats);
  };

  const checkApiConnection = async () => {
    try {
      setApiStatus('checking');
      const response = await fetch(`${API_URL}/test`);
      
      if (response.ok) {
        setApiStatus('connected');
        console.log("✅ API connection successful");
      } else {
        setApiStatus('error');
        console.error("❌ API connection failed");
      }
    } catch (error) {
      setApiStatus('error');
      console.error("❌ API connection error:", error);
      toast.error("Cannot connect to server. Please make sure backend is running.");
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_URL}/leaves/departments`);
      if (response.ok) {
        const departments = await response.json();
        console.log("📋 Available departments:", departments);
        
        if (departments && departments.length > 0) {
          setAvailableDepartments(departments);
          if (!managerDepartment) {
            setManagerDepartment(departments[0]);
          }
        } else {
          const defaultDepartments = ["Consumables Management", "Housekeeping Management", "Security Management"];
          setAvailableDepartments(defaultDepartments);
          if (!managerDepartment) {
            setManagerDepartment(defaultDepartments[0]);
          }
        }
      } else {
        throw new Error("Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      const defaultDepartments = ["Consumables Management", "Housekeeping Management", "Security Management"];
      setAvailableDepartments(defaultDepartments);
      if (!managerDepartment) {
        setManagerDepartment(defaultDepartments[0]);
      }
    }
  };

  const fetchLeaveRequests = async () => {
    if (apiStatus !== 'connected') {
      toast.error("Please check API connection first");
      return;
    }

    if (!managerDepartment) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/leaves/supervisor?department=${encodeURIComponent(managerDepartment)}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        
        let errorMessage = 'Failed to fetch leaves';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("✅ Team leaves data received:", data);
      // Ensure each leave has a unique id
      const formattedData = data.map((leave: any) => ({
        ...leave,
        id: leave._id || leave.id
      }));
      setLeaveRequests(formattedData);
    } catch (error: any) {
      console.error("Error fetching leave requests:", error);
      toast.error(error.message || "Failed to load leave requests");
      setLeaveRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

const fetchMyLeaves = async () => {
  if (apiStatus !== 'connected') {
    return;
  }

  if (!managerInfo._id) {
    console.log("Manager info not available yet");
    return;
  }

  try {
    // Fetch manager leaves from the new endpoint
    const response = await fetch(
      `${API_URL}/manager-leaves?managerId=${encodeURIComponent(managerInfo._id)}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch manager leaves: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Transform data for frontend compatibility
      const formattedData = data.leaves.map((leave: any) => ({
        ...leave,
        id: leave._id || leave.id,
        _id: leave._id || leave.id,
        isManagerLeave: true,
        // Add compatibility fields for existing frontend
        employeeId: leave.managerId,
        employeeName: leave.managerName,
        department: leave.managerDepartment,
        contactNumber: leave.managerContact,
        appliedDate: leave.appliedDate || leave.createdAt
      }));
      
      setMyLeaves(formattedData);
    }
  } catch (error) {
    console.error("Error fetching manager's leaves:", error);
    toast.error("Failed to load your leaves. Please try again.");
    setMyLeaves([]);
  }
};

  const fetchEmployees = async () => {
    if (apiStatus !== 'connected') {
      toast.error("Please check API connection first");
      return;
    }

    if (!managerDepartment) {
      return;
    }

    try {
      setIsLoadingEmployees(true);
      
      const url = `${API_URL}/leaves/supervisor/employees?department=${encodeURIComponent(managerDepartment)}`;
      
      const response = await fetch(url);
      
      if (response.status === 404) {
        throw new Error(`API endpoint not found: ${url}. Check server routes.`);
      }
      
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Invalid JSON response from server");
      }
      
      if (data.message && data.message.includes("No active employees found")) {
        console.log(`ℹ️ No employees found in ${managerDepartment} department`);
        setEmployees([]);
        setSelectedEmployee("");
        
        if (data.availableDepartments && data.availableDepartments.length > 0) {
          toast.info(`No employees in ${managerDepartment}. Try: ${data.availableDepartments.join(', ')}`, {
            duration: 5000,
          });
          setAvailableDepartments(data.availableDepartments);
        } else {
          toast.warning(`No active employees found in ${managerDepartment} department`);
        }
      } else if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} employees in ${managerDepartment}`);
        setEmployees(data);
        
        if (data.length > 0 && !selectedEmployee) {
          setSelectedEmployee(data[0]._id);
        } else if (data.length === 0) {
          setSelectedEmployee("");
          toast.warning(`No active employees found in ${managerDepartment} department`);
        }
      } else {
        throw new Error("Unexpected response format from server");
      }
    } catch (error: any) {
      console.error("❌ Error fetching employees:", error);
      toast.error(error.message || "Failed to load employees");
      setEmployees([]);
      setSelectedEmployee("");
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const calculateTotalDays = (from: string, to: string) => {
    if (!from || !to) return 0;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const timeDiff = toDate.getTime() - fromDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const handleApproveLeave = async (leaveId: string) => {
    if (!leaveId) {
      toast.error("Leave ID is required");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/leaves/${leaveId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'approved',
          managerName: managerInfo.name,
          remarks: 'Approved by manager'
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to approve leave';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      toast.success(data.message || "Leave request approved!");
      
      // Update local state for team leaves
      setLeaveRequests(prev => 
        prev.map(leave => {
          const leaveIdToCompare = leave._id || leave.id;
          if (leaveIdToCompare === leaveId) {
            return { 
              ...leave, 
              status: 'approved',
              approvedBy: managerInfo.name,
              approvedAt: new Date().toISOString(),
              remarks: 'Approved by manager'
            };
          }
          return leave;
        })
      );
      
      // Also update my leaves if it's there (for manager's own leaves)
      setMyLeaves(prev =>
        prev.map(leave => {
          const leaveIdToCompare = leave._id || leave.id;
          if (leaveIdToCompare === leaveId) {
            return { 
              ...leave, 
              status: 'approved',
              approvedBy: managerInfo.name,
              approvedAt: new Date().toISOString(),
              remarks: 'Approved by manager'
            };
          }
          return leave;
        })
      );
      
      // Close dialog if open
      if (selectedLeave && (selectedLeave._id === leaveId || selectedLeave.id === leaveId)) {
        setViewDialogOpen(false);
      }
      
      // Refresh the lists
      fetchLeaveRequests();
      fetchMyLeaves();
    } catch (error: any) {
      console.error("❌ Error approving leave:", error);
      toast.error(error.message || "Failed to approve leave");
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    if (!leaveId) {
      toast.error("Leave ID is required");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/leaves/${leaveId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'rejected',
          managerName: managerInfo.name,
          remarks: 'Rejected by manager'
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to reject leave';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      toast.success(data.message || "Leave request rejected!");
      
      // Update local state for team leaves
      setLeaveRequests(prev => 
        prev.map(leave => {
          const leaveIdToCompare = leave._id || leave.id;
          if (leaveIdToCompare === leaveId) {
            return { 
              ...leave, 
              status: 'rejected',
              rejectedBy: managerInfo.name,
              rejectedAt: new Date().toISOString(),
              remarks: 'Rejected by manager'
            };
          }
          return leave;
        })
      );
      
      // Also update my leaves if it's there
      setMyLeaves(prev =>
        prev.map(leave => {
          const leaveIdToCompare = leave._id || leave.id;
          if (leaveIdToCompare === leaveId) {
            return { 
              ...leave, 
              status: 'rejected',
              rejectedBy: managerInfo.name,
              rejectedAt: new Date().toISOString(),
              remarks: 'Rejected by manager'
            };
          }
          return leave;
        })
      );
      
      // Close dialog if open
      if (selectedLeave && (selectedLeave._id === leaveId || selectedLeave.id === leaveId)) {
        setViewDialogOpen(false);
      }
      
      // Refresh the lists
      fetchLeaveRequests();
      fetchMyLeaves();
    } catch (error: any) {
      console.error("❌ Error rejecting leave:", error);
      toast.error(error.message || "Failed to reject leave");
    }
  };

  const handleViewLeave = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setViewDialogOpen(true);
  };

  // NEW: Function to submit manager's own leave (separate from team leaves)
const handleSubmitManagerLeave = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formData.appliedBy.trim()) {
    toast.error("Manager name is required");
    return;
  }

  if (!formData.leaveType) {
    toast.error("Please select leave type");
    return;
  }

  if (!formData.fromDate || !formData.toDate) {
    toast.error("Please select both start and end dates");
    return;
  }

  const totalDays = calculateTotalDays(formData.fromDate, formData.toDate);
  if (totalDays < 1) {
    toast.error("End date must be after start date");
    return;
  }

  if (!formData.reason.trim()) {
    toast.error("Please provide a reason for leave");
    return;
  }

  try {
    setIsSubmitting(true);
    
    // Prepare manager leave data for NEW endpoint
    const managerLeaveData = {
      // Manager information
      managerId: managerInfo._id,
      managerName: managerInfo.name,
      managerDepartment: managerInfo.department || managerDepartment,
      managerPosition: managerInfo.position || "Manager",
      managerEmail: managerInfo.email || "",
      managerContact: managerInfo.contactNumber || managerInfo.phone || "0000000000",
      
      // Leave information
      leaveType: formData.leaveType,
      fromDate: formData.fromDate,
      toDate: formData.toDate,
      totalDays: totalDays,
      reason: formData.reason,
      appliedBy: formData.appliedBy
    };

    console.log("Submitting manager leave to new endpoint:", managerLeaveData);

    // Use the new manager leaves endpoint
    const response = await fetch(`${API_URL}/manager-leaves/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(managerLeaveData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || 'Failed to submit manager leave');
    }
    
    const data = await response.json();
    
    console.log("Manager leave submitted successfully:", data);
    toast.success(data.message || "Manager leave submitted successfully!");
    
    // Reset form
    setFormData({
      leaveType: "",
      fromDate: "",
      toDate: "",
      reason: "",
      appliedBy: managerInfo.name,
    });
    
    setDialogOpen(false);
    
    // Fetch manager's leaves from new endpoint
    await fetchMyLeaves();
    
    // Switch to "My Leaves" tab
    setActiveTab('my-leaves');
    
  } catch (error: any) {
    console.error("Error submitting manager leave request:", error);
    toast.error(error.message || "Failed to submit manager leave request.");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleTestDatabase = async () => {
    try {
      setIsLoading(true);
      toast.info("Testing database connection...");
      
      const response = await fetch(`${API_URL}/leaves/test/employees`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(
          `Database connected! Found ${data.totalCount} employees, ${data.activeCount} active.`
        );
        
        if (data.departments && data.departments.length > 0) {
          setAvailableDepartments(data.departments);
          if (!data.departments.includes(managerDepartment) && data.departments.length > 0) {
            setManagerDepartment(data.departments[0]);
          }
        }
        
        setApiStatus('connected');
      } else {
        toast.error(data.message || "Database test failed");
      }
    } catch (error) {
      console.error("Database test error:", error);
      toast.error("Failed to connect to database");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const leavesToExport = activeTab === 'team-leaves' ? leaveRequests : myLeaves;
    const tabName = activeTab === 'team-leaves' ? 'team' : 'manager';
    
    const csvContent = [
      ['Employee ID', 'Employee Name', 'Department', 'Leave Type', 'From Date', 'To Date', 'Total Days', 'Status', 'Reason', 'Applied By', 'Applied Date', 'Type'],
      ...leavesToExport.map(leave => [
        leave.employeeId,
        leave.employeeName,
        leave.department,
        leave.leaveType,
        leave.fromDate,
        leave.toDate,
        leave.totalDays.toString(),
        leave.status,
        leave.reason,
        leave.appliedBy,
        leave.createdAt,
        leave.isManagerLeave ? 'Manager Leave' : 'Team Leave'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-requests-${tabName}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success("Leave data exported successfully!");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      case 'cancelled': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getApiStatusBadge = () => {
    switch (apiStatus) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500">API Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">API Error</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking API...</Badge>;
      default:
        return <Badge variant="outline">API Unknown</Badge>;
    }
  };

  const filteredLeaves = leaveRequests.filter(leave => {
    if (filter === 'all') return true;
    return leave.status === filter;
  });

  const filteredMyLeaves = myLeaves.filter(leave => {
    if (myLeavesFilter === 'all') return true;
    return leave.status === myLeavesFilter;
  });

  // Get unique key for each leave
  const getLeaveKey = (leave: LeaveRequest) => {
    return leave._id || leave.id || `${leave.employeeId}-${leave.fromDate}-${leave.toDate}`;
  };

  function handleInputChange(field: string, value: string): void {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }

  // Update form data when manager info changes
  useEffect(() => {
    if (managerInfo.name) {
      setFormData(prev => ({
        ...prev,
        appliedBy: managerInfo.name
      }));
    }
  }, [managerInfo.name]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        title="Leave Management - Manager" 
        subtitle={`Welcome, ${managerInfo.name}! Manage team leaves and apply for your own leaves`}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6"
      >
        {/* API Status Bar */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Database className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">API Status</p>
              <div className="flex items-center space-x-2">
                {getApiStatusBadge()}
                <span className="text-xs text-muted-foreground">
                  {API_URL}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Manager Info Badge */}
            <div className="flex items-center space-x-2 bg-primary/10 px-3 py-1 rounded-lg">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{managerInfo.name}</span>
              <Badge variant="outline" className="text-xs">
                {managerInfo.department || "No Department"}
              </Badge>
              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-300">
                Manager
              </Badge>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestDatabase}
              className="h-8"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <Database className="mr-2 h-3 w-3" />
              )}
              Test DB
            </Button>
          </div>
        </div>

        {/* Statistics Cards - Only for Team Leaves */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Team Requests</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{myLeaves.length}</div>
              <div className="text-sm text-muted-foreground">My Leaves</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="space-y-1">
              <Label className="text-sm">Department</Label>
              <div className="flex items-center space-x-2">
                <Select
                  value={managerDepartment}
                  onValueChange={setManagerDepartment}
                  disabled={apiStatus !== 'connected' || availableDepartments.length === 0}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepartments.length > 0 ? (
                      availableDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          <div className="flex items-center">
                            <Building className="mr-2 h-4 w-4" />
                            {dept}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        Loading departments...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span className="flex items-center">
                  <Users className="mr-1 h-3 w-3" />
                  {employees.length} employees
                </span>
                <span className="flex items-center">
                  <Building className="mr-1 h-3 w-3" />
                  {availableDepartments.length} departments
                </span>
              </div>
            </div>
            
           
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  fetchLeaveRequests();
                  fetchEmployees();
                  fetchMyLeaves();
                }}
                className="h-9"
                disabled={isLoading || isLoadingEmployees}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh All
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Apply for Leave Button - MANAGER'S OWN LEAVE */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Apply for My Leave
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Apply for Your Leave</DialogTitle>
                  <div className="text-sm text-muted-foreground">
                    Manager: <span className="font-medium">{managerInfo.name}</span>
                  </div>
                </DialogHeader>
                <form onSubmit={handleSubmitManagerLeave} className="space-y-4">
                  {/* Important Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Important Notice</p>
                        <p className="text-xs text-blue-700 mt-1">
                          The system will automatically create your manager profile as an employee before submitting the leave request.
                          This is required by the backend system.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Manager Info Display */}
                  <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Manager Name:</span>
                      <span className="font-medium">{managerInfo.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Department:</span>
                      <span className="font-medium">{managerInfo.department || managerDepartment}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Contact:</span>
                      <span className="font-medium">{managerInfo.contactNumber || "Not set"}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="leaveType">Leave Type *</Label>
                    <Select
                      value={formData.leaveType}
                      onValueChange={(value) => handleInputChange('leaveType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                        <SelectItem value="paternity">Paternity Leave</SelectItem>
                        <SelectItem value="bereavement">Bereavement Leave</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromDate">Start Date *</Label>
                      <Input
                        id="fromDate"
                        type="date"
                        value={formData.fromDate}
                        onChange={(e) => {
                          handleInputChange('fromDate', e.target.value);
                          if (formData.toDate) {
                            const days = calculateTotalDays(e.target.value, formData.toDate);
                            if (days > 0) {
                              toast.info(`Total days: ${days}`);
                            }
                          }
                        }}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="toDate">End Date *</Label>
                      <Input
                        id="toDate"
                        type="date"
                        value={formData.toDate}
                        onChange={(e) => {
                          handleInputChange('toDate', e.target.value);
                          if (formData.fromDate) {
                            const days = calculateTotalDays(formData.fromDate, e.target.value);
                            if (days > 0) {
                              toast.info(`Total days: ${days}`);
                            }
                          }
                        }}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Leave *</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder="Enter reason for leave"
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Submit Manager Leave
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs for Team Leaves and My Leaves */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="team-leaves">
              <Users className="mr-2 h-4 w-4" />
              Team Leaves
            </TabsTrigger>
            <TabsTrigger value="my-leaves">
              <User className="mr-2 h-4 w-4" />
              My Leaves
            </TabsTrigger>
          </TabsList>

          {/* Team Leaves Tab - EXISTING LOGIC UNCHANGED */}
          <TabsContent value="team-leaves" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      Team Leave Requests - {managerDepartment || "Select Department"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {filteredLeaves.length} team leave requests • {employees.length} employees in department
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {filteredLeaves.length} requests
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                      >
                        All
                      </Button>
                      <Button
                        variant={filter === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('pending')}
                      >
                        Pending
                      </Button>
                      <Button
                        variant={filter === 'approved' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('approved')}
                      >
                        Approved
                      </Button>
                      <Button
                        variant={filter === 'rejected' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('rejected')}
                      >
                        Rejected
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {apiStatus !== 'connected' ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg mb-2">API Connection Required</h3>
                    <p className="text-muted-foreground mb-4">
                      Please check your backend server is running and click "Test DB"
                    </p>
                    <Button onClick={handleTestDatabase}>
                      <Database className="mr-2 h-4 w-4" />
                      Test Database Connection
                    </Button>
                  </div>
                ) : !managerDepartment ? (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg mb-2">Select a Department</h3>
                    <p className="text-muted-foreground">
                      Please select a department to view team leave requests
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredLeaves.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium text-lg mb-2">No Team Leave Requests</h3>
                      <p className="text-muted-foreground mb-4">
                        No team leave requests found for {managerDepartment} department
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLeaves.map((leave) => {
                      const leaveKey = getLeaveKey(leave);
                      return (
                        <motion.div
                          key={leaveKey}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 border rounded-lg space-y-3 hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{leave.employeeName}</h3>
                                <Badge variant={getStatusBadgeVariant(leave.status)}>
                                  {leave.status.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                <Calendar className="inline mr-1 h-3 w-3" />
                                {formatDate(leave.fromDate)} to {formatDate(leave.toDate)} ({leave.totalDays} days)
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground flex items-center">
                                  <FileText className="mr-1 h-3 w-3" />
                                  <span className="font-medium capitalize">{leave.leaveType} Leave</span>
                                </span>
                                <span className="text-muted-foreground flex items-center">
                                  <Hash className="mr-1 h-3 w-3" />
                                  {leave.employeeId}
                                </span>
                                <span className="text-muted-foreground flex items-center">
                                  <Building className="mr-1 h-3 w-3" />
                                  {leave.department}
                                </span>
                                <span className="text-muted-foreground flex items-center">
                                  <User className="mr-1 h-3 w-3" />
                                  {leave.appliedBy}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewLeave(leave)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {leave.status === 'pending' && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleApproveLeave(leave._id || leave.id || '')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRejectLeave(leave._id || leave.id || '')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="pt-2 border-t">
                            <p className="text-sm">
                              <span className="font-medium">Reason:</span> {leave.reason}
                            </p>
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                              <span>Contact: {leave.contactNumber}</span>
                              <span>Applied: {formatDate(leave.createdAt)}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Leaves Tab - MANAGER'S OWN LEAVES */}
          <TabsContent value="my-leaves" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      My Leave Requests
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {filteredMyLeaves.length} of your personal leave requests
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                      {filteredMyLeaves.length} personal requests
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant={myLeavesFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMyLeavesFilter('all')}
                        className={myLeavesFilter === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                      >
                        All
                      </Button>
                      <Button
                        variant={myLeavesFilter === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMyLeavesFilter('pending')}
                        className={myLeavesFilter === 'pending' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                      >
                        Pending
                      </Button>
                      <Button
                        variant={myLeavesFilter === 'approved' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMyLeavesFilter('approved')}
                        className={myLeavesFilter === 'approved' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                      >
                        Approved
                      </Button>
                      <Button
                        variant={myLeavesFilter === 'rejected' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMyLeavesFilter('rejected')}
                        className={myLeavesFilter === 'rejected' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                      >
                        Rejected
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {apiStatus !== 'connected' ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg mb-2">API Connection Required</h3>
                    <p className="text-muted-foreground mb-4">
                      Please check your backend server is running and click "Test DB"
                    </p>
                    <Button onClick={handleTestDatabase}>
                      <Database className="mr-2 h-4 w-4" />
                      Test Database Connection
                    </Button>
                  </div>
                ) : filteredMyLeaves.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium text-lg mb-2">No Personal Leave Requests</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't applied for any personal leaves yet
                      </p>
                      <Button onClick={() => setDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Apply for My Leave
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMyLeaves.map((leave) => {
                      const leaveKey = getLeaveKey(leave);
                      return (
                        <motion.div
                          key={leaveKey}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 border rounded-lg space-y-3 hover:border-purple-300 transition-colors bg-purple-50/50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">Your Leave Request</h3>
                                <Badge variant={getStatusBadgeVariant(leave.status)}>
                                  {leave.status.toUpperCase()}
                                </Badge>
                                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                                  Manager Leave
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                <Calendar className="inline mr-1 h-3 w-3" />
                                {formatDate(leave.fromDate)} to {formatDate(leave.toDate)} ({leave.totalDays} days)
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground flex items-center">
                                  <FileText className="mr-1 h-3 w-3" />
                                  <span className="font-medium capitalize">{leave.leaveType} Leave</span>
                                </span>
                                <span className="text-muted-foreground flex items-center">
                                  <Building className="mr-1 h-3 w-3" />
                                  {leave.department}
                                </span>
                                <span className="text-muted-foreground flex items-center">
                                  <Clock className="mr-1 h-3 w-3" />
                                  Applied on {formatDate(leave.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewLeave(leave)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="pt-2 border-t">
                            <p className="text-sm">
                              <span className="font-medium">Reason:</span> {leave.reason}
                            </p>
                            {leave.status === 'approved' && leave.approvedBy && (
                              <div className="mt-2 text-xs text-green-600">
                                Approved by {leave.approvedBy} on {formatDate(leave.approvedAt || '')}
                              </div>
                            )}
                            {leave.status === 'rejected' && leave.rejectedBy && (
                              <div className="mt-2 text-xs text-red-600">
                                Rejected by {leave.rejectedBy} on {formatDate(leave.rejectedAt || '')}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Leave Dialog - Works for both team and manager leaves */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Leave Request Details</DialogTitle>
              {selectedLeave?.isManagerLeave && (
                <div className="text-sm text-purple-600">
                  ⓘ This is a manager's personal leave request
                </div>
              )}
            </DialogHeader>
            {selectedLeave && (
              <div className="space-y-6">
                {/* Employee Information */}
                <div className={`p-4 rounded-lg space-y-3 ${selectedLeave.isManagerLeave ? 'bg-purple-50 border border-purple-200' : 'bg-muted/50'}`}>
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {selectedLeave.isManagerLeave ? 'Manager Information' : 'Employee Information'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{selectedLeave.isManagerLeave ? 'Manager Name' : 'Employee Name'}</span>
                      </div>
                      <div className="font-medium">{selectedLeave.employeeName}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <span>{selectedLeave.isManagerLeave ? 'Manager ID' : 'Employee ID'}</span>
                      </div>
                      <div className="font-medium">{selectedLeave.employeeId}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="h-4 w-4" />
                        <span>Department</span>
                      </div>
                      <div className="font-medium">{selectedLeave.department}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Contact Number</div>
                      <div className="font-medium">{selectedLeave.contactNumber}</div>
                    </div>
                  </div>
                  {selectedLeave.isManagerLeave && (
                    <div className="mt-2 text-xs text-purple-600">
                      ⓘ This leave is stored separately from team leaves
                    </div>
                  )}
                </div>

                {/* Leave Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Leave Details
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Leave Type</div>
                      <div className="font-medium capitalize">{selectedLeave.leaveType} Leave</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div>
                        <Badge variant={getStatusBadgeVariant(selectedLeave.status)}>
                          {selectedLeave.status.toUpperCase()}
                        </Badge>
                        {selectedLeave.isManagerLeave && (
                          <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-800 border-purple-300">
                            Manager Leave
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>From Date</span>
                      </div>
                      <div className="font-medium">{formatDate(selectedLeave.fromDate)}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>To Date</span>
                      </div>
                      <div className="font-medium">{formatDate(selectedLeave.toDate)}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Total Days</span>
                      </div>
                      <div className="font-medium">{selectedLeave.totalDays} days</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Applied By</div>
                      <div className="font-medium">{selectedLeave.appliedBy}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Reason</div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      {selectedLeave.reason}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Application Date</div>
                    <div className="font-medium">{formatDate(selectedLeave.createdAt)}</div>
                  </div>
                </div>

                {/* Action Buttons - Only show for team leaves (not manager's own leaves) */}
                {selectedLeave.status === 'pending' && !selectedLeave.isManagerLeave && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setViewDialogOpen(false)}
                    >
                      Close
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => handleRejectLeave(selectedLeave._id || selectedLeave.id || '')}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject Request
                    </Button>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApproveLeave(selectedLeave._id || selectedLeave.id || '')}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve Request
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default ManagerLeave;