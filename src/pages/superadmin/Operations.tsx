import { useState } from "react";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Clock, AlertCircle, Edit, Trash2, Eye, Download, Calculator, CheckCircle, XCircle, Users, Calendar, Building } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Types
interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed";
  deadline: string;
  siteId: string;
}

interface Site {
  id: string;
  name: string;
  clientName: string;
  location: string;
  areaSqft: number;
  siteManager: string;
  managerPhone: string;
  supervisor: string;
  supervisorPhone: string;
  contractValue: number;
  contractEndDate: string;
  status: "active" | "inactive";
}

interface Service {
  id: string;
  name: string;
  status: "operational" | "maintenance" | "down";
  lastChecked: string;
  assignedTeam: string;
}

interface RosterEntry {
  id: string;
  date: string;
  employeeName: string;
  employeeId: string;
  designation: string;
  shift: string;
  shiftTiming: string;
  assignedTask: string;
  attendance: "present" | "absent" | "half-day";
  hours: number;
  remark: string;
  type: "daily" | "weekly" | "fortnightly" | "monthly";
  siteClient: string;
  supervisor: string;
}

interface Alert {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved";
  date: string;
}

// Dummy Data
const initialSites: Site[] = [
  {
    id: "1",
    name: "Commercial Complex A",
    clientName: "ABC Corporation",
    location: "Downtown",
    areaSqft: 50000,
    siteManager: "John Doe",
    managerPhone: "+91 9876543210",
    supervisor: "Mike Johnson",
    supervisorPhone: "+91 9876543211",
    contractValue: 2500000,
    contractEndDate: "2024-12-31",
    status: "active"
  },
  {
    id: "2",
    name: "Residential Tower B",
    clientName: "XYZ Builders",
    location: "Uptown",
    areaSqft: 35000,
    siteManager: "Jane Smith",
    managerPhone: "+91 9876543212",
    supervisor: "Sarah Wilson",
    supervisorPhone: "+91 9876543213",
    contractValue: 1800000,
    contractEndDate: "2024-11-30",
    status: "active"
  },
  {
    id: "3",
    name: "IT Park Center",
    clientName: "Tech Solutions Ltd",
    location: "Tech Park",
    areaSqft: 75000,
    siteManager: "Robert Brown",
    managerPhone: "+91 9876543214",
    supervisor: "Emily Davis",
    supervisorPhone: "+91 9876543215",
    contractValue: 3200000,
    contractEndDate: "2025-01-31",
    status: "active"
  }
];

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Site Inspection",
    description: "Complete site inspection for safety compliance",
    assignedTo: "manager-a",
    priority: "high",
    status: "pending",
    deadline: "2024-01-15",
    siteId: "1"
  },
  {
    id: "2",
    title: "Equipment Maintenance",
    description: "Regular maintenance of security equipment",
    assignedTo: "supervisor-a",
    priority: "medium",
    status: "in-progress",
    deadline: "2024-01-20",
    siteId: "1"
  },
  {
    id: "3",
    title: "Staff Training",
    description: "Conduct safety training for new staff",
    assignedTo: "supervisor-b",
    priority: "low",
    status: "completed",
    deadline: "2024-01-10",
    siteId: "2"
  },
  {
    id: "4",
    title: "Security Audit",
    description: "Monthly security audit and report generation",
    assignedTo: "supervisor-a",
    priority: "high",
    status: "pending",
    deadline: "2024-01-18",
    siteId: "2"
  },
  {
    id: "5",
    title: "Parking System Check",
    description: "Inspect and test parking management system",
    assignedTo: "manager-b",
    priority: "medium",
    status: "in-progress",
    deadline: "2024-01-22",
    siteId: "3"
  }
];

