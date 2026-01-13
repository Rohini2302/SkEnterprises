// app/(dashboard)/admin/notifications/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, CheckCheck, Trash2, Filter, Building, RefreshCw, Search, 
  AlertCircle, ExternalLink, Calendar, User, Briefcase, Settings,
  BellOff, BellRing, Clock, Archive, X, CheckCircle, AlertTriangle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import NotificationService, { NotificationItem } from "@/lib/notificationService";
import { cn } from "@/lib/utils";

const AdminNotifications = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Initialize notifications
  useEffect(() => {
    const notificationService = NotificationService;
    
    // Load initial notifications
    setNotifications(notificationService.getNotifications());
    
    // Subscribe to notification changes
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    // Request notification permission on mount
    notificationService.requestNotificationPermission().catch(console.error);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleMarkAsRead = (id: string) => {
    const success = NotificationService.markAsRead(id);
    if (success) {
      toast({
        title: "Marked as read",
        description: "Notification has been marked as read",
      });
    }
  };

  const handleMarkAllAsRead = () => {
    const markedCount = NotificationService.markAllAsRead();
    toast({
      title: "All marked as read",
      description: `${markedCount} notifications marked as read`,
    });
  };

  const handleDelete = (id: string) => {
    const success = NotificationService.deleteNotification(id);
    if (success) {
      toast({
        title: "Deleted",
        description: "Notification has been deleted",
      });
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0) {
      toast({
        title: "No notifications",
        description: "There are no notifications to clear",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to clear all ${notifications.length} notifications?`)) {
      const clearedCount = NotificationService.clearAllNotifications();
      toast({
        title: "Cleared",
        description: `${clearedCount} notifications cleared`,
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setNotifications([...NotificationService.getNotifications()]);
    setIsRefreshing(false);
    
    toast({
      title: "Refreshed",
      description: "Notifications refreshed successfully",
    });
  };

  const handleAddTestNotification = () => {
    NotificationService.addNotification({
      title: '🧪 Test Notification',
      message: 'This is a test notification to verify the system is working properly.',
      type: 'system',
      metadata: { test: true }
    });
    
    toast({
      title: "Test notification added",
      description: "Check your notifications list",
    });
  };

  const handleClearByType = (type: string) => {
    const count = NotificationService.clearByType(type);
    if (count > 0) {
      toast({
        title: "Cleared",
        description: `${count} ${type} notifications cleared`,
      });
    } else {
      toast({
        title: "No notifications",
        description: `No ${type} notifications found`,
      });
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "site": return "bg-purple-500";
      case "leave": return "bg-blue-500";
      case "task": return "bg-green-500";
      case "approval": return "bg-yellow-500";
      case "system": return "bg-gray-500";
      default: return "bg-primary";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "site": return <Building className="h-4 w-4" />;
      case "leave": return <Calendar className="h-4 w-4" />;
      case "task": return <CheckCircle className="h-4 w-4" />;
      case "approval": return <AlertTriangle className="h-4 w-4" />;
      case "system": return <Settings className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "site": return "Sites";
      case "leave": return "Leave";
      case "task": return "Tasks";
      case "approval": return "Approvals";
      case "system": return "System";
      default: return type;
    }
  };

  const getTypeCount = (type: string): number => {
    return notifications.filter(n => n.type === type).length;
  };

  const getUnreadCount = (): number => {
    return notifications.filter(n => !n.isRead).length;
  };

  const filteredNotifications = notifications.filter(notification => {
    // Filter by tab
    if (filter === "unread" && notification.isRead) return false;
    if (filter !== "all" && filter !== "unread" && notification.type !== filter) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        notification.type.toLowerCase().includes(query)
      );
    }
    
    // Filter by selected types
    if (selectedTypes.length > 0 && !selectedTypes.includes(notification.type)) {
      return false;
    }
    
    return true;
  });

  const unreadCount = getUnreadCount();
  const totalCount = notifications.length;

  const typeCounts = {
    site: getTypeCount("site"),
    leave: getTypeCount("leave"),
    task: getTypeCount("task"),
    approval: getTypeCount("approval"),
    system: getTypeCount("system"),
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        title="Notifications" 
        subtitle="Stay updated with all system activities and alerts"
        onMenuClick={onMenuClick}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddTestNotification}
            >
              <BellRing className="h-4 w-4 mr-2" />
              Test
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Notifications</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unread</p>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                </div>
                <BellRing className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Site Notifications</p>
                  <p className="text-2xl font-bold">{typeCounts.site}</p>
                </div>
                <Building className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Latest</p>
                  <p className="text-sm font-semibold">
                    {notifications.length > 0 
                      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'No notifications'
                    }
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Notification Center</CardTitle>
                    <CardDescription>
                      Real-time updates from system activities
                    </CardDescription>
                  </div>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount} New
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {unreadCount > 0 && (
                    <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Mark All Read
                    </Button>
                  )}
                  {totalCount > 0 && (
                    <Button onClick={handleClearAll} variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Search and Filter */}
            <div className="px-6 pb-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Type Filters */}
              <div className="flex flex-wrap gap-2">
                {["site", "leave", "task", "approval", "system"].map((type) => (
                  <Button
                    key={type}
                    variant={selectedTypes.includes(type) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedTypes(prev =>
                        prev.includes(type)
                          ? prev.filter(t => t !== type)
                          : [...prev, type]
                      );
                    }}
                    className="gap-2"
                  >
                    {getTypeIcon(type)}
                    {getTypeLabel(type)}
                    {typeCounts[type as keyof typeof typeCounts] > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {typeCounts[type as keyof typeof typeCounts]}
                      </Badge>
                    )}
                  </Button>
                ))}
                {selectedTypes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTypes([])}
                    className="ml-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
              <div className="px-6">
                <TabsList className="w-full md:w-auto">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    All
                    <Badge variant="secondary" className="ml-1">
                      {totalCount}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="flex items-center gap-2">
                    Unread
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-1">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="site" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Sites
                    {typeCounts.site > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {typeCounts.site}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <CardContent className="pt-6">
                <AnimatePresence mode="wait">
                  <TabsContent value={filter} className="space-y-4">
                    {filteredNotifications.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="text-center py-12"
                      >
                        <BellOff className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          {searchQuery 
                            ? `No notifications match "${searchQuery}". Try a different search.`
                            : filter === "unread"
                            ? "You're all caught up! No unread notifications."
                            : filter !== "all"
                            ? `No ${filter} notifications found.`
                            : "You're all caught up! New notifications will appear here."
                          }
                        </p>
                        {searchQuery || filter !== "all" || selectedTypes.length > 0 ? (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => {
                              setSearchQuery("");
                              setFilter("all");
                              setSelectedTypes([]);
                            }}
                          >
                            Clear all filters
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={handleAddTestNotification}
                          >
                            Add test notification
                          </Button>
                        )}
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        {filteredNotifications.map((notification, index) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={cn(
                              "p-4 rounded-lg border transition-all duration-200",
                              notification.isRead 
                                ? "bg-background hover:bg-muted/30" 
                                : "bg-primary/5 border-primary/20 shadow-sm"
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start gap-3">
                                  <div className={cn(
                                    "p-2 rounded-lg",
                                    notification.isRead 
                                      ? "bg-muted" 
                                      : "bg-primary/10"
                                  )}>
                                    {getTypeIcon(notification.type)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className={cn(
                                        "font-semibold text-sm",
                                        !notification.isRead && "text-primary"
                                      )}>
                                        {notification.title}
                                      </h4>
                                      {!notification.isRead && (
                                        <Badge variant="secondary" className="text-xs">New</Badge>
                                      )}
                                      <Badge variant="outline" className="text-xs capitalize ml-auto">
                                        {notification.type}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {notification.timestamp}
                                      </div>
                                      {notification.metadata?.siteName && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Building className="h-3 w-3" />
                                          {notification.metadata.siteName}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {!notification.isRead && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    title="Mark as read"
                                    className="h-8 w-8 p-0"
                                  >
                                    <CheckCheck className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(notification.id)}
                                  title="Delete notification"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </AnimatePresence>
              </CardContent>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminNotifications;