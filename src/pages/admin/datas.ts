// Admin Data - Complete version with ALL exports

// Types (Admin version)
export interface Attachment {
  id: string;
  filename: string;
  url: string;
  uploadedAt: string;
  size: number;
  type: string;
}

export interface HourlyUpdate {
  id: string;
  timestamp: string;
  content: string;
  submittedBy: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed";
  deadline: string;
  dueDateTime: string;
  siteId: string;
  attachments: Attachment[];
  hourlyUpdates: HourlyUpdate[];
}

export interface Site {
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
  services: string[];
  staffCount: number;
  status: "active" | "inactive";
}

export interface Service {
  id: string;
  name: string;
  status: "operational" | "maintenance" | "down";
  lastChecked: string;
  assignedTeam: string;
}

export interface RosterEntry {
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
  department: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved";
  date: string;
  reportedBy: string;
  site: string;
  photos?: string[];
  assignedTo?: string;
}

// Dummy Data for Admin
export const initialSites: Site[] = [
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
    services: ["Security", "Housekeeping", "Parking", "Maintenance"],
    staffCount: 19,
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
    services: ["Security", "Housekeeping", "Waste Management"],
    staffCount: 11,
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
    services: ["Security", "Housekeeping", "Parking", "STP Tank Cleaning", "Maintenance"],
    staffCount: 29,
    status: "active"
  },
  {
    id: "4",
    name: "Hospital Complex",
    clientName: "City Hospital",
    location: "Medical District",
    areaSqft: 45000,
    siteManager: "Michael Chen",
    managerPhone: "+91 9876543216",
    supervisor: "Alex Turner",
    supervisorPhone: "+91 9876543217",
    contractValue: 1950000,
    contractEndDate: "2024-10-31",
    services: ["Security", "Housekeeping", "Waste Management"],
    staffCount: 15,
    status: "active"
  },
  {
    id: "5",
    name: "Shopping Mall",
    clientName: "Mega Retail",
    location: "Shopping District",
    areaSqft: 65000,
    siteManager: "Lisa Wang",
    managerPhone: "+91 9876543218",
    supervisor: "David Kim",
    supervisorPhone: "+91 9876543219",
    contractValue: 2800000,
    contractEndDate: "2024-11-15",
    services: ["Security", "Housekeeping", "Parking", "Maintenance"],
    staffCount: 22,
    status: "active"
  }
];

// Export for backward compatibility
export const adminSites = initialSites;

// Tasks that admin can manage
export const initialTasks: Task[] = [
  {
    id: "1",
    title: "Site Safety Inspection",
    description: "Conduct comprehensive safety inspection of all construction zones",
    assignedTo: "manager-1",
    priority: "high",
    status: "pending",
    deadline: "2024-12-15",
    dueDateTime: "2024-12-15T14:00:00",
    siteId: "1",
    attachments: [
      {
        id: "att-1",
        filename: "safety-checklist.pdf",
        url: "/documents/safety-checklist.pdf",
        uploadedAt: "2024-12-01T09:30:00",
        size: 1024 * 256,
        type: "application/pdf"
      }
    ],
    hourlyUpdates: [
      {
        id: "update-1",
        timestamp: "2024-12-10T10:00:00",
        content: "Initial inspection scheduled with site manager",
        submittedBy: "manager-1"
      }
    ]
  },
  {
    id: "2",
    title: "Equipment Maintenance",
    description: "Monthly maintenance of all heavy machinery and equipment",
    assignedTo: "supervisor-1",
    priority: "medium",
    status: "in-progress",
    deadline: "2024-12-10",
    dueDateTime: "2024-12-10T16:00:00",
    siteId: "2",
    attachments: [],
    hourlyUpdates: [
      {
        id: "update-2",
        timestamp: "2024-12-08T09:00:00",
        content: "Started maintenance on excavator #3",
        submittedBy: "supervisor-1"
      },
      {
        id: "update-3",
        timestamp: "2024-12-08T11:30:00",
        content: "Completed maintenance on 5 out of 8 machines",
        submittedBy: "supervisor-1"
      }
    ]
  },
  {
    id: "3",
    title: "Client Progress Meeting",
    description: "Weekly progress update meeting with client representatives",
    assignedTo: "manager-2",
    priority: "low",
    status: "completed",
    deadline: "2024-12-05",
    dueDateTime: "2024-12-05T10:00:00",
    siteId: "3",
    attachments: [
      {
        id: "att-2",
        filename: "meeting-minutes.docx",
        url: "/documents/meeting-minutes.docx",
        uploadedAt: "2024-12-05T12:00:00",
        size: 1024 * 128,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      }
    ],
    hourlyUpdates: []
  },
  {
    id: "4",
    title: "Material Delivery Verification",
    description: "Verify and document arrival of construction materials",
    assignedTo: "supervisor-2",
    priority: "medium",
    status: "pending",
    deadline: "2024-12-12",
    dueDateTime: "2024-12-12T09:00:00",
    siteId: "4",
    attachments: [],
    hourlyUpdates: []
  },
  {
    id: "5",
    title: "Worker Training Session",
    description: "Conduct safety training for new workers",
    assignedTo: "supervisor-3",
    priority: "high",
    status: "in-progress",
    deadline: "2024-12-20",
    dueDateTime: "2024-12-20T13:00:00",
    siteId: "5",
    attachments: [
      {
        id: "att-3",
        filename: "training-materials.zip",
        url: "/documents/training-materials.zip",
        uploadedAt: "2024-12-01T14:30:00",
        size: 1024 * 1024 * 5,
        type: "application/zip"
      }
    ],
    hourlyUpdates: [
      {
        id: "update-4",
        timestamp: "2024-12-06T10:00:00",
        content: "Training materials prepared and distributed",
        submittedBy: "supervisor-3"
      }
    ]
  }
];