const serviceTypes: Service[] = [
  {
    id: "1",
    name: "Security Services",
    status: "operational",
    lastChecked: "2024-01-12",
    assignedTeam: "Alpha Team"
  },
  {
    id: "2",
    name: "Housekeeping",
    status: "maintenance",
    lastChecked: "2024-01-11",
    assignedTeam: "Beta Team"
  },
  {
    id: "3",
    name: "Parking Management",
    status: "operational",
    lastChecked: "2024-01-12",
    assignedTeam: "Gamma Team"
  },
  {
    id: "4",
    name: "Waste Management",
    status: "down",
    lastChecked: "2024-01-10",
    assignedTeam: "Delta Team"
  },
  {
    id: "5",
    name: "STP Tank Cleaning",
    status: "operational",
    lastChecked: "2024-01-09",
    assignedTeam: "Epsilon Team"
  },
  {
    id: "6",
    name: "Maintenance",
    status: "maintenance",
    lastChecked: "2024-01-12",
    assignedTeam: "Zeta Team"
  }
];

const rosterTypes = ["daily", "weekly", "fortnightly", "monthly"];

const staffMembers = [
  { id: "staff-1", name: "Rajesh Kumar", role: "Security Guard", employeeId: "EMP001" },
  { id: "staff-2", name: "Priya Sharma", role: "Housekeeping", employeeId: "EMP002" },
  { id: "staff-3", name: "Amit Patel", role: "Supervisor", employeeId: "EMP003" },
  { id: "staff-4", name: "Sunita Reddy", role: "Security Guard", employeeId: "EMP004" },
  { id: "staff-5", name: "Mohan Das", role: "Housekeeping", employeeId: "EMP005" },
  { id: "staff-6", name: "Anjali Singh", role: "Parking Attendant", employeeId: "EMP006" }
];

const supervisors = [
  { id: "1", name: "Mike Johnson" },
  { id: "2", name: "Sarah Wilson" },
  { id: "3", name: "Robert Brown" }
];

const initialRoster: RosterEntry[] = [
  { 
    id: "1", 
    date: "2024-01-15", 
    employeeName: "Rajesh Kumar",
    employeeId: "EMP001",
    designation: "Security Guard",
    shift: "Morning",
    shiftTiming: "09:00-17:00",
    assignedTask: "Security Patrol", 
    attendance: "present", 
    hours: 8, 
    remark: "Regular duty completed",
    type: "daily",
    siteClient: "Commercial Complex A - ABC Corporation",
    supervisor: "Mike Johnson"
  },
  { 
    id: "2", 
    date: "2024-01-15", 
    employeeName: "Priya Sharma",
    employeeId: "EMP002",
    designation: "Housekeeping",
    shift: "Evening",
    shiftTiming: "13:00-21:00",
    assignedTask: "Cleaning - Floor 1", 
    attendance: "present", 
    hours: 8, 
    remark: "All areas cleaned",
    type: "daily",
    siteClient: "Commercial Complex A - ABC Corporation",
    supervisor: "Mike Johnson"
  }
];

const initialAlerts: Alert[] = [
  { id: "1", title: "Security Camera Offline", severity: "high", status: "open", date: "2024-01-12" },
  { id: "2", title: "Parking System Maintenance", severity: "medium", status: "in-progress", date: "2024-01-11" },
  { id: "3", title: "Waste Collection Delay", severity: "low", status: "resolved", date: "2024-01-10" }
];

