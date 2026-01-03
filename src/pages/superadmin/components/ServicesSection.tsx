import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Service {
  _id: string;
  id?: string;
  name: string;
  status: 'operational' | 'maintenance' | 'down';
  assignedTeam: string;
  lastChecked: string;
  description?: string;
  createdByRole?: string;
  updatedByRole?: string;
}

const ServicesSection = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);

  // API Base URL
  const API_BASE_URL = "http://localhost:5001/api";

  // Fetch services from backend
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/services`);
      
      if (!response.ok) throw new Error('Failed to fetch services');
      
      const data = await response.json();
      if (data.success) {
        // Transform data to match frontend structure
        const transformedServices = data.data.map((service: any) => ({
          _id: service._id,
          id: service._id, // Keep id for compatibility
          name: service.name,
          status: service.status,
          assignedTeam: service.assignedTeam,
          lastChecked: new Date(service.lastChecked).toISOString().split('T')[0],
          description: service.description,
          createdByRole: service.createdByRole || 'superadmin',
          updatedByRole: service.updatedByRole
        }));
        
        setServices(transformedServices);
      }
    } catch (error) {
      toast.error("Failed to fetch services");
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      
      const serviceData = {
        name: formData.get("name") as string,
        status: formData.get("status") as 'operational' | 'maintenance' | 'down',
        assignedTeam: formData.get("assignedTeam") as string,
        description: formData.get("description") as string,
        createdBy: "Super Admin",
        createdByRole: "superadmin"
      };
      
      const response = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData)
      });
      
      if (!response.ok) throw new Error('Failed to create service');
      
      const data = await response.json();
      if (data.success) {
        toast.success("Service created successfully");
        setServiceDialogOpen(false);
        fetchServices(); // Refresh the list
      }
    } catch (error) {
      toast.error("Failed to create service");
      console.error("Error creating service:", error);
    }
  };

  const handleUpdateStatus = async (serviceId: string, status: Service["status"]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/services/${serviceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          updatedBy: "Super Admin",
          updatedByRole: "superadmin"
        })
      });
      
      if (!response.ok) throw new Error('Failed to update service status');
      
      const data = await response.json();
      if (data.success) {
        // Update local state
        setServices(prev => prev.map(service => 
          service._id === serviceId ? { 
            ...service, 
            status,
            lastChecked: new Date().toISOString().split('T')[0],
            updatedByRole: "superadmin"
          } : service
        ));
        
        toast.success(`Service status updated to ${status}`);
      }
    } catch (error) {
      toast.error("Failed to update service status");
      console.error("Error updating service status:", error);
    }
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Service Monitoring</CardTitle>
          <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Service</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddService} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="operational">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="down">Down</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTeam">Assigned Team</Label>
                  <Input id="assignedTeam" name="assignedTeam" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
                <Button type="submit" className="w-full">Add Service</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading services...</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service._id} className="relative">
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
                      {service.createdByRole && (
                        <p className="text-xs text-muted-foreground">
                          Created by: {service.createdByRole}
                        </p>
                      )}
                      {service.updatedByRole && (
                        <p className="text-xs text-muted-foreground">
                          Last updated by: {service.updatedByRole}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant={service.status === "operational" ? "default" : "outline"}
                        onClick={() => handleUpdateStatus(service._id, "operational")}
                      >
                        Operational
                      </Button>
                      <Button 
                        size="sm" 
                        variant={service.status === "maintenance" ? "secondary" : "outline"}
                        onClick={() => handleUpdateStatus(service._id, "maintenance")}
                      >
                        Maintenance
                      </Button>
                      <Button 
                        size="sm" 
                        variant={service.status === "down" ? "destructive" : "outline"}
                        onClick={() => handleUpdateStatus(service._id, "down")}
                      >
                        Down
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicesSection;