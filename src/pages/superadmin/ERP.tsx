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
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, Plus, Edit, Package, ShoppingCart, Trash2, Eye, 
  IndianRupee, Building, Users, MapPin, Download, Upload,
  UserCheck, Phone, Mail, Home, Shield, Car, Trash, Droplets, ShoppingBasket,
  Wrench, Settings, AlertTriangle, Cpu, BarChart3
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

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  site: string;
  status: "active" | "inactive";
  salary: number;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  city: string;
  status: "active" | "inactive";
}

// Department Categories
const departments = [
  { value: "housekeeping", label: "🧼 Housekeeping Management", icon: Home },
  { value: "security", label: "🛡️ Security Management", icon: Shield },
  { value: "parking", label: "🚗 Parking Management", icon: Car },
  { value: "waste", label: "♻️ Waste Management", icon: Trash },
  { value: "stp", label: "🏭 STP Tank Cleaning", icon: Droplets },
  { value: "consumables", label: "🛒 Consumables", icon: ShoppingBasket },
];

// Category-wise Product Lists
const departmentCategories = {
  housekeeping: {
    "Machines": [
      "Single disc machine",
      "Auto scrubber dryer (walk-behind / ride-on)",
      "Wet & dry vacuum cleaner",
      "Carpet extraction machine",
      "High pressure jet machine",
      "Steam cleaner",
      "Floor polisher / burnisher"
    ],
    "Tools & Material": [
      "Mop (dry & wet)",
      "Mop wringer trolley",
      "Bucket & squeezer",
      "Microfiber cloths",
      "Dusters",
      "Brooms & brushes",
      "Floor squeegee",
      "Cobweb brush",
      "Window cleaning kit (squeegee + washer)",
      "Spray bottles",
      "Garbage bins (Indoor/Outdoor)",
      "Scrubbing pads & sponge scrubs",
      "Dustpan set",
      "Cleaning trolley"
    ],
    "Chemicals & Consumables": [
      "Floor cleaner",
      "Toilet cleaner",
      "Glass cleaner",
      "Carpet shampoo",
      "Disinfectant (bleach / hypo / bio enzyme)",
      "Hand wash liquid",
      "Air freshener",
      "Garbage bags",
      "Tissue papers"
    ],
    "PPE": [
      "Gloves",
      "Apron",
      "Mask",
      "Shoes"
    ]
  },
  security: {
    "Equipment": [
      "CCTV Cameras (IP/HD)",
      "NVR/DVR",
      "Gate metal detector",
      "Handheld metal detector",
      "Walkie-talkies",
      "Biometric attendance machine",
      "RFID cards & access control system",
      "Boom barrier (if gate management)",
      "Torch / rechargeable flashlight",
      "Guard patrol device",
      "Under-vehicle inspection mirror",
      "Body camera (optional)"
    ],
    "Tools & Safety": [
      "Barricades / caution tape",
      "Traffic cones",
      "Emergency whistle",
      "First aid kit"
    ],
    "Uniform & Accessories": [
      "Security uniforms",
      "Cap, belt, shoes",
      "ID cards",
      "Lanyard"
    ],
    "Registers": [
      "Visitor logbook",
      "Material In/Out register",
      "Key register",
      "Incident log book",
      "Vehicle entry register"
    ]
  },
  parking: {
    "Equipment": [
      "Boom barrier",
      "Ticket machine / QR system",
      "RFID scanner",
      "ANPR camera (optional)",
      "Traffic cones",
      "Wheel stoppers",
      "Safety barricades",
      "Speed breakers",
      "Traffic baton (light stick)",
      "Walkie-talkies"
    ],
    "Signage & Marking": [
      "Entry/Exit signboards",
      "Parking zone boards",
      "Direction arrow boards",
      "Number plates for slots",
      "Paint for floor marking"
    ],
    "Registers / Digital Logs": [
      "Visitor vehicle register",
      "Parking pass register"
    ],
    "Uniform & Safety": [
      "Parking uniform/Jacket",
      "Whistle",
      "Reflective vest"
    ]
  },
  waste: {
    "Bins & Storage": [
      "Color-coded bins (Dry/Wet/Bio/Plastic/Glass)",
      "Collection trolleys",
      "Big waste collection drums",
      "Wheelbarrow / push cart"
    ],
    "Tools": [
      "Shovel",
      "Garbage lifter",
      "Tongs",
      "Rake",
      "Disinfectant sprayer",
      "Broom & mops"
    ],
    "Equipment": [
      "Waste compactor (if large facility)",
      "Garbage lifter/loader machine (industrial)"
    ],
    "Consumables": [
      "Garbage bags",
      "Disinfectant chemical",
      "Gloves / PPE",
      "Mask / face shield"
    ]
  },
  stp: {
    "Machines & Tools": [
      "Submersible pump",
      "Jetting machine",
      "Sludge suction pump",
      "Desludging tanker (external vendor)",
      "Scraper rods",
      "High-pressure washer"
    ],
    "Safety Equipment": [
      "Full body safety harness",
      "Tripod & rope set",
      "Ventilation blower",
      "Gas detector (H2S, methane)",
      "Oxygen cylinder (for confined entry)",
      "First aid kit"
    ],
    "PPE": [
      "Chemical-resistant gloves",
      "Gumboots",
      "Safety goggles",
      "Helmet",
      "Respirator mask / SCBA (Self-Contained Breathing Device)"
    ]
  },
  consumables: {
    "Office Supplies": [
      "Pens & Stationery",
      "Notepads & Registers",
      "Printing Paper",
      "Toner & Cartridges"
    ],
    "Maintenance Items": [
      "Lubricants & Oils",
      "Spare Parts",
      "Tools & Equipment"
    ],
    "Safety Equipment": [
      "First Aid Kits",
      "Fire Extinguishers",
      "Safety Signage"
    ]
  }
};

