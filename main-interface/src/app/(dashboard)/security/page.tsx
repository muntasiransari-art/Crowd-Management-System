"use client";
import { useSession } from "next-auth/react";



import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Shield,
  AlertTriangle,
  MapPin,
  Users,
  Activity,
  Radio,
  Loader2,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function SecurityDashboard() {
  const { data: session } = useSession();
  const user = session?.user;
  const [venueData, setVenueData] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [stats, setStats] = useState({
    activeAlerts: 0,
    activePersonnel: 0,
    resolvedIncidents: 0,
    crowdLevel: "Normal",
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/user/role");
        const data = await res.json();

        if (data.roleData?.venueId) {
          setVenueData({
            id: data.roleData.venueId,
            name: data.roleData.venueName,
          });

          await Promise.all([
            fetchStats(data.roleData.venueId),
            fetchRecentActivity(data.roleData.venueId),
          ]);
        }
      } catch (error) {
        console.error("Failed to init dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    init();

    // Poll for updates
    const interval = setInterval(() => {
      if (venueData?.id) {
        fetchStats(venueData.id);
        fetchRecentActivity(venueData.id);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [venueData?.id]);

  async function fetchStats(venueId: string) {
    try {
      // 1. Active Alerts
      const alertsRes = await fetch(
        `/api/security/sos?venueId=${venueId}&status=active`,
      );
      const alertsData = await alertsRes.json();

      // 2. Active Personnel
      const staffRes = await fetch(
        `/api/security/personnel?venueId=${venueId}`,
      );
      const staffData = await staffRes.json();
      console.log(staffData);
      const onDuty =
        staffData.personnel?.filter((p: any) => p.status !== "off_duty")
          .length || 0;

      // 3. Resolved Incidents (Last 24h)
      const resolvedRes = await fetch(
        `/api/security/sos?venueId=${venueId}&status=resolved`,
      );
      const resolvedData = await resolvedRes.json();

      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const recentResolved =
        resolvedData.alerts?.filter(
          (a: any) => new Date(a.updatedAt) > oneDayAgo,
        ).length || 0;

      setStats({
        activeAlerts: alertsData.alerts?.length || 0,
        activePersonnel: onDuty,
        resolvedIncidents: recentResolved,
        crowdLevel: "Moderate", // Mock
      });
    } catch (e) {
      console.error("Error fetching stats", e);
    }
  }

  async function fetchRecentActivity(venueId: string) {
    try {
      const res = await fetch(`/api/security/sos?venueId=${venueId}`);
      if (res.ok) {
        const data = await res.json();
        // Take top 5 recent alerts/incidents
        setRecentActivity(data.alerts?.slice(0, 5) || []);
      }
    } catch (e) {
      console.error("Error fetching activity", e);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Security Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitoring {venueData?.name || "Venue"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1"
          >
            <Activity className="w-3 h-3 mr-1" />
            System Active
          </Badge>
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-3 py-1"
          >
            <Radio className="w-3 h-3 mr-1" />
            Live Feed
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className={
            stats.activeAlerts > 0 ? "border-red-500/50 bg-red-500/5" : ""
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${stats.activeAlerts > 0 ? "text-red-500" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${stats.activeAlerts > 0 ? "text-red-600" : ""}`}
            >
              {stats.activeAlerts}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crowd Density</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.crowdLevel}</div>
            <p className="text-xs text-muted-foreground">Overall status</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Security Staff
            </CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePersonnel}</div>
            <p className="text-xs text-muted-foreground">Active on duty</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Incidents Resolved
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolvedIncidents}</div>
            <p className="text-xs text-muted-foreground">In last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Live Surveillance</CardTitle>
            <CardDescription>Integrated CCTV Feed</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-black/90 rounded-md relative overflow-hidden group">
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
              <span className="text-white text-xs bg-black/50 px-2 py-0.5 rounded">
                CAM-01 (Main Gate)
              </span>
            </div>
            <p className="text-white/50 text-sm">
              [Simulated Video Feed Stream]
            </p>
            {/* Mock overlay elements */}
            <div className="absolute bottom-4 right-4 text-white/70 text-xs font-mono">
              {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest alerts and logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity.
                </p>
              ) : (
                recentActivity.map((alert) => (
                  <div
                    key={alert._id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {alert.priority === "critical" ? (
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    ) : alert.priority === "high" ? (
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    ) : (
                      <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {alert.description}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground">
                          {alert.location?.zone || "Unknown Area"}
                        </p>
                        <span className="text-[10px] text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(alert.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="pt-2">
                <Link
                  href="/security/sos"
                  className="text-xs text-primary hover:underline text-center block w-full"
                >
                  View All Alerts
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
