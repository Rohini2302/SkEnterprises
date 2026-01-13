// src/components/hrms/tabs/DeductionListTab.tsx
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, Edit, Trash2, Eye, Download, IndianRupee, Loader2, RefreshCw } from "lucide-react";
import Pagination from "./Pagination";

// Dialog Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Service
import deductionService, { 
  type Deduction, 
  type Employee, 
  type CreateDeductionRequest,
  type UpdateDeductionRequest,
  type DeductionStats,
  type PaginatedResponse
} from "../../services/DeductionService";

interface DeductionListTabProps {
  // Optional props if you need to manage deductions from parent component
}

const DeductionListTab = ({}: DeductionListTabProps) => {
  // State
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [deductionPage, setDeductionPage] = useState(1);
  const [deductionItemsPerPage, setDeductionItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isAddingDeduction, setIsAddingDeduction] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<Deduction | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; deduction: Deduction | null }>({ open: false, deduction: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalDeductionsCount, setTotalDeductionsCount] = useState(0);
  
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [deductionStats, setDeductionStats] = useState<DeductionStats>({
    totalDeductions: 0,
    totalAdvances: 0,
    totalFines: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    completedCount: 0
  });

  // Deduction form state
  const [deductionForm, setDeductionForm] = useState({
    employeeId: "",
    type: "advance" as "advance" | "fine" | "other",
    amount: "",
    description: "",
    deductionDate: new Date().toISOString().split('T')[0],
    status: "pending" as "pending" | "approved" | "rejected" | "completed",
    repaymentMonths: "",
    installmentAmount: "",
    fineAmount: "",
    appliedMonth: new Date().toISOString().slice(0, 7)
  });

  // Use refs to track mounted state
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch employees with caching
// Update the fetchDeductions function in DeductionListTab.tsx
const fetchDeductions = useCallback(async (forceRefresh = false) => {
  if (forceRefresh) {
    deductionService.clearCache('deductions');
    deductionService.clearCache('stats');
  }

  setIsLoading(true);
  try {
    const params: any = {
      page: deductionPage,
      limit: deductionItemsPerPage
    };

    if (statusFilter !== 'all') params.status = statusFilter;
    if (typeFilter !== 'all') params.type = typeFilter;
    if (searchTerm) params.search = searchTerm;

    const response = await deductionService.getDeductions(params);

    if (!isMounted.current) return;

    // Always handle the response, even if it's an error
    // The service now returns empty successful responses on error
    if (response.success) {
      // Transform MongoDB data to match frontend type
      const transformedDeductions = response.data.map(deduction => 
        deductionService.transformDeductionData(deduction)
      );
      
      setDeductions(transformedDeductions);
      setTotalDeductionsCount(response.pagination?.totalItems || 0);
      
      // Only show error toast if there's a message and no data
      if (response.message && response.data.length === 0) {
        toast.warning("Partial Data Loaded", {
          description: response.message || "Some data may be outdated."
        });
      }
    } else {
      toast.error("Failed to fetch deductions", {
        description: response.message || "Please try again"
      });
    }
  } catch (error: any) {
    console.error('Error fetching deductions:', error);
    
    // Don't show error toast for cache misses
    if (!error.message.includes('cached')) {
      toast.error("Network Error", {
        description: "Unable to connect to the server. Using cached data if available."
      });
    }
  } finally {
    if (isMounted.current) {
      setIsLoading(false);
    }
  }
}, [deductionPage, deductionItemsPerPage, statusFilter, typeFilter, searchTerm]);

// Update the fetchEmployees function similarly
const fetchEmployees = useCallback(async (forceRefresh = false) => {
  if (forceRefresh) {
    deductionService.clearCache('employees');
  }

  setIsLoadingEmployees(true);
  try {
    const response = await deductionService.getEmployees({
      status: 'active',
      limit: 1000
    });

    if (!isMounted.current) return;

    if (response.success) {
      // Transform MongoDB data to match frontend type
      const transformedEmployees = response.data.map(employee => 
        deductionService.transformEmployeeData(employee)
      );
      
      setEmployees(transformedEmployees);
      
      // Only show warning if there's a message and no data
      if (response.message && response.data.length === 0) {
        toast.warning("Partial Data Loaded", {
          description: response.message || "Employee data may be outdated."
        });
      }
    } else {
      toast.error("Failed to fetch employees", {
        description: response.message || "Please try again"
      });
    }
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    
    // Don't show error toast for cache misses
    if (!error.message.includes('cached')) {
      toast.error("Network Error", {
        description: "Unable to fetch employees. Using cached data if available."
      });
    }
  } finally {
    if (isMounted.current) {
      setIsLoadingEmployees(false);
    }
  }
}, []);

  // Fetch deduction statistics
  const fetchDeductionStats = useCallback(async () => {
    try {
      const response = await deductionService.getDeductionStats();

      if (!isMounted.current) return;

      if (response.success) {
        setDeductionStats(response.data);
      } else {
        // Calculate locally if API fails
        const localStats = deductions.reduce(
          (acc, deduction) => {
            if (!deduction) return acc;
            acc.totalDeductions += deduction.amount || 0;
            if (deduction.type === 'advance') acc.totalAdvances += deduction.amount || 0;
            if (deduction.type === 'fine') acc.totalFines += deduction.fineAmount || deduction.amount || 0;
            if (deduction.status === 'pending') acc.pendingCount += 1;
            if (deduction.status === 'approved') acc.approvedCount += 1;
            if (deduction.status === 'rejected') acc.rejectedCount += 1;
            if (deduction.status === 'completed') acc.completedCount += 1;
            return acc;
          },
          { 
            totalDeductions: 0, 
            totalAdvances: 0, 
            totalFines: 0, 
            pendingCount: 0,
            approvedCount: 0,
            rejectedCount: 0,
            completedCount: 0
          }
        );
        setDeductionStats(localStats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [deductions]);

  // Load employees and deductions on component mount
  useEffect(() => {
    fetchEmployees();
    fetchDeductions();
  }, [fetchEmployees, fetchDeductions]);

  // Load deductions when filters or pagination changes
  useEffect(() => {
    fetchDeductions();
  }, [deductionPage, deductionItemsPerPage, statusFilter, typeFilter, fetchDeductions]);

  // Load deductions when search term changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined && isMounted.current) {
        setDeductionPage(1);
        fetchDeductions();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchDeductions]);

  // Load stats when deductions change
  useEffect(() => {
    fetchDeductionStats();
  }, [deductions, fetchDeductionStats]);

  // Filter deductions based on search and filters
  const filteredDeductions = useMemo(() => {
    return (deductions || []).filter(deduction => {
      if (!deduction) return false;
      
      const employee = (employees || []).find(emp => emp && emp.employeeId === deduction.employeeId);
      const matchesSearch = 
        employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deduction.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || deduction.status === statusFilter;
      const matchesType = typeFilter === "all" || deduction.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [deductions, employees, searchTerm, statusFilter, typeFilter]);

  const paginatedDeductions = filteredDeductions.slice(
    (deductionPage - 1) * deductionItemsPerPage,
    deductionPage * deductionItemsPerPage
  );

  // Add new deduction to MongoDB
  const handleAddDeduction = async () => {
    if (!deductionForm.employeeId || !deductionForm.amount) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields (Employee and Amount)"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const employee = employees.find(emp => emp.employeeId === deductionForm.employeeId);
      
      if (!employee) {
        toast.error("Employee Not Found", {
          description: "Selected employee not found"
        });
        return;
      }
      
      const deductionData: CreateDeductionRequest = {
        employeeId: deductionForm.employeeId,
        employeeName: employee.name,
        employeeCode: employee.employeeId,
        type: deductionForm.type,
        amount: parseFloat(deductionForm.amount),
        description: deductionForm.description,
        deductionDate: deductionForm.deductionDate,
        status: deductionForm.status,
        repaymentMonths: deductionForm.repaymentMonths ? parseInt(deductionForm.repaymentMonths) : 0,
        fineAmount: deductionForm.fineAmount ? parseFloat(deductionForm.fineAmount) : 0,
        appliedMonth: deductionForm.appliedMonth
      };

      const response = await deductionService.createDeduction(deductionData);

      if (response.success) {
        // Transform MongoDB response to match frontend type
        const newDeduction = deductionService.transformDeductionData(response.data);
        
        setDeductions(prev => [...(prev || []), newDeduction]);
        setIsAddingDeduction(false);
        resetDeductionForm();
        
        toast.success("Success", {
          description: "Deduction added successfully!"
        });
        
        // Refresh the list
        fetchDeductions(true);
      } else {
        toast.error("Failed to add deduction", {
          description: response.message || "Please try again"
        });
      }
    } catch (error: any) {
      console.error('Error adding deduction:', error);
      toast.error("Network Error", {
        description: "Unable to save deduction. Please check your connection."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update deduction in MongoDB
  const handleUpdateDeduction = async () => {
    if (!editingDeduction) return;

    setIsSubmitting(true);
    try {
      const employee = employees.find(emp => emp.employeeId === deductionForm.employeeId);
      
      if (!employee) {
        toast.error("Employee Not Found", {
          description: "Selected employee not found"
        });
        return;
      }
      
      const updateData: UpdateDeductionRequest = {
        employeeId: deductionForm.employeeId,
        employeeName: employee.name,
        employeeCode: employee.employeeId,
        type: deductionForm.type,
        amount: parseFloat(deductionForm.amount),
        description: deductionForm.description,
        deductionDate: deductionForm.deductionDate,
        status: deductionForm.status,
        repaymentMonths: deductionForm.repaymentMonths ? parseInt(deductionForm.repaymentMonths) : 0,
        fineAmount: deductionForm.fineAmount ? parseFloat(deductionForm.fineAmount) : 0,
        appliedMonth: deductionForm.appliedMonth
      };

      const response = await deductionService.updateDeduction(editingDeduction.id, updateData);

      if (response.success) {
        // Update local state with transformed data
        const updatedDeduction = deductionService.transformDeductionData(response.data);

        setDeductions(prev => (prev || []).map(d => 
          d.id === updatedDeduction.id ? updatedDeduction : d
        ));
        setEditingDeduction(null);
        resetDeductionForm();
        
        toast.success("Success", {
          description: "Deduction updated successfully!"
        });
        
        // Refresh the list
        fetchDeductions(true);
      } else {
        toast.error("Failed to update deduction", {
          description: response.message || "Please try again"
        });
      }
    } catch (error: any) {
      console.error('Error updating deduction:', error);
      toast.error("Network Error", {
        description: "Unable to update deduction. Please check your connection."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete deduction from MongoDB
  const handleDeleteDeduction = async (id: string) => {
    try {
      const response = await deductionService.deleteDeduction(id);

      if (response.success) {
        setDeductions(prev => (prev || []).filter(d => d.id !== id));
        setDeleteDialog({ open: false, deduction: null });
        
        toast.success("Success", {
          description: "Deduction deleted successfully!"
        });
        
        // Refresh the list
        fetchDeductions(true);
      } else {
        toast.error("Failed to delete deduction", {
          description: response.message || "Please try again"
        });
      }
    } catch (error: any) {
      console.error('Error deleting deduction:', error);
      toast.error("Network Error", {
        description: "Unable to delete deduction. Please check your connection."
      });
    }
  };

  // Edit deduction
  const handleEditDeduction = (deduction: Deduction) => {
    setEditingDeduction(deduction);
    setDeductionForm({
      employeeId: deduction.employeeId.toString(),
      type: deduction.type,
      amount: deduction.amount.toString(),
      description: deduction.description || "",
      deductionDate: deduction.deductionDate || new Date().toISOString().split('T')[0],
      status: deduction.status,
      repaymentMonths: deduction.repaymentMonths?.toString() || "",
      installmentAmount: deduction.installmentAmount?.toString() || "",
      fineAmount: deduction.fineAmount?.toString() || "",
      appliedMonth: deduction.appliedMonth || new Date().toISOString().slice(0, 7)
    });
  };

  // Reset deduction form
  const resetDeductionForm = () => {
    setDeductionForm({
      employeeId: "",
      type: "advance",
      amount: "",
      description: "",
      deductionDate: new Date().toISOString().split('T')[0],
      status: "pending",
      repaymentMonths: "",
      installmentAmount: "",
      fineAmount: "",
      appliedMonth: new Date().toISOString().slice(0, 7)
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badgeClass = deductionService.getStatusBadgeClass(status);

    return (
      <Badge variant="secondary" className={badgeClass}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Get type badge
  const getTypeBadge = (type: string) => {
    const badgeClass = deductionService.getTypeBadgeClass(type);

    return (
      <Badge variant="secondary" className={badgeClass}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  // Export deductions data to CSV
  const handleExportDeductions = async () => {
    if (!deductions || deductions.length === 0) {
      toast.error("No Data", {
        description: "No deduction data to export"
      });
      return;
    }

    try {
      const blob = await deductionService.exportDeductions({
        format: 'csv',
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deductions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Export Successful", {
        description: "Deduction data exported to CSV file"
      });
    } catch (error) {
      console.error('Error exporting deductions:', error);
      toast.error("Export Failed", {
        description: "Unable to export deductions. Please try again."
      });
    }
  };

  // Handle form input changes with calculation
  const handleFormChange = (field: string, value: string) => {
    if (field === 'amount' || field === 'repaymentMonths') {
      const amount = field === 'amount' ? parseFloat(value) || 0 : parseFloat(deductionForm.amount) || 0;
      const months = field === 'repaymentMonths' ? parseInt(value) || 0 : parseInt(deductionForm.repaymentMonths) || 0;
      const installment = deductionService.calculateInstallmentAmount(amount, months);
      
      setDeductionForm(prev => ({
        ...prev,
        [field]: value,
        installmentAmount: installment.toString()
      }));
    } else {
      setDeductionForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    // Clear all caches
    deductionService.clearCache();
    
    // Force refresh
    fetchEmployees(true);
    fetchDeductions(true);
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Deduction Dialog */}
      <Dialog open={isAddingDeduction || !!editingDeduction} onOpenChange={(open) => {
        if (!open) {
          setIsAddingDeduction(false);
          setEditingDeduction(null);
          resetDeductionForm();
        }
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDeduction ? "Edit Deduction" : "Add New Deduction"}
            </DialogTitle>
            <DialogDescription>
              {editingDeduction ? "Update deduction information" : "Add a new salary deduction or advance"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee *</Label>
              <Select 
                value={deductionForm.employeeId} 
                onValueChange={(value) => handleFormChange('employeeId', value)}
                disabled={isLoadingEmployees}
              >
                <SelectTrigger>
                  {isLoadingEmployees ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading employees...
                    </div>
                  ) : (
                    <SelectValue placeholder="Select employee" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {(employees || []).map(employee => (
                    employee && (
                      <SelectItem key={employee.employeeId} value={employee.employeeId}>
                        {employee.name} ({employee.employeeId}) - {employee.department}
                      </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Deduction Type *</Label>
              <Select 
                value={deductionForm.type} 
                onValueChange={(value) => handleFormChange('type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">Salary Advance</SelectItem>
                  <SelectItem value="fine">Fine/Penalty</SelectItem>
                  <SelectItem value="other">Other Deduction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount"
                value={deductionForm.amount}
                onChange={(e) => handleFormChange('amount', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={deductionForm.status} 
                onValueChange={(value) => handleFormChange('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deductionDate">Deduction Date</Label>
              <Input
                id="deductionDate"
                type="date"
                value={deductionForm.deductionDate}
                onChange={(e) => handleFormChange('deductionDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appliedMonth">Applied Month</Label>
              <Input
                id="appliedMonth"
                type="month"
                value={deductionForm.appliedMonth}
                onChange={(e) => handleFormChange('appliedMonth', e.target.value)}
              />
            </div>
            
            {deductionForm.type === "advance" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="repaymentMonths">Repayment Months</Label>
                  <Input
                    id="repaymentMonths"
                    type="number"
                    min="0"
                    placeholder="Number of months for repayment"
                    value={deductionForm.repaymentMonths}
                    onChange={(e) => handleFormChange('repaymentMonths', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="installmentAmount">Monthly Installment (₹)</Label>
                  <Input
                    id="installmentAmount"
                    type="number"
                    readOnly
                    placeholder="Monthly installment amount"
                    value={deductionForm.installmentAmount}
                  />
                </div>
              </>
            )}
            
            {deductionForm.type === "fine" && (
              <div className="space-y-2">
                <Label htmlFor="fineAmount">Fine Amount (₹)</Label>
                <Input
                  id="fineAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Fine amount"
                  value={deductionForm.fineAmount}
                  onChange={(e) => handleFormChange('fineAmount', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Enter description for the deduction"
              value={deductionForm.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddingDeduction(false);
                setEditingDeduction(null);
                resetDeductionForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={editingDeduction ? handleUpdateDeduction : handleAddDeduction}
              disabled={isSubmitting || !deductionForm.employeeId || !deductionForm.amount}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingDeduction ? "Update Deduction" : "Add Deduction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, deduction: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deduction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this deduction record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteDialog.deduction && handleDeleteDeduction(deleteDialog.deduction.id.toString())}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Deduction Management</h2>
          <p className="text-muted-foreground">Manage salary advances, fines, and other deductions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportDeductions}
            disabled={deductions.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsAddingDeduction(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Deduction
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <IndianRupee className="h-5 w-5 mr-1" />
              {deductionService.formatCurrency(deductionStats.totalDeductions)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalDeductionsCount} total records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Salary Advances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 flex items-center">
              <IndianRupee className="h-5 w-5 mr-1" />
              {deductionService.formatCurrency(deductionStats.totalAdvances)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fines/Penalties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 flex items-center">
              <IndianRupee className="h-5 w-5 mr-1" />
              {deductionService.formatCurrency(deductionStats.totalFines)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {deductionStats.pendingCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Deduction Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name, ID, or description..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchDeductions();
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="advance">Salary Advance</SelectItem>
                  <SelectItem value="fine">Fine/Penalty</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={handleManualRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Deductions Table */}
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading deductions...</span>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fine Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Installment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied Month</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDeductions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          {deductions && deductions.length === 0 ? "No deductions added yet" : "No deductions match your filters"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedDeductions.map((deduction) => {
                        if (!deduction) return null;
                        
                        const employee = (employees || []).find(emp => emp && emp.employeeId === deduction.employeeId);
                        
                        return (
                          <TableRow key={deduction.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{employee?.name || "Unknown Employee"}</div>
                                <div className="text-sm text-muted-foreground">{employee?.employeeId || "N/A"}</div>
                                <div className="text-xs text-muted-foreground">{employee?.department || "N/A"}</div>
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(deduction.type)}</TableCell>
                            <TableCell>
                              <div className="flex items-center font-medium">
                                <IndianRupee className="h-4 w-4 mr-1" />
                                {deductionService.formatCurrency(deduction.amount)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {deduction.type === "fine" ? (
                                <div className="flex items-center font-medium text-orange-600">
                                  <IndianRupee className="h-4 w-4 mr-1" />
                                  {deductionService.formatCurrency(deduction.fineAmount || deduction.amount || 0)}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={deduction.description || ""}>
                              {deduction.description || "No description"}
                            </TableCell>
                            <TableCell>
                              {deduction.type === "advance" && (deduction.installmentAmount || 0) > 0 ? (
                                <div className="flex items-center text-sm">
                                  <IndianRupee className="h-3 w-3 mr-1" />
                                  {deductionService.formatCurrency(deduction.installmentAmount || 0)}/month
                                  {deduction.repaymentMonths && deduction.repaymentMonths > 0 && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({deduction.repaymentMonths} months)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(deduction.status)}</TableCell>
                            <TableCell>{deduction.appliedMonth || "N/A"}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditDeduction(deduction)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setDeleteDialog({ open: true, deduction })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                
                {filteredDeductions.length > 0 && (
                  <Pagination
                    currentPage={deductionPage}
                    totalPages={Math.ceil(totalDeductionsCount / deductionItemsPerPage)}
                    totalItems={totalDeductionsCount}
                    itemsPerPage={deductionItemsPerPage}
                    onPageChange={setDeductionPage}
                    onItemsPerPageChange={(value) => {
                      setDeductionItemsPerPage(value);
                      setDeductionPage(1); // Reset to first page when changing items per page
                    }}
                  />
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeductionListTab;