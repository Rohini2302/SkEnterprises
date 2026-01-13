// app/admin/sites/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, Eye, Trash2, Edit, MapPin, Building, DollarSign, Square, 
  Search, Users, Filter, BarChart, Calendar, RefreshCw, User, Briefcase,
  Loader2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { FormField } from "./sharedA";
import { Label } from "@/components/ui/label";
import { siteService, Site, Client, SiteStats, CreateSiteRequest } from "@/services/SiteService";
import notificationService from "@/lib/notificationService";

const ServicesList = [
  "Housekeeping",
  "Security",
  "Parking",
  "Waste Management"
];

const StaffRoles = [
  "Manager",
  "Supervisor",
  "Housekeeping Staff",
  "Security Guard",
  "Parking Attendant",
  "Waste Collector"
];

const SitesSection = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [staffDeployment, setStaffDeployment] = useState<Array<{ role: string; count: number }>>([]);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState<SiteStats>({
    totalSites: 0,
    totalStaff: 0,
    activeSites: 0,
    inactiveSites: 0,
    totalContractValue: 0
  });
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [clientSearch, setClientSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
    fetchStats();
    fetchClients();
    
    // Request notification permission on component mount
    notificationService.requestNotificationPermission();
  }, []);

  const fetchSites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sitesData = await siteService.getAllSites();
      setSites(sitesData || []);
    } catch (error: any) {
      console.error("Error fetching sites:", error);
      setError(error.message || "Failed to load sites");
      toast.error(error.message || "Failed to load sites");
      setSites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      setIsLoadingClients(true);
      const clientsData = await siteService.getAllClients();
      setClients(clientsData || []);
      
      if (clientsData && clientsData.length > 0) {
        setSelectedClient(clientsData[0]._id);
      }
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      setClients([]);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const searchClients = async (searchTerm: string) => {
    try {
      const clientsData = await siteService.searchClients(searchTerm);
      setClients(clientsData || []);
    } catch (error) {
      console.error("Error searching clients:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await siteService.getSiteStats();
      setStats(statsData || {
        totalSites: 0,
        totalStaff: 0,
        activeSites: 0,
        inactiveSites: 0,
        totalContractValue: 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      const safeSites = sites || [];
      const statusCounts = {
        active: safeSites.filter(s => s.status === 'active').length,
        inactive: safeSites.filter(s => s.status === 'inactive').length
      };
      setStats({
        totalSites: safeSites.length,
        totalStaff: safeSites.reduce((sum, site) => {
          const staff = Array.isArray(site.staffDeployment) 
            ? site.staffDeployment.reduce((s, d) => s + (d.count || 0), 0)
            : 0;
          return sum + staff;
        }, 0),
        activeSites: statusCounts.active,
        inactiveSites: statusCounts.inactive,
        totalContractValue: safeSites.reduce((sum, site) => sum + (site.contractValue || 0), 0)
      });
    }
  };

  const searchSites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const searchResults = await siteService.searchSites({
        query: searchQuery,
        status: statusFilter
      });
      setSites(searchResults || []);
    } catch (error: any) {
      console.error("Error searching sites:", error);
      setError(error.message || "Failed to search sites");
      toast.error(error.message || "Failed to search sites");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const updateStaffCount = (role: string, count: number) => {
    setStaffDeployment(prev => {
      const existing = prev.find(item => item.role === role);
      if (existing) {
        return prev.map(item =>
          item.role === role ? { ...item, count: Math.max(0, count) } : item
        );
      }
      return [...prev, { role, count }];
    });
  };

  const resetForm = () => {
    setSelectedServices([]);
    setStaffDeployment([]);
    setEditMode(false);
    setEditingSiteId(null);
    setSelectedClient("");
    setClientSearch("");
  };

  const handleViewSite = (site: Site) => {
    setSelectedSite(site);
    setViewDialogOpen(true);
  };

  const handleEditSite = (site: Site) => {
    setEditMode(true);
    setEditingSiteId(site._id);
    setSelectedServices(site.services || []);
    setStaffDeployment(site.staffDeployment || []);
    
    if (site.clientId) {
      const client = clients.find(c => c._id === site.clientId);
      if (client) {
        setSelectedClient(client._id);
      }
    }
    
    setTimeout(() => {
      const form = document.getElementById('site-form') as HTMLFormElement;
      if (form) {
        const safeAreaSqft = site.areaSqft || 0;
        const safeContractValue = site.contractValue || 0;
        const safeContractDate = site.contractEndDate 
          ? new Date(site.contractEndDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        
        (form.elements.namedItem('site-name') as HTMLInputElement).value = site.name || '';
        (form.elements.namedItem('location') as HTMLInputElement).value = site.location || '';
        (form.elements.namedItem('area-sqft') as HTMLInputElement).value = safeAreaSqft.toString();
        (form.elements.namedItem('contract-value') as HTMLInputElement).value = safeContractValue.toString();
        (form.elements.namedItem('contract-end-date') as HTMLInputElement).value = safeContractDate;
        
        if (!selectedClient) {
          (form.elements.namedItem('client-name-manual') as HTMLInputElement).value = site.clientName || '';
        }
      }
    }, 0);
    
    setDialogOpen(true);
  };

  const handleAddOrUpdateSite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    const formData = new FormData(e.currentTarget);

    let clientName = "";
    let clientId = "";

    if (selectedClient) {
      const client = clients.find(c => c._id === selectedClient);
      if (client) {
        clientName = client.name;
        clientId = client._id;
      }
    } else {
      clientName = formData.get("client-name-manual") as string;
    }

    if (!clientName?.trim()) {
      toast.error("Please select or enter a client name");
      return;
    }

    const siteData: CreateSiteRequest = {
      name: formData.get("site-name") as string,
      clientName: clientName.trim(),
      clientId: clientId || undefined,
      location: formData.get("location") as string,
      areaSqft: Number(formData.get("area-sqft")) || 0,
      contractValue: Number(formData.get("contract-value")) || 0,
      contractEndDate: formData.get("contract-end-date") as string,
      services: selectedServices,
      staffDeployment: staffDeployment.filter(item => item.count > 0),
      status: 'active'
    };

    // Validate site data
    const validationErrors: string[] = [];
    if (!siteData.name?.trim()) validationErrors.push("Site name is required");
    if (!siteData.clientName?.trim()) validationErrors.push("Client name is required");
    if (!siteData.location?.trim()) validationErrors.push("Location is required");
    if (siteData.areaSqft <= 0) validationErrors.push("Area must be greater than 0");
    if (siteData.contractValue <= 0) validationErrors.push("Contract value must be greater than 0");
    
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    try {
      if (editMode && editingSiteId) {
        const existingSite = sites.find(s => s._id === editingSiteId);
        const updatedSite = await siteService.updateSite(editingSiteId, siteData);
        if (updatedSite) {
          toast.success("Site updated successfully!");
          
          // Send notification for site update
          notificationService.notifySiteUpdate(
            siteData.name,
            siteData.clientName,
            'Admin',
            { 
              location: siteData.location,
              areaSqft: siteData.areaSqft,
              contractValue: siteData.contractValue 
            }
          );
          
          // Send notification for status change if status changed
          if (existingSite?.status !== siteData.status) {
            notificationService.notifySiteStatusChange(
              siteData.name,
              siteData.clientName,
              existingSite?.status || 'unknown',
              siteData.status,
              'Admin'
            );
          }
        }
      } else {
        const newSite = await siteService.createSite(siteData);
        if (newSite) {
          toast.success("Site added successfully!");
          
          // Send notification for new site
          notificationService.notifySiteAddition(
            siteData.name,
            siteData.clientName,
            'Admin',
            { 
              location: siteData.location,
              areaSqft: siteData.areaSqft,
              contractValue: siteData.contractValue 
            }
          );
        }
      }

      setDialogOpen(false);
      resetForm();
      (e.target as HTMLFormElement).reset();
      
      await fetchSites();
      await fetchStats();
      
    } catch (error: any) {
      console.error("Error saving site:", error);
      
      if (error.message?.includes('Duplicate entry') || error.message?.includes('duplicate')) {
        toast.error("Site name might already exist. Please try a different name.");
      } else if (error.message?.includes('id')) {
        toast.error("There was an issue with the site ID. Please try again.");
      } else {
        toast.error(error.message || "Failed to save site");
      }
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm("Are you sure you want to delete this site?")) {
      return;
    }

    try {
      const siteToDelete = sites.find(s => s._id === siteId);
      const result = await siteService.deleteSite(siteId);
      if (result?.success) {
        toast.success("Site deleted successfully!");
        
        if (siteToDelete) {
          // Send notification for site deletion
          notificationService.notifySiteDeletion(
            siteToDelete.name,
            siteToDelete.clientName,
            'Admin'
          );
        }
      } else {
        toast.error("Failed to delete site");
      }
      
      await fetchSites();
      await fetchStats();
    } catch (error: any) {
      console.error("Error deleting site:", error);
      toast.error(error.message || "Failed to delete site");
    }
  };

  const handleToggleStatus = async (siteId: string) => {
    try {
      const site = sites.find(s => s._id === siteId);
      if (!site) return;
      
      const oldStatus = site.status;
      const newStatus = site.status === 'active' ? 'inactive' : 'active';
      
      const updatedSite = await siteService.toggleSiteStatus(siteId);
      if (updatedSite) {
        toast.success("Site status updated!");
        
        // Send notification for status change
        notificationService.notifySiteStatusChange(
          site.name,
          site.clientName,
          oldStatus,
          newStatus,
          'Admin'
        );
      }
      
      await fetchSites();
      await fetchStats();
    } catch (error: any) {
      console.error("Error toggling site status:", error);
      toast.error(error.message || "Failed to update site status");
    }
  };

  const formatCurrency = (amount: number | undefined): string => {
    return amount ? `₹${amount.toLocaleString('en-IN')}` : '₹0';
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatNumber = (num: number | undefined): string => {
    if (!num) return '0';
    return num.toLocaleString('en-IN');
  };

  const getTotalStaff = (site: Site): number => {
    if (!Array.isArray(site.staffDeployment)) return 0;
    return site.staffDeployment.reduce((sum, deploy) => sum + (deploy.count || 0), 0);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setDialogOpen(open);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchSites();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    fetchSites();
  };

  const calculateAverageArea = (): string => {
    if (sites.length === 0) return '0';
    const totalArea = sites.reduce((sum, site) => sum + (site.areaSqft || 0), 0);
    const average = totalArea / sites.length;
    return Math.round(average / 1000).toString();
  };

  const renderClientsDropdown = () => {
    if (isLoadingClients) {
      return (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading clients...</span>
        </div>
      );
    }
    
    const safeClients = clients || [];
    
    return (
      <>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">Select a client...</option>
          {safeClients.length === 0 ? (
            <option value="" disabled>
              No clients found. Add clients in the Clients section.
            </option>
          ) : (
            safeClients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.name} - {client.company} ({client.city})
              </option>
            ))
          )}
        </select>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sites</p>
                <p className="text-2xl font-bold">{stats.totalSites}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 text-sm">
              <span className="text-green-600 font-medium">{stats.activeSites} active</span>
              <span className="mx-2">•</span>
              <span className="text-gray-600">{stats.inactiveSites} inactive</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{stats.totalStaff}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contract Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalContractValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Area</p>
                <p className="text-2xl font-bold">{calculateAverageArea()}K sqft</p>
              </div>
              <BarChart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sites by name, client, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button type="button" variant="outline" onClick={handleResetFilters}>
                  Reset
                </Button>
                <Button type="button" variant="outline" onClick={() => { fetchSites(); fetchStats(); fetchClients(); }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh All
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Site Management</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Site
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editMode ? "Edit Site" : "Add New Site"}</DialogTitle>
              </DialogHeader>

              <form id="site-form" onSubmit={handleAddOrUpdateSite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Site Name" id="site-name" required>
                    <Input 
                      id="site-name" 
                      name="site-name" 
                      placeholder="Enter site name" 
                      required 
                      defaultValue=""
                    />
                  </FormField>

                  <div className="space-y-2">
                    <Label htmlFor="client-select" className="text-sm font-medium">
                      Select Client <span className="text-muted-foreground text-xs">(or enter manually below)</span>
                    </Label>
                    {renderClientsDropdown()}
                  </div>

                  <FormField label="Location" id="location" required>
                    <Input 
                      id="location" 
                      name="location" 
                      placeholder="Enter location" 
                      required 
                      defaultValue=""
                    />
                  </FormField>
                  <FormField label="Area (sqft)" id="area-sqft" required>
                    <Input 
                      id="area-sqft" 
                      name="area-sqft" 
                      type="number" 
                      placeholder="Enter area in sqft" 
                      required 
                      min="1"
                      defaultValue="1000"
                    />
                  </FormField>
                  <FormField label="Contract Value (₹)" id="contract-value" required>
                    <Input 
                      id="contract-value" 
                      name="contract-value" 
                      type="number" 
                      placeholder="Enter contract value" 
                      required 
                      min="0"
                      defaultValue="100000"
                    />
                  </FormField>
                  <FormField label="Contract End Date" id="contract-end-date" required>
                    <Input 
                      id="contract-end-date" 
                      name="contract-end-date" 
                      type="date" 
                      required 
                      min={new Date().toISOString().split('T')[0]}
                      defaultValue={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    />
                  </FormField>
                </div>

                {!selectedClient && (
                  <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-md">
                    <FormField label="Client Name (Manual Entry)" id="client-name-manual" required>
                      <Input 
                        id="client-name-manual" 
                        name="client-name-manual" 
                        placeholder="Enter client name if not in list above" 
                        required 
                        defaultValue=""
                      />
                    </FormField>
                    <p className="text-xs text-yellow-700 mt-1">
                      Client will be saved as a text field. For better tracking, add the client to the Clients section first.
                    </p>
                  </div>
                )}

                <div className="border p-4 rounded-md">
                  <p className="font-medium mb-3">Services for this Site</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ServicesList.map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox
                          id={`service-${service}`}
                          checked={selectedServices.includes(service)}
                          onCheckedChange={() => toggleService(service)}
                        />
                        <label htmlFor={`service-${service}`} className="cursor-pointer">
                          {service}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border p-4 rounded-md">
                  <p className="font-medium mb-3">Staff Deployment</p>
                  <div className="space-y-3">
                    {StaffRoles.map((role) => {
                      const deployment = staffDeployment.find(item => item.role === role);
                      const count = deployment?.count || 0;
                      return (
                        <div key={role} className="flex items-center justify-between">
                          <span>{role}</span>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateStaffCount(role, count - 1)}
                              disabled={count <= 0}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={count}
                              onChange={(e) => updateStaffCount(role, parseInt(e.target.value) || 0)}
                              className="w-20 text-center"
                              min="0"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateStaffCount(role, count + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  {editMode ? "Update Site" : "Add Site"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading sites...</span>
            </div>
          ) : !sites || sites.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Sites Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search filters'
                  : 'Get started by adding your first site'
                }
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Site
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Area (sqft)</TableHead>
                    <TableHead>Contract Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites.map((site) => {
                    const safeAreaSqft = site.areaSqft || 0;
                    const safeContractValue = site.contractValue || 0;
                    const safeStaffDeployment = Array.isArray(site.staffDeployment) ? site.staffDeployment : [];
                    const safeServices = Array.isArray(site.services) ? site.services : [];
                    
                    return (
                      <TableRow key={site._id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{site.name || 'Unnamed Site'}</div>
                            <div className="text-xs text-muted-foreground">
                              Added: {formatDate(site.createdAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{site.clientName || 'Unknown Client'}</div>
                            {site.clientDetails && (
                              <div className="text-xs text-muted-foreground">
                                {site.clientDetails.company}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{site.location || 'Unknown Location'}</TableCell>
                        <TableCell className="w-[160px]">
                          <div className="flex flex-wrap gap-1">
                            {safeServices.map((srv, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {srv}
                              </Badge>
                            ))}
                            {safeServices.length === 0 && (
                              <span className="text-xs text-muted-foreground">No services</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="mr-1">
                              Total: {getTotalStaff(site)}
                            </Badge>
                            {safeStaffDeployment.slice(0, 2).map((deploy, i) => (
                              <div key={i} className="text-xs text-muted-foreground">
                                {deploy.role}: {deploy.count}
                              </div>
                            ))}
                            {safeStaffDeployment.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{safeStaffDeployment.length - 2} more
                              </div>
                            )}
                            {safeStaffDeployment.length === 0 && (
                              <div className="text-xs text-muted-foreground">No staff assigned</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatNumber(safeAreaSqft)}</TableCell>
                        <TableCell>{formatCurrency(safeContractValue)}</TableCell>
                        <TableCell>
                          <Badge variant={site.status === "active" ? "default" : "secondary"}>
                            {site.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewSite(site)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSite(site)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(site._id)}
                            >
                              {site.status === "active" ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteSite(site._id)}
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
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Site Details</DialogTitle>
          </DialogHeader>
          
          {selectedSite && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Site Name</h3>
                    <p className="text-lg font-semibold">{selectedSite.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
                    <p className="text-lg font-semibold">{selectedSite.clientName}</p>
                    {selectedSite.clientDetails && (
                      <div className="text-sm text-muted-foreground mt-1">
                        <div>{selectedSite.clientDetails.company}</div>
                        <div>{selectedSite.clientDetails.email}</div>
                        <div>{selectedSite.clientDetails.phone}</div>
                        <div>{selectedSite.clientDetails.city}, {selectedSite.clientDetails.state}</div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-lg font-semibold">{selectedSite.location}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Area</h3>
                    <div className="flex items-center gap-2">
                      <Square className="h-4 w-4 text-muted-foreground" />
                      <p className="text-lg font-semibold">{formatNumber(selectedSite.areaSqft)} sqft</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contract Value</h3>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <p className="text-lg font-semibold">{formatCurrency(selectedSite.contractValue)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contract End Date</h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-lg font-semibold">{formatDate(selectedSite.contractEndDate)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <Badge variant={selectedSite.status === "active" ? "default" : "secondary"}>
                      {selectedSite.status?.toUpperCase() || 'ACTIVE'}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                    <p className="text-sm">{formatDate(selectedSite.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(selectedSite.services) && selectedSite.services.length > 0 ? (
                    selectedSite.services.map((service, index) => (
                      <Badge key={index} variant="secondary">
                        {service}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No services assigned</p>
                  )}
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Staff Deployment</h3>
                <div className="space-y-3">
                  {Array.isArray(selectedSite.staffDeployment) && selectedSite.staffDeployment.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedSite.staffDeployment.map((deploy, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm font-medium">{deploy.role}</span>
                            <Badge variant="outline">{deploy.count} staff</Badge>
                          </div>
                        ))}
                      </div>
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Total Staff:</span>
                          <span className="text-lg font-bold">{getTotalStaff(selectedSite)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No staff deployed</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEditSite(selectedSite);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Site
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleToggleStatus(selectedSite._id)}
                >
                  {selectedSite.status === "active" ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleDeleteSite(selectedSite._id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Site
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SitesSection;