import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, 
  Plus, 
  Upload, 
  FileText, 
  Image, 
  Video, 
  X, 
  Eye, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  MessageCircle, 
  Paperclip, 
  User, 
  Sparkles,
  Trash2,
  Car,
  Shield,
  Wrench,
  Download,
  Calendar,
  MapPin,
  Filter,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useWorkQuery } from "@/hooks/useWorkQuery";
import { format } from "date-fns";

// Types matching the API
interface WorkQueryProofFile {
  name: string;
  type: 'image' | 'video' | 'document' | 'other';
  url: string;
  public_id: string;
  size: string;
  format?: string;
  bytes?: number;
  uploadDate: string;
}

interface WorkQuery {
  _id: string;
  queryId: string;
  title: string;
  description: string;
  type: 'service' | 'task';
  serviceId?: string;
  serviceTitle?: string;
  serviceType?: string;
  serviceStaffId?: string;
  serviceStaffName?: string;
  employeeId?: string;
  employeeName?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  category: string;
  proofFiles: WorkQueryProofFile[];
  reportedBy: {
    userId: string;
    name: string;
    role: string;
  };
  assignedTo?: {
    userId: string;
    name: string;
    role: string;
  };
  supervisorId: string;
  supervisorName: string;
  superadminResponse?: string;
  responseDate?: string;
  comments: Array<{
    userId: string;
    name: string;
    comment: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Fix: Use the API Service type directly
interface Service {
  _id: string;
  serviceId: string;
  type: string;  // Changed from specific union to string
  title: string;
  description: string;
  location: string;
  assignedTo: string;
  assignedToName: string;
  status: string;
  schedule: string;
  supervisorId: string;
}

// Helper function to safely convert string to service type
const getServiceType = (type: string): 'cleaning' | 'waste-management' | 'parking-management' | 'security' | 'maintenance' => {
  switch(type.toLowerCase()) {
    case 'cleaning':
    case 'waste-management':
    case 'parking-management':
    case 'security':
    case 'maintenance':
      return type.toLowerCase() as any;
    default:
      return 'cleaning'; // default fallback
  }
};

// Reusable Components
const PriorityBadge = ({ priority }: { priority: string }) => {
  const styles = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    critical: "bg-red-100 text-red-800 border-red-200"
  };

  const icons = {
    low: <CheckCircle className="h-3 w-3" />,
    medium: <Clock className="h-3 w-3" />,
    high: <AlertCircle className="h-3 w-3" />,
    critical: <AlertCircle className="h-3 w-3" />
  };

  return (
    <Badge variant="outline" className={`${styles[priority as keyof typeof styles]} flex items-center gap-1`}>
      {icons[priority as keyof typeof icons]}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
    resolved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200"
  };

  const icons = {
    pending: <Clock className="h-3 w-3" />,
    "in-progress": <AlertCircle className="h-3 w-3" />,
    resolved: <CheckCircle className="h-3 w-3" />,
    rejected: <X className="h-3 w-3" />
  };

  return (
    <Badge variant="outline" className={`${styles[status as keyof typeof styles]} flex items-center gap-1`}>
      {icons[status as keyof typeof icons]}
      {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
    </Badge>
  );
};

const ServiceTypeBadge = ({ type }: { type: string }) => {
  const styles = {
    cleaning: "bg-blue-100 text-blue-800 border-blue-200",
    "waste-management": "bg-green-100 text-green-800 border-green-200",
    "parking-management": "bg-purple-100 text-purple-800 border-purple-200",
    "security": "bg-orange-100 text-orange-800 border-orange-200",
    "maintenance": "bg-red-100 text-red-800 border-red-200"
  };

  const icons = {
    cleaning: Sparkles,
    "waste-management": Trash2,
    "parking-management": Car,
    "security": Shield,
    "maintenance": Wrench
  };

  const safeType = getServiceType(type);
  const Icon = icons[safeType];

  return (
    <Badge variant="outline" className={`${styles[safeType]} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {safeType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
    </Badge>
  );
};

const FileIcon = ({ type }: { type: string }) => {
  const icons = {
    image: <Image className="h-4 w-4" />,
    video: <Video className="h-4 w-4" />,
    document: <FileText className="h-4 w-4" />,
    other: <Paperclip className="h-4 w-4" />
  };

  return icons[type as keyof typeof icons] || <Paperclip className="h-4 w-4" />;
};

const FilePreview = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const getFileType = (fileType: string): "image" | "video" | "document" | "other" => {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return 'document';
    return 'other';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fileType = getFileType(file.type);

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg border">
          <FileIcon type={fileType} />
        </div>
        <div>
          <div className="font-medium text-sm truncate max-w-xs">{file.name}</div>
          <div className="text-xs text-muted-foreground">
            {formatFileSize(file.size)} • {fileType.charAt(0).toUpperCase() + fileType.slice(1)}
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

// Main Component
const WorkQueryPage = () => {
  const supervisorId = "SUP001"; // Replace with actual supervisor ID from auth
  const supervisorName = "Supervisor User"; // Replace with actual supervisor name
  
  const {
    workQueries,
    services,
    statistics,
    categories,
    serviceTypes,
    priorities,
    statuses,
    loading,
    createWorkQuery,
    fetchWorkQueries,
    fetchServices,
    fetchStatistics,
    formatFileSize,
    getFileIcon,
    validateFile,
    downloadFile,
    previewFile,
    pagination,
    changePage,
    changeLimit
  } = useWorkQuery({
    supervisorId,
    autoFetch: true,
    initialFilters: {
      page: 1,
      limit: 10
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New query form state
  const [newQuery, setNewQuery] = useState({
    title: "",
    description: "",
    serviceId: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    category: "service-quality",
    supervisorId,
    supervisorName
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Filter work queries
  const filteredQueries = workQueries.filter(query => {
    const matchesSearch = 
      query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.queryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || query.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || query.priority === priorityFilter;
    const matchesServiceType = serviceTypeFilter === "all" || query.serviceType === serviceTypeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesServiceType;
  });

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const invalidFiles: string[] = [];
    
    // Validate each file
    newFiles.forEach(file => {
      if (!validateFile(file)) {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files: ${invalidFiles.join(', ')}. Allowed: Images, Videos, PDFs, Docs (Max 25MB)`);
      return;
    }

    // Check total files count (max 10 files)
    if (uploadedFiles.length + newFiles.length > 10) {
      toast.error("Maximum 10 files allowed per query");
      return;
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} file(s) uploaded successfully`);
  };

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle service selection - FIXED: No type error now
  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.serviceId === serviceId);
    setSelectedService(service || null);
    setNewQuery(prev => ({ ...prev, serviceId }));
  };

  // Handle form submission
  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newQuery.title || !newQuery.description || !newQuery.serviceId) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!selectedService) {
      toast.error("Please select a service");
      return;
    }

    try {
      const result = await createWorkQuery({
        ...newQuery,
        serviceTitle: selectedService.title,
        serviceTeam: selectedService.type // This is now a string, which matches the API
      }, uploadedFiles);
      
      if (result.success) {
        // Reset form
        setNewQuery({
          title: "",
          description: "",
          serviceId: "",
          priority: "medium",
          category: "service-quality",
          supervisorId,
          supervisorName
        });
        setUploadedFiles([]);
        setSelectedService(null);
        setIsDialogOpen(false);
        
        // Refresh data
        fetchWorkQueries();
        fetchStatistics();
        
        toast.success("Work query created successfully!");
      } else {
        toast.error(result.error || "Failed to create work query");
      }
    } catch (error) {
      console.error("Error creating work query:", error);
      toast.error("Failed to create work query. Please try again.");
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchWorkQueries();
    fetchServices();
    fetchStatistics();
    toast.success("Data refreshed successfully");
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Also fix the ServiceTypeBadge usage in the table
  const TableServiceTypeBadge = ({ type }: { type?: string }) => {
    if (!type) return null;
    return <ServiceTypeBadge type={type} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Work Query Management" 
        subtitle="Report and track issues with facility services"
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 space-y-6"
      >
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading.statistics ? "Loading..." : statistics?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">All queries</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {loading.statistics ? "..." : statistics?.statusCounts?.pending || 0}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading.statistics ? "..." : statistics?.statusCounts?.['in-progress'] || 0}
              </div>
              <p className="text-xs text-muted-foreground">Being investigated</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading.statistics ? "..." : statistics?.statusCounts?.resolved || 0}
              </div>
              <p className="text-xs text-muted-foreground">Completed queries</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Work Queries</CardTitle>
                <CardDescription>
                  Manage and track issues with facility services
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleRefresh} disabled={loading.queries}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading.queries ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={loading.creating}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Query
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Work Query</DialogTitle>
                      <DialogDescription>
                        Report an issue with a facility service
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmitQuery} className="space-y-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Query Details</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Query Title *</Label>
                            <Input
                              id="title"
                              value={newQuery.title}
                              onChange={(e) => setNewQuery(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Brief description of the issue"
                              required
                              disabled={loading.creating}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select 
                              value={newQuery.category} 
                              onValueChange={(value) => setNewQuery(prev => ({ ...prev, category: value }))}
                              disabled={loading.creating}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(category => (
                                  <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Detailed Description *</Label>
                          <Textarea
                            id="description"
                            value={newQuery.description}
                            onChange={(e) => setNewQuery(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Provide detailed information about the issue..."
                            rows={4}
                            required
                            disabled={loading.creating}
                          />
                        </div>
                      </div>

                      {/* Service Selection */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Related Service</h3>
                        
                        <div className="space-y-2">
                          <Label htmlFor="service">Select Service *</Label>
                          <Select 
                            value={newQuery.serviceId} 
                            onValueChange={handleServiceSelect}
                            disabled={loading.creating || loading.services}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a service">
                                {selectedService ? selectedService.title : "Select a service"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {services.map(service => (
                                <SelectItem key={service.serviceId} value={service.serviceId}>
                                  <div className="flex flex-col">
                                    <span>{service.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {service.serviceId} • {service.type}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Selected Service Details */}
                        {selectedService && (
                          <div className="p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="font-semibold">Service Details</Label>
                              <ServiceTypeBadge type={selectedService.type} />
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span><strong>Location:</strong> {selectedService.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                <span><strong>Assigned To:</strong> {selectedService.assignedToName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span><strong>Schedule:</strong> {formatDate(selectedService.schedule)}</span>
                              </div>
                              <div>
                                <strong>Description:</strong> {selectedService.description}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority Level *</Label>
                        <Select 
                          value={newQuery.priority} 
                          onValueChange={(value) => setNewQuery(prev => ({ ...prev, priority: value as any }))}
                          disabled={loading.creating}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            {priorities.map(priority => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* File Upload Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Supporting Evidence</h3>
                        
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Upload screenshots, photos, documents, or other proof (Max 10 files, 25MB each)
                          </p>
                          <Input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
                            disabled={loading.creating}
                          />
                          <Label htmlFor="file-upload">
                            <Button 
                              variant="outline" 
                              className="mt-4" 
                              type="button"
                              disabled={loading.creating}
                            >
                              Choose Files
                            </Button>
                          </Label>
                        </div>

                        {/* Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-3">
                            <Label>Uploaded Files ({uploadedFiles.length}/10)</Label>
                            <div className="space-y-2">
                              {uploadedFiles.map((file, index) => (
                                <FilePreview 
                                  key={index} 
                                  file={file} 
                                  onRemove={() => handleRemoveFile(index)} 
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <div className="flex gap-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                          className="flex-1"
                          disabled={loading.creating}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1"
                          disabled={loading.creating}
                        >
                          {loading.creating ? "Creating..." : "Submit Query"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search queries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {serviceTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Actions</Label>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setServiceTypeFilter("all");
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Queries Table */}
            {loading.queries ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading work queries...</p>
              </div>
            ) : filteredQueries.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">No queries found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                    ? "No work queries match your current filters." 
                    : "No work queries have been created yet."}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Query ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Files</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQueries.map((query) => (
                        <TableRow key={query._id}>
                          <TableCell className="font-mono text-sm">
                            {query.queryId}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="font-medium truncate">{query.title}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {query.description.substring(0, 50)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="font-medium text-sm">{query.serviceTitle || query.serviceId}</div>
                              {query.serviceType && (
                                <TableServiceTypeBadge type={query.serviceType} />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {categories.find(c => c.value === query.category)?.label || query.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <PriorityBadge priority={query.priority} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={query.status} />
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(query.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{query.proofFiles.length}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Query Details - {query.queryId}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6">
                                  {/* Query Information */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label className="font-semibold">Title</Label>
                                      <p className="mt-1">{query.title}</p>
                                    </div>
                                    <div>
                                      <Label className="font-semibold">Category</Label>
                                      <Badge className="mt-1">
                                        {categories.find(c => c.value === query.category)?.label || query.category}
                                      </Badge>
                                    </div>
                                    <div>
                                      <Label className="font-semibold">Priority</Label>
                                      <div className="mt-1">
                                        <PriorityBadge priority={query.priority} />
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="font-semibold">Status</Label>
                                      <div className="mt-1">
                                        <StatusBadge status={query.status} />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Description */}
                                  <div>
                                    <Label className="font-semibold">Description</Label>
                                    <p className="mt-1 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                                      {query.description}
                                    </p>
                                  </div>

                                  {/* Service Information */}
                                  <div>
                                    <Label className="font-semibold">Service Information</Label>
                                    <div className="mt-1 p-3 border rounded-lg">
                                      <div className="font-medium">{query.serviceTitle || query.serviceId}</div>
                                      {query.serviceType && (
                                        <div className="mt-2">
                                          <TableServiceTypeBadge type={query.serviceType} />
                                        </div>
                                      )}
                                      {query.serviceStaffName && (
                                        <div className="mt-2 text-sm">
                                          <strong>Service Staff:</strong> {query.serviceStaffName}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Proof Files */}
                                  {query.proofFiles.length > 0 && (
                                    <div>
                                      <Label className="font-semibold">Supporting Evidence</Label>
                                      <div className="grid gap-2 mt-2">
                                        {query.proofFiles.map((file, index) => (
                                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                              <div className="p-2 bg-gray-100 rounded-lg">
                                                <FileIcon type={file.type} />
                                              </div>
                                              <div>
                                                <div className="font-medium">{file.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                  {file.size} • {file.type} • {formatDate(file.uploadDate)}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex gap-2">
                                              <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => previewFile(file.url)}
                                              >
                                                <Eye className="h-3 w-3 mr-1" />
                                                View
                                              </Button>
                                              <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => downloadFile(file.url, file.name)}
                                              >
                                                <Download className="h-3 w-3 mr-1" />
                                                Download
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Superadmin Response */}
                                  {query.superadminResponse && (
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                      <Label className="font-semibold text-blue-900">Superadmin Response</Label>
                                      <p className="mt-1 text-sm text-blue-800 whitespace-pre-wrap">
                                        {query.superadminResponse}
                                      </p>
                                      {query.responseDate && (
                                        <div className="text-xs text-blue-600 mt-2">
                                          Responded on: {formatDate(query.responseDate)}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Created Info */}
                                  <div className="text-sm text-muted-foreground">
                                    Created by {query.reportedBy.name} on {formatDate(query.createdAt)}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} queries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => changePage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default WorkQueryPage;