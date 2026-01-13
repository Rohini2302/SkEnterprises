import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, Search, FileText, Download, Eye, Trash2, Edit, FileUp, Loader2, RefreshCw, 
  Users, Shield, Settings, AlertTriangle, UserCheck, UserX, BarChart3, Filter,
  MoreVertical, CheckCircle, XCircle, Mail, Calendar, Clock, FolderTree, 
  TrendingUp, Users as UsersIcon, Database, Cloud, Server, Check, X,
  Upload, Copy, Archive, Lock, Unlock
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
interface Document {
  id: string;
  name: string;
  type: "PDF" | "XLSX" | "DOCX" | "JPG" | "PNG" | "OTHER";
  size: string;
  uploadedBy: string;
  userId: string;
  date: string;
  category: "uploaded" | "generated" | "template" | "system";
  status: "active" | "archived" | "pending_review";
  description?: string;
  url?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "moderator" | "user";
  status: "active" | "suspended" | "pending";
  lastLogin: string;
  documentCount: number;
  joinDate: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  lastModified: string;
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  fileType: string;
}

interface AuditLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  status: "success" | "failed";
}

interface SystemSettings {
  autoBackup: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
  documentRetention: number;
  maxFileSize: number;
  requireApproval: boolean;
  enableAuditLog: boolean;
  storageProvider: "cloudinary" | "aws" | "azure" | "local";
  emailNotifications: boolean;
  maxUsers: number;
  maintenanceMode: boolean;
}

// Mock Data
const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Employee Handbook 2024",
    type: "PDF",
    size: "4.2 MB",
    uploadedBy: "John Admin",
    userId: "admin1",
    date: "2024-01-15",
    category: "system",
    status: "active",
    description: "Official employee handbook",
    url: "https://example.com/doc1.pdf"
  },
  {
    id: "2",
    name: "Monthly Financial Report",
    type: "XLSX",
    size: "3.8 MB",
    uploadedBy: "Sarah Manager",
    userId: "user2",
    date: "2024-01-14",
    category: "generated",
    status: "active",
    description: "January financial report",
    url: "https://example.com/doc2.xlsx"
  },
  {
    id: "3",
    name: "Invoice Template",
    type: "DOCX",
    size: "1.2 MB",
    uploadedBy: "Finance Team",
    userId: "user3",
    date: "2024-01-13",
    category: "template",
    status: "active",
    description: "Standard invoice template",
    url: "https://example.com/doc3.docx"
  },
  {
    id: "4",
    name: "Sensitive Data",
    type: "PDF",
    size: "2.5 MB",
    uploadedBy: "New User",
    userId: "user4",
    date: "2024-01-12",
    category: "uploaded",
    status: "pending_review",
    description: "Requires admin review",
    url: "https://example.com/doc4.pdf"
  },
  {
    id: "5",
    name: "Old Report 2023",
    type: "PDF",
    size: "5.1 MB",
    uploadedBy: "John Admin",
    userId: "admin1",
    date: "2023-12-20",
    category: "uploaded",
    status: "archived",
    description: "Archived annual report",
    url: "https://example.com/doc5.pdf"
  }
];

const mockUsers: AdminUser[] = [
  {
    id: "admin1",
    name: "John Admin",
    email: "john@company.com",
    role: "super_admin",
    status: "active",
    lastLogin: "2024-01-15 10:30",
    documentCount: 42,
    joinDate: "2023-01-01"
  },
  {
    id: "admin2",
    name: "Sarah Manager",
    email: "sarah@company.com",
    role: "admin",
    status: "active",
    lastLogin: "2024-01-15 09:15",
    documentCount: 28,
    joinDate: "2023-03-15"
  },
  {
    id: "mod1",
    name: "Mike Moderator",
    email: "mike@company.com",
    role: "moderator",
    status: "active",
    lastLogin: "2024-01-14 16:45",
    documentCount: 15,
    joinDate: "2023-06-20"
  },
  {
    id: "user1",
    name: "Alice Johnson",
    email: "alice@company.com",
    role: "user",
    status: "active",
    lastLogin: "2024-01-15 08:20",
    documentCount: 8,
    joinDate: "2023-08-10"
  },
  {
    id: "user2",
    name: "Bob Wilson",
    email: "bob@company.com",
    role: "user",
    status: "suspended",
    lastLogin: "2024-01-10 14:30",
    documentCount: 3,
    joinDate: "2023-09-05"
  },
  {
    id: "user3",
    name: "Carol Davis",
    email: "carol@company.com",
    role: "user",
    status: "pending",
    lastLogin: "2024-01-13 11:15",
    documentCount: 0,
    joinDate: "2024-01-13"
  }
];

