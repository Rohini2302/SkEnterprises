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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Plus, Package, ShoppingCart, Eye, 
  IndianRupee, Building, Users, Download, Upload,
  UserCheck, AlertTriangle, Wrench, Droplets, Cpu, 
  BarChart3, Filter, Calendar, Printer, FileText,
  CheckCircle, XCircle, Clock, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Types
interface Product {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  department: string;
  quantity: number;
  price: number;
  costPrice: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
  supplier: string;
  sku: string;
  reorderLevel: number;
  description?: string;
  site: string;
  assignedManager: string;
  changeHistory: ChangeHistory[];
  brushCount?: number;
  squeegeeCount?: number;
  lastUpdated: string;
}

interface ChangeHistory {
  date: string;
  changeType: "maintenance" | "repair" | "replacement" | "inspection";
  description: string;
  cost: number;
  performedBy: string;
}

interface Site {
  id: string;
  name: string;
  location: string;
  city: string;
  status: "active" | "inactive";
  manager: string;
  totalEmployees: number;
  contact: string;
}

interface Requisition {
  id: string;
  productName: string;
  category: string;
  quantity: number;
  site: string;
  requestedBy: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "fulfilled";
  priority: "low" | "medium" | "high";
  estimatedCost: number;
}

// Department Categories
const departments = [
  { value: "housekeeping", label: "🧼 Housekeeping Management" },
  { value: "security", label: "🛡️ Security Management" },
  { value: "parking", label: "🚗 Parking Management" },
  { value: "waste", label: "♻️ Waste Management" },
  { value: "stp", label: "🏭 STP Tank Cleaning" },
  { value: "consumables", label: "🛒 Consumables" },
];

// Sample Data
const initialProducts: Product[] = [
  { 
    id: "1", 
    name: "Single disc machine", 
    category: "Machines",
    subCategory: "Machines",
    department: "housekeeping", 
    quantity: 5, 
    price: 45000, 
    costPrice: 38000, 
    status: "in-stock", 
    supplier: "Cleaning Equipment Co.", 
    sku: "HK-MACH-001", 
    reorderLevel: 2,
    description: "Professional single disc floor cleaning machine",
    site: "SITE-001",
    assignedManager: "Rajesh Kumar",
    brushCount: 12,
    squeegeeCount: 8,
    lastUpdated: "2024-03-15",
    changeHistory: [
      {
        date: "2024-01-15",
        changeType: "maintenance",
        description: "Routine maintenance and brush replacement",
        cost: 2500,
        performedBy: "Maintenance Team"
      }
    ]
  },
  { 
    id: "2", 
    name: "Auto scrubber dryer", 
    category: "Machines",
    subCategory: "Machines",
    department: "housekeeping", 
    quantity: 3, 
    price: 125000, 
    costPrice: 110000, 
    status: "in-stock", 
    supplier: "Cleaning Equipment Co.", 
    sku: "HK-MACH-002", 
    reorderLevel: 1,
    description: "Walk-behind auto scrubber dryer",
    site: "SITE-001",
    assignedManager: "Rajesh Kumar",
    brushCount: 6,
    squeegeeCount: 4,
    lastUpdated: "2024-03-10",
    changeHistory: []
  },
  { 
    id: "3", 
    name: "High pressure jet machine", 
    category: "Machines",
    subCategory: "Machines",
    department: "housekeeping", 
    quantity: 2, 
    price: 75000, 
    costPrice: 65000, 
    status: "low-stock", 
    supplier: "Cleaning Equipment Co.", 
    sku: "HK-MACH-003", 
    reorderLevel: 1,
    description: "Industrial high pressure cleaning machine",
    site: "SITE-001",
    assignedManager: "Rajesh Kumar",
    brushCount: 4,
    squeegeeCount: 3,
    lastUpdated: "2024-03-05",
    changeHistory: []
  },
  { 
    id: "4", 
    name: "CCTV Cameras (IP/HD)", 
    category: "Equipment",
    subCategory: "Equipment",
    department: "security", 
    quantity: 25, 
    price: 8500, 
    costPrice: 6500, 
    status: "in-stock", 
    supplier: "Security Systems Ltd.", 
    sku: "SEC-EQP-001", 
    reorderLevel: 5,
    site: "SITE-001",
    assignedManager: "Rajesh Kumar",
    lastUpdated: "2024-03-12",
    changeHistory: []
  },
  { 
    id: "5", 
    name: "Boom barrier", 
    category: "Equipment",
    subCategory: "Equipment",
    department: "parking", 
    quantity: 8, 
    price: 75000, 
    costPrice: 60000, 
    status: "low-stock", 
    supplier: "Parking Solutions Inc.", 
    sku: "PARK-EQP-001", 
    reorderLevel: 3,
    site: "SITE-001",
    assignedManager: "Rajesh Kumar",
    lastUpdated: "2024-03-08",
    changeHistory: []
  },
];

