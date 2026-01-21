import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Edit, Trash2, Phone, Mail, Calendar, Eye, MapPin, Building, Loader2, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { 
  crmService, 
  Client, 
  Lead, 
  Communication,
  CRMStats 
} from "../../services/crmService";

// Indian Data constants
const indianCities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad"];
const industries = ["MALL", "COMMERCIAL", "Banking", "Healthcare", "Education", "Real Estate", "Retail", "Automobile"];
const leadSources = ["Website", "Referral", "Cold Call", "Social Media", "Email Campaign", "Trade Show"];
const communicationTypes = ["call", "email", "meeting", "demo"];

const CRM = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [commDialogOpen, setCommDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [viewClientDialog, setViewClientDialog] = useState<string | null>(null);
  const [viewLeadDialog, setViewLeadDialog] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [loading, setLoading] = useState({
    clients: false,
    leads: false,
    communications: false,
    stats: false
  });

  const [stats, setStats] = useState<CRMStats>({
    totalClients: 0,
    activeLeads: 0,
    totalValue: "₹0",
    communications: 0
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch all data
  const fetchAllData = async () => {
    setLoading({
      clients: true,
      leads: true,
      communications: true,
      stats: true
    });

    try {
      const data = await crmService.fetchAllData(searchQuery);
      setStats(data.stats);
      setClients(data.clients);
      setLeads(data.leads);
      setCommunications(data.communications);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading({
        clients: false,
        leads: false,
        communications: false,
        stats: false
      });
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      const statsData = await crmService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  // Fetch Clients
  const fetchClients = async () => {
    try {
      setLoading(prev => ({ ...prev, clients: true }));
      const clientsData = await crmService.clients.getAll(searchQuery);
      setClients(clientsData);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
    }
  };

  // Fetch Leads
  const fetchLeads = async () => {
    try {
      setLoading(prev => ({ ...prev, leads: true }));
      const leadsData = await crmService.leads.getAll(searchQuery);
      setLeads(leadsData);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(prev => ({ ...prev, leads: false }));
    }
  };

  // Fetch Communications
  const fetchCommunications = async () => {
    try {
      setLoading(prev => ({ ...prev, communications: true }));
      const communicationsData = await crmService.communications.getAll(searchQuery);
      setCommunications(communicationsData);
    } catch (error) {
      console.error("Failed to fetch communications:", error);
    } finally {
      setLoading(prev => ({ ...prev, communications: false }));
    }
  };

  // Handle search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
      fetchLeads();
      fetchCommunications();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Client Functions
  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const newClient = {
        name: formData.get("name") as string,
        company: formData.get("company") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string || "",
        city: formData.get("city") as string || "Mumbai",
        status: "active" as const,
        value: formData.get("value") as string,
        industry: formData.get("industry") as string || "IT Services",
        contactPerson: formData.get("contactPerson") as string || "",
      };

      await crmService.clients.create(newClient);
      setClientDialogOpen(false);
      fetchAllData();
    } catch (error) {
      console.error("Failed to add client:", error);
    }
  };

  const handleEditClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClient) return;
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const updateData = {
        name: formData.get("name") as string,
        company: formData.get("company") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string,
        city: formData.get("city") as string,
        value: formData.get("value") as string,
        industry: formData.get("industry") as string,
        contactPerson: formData.get("contactPerson") as string,
      };

      await crmService.clients.update(editingClient._id, updateData);
      setEditingClient(null);
      fetchAllData();
    } catch (error) {
      console.error("Failed to update client:", error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    
    try {
      await crmService.clients.delete(clientId);
      fetchAllData();
    } catch (error) {
      console.error("Failed to delete client:", error);
    }
  };

  // Excel Import Functions
  const handleImportExcel = async () => {
    if (!importFile) {
      toast.error("Please select a file to import");
      return;
    }
    
    setImportLoading(true);
    
    try {
      const importedData = await readExcelFile(importFile);
      const validData = validateImportData(importedData);
      
      if (validData.length === 0) {
        toast.error("No valid data found in the file");
        return;
      }
      
      console.log('Data to be imported:', validData);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      // Import each valid client
      for (const clientData of validData) {
        try {
          // Remove the temporary _id before sending to API
          const { _id, createdAt, updatedAt, ...clientToCreate } = clientData;
          await crmService.clients.create(clientToCreate);
          successCount++;
        } catch (error: any) {
          console.error(`Failed to import client ${clientData.name}:`, error);
          errors.push(`${clientData.name}: ${error.message || 'Unknown error'}`);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} clients${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        if (errors.length > 0) {
          console.error('Import errors:', errors);
        }
        setImportDialogOpen(false);
        setImportFile(null);
        fetchAllData();
      } else {
        toast.error(`Failed to import any clients. ${errors[0] || 'Check the template format.'}`);
      }
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Failed to import file. Please check the format.");
    } finally {
      setImportLoading(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { 
            header: 1,
            blankrows: false,
            defval: ''
          });
          
          if (jsonData.length < 2) {
            resolve([]);
            return;
          }
          
          const headers = (jsonData[0] as string[]).map(h => h?.toString().trim() || '');
          const rows = jsonData.slice(1) as any[];
          
          const formattedData = rows
            .filter(row => {
              return row.some((cell: any) => cell !== null && cell !== undefined && cell.toString().trim() !== '');
            })
            .map(row => {
              const obj: any = {};
              headers.forEach((header, index) => {
                if (header && row[index] !== undefined && row[index] !== null) {
                  obj[header] = row[index]?.toString().trim();
                } else {
                  obj[header] = '';
                }
              });
              return obj;
            })
            .filter(row => row['Client Name'] || row['Company']);
          
          resolve(formattedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsBinaryString(file);
    });
  };

  const validateImportData = (data: any[]): Client[] => {
    const validClients: Client[] = [];
    
    data.forEach((row, index) => {
      if (!row['Client Name'] && !row['Company']) {
        console.warn(`Skipping row ${index + 1}: Missing client name and company`);
        return;
      }
      
      // Generate placeholder data for missing required fields
      const clientName = row['Client Name'] || '';
      const companyName = row['Company'] || '';
      
      // Generate email from client name if empty
      let email = row['Email'] || '';
      if (!email && clientName) {
        const emailName = clientName.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '.');
        email = `${emailName}@company.com`;
      }
      
      // Generate phone number if empty
      let phone = row['Phone']?.toString() || '';
      if (!phone) {
        // Generate a random Indian phone number
        const randomNum = Math.floor(1000000000 + Math.random() * 9000000000);
        phone = `9${randomNum.toString().slice(0, 9)}`;
      }
      
      // Generate expected value if empty
      let expectedValue = row['Expected Value'] || '';
      if (!expectedValue) {
        const randomValue = Math.floor(10 + Math.random() * 90) * 100000;
        expectedValue = `₹${randomValue.toLocaleString('en-IN')}`;
      }
      
      // Set industry if empty
      const industry = row['Industry'] || 'COMMERCIAL';
      
      // Create client object from Excel data
      const client: Client = {
        _id: `temp-${Date.now()}-${index}`,
        name: clientName,
        company: companyName,
        email: email,
        phone: phone,
        industry: industry,
        city: row['City'] || 'Pune',
        value: expectedValue,
        address: row['Address'] || '',
        contactPerson: '', // Add empty string as default
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (!client.name.trim()) {
        console.warn(`Skipping row ${index + 1}: Missing client name`);
        return;
      }
      
      if (!client.company.trim()) {
        console.warn(`Skipping row ${index + 1}: Missing company name`);
        return;
      }
      
      validClients.push(client);
    });
    
    return validClients;
  };

  const downloadTemplate = () => {
    const templateData = [
      ['SR. NO.', 'Client Name', 'Company', 'Email', 'Phone', 'Industry', 'City', 'Expected Value', 'Address', 'Contact Person (Optional)'],
      ['1', 'PHOENIX MALL', 'ALYSSUM DEVELOPERS PVT LTD', 'contact@phoenixmall.com', '9876543210', 'MALL', 'PUNE', '₹50,00,000', 'WAKAD. PUNE', ''],
      ['2', 'HIGHSTREET MALL', 'HARKRISH PROPERTIES PVT LTD', 'info@highstreetmall.com', '9876543211', 'MALL', 'PUNE', '₹75,00,000', 'HINJEWADI, PUNE', ''],
      ['3', 'WESTEND MALL', 'CHITRALI PROPERTIES PVT LTD', 'admin@westendmall.com', '9876543212', 'MALL', 'PUNE', '₹60,00,000', 'AUNDH PUNE', ''],
      ['4', 'GLOBAL GROUP', 'GLOBAL SQUARE REALTY LLP', 'contact@globalgroup.com', '9876543213', 'COMMERCIAL', 'PUNE', '₹80,00,000', 'YERWADA, PUNE', ''],
      ['5', 'K RAHEJA GROUP', 'KRC INFRASTRUCTURE', 'info@kraheja.com', '9876543214', 'COMMERCIAL', 'PUNE', '₹90,00,000', 'KHARADI, PUNE', ''],
      ['6', 'T-ONE', 'ASTITVA ASSET MANAGEMENT LLP', 'contact@t-one.com', '9876543215', 'COMMERCIAL', 'PUNE', '₹40,00,000', 'HINJEWADI, PUNE', ''],
      ['7', 'GANGA TRUENO', 'KAPPA REALTORS PVT LTD', 'info@ganguatrueno.com', '9876543216', 'COMMERCIAL', 'PUNE', '₹55,00,000', 'VIMAN NAGAR, PUNE', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ['Note:', 'Required', 'Required', 'Required', 'Required', 'Required (Options: MALL, COMMERCIAL, etc.)', 'Optional', 'Required (e.g. ₹50,00,000)', 'Optional', 'Optional'],
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Client Details');
    XLSX.writeFile(wb, 'Client_Import_Template.xlsx');
  };

  // Lead Functions
  const handleAddLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const newLead = {
        name: formData.get("name") as string,
        company: formData.get("company") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        source: formData.get("source") as string,
        status: "new" as const,
        value: formData.get("value") as string,
        assignedTo: formData.get("assignedTo") as string,
        followUpDate: formData.get("followUpDate") as string || "",
        notes: formData.get("notes") as string || "",
      };

      await crmService.leads.create(newLead);
      setLeadDialogOpen(false);
      fetchAllData();
    } catch (error) {
      console.error("Failed to add lead:", error);
    }
  };

  const handleEditLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLead) return;
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const updateData = {
        name: formData.get("name") as string,
        company: formData.get("company") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        source: formData.get("source") as string,
        value: formData.get("value") as string,
        assignedTo: formData.get("assignedTo") as string,
        followUpDate: formData.get("followUpDate") as string,
        notes: formData.get("notes") as string,
      };

      await crmService.leads.update(editingLead._id, updateData);
      setEditingLead(null);
      fetchAllData();
    } catch (error) {
      console.error("Failed to update lead:", error);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    
    try {
      await crmService.leads.delete(leadId);
      fetchAllData();
    } catch (error) {
      console.error("Failed to delete lead:", error);
    }
  };

  const handleLeadStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    try {
      await crmService.leads.updateStatus(leadId, newStatus);
      fetchAllData();
    } catch (error) {
      console.error("Failed to update lead status:", error);
    }
  };

  // Communication Functions
  const handleAddCommunication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const newComm = {
        clientName: formData.get("clientName") as string,
        clientId: formData.get("clientId") as string,
        type: formData.get("type") as "call" | "email" | "meeting" | "demo",
        date: formData.get("date") as string,
        notes: formData.get("notes") as string,
        followUpRequired: formData.get("followUpRequired") === "on",
        followUpDate: formData.get("followUpDate") as string || undefined,
      };

      await crmService.communications.create(newComm);
      setCommDialogOpen(false);
      fetchAllData();
    } catch (error) {
      console.error("Failed to log communication:", error);
    }
  };

  const handleDeleteCommunication = async (commId: string) => {
    if (!confirm("Are you sure you want to delete this communication?")) return;
    
    try {
      await crmService.communications.delete(commId);
      fetchAllData();
    } catch (error) {
      console.error("Failed to delete communication:", error);
    }
  };

  // Utility Functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "default";
      case "contacted": return "secondary";
      case "qualified": return "default";
      case "proposal": return "secondary";
      case "negotiation": return "outline";
      case "closed-won": return "default";
      case "closed-lost": return "destructive";
      case "active": return "default";
      case "inactive": return "outline";
      default: return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "New";
      case "contacted": return "Contacted";
      case "qualified": return "Qualified";
      case "proposal": return "Proposal Sent";
      case "negotiation": return "Negotiation";
      case "closed-won": return "Won";
      case "closed-lost": return "Lost";
      default: return status;
    }
  };

  const getCommunicationTypeIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="h-3 w-3 mr-1" />;
      case "email": return <Mail className="h-3 w-3 mr-1" />;
      case "meeting": return <Calendar className="h-3 w-3 mr-1" />;
      case "demo": return <Eye className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const getClientById = (id: string) => clients.find(client => client._id === id);
  const getLeadById = (id: string) => leads.find(lead => lead._id === id);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="CRM Management" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6"
      >
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading.stats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalClients}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {loading.stats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeLeads}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading.stats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalValue}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Communications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading.stats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.communications}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Excel Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Import Clients from Excel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="excel-file">Upload Excel File</Label>
                <Input 
                  id="excel-file"
                  type="file" 
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                <p className="text-sm text-muted-foreground">
                  Use the template below. Required fields: Client Name, Company
                </p>
              </div>
              
              <div className="p-4 border rounded bg-muted/50">
                <h4 className="font-medium mb-2">Template Format:</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Column A:</strong> SR. NO. (Optional)</div>
                  <div><strong>Column B:</strong> Client Name <span className="text-red-500">*Required</span></div>
                  <div><strong>Column C:</strong> Company <span className="text-red-500">*Required</span></div>
                  <div><strong>Column D:</strong> Email <span className="text-red-500">*Required</span></div>
                  <div><strong>Column E:</strong> Phone <span className="text-red-500">*Required</span></div>
                  <div><strong>Column F:</strong> Industry <span className="text-red-500">*Required</span></div>
                  <div><strong>Column G:</strong> City</div>
                  <div><strong>Column H:</strong> Expected Value <span className="text-red-500">*Required</span></div>
                  <div><strong>Column I:</strong> Address</div>
                  <div><strong>Column J:</strong> Contact Person (Optional)</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  *Required fields must have values. Use the download template button for a pre-filled example.
                </p>
              </div>
              
              <Button 
                onClick={downloadTemplate}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              
              <Button 
                onClick={handleImportExcel}
                disabled={!importFile || importLoading}
                className="w-full"
              >
                {importLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Clients'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Tabs */}
        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Client List</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search clients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setImportDialogOpen(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import Excel
                  </Button>
                  <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="mr-2 h-4 w-4" />Add Client</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Client</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddClient} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Client Name *</Label>
                            <Input id="name" name="name" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="company">Company *</Label>
                            <Input id="company" name="company" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input id="email" name="email" type="email" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone *</Label>
                            <Input id="phone" name="phone" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contactPerson">Contact Person</Label>
                            <Input id="contactPerson" name="contactPerson" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Select name="industry" defaultValue="MALL">
                              <SelectTrigger>
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                              <SelectContent>
                                {industries.map(industry => (
                                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Select name="city" defaultValue="Mumbai">
                              <SelectTrigger>
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                              <SelectContent>
                                {indianCities.map(city => (
                                  <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="value">Expected Value *</Label>
                            <Input id="value" name="value" placeholder="₹50,00,000" required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Textarea id="address" name="address" />
                        </div>
                        <Button type="submit" className="w-full">Add Client</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading.clients ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : clients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No clients found. Add your first client or import from Excel!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client._id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {client.company}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{client.industry}</TableCell>
                          <TableCell className="font-semibold">{client.value}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(client.status)}>
                              {client.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setViewClientDialog(client._id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Client Details</DialogTitle>
                                  </DialogHeader>
                                  {viewClientDialog && getClientById(viewClientDialog) && (() => {
                                    const client = getClientById(viewClientDialog)!;
                                    return (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div><strong>Name:</strong> {client.name}</div>
                                          <div><strong>Company:</strong> {client.company}</div>
                                          <div><strong>Email:</strong> {client.email}</div>
                                          <div><strong>Phone:</strong> {client.phone}</div>
                                          <div><strong>Industry:</strong> {client.industry}</div>
                                          <div><strong>City:</strong> {client.city}</div>
                                          <div><strong>Value:</strong> {client.value}</div>
                                          <div><strong>Status:</strong> {client.status}</div>
                                          <div><strong>Contact Person:</strong> {client.contactPerson || "N/A"}</div>
                                          <div><strong>Created:</strong> {formatDate(client.createdAt)}</div>
                                          <div><strong>Updated:</strong> {formatDate(client.updatedAt)}</div>
                                        </div>
                                        {client.address && (
                                          <div>
                                            <strong>Address:</strong>
                                            <div className="flex items-center gap-1 mt-1">
                                              <MapPin className="h-3 w-3" />
                                              {client.address}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </DialogContent>
                              </Dialog>
                              
                              <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setEditingClient(client)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                {editingClient && editingClient._id === client._id && (
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Edit Client</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleEditClient} className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-name">Client Name</Label>
                                          <Input 
                                            id="edit-name" 
                                            name="name" 
                                            defaultValue={editingClient.name} 
                                            required 
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-company">Company</Label>
                                          <Input 
                                            id="edit-company" 
                                            name="company" 
                                            defaultValue={editingClient.company} 
                                            required 
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-email">Email</Label>
                                          <Input 
                                            id="edit-email" 
                                            name="email" 
                                            type="email" 
                                            defaultValue={editingClient.email} 
                                            required 
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-phone">Phone</Label>
                                          <Input 
                                            id="edit-phone" 
                                            name="phone" 
                                            defaultValue={editingClient.phone} 
                                            required 
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-contactPerson">Contact Person</Label>
                                          <Input 
                                            id="edit-contactPerson" 
                                            name="contactPerson" 
                                            defaultValue={editingClient.contactPerson || ""} 
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-industry">Industry</Label>
                                          <Select name="industry" defaultValue={editingClient.industry}>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {industries.map(industry => (
                                                <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-city">City</Label>
                                          <Select name="city" defaultValue={editingClient.city}>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {indianCities.map(city => (
                                                <SelectItem key={city} value={city}>{city}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-value">Expected Value</Label>
                                          <Input 
                                            id="edit-value" 
                                            name="value" 
                                            defaultValue={editingClient.value} 
                                            required 
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-address">Address</Label>
                                        <Textarea 
                                          id="edit-address" 
                                          name="address" 
                                          defaultValue={editingClient.address || ""} 
                                        />
                                      </div>
                                      <Button type="submit" className="w-full">Update Client</Button>
                                    </form>
                                  </DialogContent>
                                )}
                              </Dialog>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteClient(client._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Lead Tracker</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search leads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="mr-2 h-4 w-4" />Add Lead</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Lead</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddLead} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="leadName">Lead Name *</Label>
                            <Input id="leadName" name="name" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="leadCompany">Company *</Label>
                            <Input id="leadCompany" name="company" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="leadEmail">Email *</Label>
                            <Input id="leadEmail" name="email" type="email" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="leadPhone">Phone *</Label>
                            <Input id="leadPhone" name="phone" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="source">Source *</Label>
                            <Select name="source" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent>
                                {leadSources.map(source => (
                                  <SelectItem key={source} value={source}>{source}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="leadValue">Expected Value *</Label>
                            <Input id="leadValue" name="value" placeholder="₹30,00,000" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="assignedTo">Assign To *</Label>
                            <Input id="assignedTo" name="assignedTo" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="followUpDate">Follow-up Date</Label>
                            <Input id="followUpDate" name="followUpDate" type="date" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="leadNotes">Notes</Label>
                          <Textarea id="leadNotes" name="notes" />
                        </div>
                        <Button type="submit" className="w-full">Add Lead</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading.leads ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No leads found. Add your first lead!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Follow-up</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead._id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>{lead.company}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="text-sm">{lead.email}</div>
                              <div className="text-sm">{lead.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>{lead.source}</TableCell>
                          <TableCell>
                            <Select 
                              value={lead.status} 
                              onValueChange={(value) => handleLeadStatusChange(lead._id, value as Lead['status'])}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="proposal">Proposal Sent</SelectItem>
                                <SelectItem value="negotiation">Negotiation</SelectItem>
                                <SelectItem value="closed-won">Won</SelectItem>
                                <SelectItem value="closed-lost">Lost</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="font-semibold">{lead.value}</TableCell>
                          <TableCell>
                            {lead.followUpDate ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(lead.followUpDate)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No follow-up</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setViewLeadDialog(lead._id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Lead Details</DialogTitle>
                                  </DialogHeader>
                                  {viewLeadDialog && getLeadById(viewLeadDialog) && (() => {
                                    const lead = getLeadById(viewLeadDialog)!;
                                    return (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div><strong>Name:</strong> {lead.name}</div>
                                          <div><strong>Company:</strong> {lead.company}</div>
                                          <div><strong>Email:</strong> {lead.email}</div>
                                          <div><strong>Phone:</strong> {lead.phone}</div>
                                          <div><strong>Source:</strong> {lead.source}</div>
                                          <div><strong>Status:</strong> {getStatusText(lead.status)}</div>
                                          <div><strong>Value:</strong> {lead.value}</div>
                                          <div><strong>Assigned To:</strong> {lead.assignedTo}</div>
                                          <div><strong>Created:</strong> {formatDate(lead.createdAt)}</div>
                                          <div><strong>Updated:</strong> {formatDate(lead.updatedAt)}</div>
                                        </div>
                                        {lead.followUpDate && (
                                          <div>
                                            <strong>Follow-up Date:</strong> {formatDate(lead.followUpDate)}
                                          </div>
                                        )}
                                        {lead.notes && (
                                          <div>
                                            <strong>Notes:</strong>
                                            <div className="mt-1 p-2 border rounded">{lead.notes}</div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </DialogContent>
                              </Dialog>
                              
                              <Dialog open={!!editingLead} onOpenChange={(open) => !open && setEditingLead(null)}>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setEditingLead(lead)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                {editingLead && editingLead._id === lead._id && (
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Edit Lead</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleEditLead} className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-lead-name">Lead Name</Label>
                                          <Input 
                                            id="edit-lead-name" 
                                            name="name" 
                                            defaultValue={editingLead.name} 
                                            required 
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-lead-company">Company</Label>
                                          <Input 
                                            id="edit-lead-company" 
                                            name="company" 
                                            defaultValue={editingLead.company} 
                                            required 
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-lead-email">Email</Label>
                                          <Input 
                                            id="edit-lead-email" 
                                            name="email" 
                                            type="email" 
                                            defaultValue={editingLead.email} 
                                            required 
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-lead-phone">Phone</Label>
                                          <Input 
                                            id="edit-lead-phone" 
                                            name="phone" 
                                            defaultValue={editingLead.phone} 
                                            required 
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-source">Source</Label>
                                          <Select name="source" defaultValue={editingLead.source}>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {leadSources.map(source => (
                                                <SelectItem key={source} value={source}>{source}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-lead-value">Expected Value</Label>
                                          <Input 
                                            id="edit-lead-value" 
                                            name="value" 
                                            defaultValue={editingLead.value} 
                                            required 
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-assignedTo">Assign To</Label>
                                          <Input 
                                            id="edit-assignedTo" 
                                            name="assignedTo" 
                                            defaultValue={editingLead.assignedTo} 
                                            required 
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-followUpDate">Follow-up Date</Label>
                                          <Input 
                                            id="edit-followUpDate" 
                                            name="followUpDate" 
                                            type="date" 
                                            defaultValue={editingLead.followUpDate ? editingLead.followUpDate.split('T')[0] : ''} 
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-lead-notes">Notes</Label>
                                        <Textarea 
                                          id="edit-lead-notes" 
                                          name="notes" 
                                          defaultValue={editingLead.notes || ""} 
                                        />
                                      </div>
                                      <Button type="submit" className="w-full">Update Lead</Button>
                                    </form>
                                  </DialogContent>
                                )}
                              </Dialog>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteLead(lead._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Communication Logs</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search communications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Dialog open={commDialogOpen} onOpenChange={setCommDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="mr-2 h-4 w-4" />Log Communication</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Log Communication</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddCommunication} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="commClientName">Client Name *</Label>
                            <Select name="clientName" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select client" />
                              </SelectTrigger>
                              <SelectContent>
                                {clients.map(client => (
                                  <SelectItem key={client._id} value={client.name}>
                                    {client.name} - {client.company}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="commType">Type *</Label>
                            <Select name="type" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {communicationTypes.map(type => (
                                  <SelectItem key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="commDate">Date *</Label>
                            <Input 
                              id="commDate" 
                              name="date" 
                              type="date" 
                              defaultValue={new Date().toISOString().split('T')[0]} 
                              required 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="commClientId">Client ID</Label>
                            <Select name="clientId">
                              <SelectTrigger>
                                <SelectValue placeholder="Select client ID" />
                              </SelectTrigger>
                              <SelectContent>
                                {clients.map(client => (
                                  <SelectItem key={client._id} value={client._id}>
                                    {client._id.slice(-6)} - {client.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="commNotes">Notes *</Label>
                          <Textarea id="commNotes" name="notes" required />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="followUpRequired" 
                            name="followUpRequired" 
                            className="rounded" 
                          />
                          <Label htmlFor="followUpRequired">Follow-up Required</Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="commFollowUpDate">Follow-up Date</Label>
                          <Input id="commFollowUpDate" name="followUpDate" type="date" />
                        </div>
                        <Button type="submit" className="w-full">Log Communication</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading.communications ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : communications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No communications found. Log your first communication!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Follow-up</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {communications.map((comm) => (
                        <TableRow key={comm._id}>
                          <TableCell className="font-medium">
                            {comm.clientName}
                            {typeof comm.clientId === 'object' && comm.clientId && (
                              <div className="text-sm text-muted-foreground">
                                {comm.clientId.company}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getCommunicationTypeIcon(comm.type)}
                              {comm.type.charAt(0).toUpperCase() + comm.type.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(comm.date)}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate">{comm.notes}</div>
                          </TableCell>
                          <TableCell>
                            {comm.followUpRequired ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {comm.followUpDate ? formatDate(comm.followUpDate) : "Pending"}
                              </div>
                            ) : (
                              <Badge variant="outline">Not Required</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteCommunication(comm._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default CRM;