// Stats Cards Component
const StatsCards = ({ tasks }: { tasks: Task[] }) => {
  const getSiteStats = () => {
    const siteStats: { [key: string]: { total: number; completed: number; pending: number; inProgress: number } } = {};
    
    initialSites.forEach(site => {
      const siteTasks = tasks.filter(task => task.siteId === site.id);
      siteStats[site.id] = {
        total: siteTasks.length,
        completed: siteTasks.filter(t => t.status === "completed").length,
        pending: siteTasks.filter(t => t.status === "pending").length,
        inProgress: siteTasks.filter(t => t.status === "in-progress").length
      };
    });

    return siteStats;
  };

  const siteStats = getSiteStats();
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === "in-progress").length;
  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{inProgressTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{pendingTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Site-wise Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Site-wise Task Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {initialSites.map((site) => {
              const stats = siteStats[site.id];
              return (
                <Card key={site.id} className="relative">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      {site.name}
                      <Badge variant={site.status === "active" ? "default" : "secondary"}>
                        {site.status}
                      </Badge>
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {site.clientName} • {site.location}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Total Tasks</div>
                        <div className="font-semibold">{stats.total}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Completed</div>
                        <div className="font-semibold text-green-600">{stats.completed}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">In Progress</div>
                        <div className="font-semibold text-primary">{stats.inProgress}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Pending</div>
                        <div className="font-semibold text-orange-500">{stats.pending}</div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%' 
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {stats.completed} of {stats.total} tasks completed
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Reusable Components
const FormField = ({ label, id, children, required = false }: {
  label: string;
  id: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </Label>
    {children}
  </div>
);

const SearchBar = ({ value, onChange, placeholder }: { 
  value: string; 
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <div className="mb-4">
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  </div>
);

// Task Management Section
const TasksSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedSite, setSelectedSite] = useState<string>("all");

  const handleAssignTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: formData.get("task-title") as string,
      description: formData.get("description") as string,
      assignedTo: formData.get("assign-to") as string,
      priority: formData.get("priority") as "high" | "medium" | "low",
      status: "pending",
      deadline: formData.get("deadline") as string,
      siteId: formData.get("site") as string
    };

    setTasks(prev => [newTask, ...prev]);
    toast.success("Task assigned successfully!");
    setDialogOpen(false);
    (e.target as HTMLFormElement).reset();
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast.success("Task deleted successfully!");
  };

  const handleUpdateStatus = (taskId: string, status: Task["status"]) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status } : task
    ));
    toast.success("Task status updated!");
  };

  // Filter tasks based on search query and selected site
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSite = selectedSite === "all" || task.siteId === selectedSite;
    
    return matchesSearch && matchesSite;
  });

  const getPriorityColor = (priority: string) => {
    const colors = { high: "destructive", medium: "default", low: "secondary" };
    return colors[priority as keyof typeof colors] || "outline";
  };

  const getStatusColor = (status: string) => {
    const colors = { completed: "default", "in-progress": "default", pending: "secondary" };
    return colors[status as keyof typeof colors] || "outline";
  };

  const getAssigneeName = (assigneeId: string) => {
    const assignees: { [key: string]: string } = {
      "manager-a": "Manager A",
      "supervisor-a": "Supervisor A",
      "supervisor-b": "Supervisor B",
      "manager-b": "Manager B"
    };
    return assignees[assigneeId] || assigneeId;
  };

  const getSiteName = (siteId: string) => {
    const site = initialSites.find(s => s.id === siteId);
    return site ? site.name : "Unknown Site";
  };

  const AssignTaskDialog = ({ open, onOpenChange, onSubmit }: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Assign Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="Site" id="site" required>
            <Select name="site" required>
              <SelectTrigger>
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {initialSites.map(site => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name} - {site.clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Task Title" id="task-title" required>
            <Input id="task-title" name="task-title" placeholder="Enter task title" required />
          </FormField>
          <FormField label="Description" id="description" required>
            <Textarea id="description" name="description" placeholder="Enter task description" required />
          </FormField>
          <FormField label="Assign To" id="assign-to" required>
            <Select name="assign-to" required>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager-a">Manager A</SelectItem>
                <SelectItem value="supervisor-a">Supervisor A</SelectItem>
                <SelectItem value="supervisor-b">Supervisor B</SelectItem>
                <SelectItem value="manager-b">Manager B</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Priority" id="priority" required>
            <Select name="priority" required>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Deadline" id="deadline" required>
            <Input id="deadline" name="deadline" type="date" required />
          </FormField>
          <Button type="submit" className="w-full">Assign Task</Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>All Tasks</CardTitle>
          <AssignTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleAssignTask} />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search tasks..." />
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {initialSites.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Title</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No tasks found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{task.title}</div>
                        <div className="text-sm text-muted-foreground">{task.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getSiteName(task.siteId)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getAssigneeName(task.assignedTo)}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(task.priority) as "default" | "destructive" | "outline" | "secondary"}>
                        {task.priority === "high" && <AlertCircle className="mr-1 h-3 w-3" />}
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(task.status) as "default" | "destructive" | "outline" | "secondary"}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.deadline}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {task.status !== "completed" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleUpdateStatus(task.id, "in-progress")}
                            disabled={task.status === "in-progress"}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {task.status !== "completed" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleUpdateStatus(task.id, "completed")}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Sites Management Section