const initialSites: Site[] = [
  { id: "SITE-001", name: "Tech Park Bangalore", location: "Whitefield", city: "Bangalore", status: "active", manager: "Rajesh Kumar", totalEmployees: 45, contact: "+91 80 2654 7890" },
  { id: "SITE-002", name: "Corporate Tower Mumbai", location: "Bandra Kurla Complex", city: "Mumbai", status: "active", manager: "Sanjay Singh", totalEmployees: 32, contact: "+91 22 2654 7891" },
];

const initialRequisitions: Requisition[] = [
  { id: "REQ-001", productName: "Single disc machine", category: "Machines", quantity: 2, site: "SITE-001", requestedBy: "Amit Patel", date: "2024-03-15", status: "pending", priority: "medium", estimatedCost: 90000 },
  { id: "REQ-002", productName: "CCTV Cameras", category: "Equipment", quantity: 10, site: "SITE-001", requestedBy: "Neha Gupta", date: "2024-03-14", status: "approved", priority: "high", estimatedCost: 85000 },
  { id: "REQ-003", productName: "Color-coded bins", category: "Bins & Storage", quantity: 25, site: "SITE-001", requestedBy: "Rahul Sharma", date: "2024-03-13", status: "fulfilled", priority: "low", estimatedCost: 62500 },
  { id: "REQ-004", productName: "High pressure jet machine", category: "Machines", quantity: 1, site: "SITE-001", requestedBy: "Vikram Joshi", date: "2024-03-12", status: "rejected", priority: "medium", estimatedCost: 75000 },
];