const mockTemplates: Template[] = [
  {
    id: "1",
    name: "Employee Contract",
    type: "Legal Document",
    description: "Standard employee contract template",
    lastModified: "2024-01-10",
    createdBy: "John Admin",
    isPublic: true,
    usageCount: 24,
    fileType: "DOCX"
  },
  {
    id: "2",
    name: "Financial Report",
    type: "Report Template",
    description: "Monthly financial report template",
    lastModified: "2024-01-09",
    createdBy: "Sarah Manager",
    isPublic: true,
    usageCount: 18,
    fileType: "XLSX"
  },
  {
    id: "3",
    name: "Company Letterhead",
    type: "Brand Template",
    description: "Official company letterhead",
    lastModified: "2024-01-08",
    createdBy: "John Admin",
    isPublic: false,
    usageCount: 12,
    fileType: "DOCX"
  },
  {
    id: "4",
    name: "Invoice Template",
    type: "Finance Template",
    description: "Standard invoice with company branding",
    lastModified: "2024-01-07",
    createdBy: "Finance Team",
    isPublic: true,
    usageCount: 32,
    fileType: "DOCX"
  }
];

const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    user: "john@company.com",
    action: "Document Upload",
    resource: "Employee_Handbook.pdf",
    timestamp: "2024-01-15 10:30:00",
    ipAddress: "192.168.1.100",
    status: "success"
  },
  {
    id: "2",
    user: "bob@company.com",
    action: "Document Deleted",
    resource: "Old_Report.xlsx",
    timestamp: "2024-01-15 09:15:00",
    ipAddress: "192.168.1.101",
    status: "success"
  },
  {
    id: "3",
    user: "guest@company.com",
    action: "Failed Login Attempt",
    resource: "Authentication",
    timestamp: "2024-01-15 08:45:00",
    ipAddress: "192.168.1.102",
    status: "failed"
  },
  {
    id: "4",
    user: "sarah@company.com",
    action: "User Role Updated",
    resource: "User: alice@company.com",
    timestamp: "2024-01-14 16:30:00",
    ipAddress: "192.168.1.103",
    status: "success"
  },
  {
    id: "5",
    user: "mike@company.com",
    action: "Template Created",
    resource: "New_Report_Template.docx",
    timestamp: "2024-01-14 14:20:00",
    ipAddress: "192.168.1.104",
    status: "success"
  }
];

const defaultSystemSettings: SystemSettings = {
  autoBackup: true,
  backupFrequency: "daily",
  documentRetention: 365,
  maxFileSize: 100,
  requireApproval: false,
  enableAuditLog: true,
  storageProvider: "cloudinary",
  emailNotifications: true,
  maxUsers: 100,
  maintenanceMode: false
};

// Main Component
const AdminDocuments = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        title="Admin Document Management" 
        description="Manage documents, users, and system settings"
        actions={
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Shield className="h-3 w-3 mr-1" />
            Admin Mode
          </Badge>
        }
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6"
      >
        <AdminStatsCards />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileUp className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboardSection />
          </TabsContent>

          <TabsContent value="documents">
            <AdminDocumentsSection />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementSection />
          </TabsContent>

          <TabsContent value="templates">
            <AdminTemplatesSection />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettingsSection />
          </TabsContent>

          <TabsContent value="logs">
            <AuditLogsSection />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