// Sample Data with enhanced machine information
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
    changeHistory: [
      {
        date: "2024-01-15",
        changeType: "maintenance",
        description: "Routine maintenance and brush replacement",
        cost: 2500,
        performedBy: "Maintenance Team"
      },
      {
        date: "2024-02-20",
        changeType: "repair",
        description: "Motor bearing replacement",
        cost: 4500,
        performedBy: "Technical Team"
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
    changeHistory: [
      {
        date: "2024-01-10",
        changeType: "maintenance",
        description: "Battery replacement and system check",
        cost: 8500,
        performedBy: "Maintenance Team"
      }
    ]
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
    site: "SITE-002",
    assignedManager: "Sanjay Singh",
    brushCount: 4,
    squeegeeCount: 3,
    changeHistory: [
      {
        date: "2024-01-25",
        changeType: "repair",
        description: "Pump seal replacement",
        cost: 3200,
        performedBy: "Technical Team"
      },
      {
        date: "2024-02-15",
        changeType: "maintenance",
        description: "Nozzle cleaning and pressure check",
        cost: 1800,
        performedBy: "Maintenance Team"
      }
    ]
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
    site: "SITE-002",
    assignedManager: "Sanjay Singh",
    changeHistory: []
  },
  { 
    id: "6", 
    name: "Color-coded bins", 
    category: "Bins & Storage",
    subCategory: "Bins & Storage",
    department: "waste", 
    quantity: 50, 
    price: 2500, 
    costPrice: 1800, 
    status: "in-stock", 
    supplier: "Waste Management Corp", 
    sku: "WASTE-BIN-001", 
    reorderLevel: 20,
    site: "SITE-001",
    assignedManager: "Rajesh Kumar",
    changeHistory: []
  },
];

const initialSites: Site[] = [
  { id: "SITE-001", name: "Tech Park Bangalore", location: "Whitefield", city: "Bangalore", status: "active", manager: "Rajesh Kumar", totalEmployees: 45, contact: "+91 80 2654 7890" },
  { id: "SITE-002", name: "Corporate Tower Mumbai", location: "Bandra Kurla Complex", city: "Mumbai", status: "active", manager: "Sanjay Singh", totalEmployees: 32, contact: "+91 22 2654 7891" },
];

const initialEmployees: Employee[] = [
  { id: "EMP-001", name: "Amit Patel", role: "Housekeeping Supervisor", phone: "+91 98765 43211", site: "SITE-001", status: "active", salary: 35000 },
  { id: "EMP-002", name: "Neha Gupta", role: "Security Incharge", phone: "+91 98765 43212", site: "SITE-001", status: "active", salary: 32000 },
  { id: "EMP-003", name: "Vikram Joshi", role: "Parking Manager", phone: "+91 98765 43214", site: "SITE-002", status: "active", salary: 42000 },
  { id: "EMP-004", name: "Rahul Sharma", role: "Waste Management Supervisor", phone: "+91 98765 43215", site: "SITE-001", status: "active", salary: 38000 },
  { id: "EMP-005", name: "Priya Nair", role: "STP Operator", phone: "+91 98765 43216", site: "SITE-002", status: "active", salary: 45000 },
];