const SitesSection = () => {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddSite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newSite: Site = {
      id: Date.now().toString(),
      name: formData.get("site-name") as string,
      clientName: formData.get("client-name") as string,
      location: formData.get("location") as string,
      areaSqft: Number(formData.get("area-sqft")),
      siteManager: formData.get("site-manager") as string,
      managerPhone: formData.get("manager-phone") as string,
      supervisor: formData.get("supervisor") as string,
      supervisorPhone: formData.get("supervisor-phone") as string,
      contractValue: Number(formData.get("contract-value")),
      contractEndDate: formData.get("contract-end-date") as string,
      status: "active"
    };

    setSites(prev => [newSite, ...prev]);
    toast.success("Site added successfully!");
    setDialogOpen(false);
    (e.target as HTMLFormElement).reset();
  };

  const handleDeleteSite = (siteId: string) => {
    setSites(prev => prev.filter(site => site.id !== siteId));
    toast.success("Site deleted successfully!");
  };

  const handleToggleStatus = (siteId: string) => {
    setSites(prev => prev.map(site => 
      site.id === siteId ? { ...site, status: site.status === "active" ? "inactive" : "active" } : site
    ));
    toast.success("Site status updated!");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Site Management</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Site
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Site</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Site Name" id="site-name" required>
                    <Input id="site-name" name="site-name" placeholder="Enter site name" required />
                  </FormField>
                  <FormField label="Client Name" id="client-name" required>
                    <Input id="client-name" name="client-name" placeholder="Enter client name" required />
                  </FormField>
                  <FormField label="Location" id="location" required>
                    <Input id="location" name="location" placeholder="Enter location" required />
                  </FormField>
                  <FormField label="Area (sqft)" id="area-sqft" required>
                    <Input 
                      id="area-sqft" 
                      name="area-sqft" 
                      type="number" 
                      placeholder="Enter area in sqft" 
                      required 
                    />
                  </FormField>
                  <FormField label="Site Manager" id="site-manager" required>
                    <Input id="site-manager" name="site-manager" placeholder="Enter site manager name" required />
                  </FormField>
                  <FormField label="Manager Phone" id="manager-phone" required>
                    <Input id="manager-phone" name="manager-phone" placeholder="Enter manager phone" required />
                  </FormField>
                  <FormField label="Supervisor" id="supervisor" required>
                    <Input id="supervisor" name="supervisor" placeholder="Enter supervisor name" required />
                  </FormField>
                  <FormField label="Supervisor Phone" id="supervisor-phone" required>
                    <Input id="supervisor-phone" name="supervisor-phone" placeholder="Enter supervisor phone" required />
                  </FormField>
                  <FormField label="Contract Value" id="contract-value" required>
                    <Input 
                      id="contract-value" 
                      name="contract-value" 
                      type="number" 
                      placeholder="Enter contract value" 
                      required 
                    />
                  </FormField>
                  <FormField label="Contract End Date" id="contract-end-date" required>
                    <Input id="contract-end-date" name="contract-end-date" type="date" required />
                  </FormField>
                </div>
                <Button type="submit" className="w-full">Add Site</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Area (sqft)</TableHead>
                <TableHead>Contract Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{site.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Manager: {site.siteManager}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{site.clientName}</TableCell>
                  <TableCell>{site.location}</TableCell>
                  <TableCell>{site.areaSqft.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(site.contractValue)}</TableCell>
                  <TableCell>
                    <Badge variant={site.status === "active" ? "default" : "secondary"}>
                      {site.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleStatus(site.id)}
                      >
                        {site.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteSite(site.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Roster Management Section
const RosterSection = () => {
  const [selectedRoster, setSelectedRoster] = useState("daily");
  const [roster, setRoster] = useState<RosterEntry[]>(initialRoster);
  const [addEntryDialogOpen, setAddEntryDialogOpen] = useState(false);

  const handleAddRosterEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const selectedStaff = staffMembers.find(s => s.id === formData.get("employee"));
    
    const newRoster: RosterEntry = {
      id: Date.now().toString(),
      date: formData.get("date") as string,
      employeeName: selectedStaff?.name || "",
      employeeId: selectedStaff?.employeeId || "",
      designation: selectedStaff?.role || "",
      shift: formData.get("shift") as string,
      shiftTiming: formData.get("shiftTiming") as string,
      assignedTask: formData.get("assignedTask") as string,
      attendance: formData.get("attendance") as "present" | "absent" | "half-day",
      hours: Number(formData.get("hours")),
      remark: formData.get("remark") as string,
      type: selectedRoster as "daily" | "weekly" | "fortnightly" | "monthly",
      siteClient: formData.get("siteClient") as string,
      supervisor: formData.get("supervisor") as string
    };

    setRoster(prev => [newRoster, ...prev]);
    toast.success("Roster entry added successfully!");
    setAddEntryDialogOpen(false);
    (e.target as HTMLFormElement).reset();
  };

  const handleDeleteRoster = (rosterId: string) => {
    setRoster(prev => prev.filter(entry => entry.id !== rosterId));
    toast.success("Roster entry deleted!");
  };

  const filteredRoster = roster.filter(entry => entry.type === selectedRoster);

  const handleExportReport = () => {
    toast.success(`Exporting ${selectedRoster} roster report...`);
  };

  const getAttendanceColor = (attendance: string) => {
    const colors = {
      present: "default",
      absent: "destructive",
      "half-day": "secondary"
    };
    return colors[attendance as keyof typeof colors] || "outline";
  };

  const totalHours = filteredRoster.reduce((sum, entry) => sum + entry.hours, 0);
  const presentStaff = filteredRoster.filter(entry => entry.attendance === "present").length;
  const absentStaff = filteredRoster.filter(entry => entry.attendance === "absent").length;

  // Daily Roster Table Component
  const DailyRosterTable = ({ roster, onDelete }: { roster: RosterEntry[], onDelete: (id: string) => void }) => (
    <div className="space-y-4">
      {roster.length > 0 && (
        <div className="bg-muted p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><strong>Date:</strong> {roster[0].date}</div>
            <div><strong>Site / Client:</strong> {roster[0].siteClient}</div>
            <div><strong>Supervisor:</strong> {roster[0].supervisor}</div>
          </div>
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sr. No.</TableHead>
            <TableHead>Employee Name</TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Shift Timing</TableHead>
            <TableHead>Assigned Task</TableHead>
            <TableHead>Attendance</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roster.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-8 w-8" />
                  <div>No roster entries found for {selectedRoster} roster</div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            roster.map((entry, index) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{entry.employeeName}</TableCell>
                <TableCell>{entry.employeeId}</TableCell>
                <TableCell>{entry.designation}</TableCell>
                <TableCell>{entry.shiftTiming}</TableCell>
                <TableCell>{entry.assignedTask}</TableCell>
                <TableCell>
                  <Badge variant={getAttendanceColor(entry.attendance) as "default" | "destructive" | "outline" | "secondary"}>
                    {entry.attendance === 'present' ? '✓' : entry.attendance === 'absent' ? '✗' : 'H'}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={entry.remark}>
                  {entry.remark}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast.info("Edit functionality coming soon")}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => onDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Roster Management
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportReport}>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Roster Type Selection */}
          <div className="flex flex-wrap gap-4 mb-6">
            {rosterTypes.map((type) => (
              <Button
                key={type}
                variant={selectedRoster === type ? "default" : "outline"}
                onClick={() => setSelectedRoster(type)}
                className="capitalize"
              >
                {type} Roster
              </Button>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredRoster.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalHours}h</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Present Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{presentStaff}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Absent Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{absentStaff}</div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Add Entry Button */}
            <Dialog open={addEntryDialogOpen} onOpenChange={setAddEntryDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Roster Entry - {selectedRoster.toUpperCase()} ROSTER</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddRosterEntry} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Date" id="date" required>
                      <Input id="date" name="date" type="date" required />
                    </FormField>
                    <FormField label="Site / Client" id="siteClient" required>
                      <Select name="siteClient" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select site/client" />
                        </SelectTrigger>
                        <SelectContent>
                          {initialSites.map(site => (
                            <SelectItem key={site.id} value={`${site.name} - ${site.clientName}`}>
                              {site.name} - {site.clientName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Supervisor" id="supervisor" required>
                      <Select name="supervisor" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supervisor" />
                        </SelectTrigger>
                        <SelectContent>
                          {supervisors.map(sup => (
                            <SelectItem key={sup.id} value={sup.name}>
                              {sup.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Employee" id="employee" required>
                      <Select name="employee" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffMembers.map(staff => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.name} - {staff.role} ({staff.employeeId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Shift" id="shift" required>
                      <Select name="shift" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Morning">Morning Shift</SelectItem>
                          <SelectItem value="Evening">Evening Shift</SelectItem>
                          <SelectItem value="Night">Night Shift</SelectItem>
                          <SelectItem value="General">General Shift</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Shift Timing" id="shiftTiming" required>
                      <Input 
                        id="shiftTiming" 
                        name="shiftTiming" 
                        placeholder="e.g., 09:00-17:00" 
                        required 
                      />
                    </FormField>
                    <FormField label="Assigned Task" id="assignedTask" required>
                      <Input 
                        id="assignedTask" 
                        name="assignedTask" 
                        placeholder="Enter assigned task" 
                        required 
                      />
                    </FormField>
                    <FormField label="Attendance" id="attendance" required>
                      <Select name="attendance" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select attendance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present (✓)</SelectItem>
                          <SelectItem value="absent">Absent (✗)</SelectItem>
                          <SelectItem value="half-day">Half Day (H)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Hours" id="hours" required>
                      <Input 
                        id="hours" 
                        name="hours" 
                        type="number" 
                        placeholder="Enter hours" 
                        min="0"
                        max="24"
                        step="0.5"
                        required 
                      />
                    </FormField>
                  </div>
                  <FormField label="Remark" id="remark">
                    <Textarea id="remark" name="remark" placeholder="Enter any remarks or notes" />
                  </FormField>
                  <Button type="submit" className="w-full">Add Entry</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Roster Table */}
          <DailyRosterTable roster={filteredRoster} onDelete={handleDeleteRoster} />
        </CardContent>
      </Card>
    </div>
  );
};

// Services Monitoring Section
const ServicesSection = () => {
  const [services, setServices] = useState<Service[]>(serviceTypes);

  const handleUpdateStatus = (serviceId: string, status: Service["status"]) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId ? { 
        ...service, 
        status,
        lastChecked: new Date().toISOString().split('T')[0]
      } : service
    ));
    toast.success(`Service status updated to ${status}`);
  };

  const getStatusColor = (status: Service["status"]) => {
    const colors = {
      operational: "default",
      maintenance: "secondary",
      down: "destructive"
    };
    return colors[status];
  };

  const getStatusIcon = (status: Service["status"]) => {
    const icons = {
      operational: <CheckCircle className="h-4 w-4" />,
      maintenance: <Clock className="h-4 w-4" />,
      down: <XCircle className="h-4 w-4" />
    };
    return icons[status];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="relative">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {service.name}
                    {getStatusIcon(service.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant={getStatusColor(service.status) as "default" | "destructive" | "outline" | "secondary"}>
                    {service.status}
                  </Badge>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">Team: {service.assignedTeam}</p>
                    <p className="text-muted-foreground">Last checked: {service.lastChecked}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant={service.status === "operational" ? "default" : "outline"}
                      onClick={() => handleUpdateStatus(service.id, "operational")}
                    >
                      Operational
                    </Button>
                    <Button 
                      size="sm" 
                      variant={service.status === "maintenance" ? "secondary" : "outline"}
                      onClick={() => handleUpdateStatus(service.id, "maintenance")}
                    >
                      Maintenance
                    </Button>
                    <Button 
                      size="sm" 
                      variant={service.status === "down" ? "destructive" : "outline"}
                      onClick={() => handleUpdateStatus(service.id, "down")}
                    >
                      Down
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Alerts & Issues Section
const AlertsSection = () => {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  const handleUpdateStatus = (alertId: string, status: Alert["status"]) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status } : alert
    ));
    toast.success("Alert status updated!");
  };

  const getSeverityColor = (severity: Alert["severity"]) => {
    const colors = {
      low: "secondary",
      medium: "default",
      high: "destructive",
      critical: "destructive"
    };
    return colors[severity];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Alerts & Issues</CardTitle>
          <Button onClick={() => toast.success("Navigating to detailed alerts page...")}>
            View All Alerts
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.title}</TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(alert.severity) as "default" | "destructive" | "outline" | "secondary"}>
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={alert.status === "resolved" ? "default" : "secondary"}>
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{alert.date}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {alert.status !== "open" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateStatus(alert.id, "open")}
                        >
                          Reopen
                        </Button>
                      )}
                      {alert.status !== "in-progress" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateStatus(alert.id, "in-progress")}
                        >
                          In Progress
                        </Button>
                      )}
                      {alert.status !== "resolved" && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleUpdateStatus(alert.id, "resolved")}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Price Calculator Section
const PriceCalculator = () => {
  const [area, setArea] = useState("");
  const [unit, setUnit] = useState("sqm");
  const [rate, setRate] = useState("");
  const [gst, setGst] = useState("18");
  const [discount, setDiscount] = useState("0");

  const calculatePrice = () => {
    const areaValue = parseFloat(area) || 0;
    const rateValue = parseFloat(rate) || 0;
    const gstValue = parseFloat(gst) || 0;
    const discountValue = parseFloat(discount) || 0;

    const basePrice = areaValue * rateValue;
    const discountAmount = (basePrice * discountValue) / 100;
    const priceAfterDiscount = basePrice - discountAmount;
    const gstAmount = (priceAfterDiscount * gstValue) / 100;
    const finalPrice = priceAfterDiscount + gstAmount;

    return {
      basePrice: basePrice.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      finalPrice: finalPrice.toFixed(2)
    };
  };

  const result = calculatePrice();

  const handleReset = () => {
    setArea("");
    setUnit("sqm");
    setRate("");
    setGst("18");
    setDiscount("0");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Area to Price Converter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Enter area"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqm">Square Meter (sqm)</SelectItem>
                    <SelectItem value="sqft">Square Feet (sqft)</SelectItem>
                    <SelectItem value="gaj">Gaj</SelectItem>
                    <SelectItem value="cm">Centimeter (cm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Rate per Square Meter</Label>
                <Input
                  id="rate"
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Enter rate"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gst">GST (%)</Label>
                  <Input
                    id="gst"
                    type="number"
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" onClick={handleReset} variant="outline" className="flex-1">
                  Reset
                </Button>
                <Button 
                  type="button" 
                  onClick={() => toast.success("Calculation completed!")}
                  className="flex-1"
                >
                  Calculate
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Price Calculation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span>₹{result.basePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount ({discount}%):</span>
                    <span className="text-green-600">-₹{result.discountAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({gst}%):</span>
                    <span className="text-red-600">+₹{result.gstAmount}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold text-lg">
                    <span>Final Price:</span>
                    <span>₹{result.finalPrice}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Operations Component
const Operations = () => {
  const [activeTab, setActiveTab] = useState("tasks");
  const [tasks] = useState<Task[]>(initialTasks);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Operations & Task Management" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6"
      >
        <StatsCards tasks={tasks} />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Issues</TabsTrigger>
            {/* <TabsTrigger value="calculator">Price Calculator</TabsTrigger> */}
          </TabsList>

          <TabsContent value="tasks">
            <TasksSection />
          </TabsContent>

          <TabsContent value="sites">
            <SitesSection />
          </TabsContent>

          <TabsContent value="roster">
            <RosterSection />
          </TabsContent>

          <TabsContent value="services">
            <ServicesSection />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsSection />
          </TabsContent>

          <TabsContent value="calculator">
            <PriceCalculator />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Operations;