import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Trash2, Phone, Mail, Calendar, Eye, Volume2, VolumeX, Settings } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import notificationService from "../../lib/notificationService";

const API_BASE_URL = "http://localhost:5001/api";

interface Communication {
  _id: string;
  clientName: string;
  clientId: {
    _id: string;
    name: string;
    company: string;
    email: string;
  } | string;
  type: "call" | "email" | "meeting" | "demo";
  date: string;
  notes: string;
  followUpRequired: boolean;
  followUpDate?: string;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "success" | "warning" | "info" | "urgent";
  read: boolean;
  followUpDate?: string;
  communicationType?: string;
  clientName?: string;
  notes?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

interface NotificationSettings {
  desktopNotifications: boolean;
  soundNotifications: boolean;
  soundVolume: number;
  notificationFrequency: 'realtime' | '5min' | '15min' | '30min';
  showOverdue: boolean;
  showToday: boolean;
  showUpcoming: boolean;
}

// API functions
const api = {
  async getCommunications() {
    const timestamp = new Date().getTime();
    const res = await fetch(`${API_BASE_URL}/crm/communications?t=${timestamp}`);
    if (!res.ok) throw new Error('Failed to fetch communications');
    return res.json();
  },

  async getUnreadNotifications() {
    const res = await fetch(`${API_BASE_URL}/notifications/unread`);
    if (!res.ok) throw new Error('Failed to fetch unread notifications');
    return res.json();
  },

  async markNotificationAsRead(id: string) {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },

  async deleteNotification(id: string) {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete notification');
    return res.json();
  },

  async markAllNotificationsAsRead() {
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to mark all notifications as read');
    return res.json();
  },

  async createNotification(data: Partial<Notification>) {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create notification');
    return res.json();
  }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewNotification, setViewNotification] = useState<Notification | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [newNotificationsCount, setNewNotificationsCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  // Notification settings
  const [settings, setSettings] = useState<NotificationSettings>({
    desktopNotifications: true,
    soundNotifications: true,
    soundVolume: 70,
    notificationFrequency: 'realtime',
    showOverdue: true,
    showToday: true,
    showUpcoming: true,
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Request notification permission on load
    notificationService.requestNotificationPermission();
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  // Network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isFollowUpToday = (followUpDate?: string) => {
    if (!followUpDate) return false;
    const today = new Date();
    const followUp = new Date(followUpDate);
    return (
      followUp.getDate() === today.getDate() &&
      followUp.getMonth() === today.getMonth() &&
      followUp.getFullYear() === today.getFullYear()
    );
  };

  const isFollowUpOverdue = (followUpDate?: string) => {
    if (!followUpDate) return false;
    const today = new Date();
    const followUp = new Date(followUpDate);
    today.setHours(0, 0, 0, 0);
    followUp.setHours(0, 0, 0, 0);
    return followUp < today;
  };

  const isFollowUpUrgent = (followUpDate?: string) => {
    if (!followUpDate) return false;
    const today = new Date();
    const followUp = new Date(followUpDate);
    const diffHours = (followUp.getTime() - today.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 2; // Urgent if within 2 hours
  };

  const convertToNotifications = (communications: Communication[]): Notification[] => {
    const today = new Date().toISOString().split('T')[0];
    
    return communications
      .filter(comm => comm.followUpRequired && comm.followUpDate)
      .map(comm => {
        const followUpDate = comm.followUpDate || "";
        const isToday = isFollowUpToday(followUpDate);
        const isOverdue = isFollowUpOverdue(followUpDate);
        const isUrgent = isFollowUpUrgent(followUpDate);
        
        let type: "success" | "warning" | "info" | "urgent" = "info";
        let title = "";
        let priority: "low" | "medium" | "high" = "medium";

        if (isOverdue) {
          type = "warning";
          title = "⚠️ Follow-up Overdue";
          priority = "high";
        } else if (isUrgent) {
          type = "urgent";
          title = "🚨 Urgent Follow-up";
          priority = "high";
        } else if (isToday) {
          type = "success";
          title = "✓ Follow-up Today";
          priority = "medium";
        } else {
          type = "info";
          title = "📅 Follow-up Scheduled";
          priority = "low";
        }

        const formattedDate = new Date(followUpDate).toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return {
          id: comm._id,
          title: `${title} - ${comm.type.charAt(0).toUpperCase() + comm.type.slice(1)}`,
          message: `Follow-up with ${comm.clientName} for ${comm.type}`,
          time: formatTimeAgo(comm.createdAt),
          type,
          read: false,
          followUpDate: formattedDate,
          communicationType: comm.type,
          clientName: comm.clientName,
          notes: comm.notes,
          priority,
          createdAt: comm.createdAt
        };
      })
      .filter(notification => {
        if (notification.type === 'warning' && !settings.showOverdue) return false;
        if (notification.type === 'success' && !settings.showToday) return false;
        if (notification.type === 'info' && !settings.showUpcoming) return false;
        if (notification.type === 'urgent') return true; // Always show urgent
        return true;
      })
      .sort((a, b) => {
        // Sort by priority: urgent > overdue > today > upcoming
        const priorityOrder = { 'urgent': 0, 'warning': 1, 'success': 2, 'info': 3 };
        if (priorityOrder[a.type] !== priorityOrder[b.type]) {
          return priorityOrder[a.type] - priorityOrder[b.type];
        }
        
        // Then sort by date
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  };

  const showSystemNotificationForNew = (newNotifications: Notification[]) => {
    if (!settings.desktopNotifications) return;

    newNotifications.forEach(notification => {
      if (notification.priority === 'high' || notification.type === 'urgent') {
        notificationService.showSystemNotification(notification.title, {
          body: notification.message,
          tag: notification.id,
          data: { url: window.location.href }
        });
      }
    });
  };

  const fetchNotifications = async (showNewIndicator = true) => {
    if (!isOnline) {
      toast.error("You are offline. Please check your internet connection.");
      return;
    }

    try {
      setLoading(true);
      const result = await api.getCommunications();
      
      if (result.success) {
        const communications = result.data as Communication[];
        const newNotifications = convertToNotifications(communications);
        
        // Find new notifications (not in current list)
        const oldIds = new Set(notifications.map(n => n.id));
        const trulyNew = newNotifications.filter(n => !oldIds.has(n.id));
        
        // Update notifications
        setNotifications(newNotifications);
        
        // Show system notification for new ones
        if (showNewIndicator && trulyNew.length > 0 && settings.desktopNotifications) {
          showSystemNotificationForNew(trulyNew);
          setNewNotificationsCount(trulyNew.length);
          
          // Play sound if enabled
          if (settings.soundNotifications && trulyNew.some(n => n.priority === 'high')) {
            notificationService.showSystemNotification("New High Priority Notifications", {
              body: `You have ${trulyNew.length} new notifications`
            });
          }
        }
        
        setLastChecked(new Date());
      }
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(false); // Initial load without notifications
    
    // Set up periodic checking based on settings
    const frequencyMap = {
      'realtime': 10000, // 10 seconds
      '5min': 300000, // 5 minutes
      '15min': 900000, // 15 minutes
      '30min': 1800000 // 30 minutes
    };

    const interval = setInterval(() => {
      fetchNotifications(true);
    }, frequencyMap[settings.notificationFrequency]);

    return () => clearInterval(interval);
  }, [settings.notificationFrequency]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setNewNotificationsCount(0);
      toast.success("All notifications marked as read!");
    } catch (error: any) {
      toast.error(error.message || "Failed to mark all notifications as read");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success("Notification deleted!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete notification");
    }
  };

  const handleViewDetails = (notification: Notification) => {
    setViewNotification(notification);
    setDialogOpen(true);
    
    // Mark as read when viewing details
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error: any) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case "success": return "default";
      case "warning": return "destructive";
      case "urgent": return "destructive";
      case "info": return "secondary";
      default: return "outline";
    }
  };

  const getCommunicationIcon = (type?: string) => {
    switch(type) {
      case "call": return <Phone className="h-4 w-4 mr-2" />;
      case "email": return <Mail className="h-4 w-4 mr-2" />;
      case "meeting": return <Calendar className="h-4 w-4 mr-2" />;
      case "demo": return <Eye className="h-4 w-4 mr-2" />;
      default: return <Bell className="h-4 w-4 mr-2" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const testNotification = () => {
    if (settings.desktopNotifications) {
      notificationService.showSystemNotification("Test Notification", {
        body: "This is a test notification from your CRM system.",
        icon: "/favicon.ico"
      });
      toast.success("Test notification sent!");
    } else {
      toast.error("Please enable desktop notifications first");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Notifications" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6"
      >
        {/* Header with stats and controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <span className="text-lg font-semibold">
                {unreadCount} Unread Notification{unreadCount !== 1 && "s"}
              </span>
              {newNotificationsCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {newNotificationsCount} New
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {!isOnline && (
                <Badge variant="outline" className="text-destructive">
                  Offline
                </Badge>
              )}
              <span>Last checked: {lastChecked.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Notification Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="desktop">Desktop Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show system notifications
                      </p>
                    </div>
                    <Switch
                      id="desktop"
                      checked={settings.desktopNotifications}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, desktopNotifications: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sound">Sound Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Play sound for new notifications
                      </p>
                    </div>
                    <Switch
                      id="sound"
                      checked={settings.soundNotifications}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, soundNotifications: checked})
                      }
                    />
                  </div>

                  {settings.soundNotifications && (
                    <div className="space-y-2">
                      <Label htmlFor="volume">Sound Volume</Label>
                      <div className="flex items-center gap-2">
                        <VolumeX className="h-4 w-4" />
                        <Slider
                          id="volume"
                          min={0}
                          max={100}
                          step={1}
                          value={[settings.soundVolume]}
                          onValueChange={([value]) => 
                            setSettings({...settings, soundVolume: value})
                          }
                          className="flex-1"
                        />
                        <Volume2 className="h-4 w-4" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="frequency">Check Frequency</Label>
                    <Select
                      value={settings.notificationFrequency}
                      onValueChange={(value: any) => 
                        setSettings({...settings, notificationFrequency: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Realtime (10s)</SelectItem>
                        <SelectItem value="5min">Every 5 minutes</SelectItem>
                        <SelectItem value="15min">Every 15 minutes</SelectItem>
                        <SelectItem value="30min">Every 30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Show Notification Types</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="overdue"
                          checked={settings.showOverdue}
                          onCheckedChange={(checked) => 
                            setSettings({...settings, showOverdue: checked})
                          }
                        />
                        <Label htmlFor="overdue" className="cursor-pointer">
                          Overdue Follow-ups
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="today"
                          checked={settings.showToday}
                          onCheckedChange={(checked) => 
                            setSettings({...settings, showToday: checked})
                          }
                        />
                        <Label htmlFor="today" className="cursor-pointer">
                          Today's Follow-ups
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="upcoming"
                          checked={settings.showUpcoming}
                          onCheckedChange={(checked) => 
                            setSettings({...settings, showUpcoming: checked})
                          }
                        />
                        <Label htmlFor="upcoming" className="cursor-pointer">
                          Upcoming Follow-ups
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={testNotification}
                  >
                    Test Notification
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              onClick={() => fetchNotifications(true)} 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
            
            <Button 
              onClick={handleMarkAllRead} 
              disabled={unreadCount === 0}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground mb-4">
                {settings.showOverdue || settings.showToday || settings.showUpcoming 
                  ? "No follow-ups matching your filters."
                  : "All notification types are disabled. Enable them in settings."}
              </p>
              <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Adjust Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.005 }}
              >
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.read ? "border-l-4 border-l-primary bg-primary/5" : ""
                  } ${
                    notification.type === 'urgent' ? "border-red-500/50 bg-red-50 dark:bg-red-950/20" :
                    notification.type === 'warning' ? "border-orange-500/50 bg-orange-50 dark:bg-orange-950/20" :
                    notification.type === 'success' ? "border-green-500/50 bg-green-50 dark:bg-green-950/20" : ""
                  }`}
                  onClick={() => handleViewDetails(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getCommunicationIcon(notification.communicationType)}
                          <h4 className="font-semibold">{notification.title}</h4>
                          <Badge variant={getTypeColor(notification.type)}>
                            {notification.type}
                          </Badge>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                          {!notification.read && (
                            <Badge variant="default" className="animate-pulse text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {notification.followUpDate}
                          </span>
                          <span>•</span>
                          <span>{notification.time}</span>
                          {notification.clientName && (
                            <>
                              <span>•</span>
                              <span className="font-medium">Client: {notification.clientName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className={notification.read ? "text-muted-foreground" : "text-primary"}
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Low Priority</span>
            </div>
          </div>
          <div>
            Showing {notifications.length} of {notifications.length} notifications
          </div>
        </div>
      </motion.div>

      {/* Notification Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
          </DialogHeader>
          {viewNotification && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getCommunicationIcon(viewNotification.communicationType)}
                <h3 className="text-lg font-semibold">{viewNotification.title}</h3>
                <Badge variant={getTypeColor(viewNotification.type)}>
                  {viewNotification.type}
                </Badge>
                <div className={`w-3 h-3 rounded-full ${getPriorityColor(viewNotification.priority)}`} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Client</h4>
                  <p className="font-medium">{viewNotification.clientName || "N/A"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Follow-up Date</h4>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{viewNotification.followUpDate || "N/A"}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Type</h4>
                  <p className="font-medium capitalize">{viewNotification.communicationType || "N/A"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Received</h4>
                  <p className="font-medium">{viewNotification.time}</p>
                </div>
              </div>

              {viewNotification.notes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Notes</h4>
                  <div className="p-3 border rounded-md bg-muted/50">
                    <p className="text-sm">{viewNotification.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (!viewNotification.read) {
                      handleMarkAsRead(viewNotification.id);
                    }
                    setDialogOpen(false);
                  }}
                  className="flex-1"
                >
                  Mark as Read
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleDelete(viewNotification.id);
                    setDialogOpen(false);
                  }}
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;