const initialVendors: Vendor[] = [
  { id: "VEND-001", name: "Cleaning Equipment Co.", category: "Housekeeping", contactPerson: "Mr. Sharma", phone: "+91 22 2654 7890", city: "Mumbai", status: "active" },
  { id: "VEND-002", name: "Security Systems Ltd.", category: "Security", contactPerson: "Ms. Desai", phone: "+91 80 2654 7891", city: "Bangalore", status: "active" },
  { id: "VEND-003", name: "Parking Solutions Inc.", category: "Parking", contactPerson: "Mr. Gupta", phone: "+91 11 2654 7892", city: "Delhi", status: "active" },
  { id: "VEND-004", name: "Waste Management Corp", category: "Waste", contactPerson: "Ms. Reddy", phone: "+91 40 2654 7893", city: "Hyderabad", status: "active" },
  { id: "VEND-005", name: "STP Equipment Ltd", category: "STP", contactPerson: "Mr. Kumar", phone: "+91 44 2654 7894", city: "Chennai", status: "active" },
];

const ERP = () => {
  // State Management
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSite, setSelectedSite] = useState("all");
  const [customProductName, setCustomProductName] = useState("");

  // Dialog States
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [changeHistoryDialogOpen, setChangeHistoryDialogOpen] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Form States
  const [selectedDept, setSelectedDept] = useState("housekeeping");
  const [selectedProdCategory, setSelectedProdCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  // Utility Functions
  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      "active": "default", "in-stock": "default",
      "pending": "secondary", "inactive": "outline", "draft": "outline",
      "low-stock": "secondary", "out-of-stock": "destructive"
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

  const getDepartmentIcon = (dept: string) => {
    const deptObj = departments.find(d => d.value === dept);
    return deptObj ? deptObj.icon : Package;
  };

  // Product Functions
  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productName = selectedProduct === "custom" ? customProductName : selectedProduct;
    
    if (!productName) {
      toast.error("Please select or enter a product name");
      return;
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      name: productName,
      category: selectedProdCategory,
      subCategory: selectedProdCategory,
      department: selectedDept,
      quantity: parseInt(formData.get("quantity") as string),
      price: parseInt(formData.get("price") as string),
      costPrice: parseInt(formData.get("costPrice") as string),
      status: "in-stock",
      supplier: formData.get("supplier") as string,
      sku: generateSKU(selectedDept, selectedProdCategory),
      reorderLevel: parseInt(formData.get("reorderLevel") as string),
      description: formData.get("description") as string,
      site: formData.get("site") as string,
      assignedManager: sites.find(s => s.id === formData.get("site"))?.manager || "",
      brushCount: parseInt(formData.get("brushCount") as string) || 0,
      squeegeeCount: parseInt(formData.get("squeegeeCount") as string) || 0,
      changeHistory: []
    };
    
    setProducts(prev => [newProduct, ...prev]);
    toast.success("Product added successfully!");
    setProductDialogOpen(false);
    
    // Reset form
    setSelectedDept("housekeeping");
    setSelectedProdCategory("");
    setSelectedProduct("");
    setCustomProductName("");
  };

  const generateSKU = (department: string, category: string) => {
    const deptCode = department.substring(0, 3).toUpperCase();
    const catCode = category.substring(0, 3).toUpperCase();
    const count = products.filter(p => p.department === department && p.category === category).length + 1;
    return `${deptCode}-${catCode}-${count.toString().padStart(3, '0')}`;
  };

  const handleAddChangeHistory = (productId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newChange: ChangeHistory = {
      date: formData.get("date") as string,
      changeType: formData.get("changeType") as "maintenance" | "repair" | "replacement" | "inspection",
      description: formData.get("description") as string,
      cost: parseInt(formData.get("cost") as string),
      performedBy: formData.get("performedBy") as string,
    };
    
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, changeHistory: [...product.changeHistory, newChange] }
        : product
    ));
    
    toast.success("Change history added successfully!");
  };

  // Calculations
  const getTotalMachineCost = () => {
    const machines = products.filter(p => 
      p.department === "housekeeping" && p.category === "Machines"
    );
    return machines.reduce((total, machine) => total + (machine.costPrice * machine.quantity), 0);
  };

  const getTotalBrushCount = () => {
    const machines = products.filter(p => 
      p.department === "housekeeping" && p.category === "Machines"
    );
    return machines.reduce((total, machine) => total + (machine.brushCount || 0), 0);
  };

  const getTotalSqueegeeCount = () => {
    const machines = products.filter(p => 
      p.department === "housekeeping" && p.category === "Machines"
    );
    return machines.reduce((total, machine) => total + (machine.squeegeeCount || 0), 0);
  };

  const getSiteWiseMachineStats = () => {
    const stats: { [key: string]: { 
      siteName: string; 
      manager: string; 
      machineCount: number; 
      totalChanges: number;
      totalCost: number;
      brushCount: number;
      squeegeeCount: number;
    } } = {};
    
    products
      .filter(p => p.department === "housekeeping" && p.category === "Machines")
      .forEach(machine => {
        if (!stats[machine.site]) {
          const site = sites.find(s => s.id === machine.site);
          stats[machine.site] = {
            siteName: site?.name || "Unknown Site",
            manager: machine.assignedManager,
            machineCount: 0,
            totalChanges: 0,
            totalCost: 0,
            brushCount: 0,
            squeegeeCount: 0
          };
        }
        
        stats[machine.site].machineCount += machine.quantity;
        stats[machine.site].totalChanges += machine.changeHistory.length;
        stats[machine.site].totalCost += machine.costPrice * machine.quantity;
        stats[machine.site].brushCount += machine.brushCount || 0;
        stats[machine.site].squeegeeCount += machine.squeegeeCount || 0;
      });
    
    return stats;
  };

  // Get categories for selected department - FIXED VERSION
  const getCategoriesForDepartment = (dept: string) => {
    const deptCategories = departmentCategories[dept as keyof typeof departmentCategories];
    return deptCategories ? Object.keys(deptCategories) : [];
  };

  // Get products for selected department and category - FIXED VERSION
  const getProductsForCategory = (dept: string, category: string) => {
    const deptCategories = departmentCategories[dept as keyof typeof departmentCategories];
    if (!deptCategories) return [];
    
    const categoryProducts = deptCategories[category as keyof typeof deptCategories];
    return Array.isArray(categoryProducts) ? categoryProducts : [];
  };

  // Filtered Data
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || product.department === selectedDepartment;
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSite = selectedSite === "all" || product.site === selectedSite;
    return matchesSearch && matchesDepartment && matchesCategory && matchesSite;
  });

  const siteWiseStats = getSiteWiseMachineStats();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="ERP Management System" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6"
      >
        {/* Machine Statistics Cards */}
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
                {products.filter(p => p.department === "housekeeping" && p.category === "Machines")
                  .reduce((total, machine) => total + machine.quantity, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all sites</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Total Machine Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(getTotalMachineCost())}
              </div>
              <p className="text-xs text-muted-foreground">Total investment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Total Brushes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalBrushCount()}</div>
              <p className="text-xs text-muted-foreground">Brush count</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Total Squeegees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalSqueegeeCount()}</div>
              <p className="text-xs text-muted-foreground">Squeegee count</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
            <TabsTrigger value="machine-stats">Machine Statistics</TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Inventory Management</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                  <Button onClick={() => setProductDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
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
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {selectedDepartment !== "all" && 
                        getCategoriesForDepartment(selectedDepartment).map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Sites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sites</SelectItem>
                      {sites.map(site => (
                        <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const DeptIcon = getDepartmentIcon(product.department);
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.sku}</TableCell>
                          <TableCell className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {product.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <DeptIcon className="h-3 w-3" />
                              {departments.find(d => d.value === product.department)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sites.find(s => s.id === product.site)?.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              {product.assignedManager}
                            </div>
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
                            <Badge variant="outline" className="cursor-pointer" 
                              onClick={() => setChangeHistoryDialogOpen(product.id)}>
                              {product.changeHistory.length} changes
                            </Badge>
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
                                      <div><strong>Department:</strong> {departments.find(d => d.value === product.department)?.label}</div>
                                      <div><strong>Category:</strong> {product.category}</div>
                                      <div><strong>Quantity:</strong> {product.quantity}</div>
                                      <div><strong>Price:</strong> {formatCurrency(product.price)}</div>
                                      <div><strong>Cost Price:</strong> {formatCurrency(product.costPrice)}</div>
                                      <div><strong>Supplier:</strong> {product.supplier}</div>
                                      <div><strong>Reorder Level:</strong> {product.reorderLevel}</div>
                                      <div><strong>Site:</strong> {sites.find(s => s.id === product.site)?.name}</div>
                                      <div><strong>Manager:</strong> {product.assignedManager}</div>
                                      {product.brushCount && <div><strong>Brush Count:</strong> {product.brushCount}</div>}
                                      {product.squeegeeCount && <div><strong>Squeegee Count:</strong> {product.squeegeeCount}</div>}
                                      {product.description && (
                                        <div className="col-span-2">
                                          <strong>Description:</strong> {product.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setProducts(prev => prev.filter(p => p.id !== product.id));
                                  toast.success("Product deleted successfully!");
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Machine Statistics Tab */}
          <TabsContent value="machine-stats">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Machine Statistics - Site Wise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site Name</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Machine Count</TableHead>
                      <TableHead>Total Changes</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Brush Count</TableHead>
                      <TableHead>Squeegee Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(siteWiseStats).map(([siteId, stats]) => (
                      <TableRow key={siteId}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {stats.siteName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            {stats.manager}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{stats.machineCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stats.totalChanges > 0 ? "secondary" : "outline"}>
                            {stats.totalChanges} changes
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(stats.totalCost)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{stats.brushCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{stats.squeegeeCount}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Detailed Machine List */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Detailed Machine Information</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Machine Name</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Brushes</TableHead>
                        <TableHead>Squeegees</TableHead>
                        <TableHead>Changes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products
                        .filter(p => p.department === "housekeeping" && p.category === "Machines")
                        .map(machine => (
                          <TableRow key={machine.id}>
                            <TableCell className="font-medium">{machine.name}</TableCell>
                            <TableCell>{sites.find(s => s.id === machine.site)?.name}</TableCell>
                            <TableCell>{machine.assignedManager}</TableCell>
                            <TableCell>{machine.quantity}</TableCell>
                            <TableCell>{formatCurrency(machine.costPrice * machine.quantity)}</TableCell>
                            <TableCell>{machine.brushCount || 0}</TableCell>
                            <TableCell>{machine.squeegeeCount || 0}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className="cursor-pointer"
                                onClick={() => setChangeHistoryDialogOpen(machine.id)}
                              >
                                {machine.changeHistory.length} changes
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Product Dialog */}
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto pr-4">
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={selectedDept} onValueChange={setSelectedDept}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={selectedProdCategory} 
                      onValueChange={setSelectedProdCategory}
                      disabled={!selectedDept}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategoriesForDepartment(selectedDept).map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product or add custom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">+ Add Custom Product</SelectItem>
                      {selectedProdCategory && getProductsForCategory(selectedDept, selectedProdCategory).map(product => (
                        <SelectItem key={product} value={product}>
                          {product}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct === "custom" && (
                  <div className="space-y-2">
                    <Label>Custom Product Name</Label>
                    <Input 
                      value={customProductName}
                      onChange={(e) => setCustomProductName(e.target.value)}
                      placeholder="Enter custom product name"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Site</Label>
                    <Select name="site" required>
                      <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                      <SelectContent>
                        {sites.map(site => (
                          <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input name="quantity" type="number" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reorder Level</Label>
                    <Input name="reorderLevel" type="number" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input name="price" type="number" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cost Price</Label>
                    <Input name="costPrice" type="number" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Input name="supplier" required />
                  </div>
                </div>

                {selectedProdCategory === "Machines" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Brush Count</Label>
                      <Input name="brushCount" type="number" placeholder="Optional" />
                    </div>
                    <div className="space-y-2">
                      <Label>Squeegee Count</Label>
                      <Input name="squeegeeCount" type="number" placeholder="Optional" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" placeholder="Product description (optional)" />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={!selectedProduct || (selectedProduct === "custom" && !customProductName)}
                >
                  Add Product
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Change History Dialog */}
        <Dialog open={!!changeHistoryDialogOpen} onOpenChange={() => setChangeHistoryDialogOpen(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Change History - {products.find(p => p.id === changeHistoryDialogOpen)?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto space-y-4">
              {changeHistoryDialogOpen && (
                <>
                  <div className="space-y-2">
                    {products.find(p => p.id === changeHistoryDialogOpen)?.changeHistory.map((change, index) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{change.changeType}</p>
                            <p className="text-sm text-muted-foreground">{change.description}</p>
                            <p className="text-xs">Performed by: {change.performedBy}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatCurrency(change.cost)}</p>
                            <p className="text-xs text-muted-foreground">{change.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {products.find(p => p.id === changeHistoryDialogOpen)?.changeHistory.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No change history recorded</p>
                    )}
                  </div>
                  
                  <form onSubmit={(e) => handleAddChangeHistory(changeHistoryDialogOpen, e)} className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Add New Change</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input name="date" type="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Change Type</Label>
                        <Select name="changeType" required>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="repair">Repair</SelectItem>
                            <SelectItem value="replacement">Replacement</SelectItem>
                            <SelectItem value="inspection">Inspection</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input name="description" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cost</Label>
                        <Input name="cost" type="number" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Performed By</Label>
                        <Input name="performedBy" required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Add Change Record</Button>
                  </form>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Data</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload CSV file with data
                </p>
                <Input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      toast.success("Data imported successfully!");
                      setImportDialogOpen(false);
                    }
                  }}
                />
              </div>
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default ERP;