// Export for backward compatibility
export const adminTasks = initialTasks;

// Assignees data (managers and supervisors)
export const assignees = [
  { id: "manager-1", name: "John Smith" },
  { id: "manager-2", name: "Sarah Johnson" },
  { id: "manager-3", name: "Robert Williams" },
  { id: "supervisor-1", name: "Mike Davis" },
  { id: "supervisor-2", name: "Lisa Brown" },
  { id: "supervisor-3", name: "David Wilson" },
  { id: "supervisor-4", name: "Emma Taylor" },
  { id: "supervisor-5", name: "James Anderson" },
  { id: "supervisor-6", name: "Alex Turner" },
  { id: "supervisor-7", name: "David Kim" }
];

// Export for backward compatibility
export const adminAssignees = assignees;

// Service types
export const serviceTypes: Service[] = [
  {
    id: "1",
    name: "Security Services",
    status: "operational",
    lastChecked: "2024-01-12",
    assignedTeam: "Security Team"
  },
  {
    id: "2",
    name: "Housekeeping",
    status: "maintenance",
    lastChecked: "2024-01-11",
    assignedTeam: "Cleaning Team"
  },
  {
    id: "3",
    name: "Parking Management",
    status: "operational",
    lastChecked: "2024-01-12",
    assignedTeam: "Parking Team"
  },
  {
    id: "4",
    name: "Waste Management",
    status: "down",
    lastChecked: "2024-01-10",
    assignedTeam: "Maintenance Team"
  },
  {
    id: "5",
    name: "STP Tank Cleaning",
    status: "operational",
    lastChecked: "2024-01-09",
    assignedTeam: "STP Team"
  },
  {
    id: "6",
    name: "Maintenance",
    status: "maintenance",
    lastChecked: "2024-01-12",
    assignedTeam: "Maintenance Team"
  }
];

// Roster types
export const rosterTypes = ["daily", "weekly", "fortnightly", "monthly"];

// Staff members - for roster section
export const staffMembers = [
  { id: "staff-1", name: "Rajesh Kumar", role: "Security Guard", employeeId: "EMP001", siteId: "1", department: "Security" },
  { id: "staff-2", name: "Priya Sharma", role: "Housekeeping", employeeId: "EMP002", siteId: "1", department: "Housekeeping" },
  { id: "staff-3", name: "Amit Patel", role: "Supervisor", employeeId: "EMP003", siteId: "1", department: "Operations" },
  { id: "staff-4", name: "Sunita Reddy", role: "Security Guard", employeeId: "EMP004", siteId: "2", department: "Security" },
  { id: "staff-5", name: "Mohan Das", role: "Housekeeping", employeeId: "EMP005", siteId: "2", department: "Housekeeping" },
  { id: "staff-6", name: "Anjali Singh", role: "Parking Attendant", employeeId: "EMP006", siteId: "3", department: "Parking" },
  { id: "staff-7", name: "Vikram Mehta", role: "STP Operator", employeeId: "EMP007", siteId: "3", department: "Maintenance" },
  { id: "staff-8", name: "Neha Gupta", role: "Security Guard", employeeId: "EMP008", siteId: "3", department: "Security" }
];

// Export for backward compatibility
export const adminStaffMembers = staffMembers;

// Supervisors - for roster section
export const supervisors = [
  { id: "1", name: "Mike Johnson", siteId: "1" },
  { id: "2", name: "Sarah Wilson", siteId: "2" },
  { id: "3", name: "Emily Davis", siteId: "3" },
  { id: "4", name: "Alex Turner", siteId: "4" },
  { id: "5", name: "David Kim", siteId: "5" }
];

// Export for backward compatibility
export const adminSupervisors = supervisors;