// Admin Stats Cards Component
const AdminStatsCards = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDocuments: 0,
    storageUsed: "0 GB",
    recentActivity: 0,
    pendingReviews: 0
  });

  useEffect(() => {
    // Calculate stats from mock data
    setStats({
      totalUsers: mockUsers.length,
      activeUsers: mockUsers.filter(u => u.status === "active").length,
      totalDocuments: mockDocuments.length,
      storageUsed: "15.8 GB",
      recentActivity: mockAuditLogs.filter(log => 
        new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
      pendingReviews: mockDocuments.filter(d => d.status === "pending_review").length
    });
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      <StatCard 
        title="Total Users" 
        value={stats.totalUsers}
        icon={<UsersIcon className="h-4 w-4 text-blue-500" />}
        description="Registered users"
        trend="+12%"
      />
      <StatCard 
        title="Active Users" 
        value={stats.activeUsers}
        icon={<UserCheck className="h-4 w-4 text-green-500" />}
        description="Currently active"
        className="text-green-600"
      />
      <StatCard 
        title="Total Documents" 
        value={stats.totalDocuments}
        icon={<FileText className="h-4 w-4 text-purple-500" />}
        description="All documents"
      />
      <StatCard 
        title="Storage Used" 
        value={stats.storageUsed}
        icon={<Database className="h-4 w-4 text-amber-500" />}
        description="Cloud storage"
        className="text-blue-600"
      />
      <StatCard 
        title="Recent Activity" 
        value={stats.recentActivity}
        icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
        description="Last 24 hours"
      />
      <StatCard 
        title="Pending Reviews" 
        value={stats.pendingReviews}
        icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
        description="Awaiting approval"
        className="text-amber-600"
      />
    </div>
  );
};

// Admin Documents Section
const AdminDocumentsSection = () => {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [filter, setFilter] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleBulkAction = (action: string) => {
    if (selectedDocuments.length === 0) {
      toast.error("No documents selected");
      return;
    }

    switch (action) {
      case "approve":
        setDocuments(docs => 
          docs.map(doc => 
            selectedDocuments.includes(doc.id) 
              ? { ...doc, status: "active" as const }
              : doc
          )
        );
        toast.success(`${selectedDocuments.length} document(s) approved`);
        break;
      
      case "archive":
        setDocuments(docs => 
          docs.map(doc => 
            selectedDocuments.includes(doc.id) 
              ? { ...doc, status: "archived" as const }
              : doc
          )
        );
        toast.success(`${selectedDocuments.length} document(s) archived`);
        break;
      
      case "delete":
        setDocuments(docs => docs.filter(doc => !selectedDocuments.includes(doc.id)));
        toast.success(`${selectedDocuments.length} document(s) deleted`);
        break;
      
      case "flag":
        setDocuments(docs => 
          docs.map(doc => 
            selectedDocuments.includes(doc.id) 
              ? { ...doc, status: "pending_review" as const }
              : doc
          )
        );
        toast.success(`${selectedDocuments.length} document(s) flagged for review`);
        break;
    }
    
    setSelectedDocuments([]);
  };

  const handleUploadDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    
    const formData = new FormData(e.currentTarget);
    const fileName = formData.get("document-name") as string || "New Document";
    const fileType = formData.get("document-type") as string || "PDF";
    const description = formData.get("description") as string;
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newDocument: Document = {
      id: Date.now().toString(),
      name: fileName,
      type: fileType as Document["type"],
      size: "2.4 MB",
      uploadedBy: "Admin User",
      userId: "admin1",
      date: new Date().toISOString().split('T')[0],
      category: "uploaded",
      status: "active",
      description,
      url: "https://example.com/new-document.pdf"
    };
    
    setDocuments(prev => [newDocument, ...prev]);
    setIsUploading(false);
    setUploadDialogOpen(false);
    toast.success("Document uploaded successfully");
    (e.target as HTMLFormElement).reset();
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(docs => docs.filter(doc => doc.id !== id));
    toast.success("Document deleted");
  };

  const handleUpdateDocumentStatus = (id: string, status: Document["status"]) => {
    setDocuments(docs => 
      docs.map(doc => doc.id === id ? { ...doc, status } : doc)
    );
    toast.success(`Document ${status}`);
  };

  const filteredDocuments = documents.filter(doc => {
    if (filter === "all") return true;
    if (filter === "pending") return doc.status === "pending_review";
    if (filter === "archived") return doc.status === "archived";
    return doc.category === filter || doc.status === filter;
  }).filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { label: "Active", variant: "default" as const, color: "bg-green-100 text-green-800" },
      archived: { label: "Archived", variant: "secondary" as const, color: "bg-gray-100 text-gray-800" },
      pending_review: { label: "Pending Review", variant: "outline" as const, color: "bg-amber-100 text-amber-800" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.active;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      uploaded: "bg-blue-100 text-blue-800",
      generated: "bg-purple-100 text-purple-800",
      template: "bg-indigo-100 text-indigo-800",
      system: "bg-gray-100 text-gray-800"
    };
    
    return (
      <Badge variant="outline" className={colors[category as keyof typeof colors]}>
        {category}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Document Management</CardTitle>
            <CardDescription>Manage all documents in the system</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value="" onValueChange={handleBulkAction}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Bulk Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">Approve Selected</SelectItem>
                <SelectItem value="archive">Archive Selected</SelectItem>
                <SelectItem value="flag">Flag for Review</SelectItem>
                <SelectItem value="delete" className="text-red-600">Delete Selected</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Upload New Document</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUploadDocument} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="document-name">Document Name</Label>
                    <Input 
                      id="document-name" 
                      name="document-name" 
                      placeholder="Enter document name" 
                      required 
                      disabled={isUploading}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="document-type">Document Type</Label>
                      <Select name="document-type" required disabled={isUploading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PDF">PDF</SelectItem>
                          <SelectItem value="DOCX">Word Document</SelectItem>
                          <SelectItem value="XLSX">Excel Spreadsheet</SelectItem>
                          <SelectItem value="JPG">JPG Image</SelectItem>
                          <SelectItem value="PNG">PNG Image</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category" disabled={isUploading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uploaded">Uploaded</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="template">Template</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">Select File</Label>
                    <Input 
                      id="file" 
                      name="file" 
                      type="file" 
                      required 
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      disabled={isUploading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      placeholder="Enter document description" 
                      disabled={isUploading}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload Document'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="template">Templates</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedDocuments.length > 0 && (
            <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
              <span className="text-sm">
                {selectedDocuments.length} document(s) selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDocuments([])}
              >
                Clear selection
              </Button>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocuments(filteredDocuments.map(d => d.id));
                        } else {
                          setSelectedDocuments([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocuments([...selectedDocuments, doc.id]);
                          } else {
                            setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          {doc.description && (
                            <div className="text-sm text-muted-foreground">{doc.description}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{doc.uploadedBy}</div>
                      <div className="text-sm text-muted-foreground">{doc.userId}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(doc.category)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(doc.status)}
                    </TableCell>
                    <TableCell>{doc.date}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(doc.url, '_blank')}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateDocumentStatus(doc.id, "active")}>
                              <Check className="h-4 w-4 mr-2 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateDocumentStatus(doc.id, "pending_review")}>
                              <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                              Flag for Review
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateDocumentStatus(doc.id, "archived")}>
                              <Archive className="h-4 w-4 mr-2 text-gray-600" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// User Management Section
const UserManagementSection = () => {
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newUser: AdminUser = {
      id: `user${Date.now()}`,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as AdminUser["role"],
      status: "pending",
      lastLogin: "Never",
      documentCount: 0,
      joinDate: new Date().toISOString().split('T')[0]
    };
    
    setUsers(prev => [newUser, ...prev]);
    setNewUserDialogOpen(false);
    toast.success("User created successfully");
    (e.target as HTMLFormElement).reset();
  };

  const handleUpdateUserRole = (userId: string, newRole: AdminUser["role"]) => {
    setUsers(users => 
      users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
    toast.success("User role updated");
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users => 
      users.map(user => {
        if (user.id === userId) {
          const newStatus = user.status === "active" ? "suspended" : "active";
          return { ...user, status: newStatus };
        }
        return user;
      })
    );
    toast.success("User status updated");
  };

  const filteredUsers = users.filter(user => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (statusFilter !== "all" && user.status !== statusFilter) return false;
    if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !user.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getRoleBadge = (role: string) => {
    const colors = {
      super_admin: "bg-red-100 text-red-800",
      admin: "bg-purple-100 text-purple-800",
      moderator: "bg-blue-100 text-blue-800",
      user: "bg-gray-100 text-gray-800"
    };
    
    return (
      <Badge className={colors[role as keyof typeof colors]}>
        {role.replace('_', ' ')}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      suspended: "bg-red-100 text-red-800",
      pending: "bg-amber-100 text-amber-800"
    };
    
    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors]}>
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </div>
        <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Regular User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Create User</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">Joined: {user.joinDate}</div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select 
                        value={user.role} 
                        onValueChange={(value: AdminUser["role"]) => handleUpdateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{user.documentCount}</div>
                    </TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleUserStatus(user.id)}
                          title={user.status === "active" ? "Suspend User" : "Activate User"}
                        >
                          {user.status === "active" ? 
                            <Lock className="h-4 w-4" /> : 
                            <Unlock className="h-4 w-4" />
                          }
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Activity
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Admin Dashboard Section
const AdminDashboardSection = () => {
  const [storageData] = useState({
    documents: 65,
    templates: 20,
    system: 15
  });

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Storage Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Documents</span>
                  <span className="text-sm font-medium">{storageData.documents}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${storageData.documents}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Templates</span>
                  <span className="text-sm font-medium">{storageData.templates}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${storageData.templates}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">System Files</span>
                  <span className="text-sm font-medium">{storageData.system}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${storageData.system}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">API Service</span>
                </div>
                <Badge variant="outline">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Database</span>
                </div>
                <Badge variant="outline">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Cloud Storage</span>
                </div>
                <Badge variant="outline">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Email Service</span>
                </div>
                <Badge variant="outline">Operational</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Upload System Document
              </Button>
              <Button variant="outline" className="justify-start">
                <Users className="h-4 w-4 mr-2" />
                Add New User
              </Button>
              <Button variant="outline" className="justify-start">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
              <Button variant="outline" className="justify-start">
                <Database className="h-4 w-4 mr-2" />
                Backup Database
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAuditLogs.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {activity.status === 'success' ? 
                      <CheckCircle className="h-4 w-4 text-green-600" /> : 
                      <XCircle className="h-4 w-4 text-red-600" />
                    }
                  </div>
                  <div>
                    <div className="font-medium">{activity.user}</div>
                    <div className="text-sm text-muted-foreground">{activity.action} • {activity.resource}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{activity.timestamp.split(' ')[1]}</div>
                  <div className="text-xs text-muted-foreground">{activity.ipAddress}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Templates Section
const AdminTemplatesSection = () => {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [newTemplateDialogOpen, setNewTemplateDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    
    const formData = new FormData(e.currentTarget);
    const templateName = formData.get("template-name") as string;
    const description = formData.get("description") as string;
    const isPublic = formData.get("isPublic") === "on";
    const fileType = formData.get("file-type") as string;
    
    setTimeout(() => {
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: templateName,
        type: "Document Template",
        description,
        lastModified: new Date().toISOString().split('T')[0],
        createdBy: "Admin User",
        isPublic,
        usageCount: 0,
        fileType
      };
      
      setTemplates(prev => [newTemplate, ...prev]);
      setIsUploading(false);
      setNewTemplateDialogOpen(false);
      toast.success("Template added successfully");
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  const handleTogglePublic = (templateId: string) => {
    setTemplates(templates => 
      templates.map(template => 
        template.id === templateId 
          ? { ...template, isPublic: !template.isPublic }
          : template
      )
    );
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates => templates.filter(t => t.id !== templateId));
    toast.success("Template deleted");
  };

  const handleDuplicateTemplate = (template: Template) => {
    const duplicatedTemplate: Template = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      usageCount: 0,
      lastModified: new Date().toISOString().split('T')[0]
    };
    
    setTemplates(prev => [duplicatedTemplate, ...prev]);
    toast.success("Template duplicated");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Templates Management</CardTitle>
            <CardDescription>Manage document templates and permissions</CardDescription>
          </div>
          <Dialog open={newTemplateDialogOpen} onOpenChange={setNewTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Template</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTemplate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input 
                    id="template-name" 
                    name="template-name" 
                    placeholder="Enter template name" 
                    required 
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file-type">File Type</Label>
                  <Select name="file-type" required disabled={isUploading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCX">Word Document (.docx)</SelectItem>
                      <SelectItem value="PDF">PDF Document (.pdf)</SelectItem>
                      <SelectItem value="XLSX">Excel Spreadsheet (.xlsx)</SelectItem>
                      <SelectItem value="PPTX">PowerPoint (.pptx)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Enter template description" 
                    required 
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-file">Upload Template File</Label>
                  <Input 
                    id="template-file" 
                    name="template-file"
                    type="file" 
                    required 
                    disabled={isUploading}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="isPublic" name="isPublic" defaultChecked />
                  <Label htmlFor="isPublic">Make template public</Label>
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Template...
                    </>
                  ) : (
                    'Add Template'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="relative hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{template.fileType}</Badge>
                        <Badge variant={template.isPublic ? "default" : "secondary"}>
                          {template.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Template</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>View Usage</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{template.usageCount} uses</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{template.lastModified}</span>
                      </div>
                    </div>
                    <Switch 
                      checked={template.isPublic} 
                      onCheckedChange={() => handleTogglePublic(template.id)}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created by: {template.createdBy}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline">
                      Use Template
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

// System Settings Section
const SystemSettingsSection = () => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings saved successfully");
    }, 1000);
  };

  const handleResetSettings = () => {
    setSettings(defaultSystemSettings);
    toast.success("Settings reset to defaults");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>Configure system preferences and behavior</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Document Settings</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                <Input 
                  id="maxFileSize" 
                  type="number" 
                  value={settings.maxFileSize}
                  onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentRetention">Document Retention (days)</Label>
                <Input 
                  id="documentRetention" 
                  type="number" 
                  value={settings.documentRetention}
                  onChange={(e) => setSettings({...settings, documentRetention: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Security & Permissions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Document Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    All uploaded documents require admin approval
                  </p>
                </div>
                <Switch 
                  checked={settings.requireApproval}
                  onCheckedChange={(checked) => setSettings({...settings, requireApproval: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log all system activities for security
                  </p>
                </div>
                <Switch 
                  checked={settings.enableAuditLog}
                  onCheckedChange={(checked) => setSettings({...settings, enableAuditLog: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable user access
                  </p>
                </div>
                <Switch 
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Backup Settings</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Backups</Label>
                  <p className="text-sm text-muted-foreground">Enable automatic system backups</p>
                </div>
                <Switch 
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <Select 
                  value={settings.backupFrequency}
                  onValueChange={(value: "daily" | "weekly" | "monthly") => 
                    setSettings({...settings, backupFrequency: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Storage Configuration</h3>
            <div className="space-y-2">
              <Label htmlFor="storageProvider">Storage Provider</Label>
              <Select 
                value={settings.storageProvider}
                onValueChange={(value: "cloudinary" | "aws" | "azure" | "local") => 
                  setSettings({...settings, storageProvider: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cloudinary">Cloudinary</SelectItem>
                  <SelectItem value="aws">Amazon S3</SelectItem>
                  <SelectItem value="azure">Azure Blob Storage</SelectItem>
                  <SelectItem value="local">Local Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Settings</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications for system events
                </p>
              </div>
              <Switch 
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleResetSettings}
              disabled={isSaving}
            >
              Reset to Defaults
            </Button>
            <Button 
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Audit Logs Section
const AuditLogsSection = () => {
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter(log => {
    if (filter !== "all" && log.status !== filter) return false;
    if (searchQuery && !log.user.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !log.action.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.resource.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    return status === "success" ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const clearLogs = () => {
    setLogs([]);
    toast.success("Audit logs cleared");
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Logs exported successfully");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>System activity and security logs</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Logs
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="success">Successful</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No audit logs found
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="mt-1">{getStatusIcon(log.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="font-medium truncate">{log.user}</div>
                      <div className="text-sm text-muted-foreground">{log.timestamp}</div>
                    </div>
                    <div className="text-sm mt-1">
                      <span className="font-medium">{log.action}</span> • {log.resource}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-muted-foreground">
                        IP: {log.ipAddress}
                      </div>
                      <Badge variant={log.status === "success" ? "outline" : "destructive"}>
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Reusable Stat Card
const StatCard = ({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  className = "" 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  description: string; 
  trend?: string;
  className?: string; 
}) => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${className}`}>{value}</div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <span className="text-xs text-green-600">{trend}</span>
        )}
      </div>
    </CardContent>
  </Card>
);

export default AdminDocuments;