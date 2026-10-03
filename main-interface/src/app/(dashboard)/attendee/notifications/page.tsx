"use client";
// 

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Bell,
//   Ticket,
//   Users,
//   AlertCircle,
//   Clock,
//   Megaphone,
//   Check,
//   CheckCheck,
//   Star,
// } from "lucide-react";



import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Ticket,
  Users,
  AlertCircle,
  Clock,
  Megaphone,
  CheckCheck,
  Star,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type:
    | "booking"
    | "crowd"
    | "alert"
    | "announcement"
    | "reminder"
    | "priority_status";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  data?: any;
}

type NotificationType = "all" | "booking" | "crowd" | "alert" | "announcement";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationType>("all");
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Unauthorized. Please sign in.");
          return;
        }
        throw new Error("Failed to fetch notifications");
      }
      const data = await res.json();
      setNotifs(data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  const filteredNotifs =
    activeTab === "all" ? notifs : notifs.filter((n) => n.type === activeTab);

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifs(notifs.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
    // TODO: Implement backend 'mark all read' endpoint if needed
  };

  const markAsRead = (id: string) => {
    setNotifs(notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    // TODO: Implement backend 'mark read' endpoint
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "booking":
        return Ticket;
      case "crowd":
        return Users;
      case "alert":
        return AlertCircle;
      case "reminder":
        return Clock;
      case "priority_status":
        return Star;
      case "announcement":
        return Megaphone;
      default:
        return Bell;
    }
  };

  const getIconColor = (type: string) => {
    const colors: Record<string, string> = {
      booking: "text-primary bg-primary/10",
      crowd: "text-chart-1 bg-chart-1/10",
      reminder: "text-chart-2 bg-chart-2/10",
      priority_status: "text-chart-3 bg-chart-3/10",
      announcement: "text-blue-600 bg-blue-500/10",
      alert: "text-destructive bg-destructive/10",
    };
    return colors[type] || "text-muted-foreground bg-muted";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </Button>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as NotificationType)}
      >
        <TabsList className="grid w-full max-w-lg grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
          <TabsTrigger value="crowd">Crowd</TabsTrigger>
          <TabsTrigger value="alert">Alerts</TabsTrigger>
          <TabsTrigger value="announcement">News</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredNotifs.length > 0 ? (
            <div className="space-y-3">
              {filteredNotifs.map((notif) => {
                const Icon = getIcon(notif.type);
                return (
                  <Card
                    key={notif.id}
                    className={`border-0 shadow-sm transition-colors cursor-pointer ${
                      !notif.isRead ? "bg-primary/5" : ""
                    }`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-2.5 rounded-xl ${getIconColor(
                            notif.type,
                          )}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold">{notif.title}</p>
                            {!notif.isRead && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notif.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground text-center">
                  You don&apos;t have any notifications in this category.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