// Roster entries - initial roster data
export const initialRoster: RosterEntry[] = [
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
    supervisor: "Mike Johnson",
    department: "Security"
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
    supervisor: "Mike Johnson",
    department: "Housekeeping"
  },
  { 
    id: "3", 
    date: "2024-01-15", 
    employeeName: "Amit Patel",
    employeeId: "EMP003",
    designation: "Supervisor",
    shift: "Morning",
    shiftTiming: "08:00-16:00",
    assignedTask: "Site Supervision", 
    attendance: "present", 
    hours: 8, 
    remark: "Supervised security team",
    type: "daily",
    siteClient: "Residential Tower B - XYZ Builders",
    supervisor: "Sarah Wilson",
    department: "Operations"
  },
  { 
    id: "4", 
    date: "2024-01-15", 
    employeeName: "Sunita Reddy",
    employeeId: "EMP004",
    designation: "Security Guard",
    shift: "Night",
    shiftTiming: "21:00-05:00",
    assignedTask: "Gate Security", 
    attendance: "present", 
    hours: 8, 
    remark: "Gate duty completed",
    type: "daily",
    siteClient: "IT Park Center - Tech Solutions Ltd",
    supervisor: "Emily Davis",
    department: "Security"
  }
];

// Export for backward compatibility
export const adminRoster = initialRoster;

// Alerts data
export const initialAlerts: Alert[] = [
  { 
    id: "1", 
    title: "Security Camera Offline", 
    description: "Camera at main entrance is not functioning",
    severity: "high", 
    status: "open", 
    date: "2024-01-12 14:30",
    reportedBy: "Mike Johnson",
    site: "Commercial Complex A",
    assignedTo: "Mike Johnson"
  },
  { 
    id: "2", 
    title: "Parking System Maintenance", 
    description: "Parking barrier needs replacement",
    severity: "medium", 
    status: "in-progress", 
    date: "2024-01-11 10:15",
    reportedBy: "Sarah Wilson",
    site: "Residential Tower B",
    assignedTo: "Sarah Wilson"
  },
  { 
    id: "3", 
    title: "Waste Collection Delay", 
    description: "Waste collection delayed due to vehicle breakdown",
    severity: "low", 
    status: "resolved", 
    date: "2024-01-10 08:45",
    reportedBy: "Emily Davis",
    site: "IT Park Center"
  },
  { 
    id: "4", 
    title: "STP Pump Failure", 
    description: "Sewage treatment plant pump malfunctioning",
    severity: "critical", 
    status: "open", 
    date: "2024-01-13 09:20",
    reportedBy: "Robert Brown",
    site: "IT Park Center",
    assignedTo: "Emily Davis"
  },
  { 
    id: "5", 
    title: "Fire Safety Inspection Due", 
    description: "Monthly fire safety inspection is due next week",
    severity: "medium", 
    status: "open", 
    date: "2024-01-14 11:00",
    reportedBy: "John Doe",
    site: "Commercial Complex A"
  },
  { 
    id: "6", 
    title: "Power Backup System Test Failed", 
    description: "Generator test failed during routine check",
    severity: "high", 
    status: "in-progress", 
    date: "2024-01-15 09:30",
    reportedBy: "Alex Turner",
    site: "Hospital Complex",
    assignedTo: "Alex Turner"
  }
];

// Export for backward compatibility
export const adminAlerts = initialAlerts;

// Alert categories for filtering
export const alertCategories = [
  "Security", "Maintenance", "Safety", "Equipment", "Personnel", "Other"
];

// Alert severity options
export const alertSeverityOptions = [
  { value: "low", label: "Low", color: "bg-blue-100 text-blue-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-800" }
];

// Alert status options
export const alertStatusOptions = [
  { value: "open", label: "Open", color: "bg-red-100 text-red-800" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-800" },
  { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-800" }
];

// Sites for alerts filter
export const sitesForAlerts = initialSites.map(site => ({
  id: site.id,
  name: `${site.name} - ${site.clientName}`
}));

// Dashboard stats
export const adminDashboardStats = {
  totalSites: 5,
  activeSites: 5,
  totalStaff: 59,
  pendingTasks: 3,
  openAlerts: 2,
  upcomingDeadlines: 4,
  totalRevenue: 12250000,
  averageStaffPerSite: 12
};

// Admin permissions
export const adminPermissions = {
  canViewAllSites: true,
  canManageTasks: true,
  canAssignStaff: true,
  canViewReports: true,
  canManageRoster: true,
  canHandleAlerts: true,
  canViewAnalytics: true,
  canApproveLeave: true,
  canManageInventory: false,
  canCreateUsers: false,
  canModifyContracts: false,
  canAccessBilling: false
};

// Common exports that might be needed
export const taskStatusOptions = ["pending", "in-progress", "completed"];
export const taskPriorityOptions = ["high", "medium", "low"];
export const shiftOptions = ["Morning", "Evening", "Night", "General"];
export const attendanceOptions = ["present", "absent", "half-day"];
export const serviceStatusOptions = ["operational", "maintenance", "down"];