const AdminERP = () => {
  // State Management
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [requisitions, setRequisitions] = useState<Requisition[]>(initialRequisitions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRequisitionStatus, setSelectedRequisitionStatus] = useState("all");
  const [viewHistoryDialogOpen, setViewHistoryDialogOpen] = useState<string | null>(null);
  const [requisitionDialogOpen, setRequisitionDialogOpen] = useState(false);

  // Current Admin's Site (Assuming admin is assigned to one site)
  const currentAdminSite = "SITE-001";
  const currentAdminName = "Rajesh Kumar";

  // Utility Functions
  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      "active": "default", "in-stock": "default",
      "pending": "secondary", "inactive": "outline", "draft": "outline",
      "low-stock": "secondary", "out-of-stock": "destructive",
      "approved": "default", "rejected": "destructive", "fulfilled": "outline"
    };
    return statusColors[status] || "outline";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculations for admin's site only
  const getSiteMachineStats = () => {
    const siteProducts = products.filter(p => p.site === currentAdminSite);
    const machines = siteProducts.filter(p => p.department === "housekeeping" && p.category === "Machines");
    
    return {
      totalMachines: machines.reduce((total, machine) => total + machine.quantity, 0),
      totalCost: machines.reduce((total, machine) => total + (machine.costPrice * machine.quantity), 0),
      totalBrushes: machines.reduce((total, machine) => total + (machine.brushCount || 0), 0),
      totalSqueegees: machines.reduce((total, machine) => total + (machine.squeegeeCount || 0), 0),
      lowStockItems: siteProducts.filter(p => p.status === "low-stock").length,
      outOfStockItems: siteProducts.filter(p => p.status === "out-of-stock").length,
      totalChanges: machines.reduce((total, machine) => total + machine.changeHistory.length, 0)
    };
  };

  // Filter products for admin's site only
  const filteredProducts = products
    .filter(product => product.site === currentAdminSite)
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = selectedDepartment === "all" || product.department === selectedDepartment;
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || product.status === selectedStatus;
      return matchesSearch && matchesDepartment && matchesCategory && matchesStatus;
    });

  // Filter requisitions for admin's site only
  const filteredRequisitions = requisitions
    .filter(req => req.site === currentAdminSite)
    .filter(req => {
      const matchesStatus = selectedRequisitionStatus === "all" || req.status === selectedRequisitionStatus;
      return matchesStatus;
    });

  const siteStats = getSiteMachineStats();

  // Handle requisition submission
  const handleSubmitRequisition = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newRequisition: Requisition = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      productName: formData.get("productName") as string,
      category: formData.get("category") as string,
      quantity: parseInt(formData.get("quantity") as string),
      site: currentAdminSite,
      requestedBy: currentAdminName,
      date: new Date().toISOString().split('T')[0],
      status: "pending",
      priority: formData.get("priority") as "low" | "medium" | "high",
      estimatedCost: parseInt(formData.get("estimatedCost") as string),
    };
    
    setRequisitions(prev => [newRequisition, ...prev]);
    toast.success("Requisition submitted successfully!");
    setRequisitionDialogOpen(false);
  };

  // Handle requisition approval/rejection
  const handleRequisitionAction = (requisitionId: string, action: "approve" | "reject") => {
    setRequisitions(prev => prev.map(req => 
      req.id === requisitionId 
        ? { ...req, status: action === "approve" ? "approved" : "rejected" }
        : req
    ));
    
    if (action === "approve") {
      // Update product quantity if available
      const requisition = requisitions.find(r => r.id === requisitionId);
      if (requisition) {
        const product = products.find(p => 
          p.name === requisition.productName && 
          p.site === currentAdminSite
        );
        
        if (product && product.quantity >= requisition.quantity) {
          setProducts(prev => prev.map(p =>
            p.id === product.id
              ? { ...p, quantity: p.quantity - requisition.quantity }
              : p
          ));
        }
      }
    }
    
    toast.success(`Requisition ${action === "approve" ? "approved" : "rejected"} successfully!`);
  };

  // Get recent activities
  const getRecentActivities = () => {
    const activities = [];
    
    // Add product updates
    const recentProducts = products
      .filter(p => p.site === currentAdminSite)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 3);
    
    recentProducts.forEach(product => {
      activities.push({
        id: product.id,
        type: "product_update",
        title: `${product.name} updated`,
        description: `Quantity: ${product.quantity} | Status: ${product.status}`,
        date: product.lastUpdated,
        icon: Package
      });
    });
    
    // Add requisition updates
    const recentRequisitions = requisitions
      .filter(r => r.site === currentAdminSite)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2);
    
    recentRequisitions.forEach(req => {
      activities.push({
        id: req.id,
        type: "requisition",
        title: `Requisition ${req.status}: ${req.productName}`,
        description: `Quantity: ${req.quantity} | Priority: ${req.priority}`,
        date: req.date,
        icon: FileText
      });
    });
    
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  };

  const recentActivities = getRecentActivities();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        title="ERP Management" 
        subtitle={`Admin Dashboard - ${sites.find(s => s.id === currentAdminSite)?.name}`}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6"
      >
        {/* Admin Site Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Total Machines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {siteStats.totalMachines}
              </div>
              <p className="text-xs text-muted-foreground">
                At your site
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">
                {siteStats.lowStockItems}
              </div>
              <p className="text-xs text-muted-foreground">
                Needs attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Requisitions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {requisitions.filter(r => r.status === "pending" && r.site === currentAdminSite).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(siteStats.totalCost)}
              </div>
              <p className="text-xs text-muted-foreground">
                Machine inventory value
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Recent Activities */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="p-2 bg-primary/10 rounded">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(activity.date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Main Content */}
          <div className="md:col-span-2">
            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
                <TabsTrigger value="machines">Machines</TabsTrigger>
              </TabsList>

              {/* Inventory Tab */}
              <TabsContent value="inventory">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>Site Inventory</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          // Export inventory for current site
                          toast.success("Inventory exported successfully!");
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button 
                        onClick={() => setRequisitionDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New Requisition
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments.map(dept => (
                            <SelectItem key={dept.value} value={dept.value}>
                              {dept.label.split(" ")[1]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="in-stock">In Stock</SelectItem>
                          <SelectItem value="low-stock">Low Stock</SelectItem>
                          <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.sku}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                {product.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {product.department.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {product.quantity}
                                {product.quantity <= product.reorderLevel && (
                                  <Badge variant="outline" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Reorder
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(product.status)}>
                                {product.status.replace("-", " ").toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDate(product.lastUpdated)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Product Details</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div><strong>SKU:</strong> {product.sku}</div>
                                        <div><strong>Name:</strong> {product.name}</div>
                                        <div><strong>Department:</strong> {product.department}</div>
                                        <div><strong>Category:</strong> {product.category}</div>
                                        <div><strong>Quantity:</strong> {product.quantity}</div>
                                        <div><strong>Price:</strong> {formatCurrency(product.price)}</div>
                                        <div><strong>Reorder Level:</strong> {product.reorderLevel}</div>
                                        <div><strong>Supplier:</strong> {product.supplier}</div>
                                        {product.brushCount && <div><strong>Brush Count:</strong> {product.brushCount}</div>}
                                        {product.squeegeeCount && <div><strong>Squeegee Count:</strong> {product.squeegeeCount}</div>}
                                      </div>
                                      {product.changeHistory.length > 0 && (
                                        <div>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setViewHistoryDialogOpen(product.id)}
                                          >
                                            View Change History ({product.changeHistory.length})
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Requisitions Tab */}
              <TabsContent value="requisitions">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>Purchase Requisitions</CardTitle>
                    <div className="flex gap-2">
                      <Select value={selectedRequisitionStatus} onValueChange={setSelectedRequisitionStatus}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="fulfilled">Fulfilled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Requisition ID</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Estimated Cost</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequisitions.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">{req.id}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{req.productName}</p>
                                <p className="text-xs text-muted-foreground">{req.category}</p>
                              </div>
                            </TableCell>
                            <TableCell>{req.quantity}</TableCell>
                            <TableCell>
                              <Badge variant={
                                req.priority === "high" ? "destructive" : 
                                req.priority === "medium" ? "secondary" : "outline"
                              }>
                                {req.priority.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(req.estimatedCost)}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(req.status)}>
                                {req.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {req.status === "pending" && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="default"
                                      onClick={() => handleRequisitionAction(req.id, "approve")}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      onClick={() => handleRequisitionAction(req.id, "reject")}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Machines Tab */}
              <TabsContent value="machines">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Machine Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Machine Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Machines:</span>
                              <span className="font-medium">{siteStats.totalMachines}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Brushes:</span>
                              <span className="font-medium">{siteStats.totalBrushes}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Squeegees:</span>
                              <span className="font-medium">{siteStats.totalSqueegees}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Changes:</span>
                              <span className="font-medium">{siteStats.totalChanges}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Machine Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-sm">Operational</span>
                              </div>
                              <span className="font-medium">
                                {products.filter(p => 
                                  p.site === currentAdminSite && 
                                  p.department === "housekeeping" && 
                                  p.category === "Machines" &&
                                  p.status === "in-stock"
                                ).length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span className="text-sm">Needs Maintenance</span>
                              </div>
                              <span className="font-medium">
                                {products.filter(p => 
                                  p.site === currentAdminSite && 
                                  p.department === "housekeeping" && 
                                  p.category === "Machines" &&
                                  p.status === "low-stock"
                                ).length}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <h3 className="text-lg font-semibold mb-4">Site Machines</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Machine Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Brushes</TableHead>
                          <TableHead>Squeegees</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Maintenance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products
                          .filter(p => 
                            p.site === currentAdminSite && 
                            p.department === "housekeeping" && 
                            p.category === "Machines"
                          )
                          .map((machine) => (
                            <TableRow key={machine.id}>
                              <TableCell className="font-medium">{machine.name}</TableCell>
                              <TableCell>{machine.quantity}</TableCell>
                              <TableCell>{machine.brushCount || 0}</TableCell>
                              <TableCell>{machine.squeegeeCount || 0}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusColor(machine.status)}>
                                  {machine.status.replace("-", " ").toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {machine.changeHistory.length > 0 
                                  ? formatDate(machine.changeHistory[machine.changeHistory.length - 1].date)
                                  : "Never"
                                }
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* View Change History Dialog */}
        <Dialog open={!!viewHistoryDialogOpen} onOpenChange={() => setViewHistoryDialogOpen(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Change History - {products.find(p => p.id === viewHistoryDialogOpen)?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto space-y-4">
              {viewHistoryDialogOpen && products.find(p => p.id === viewHistoryDialogOpen)?.changeHistory.map((change, index) => (
                <div key={index} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{change.changeType}</p>
                      <p className="text-sm text-muted-foreground">{change.description}</p>
                      <p className="text-xs">Performed by: {change.performedBy}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(change.cost)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(change.date)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {viewHistoryDialogOpen && products.find(p => p.id === viewHistoryDialogOpen)?.changeHistory.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No change history recorded</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* New Requisition Dialog */}
        <Dialog open={requisitionDialogOpen} onOpenChange={setRequisitionDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Requisition</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitRequisition} className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input name="productName" required placeholder="Enter product name" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Machines">Machines</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Tools & Material">Tools & Material</SelectItem>
                    <SelectItem value="Chemicals & Consumables">Chemicals & Consumables</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input name="quantity" type="number" required />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select name="priority" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estimated Cost (₹)</Label>
                <Input name="estimatedCost" type="number" required />
              </div>
              <Button type="submit" className="w-full">Submit Requisition</Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default AdminERP;