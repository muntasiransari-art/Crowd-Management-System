"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Building2,
  UserCog,
  Clock,
  CalendarDays,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  QrCode,
} from "lucide-react";
import Link from "next/link";

interface OverviewStats {
  totalAttendees: number;
  totalVenues: number;
  totalStaff: number;
  pendingApprovals: number;
  todayBookings: number;
  activeSOSCount: number;
}

interface VenueStats {
  _id: string;
  name: string;
  slug: string;
  registeredAttendees: number; presentAttendees: number;
  zones: number;
  sosCount: number;
  staffCount: number;
  status: "normal" | "alert";
}

interface RoleBreakdown {
  attendee?: number;
  venue_staff?: number;
  security?: number;
  medical?: number;
  admin?: number;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [venueStats, setVenueStats] = useState<VenueStats[]>([]);
  const [roleBreakdown, setRoleBreakdown] = useState<RoleBreakdown>({});

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.overview);
        setVenueStats(data.venueStats || []);
        setRoleBreakdown(data.roleBreakdown || {});
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Attendees",
      value: stats?.totalAttendees || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Venues",
      value: stats?.totalVenues || 0,
      icon: Building2,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Staff On Duty",
      value: stats?.totalStaff || 0,
      icon: UserCog,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals || 0,
      icon: Clock,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      href: "/admin/approvals",
    },
  ];

  const quickStats = [
    {
      title: "Today's Bookings",
      value: stats?.todayBookings || 0,
      icon: CalendarDays,
    },
    {
      title: "Active SOS Alerts",
      value: stats?.activeSOSCount || 0,
      icon: AlertTriangle,
      isAlert: (stats?.activeSOSCount || 0) > 0,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and management
          </p>
        </div>
        <Link href="/organizer/verify-tickets">
          <Button className="flex items-center gap-2 shadow-md">
            <QrCode className="h-4 w-4" /> Verify QR Tickets
          </Button>
        </Link>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );

          return stat.href ? (
            <Link key={stat.title} href={stat.href}>
              {content}
            </Link>
          ) : (
            <div key={stat.title}>{content}</div>
          );
        })}
      </div>

      {/* Quick Stats & Alerts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={stat.isAlert ? "border-destructive" : ""}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${
                    stat.isAlert
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p
                    className={`text-2xl font-bold ${
                      stat.isAlert ? "text-destructive" : ""
                    }`}
                  >
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Role Breakdown Card */}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-3">User Breakdown</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                Venue Staff: {roleBreakdown.venue_staff || 0}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Security: {roleBreakdown.security || 0}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Medical: {roleBreakdown.medical || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Venue-wise Summary Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Venue-wise Summary</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/venues">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venue</TableHead>
                <TableHead className="text-center">Registered Attendees</TableHead><TableHead className="text-center">Present (Checked In)</TableHead>
                <TableHead className="text-center">Zones</TableHead>
                <TableHead className="text-center">Active SOS</TableHead>
                <TableHead className="text-center">Staff</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venueStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No venues found
                  </TableCell>
                </TableRow>
              ) : (
                venueStats.map((venue) => (
                  <TableRow key={venue._id}>
                    <TableCell className="font-medium">{venue.name}</TableCell>
                    <TableCell className="text-center">{venue.registeredAttendees.toLocaleString()}</TableCell><TableCell className="text-center">{venue.presentAttendees.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{venue.zones}</TableCell>
                    <TableCell className="text-center">
                      {venue.sosCount > 0 ? (
                        <Badge variant="destructive">{venue.sosCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{venue.staffCount}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={venue.status === "alert" ? "destructive" : "secondary"}
                      >
                        {venue.status === "alert" ? "Alert" : "Normal"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/admin/venues">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-chart-1/10">
                <Building2 className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="font-medium">Manage Venues</p>
                <p className="text-sm text-muted-foreground">Add, edit, or deactivate venues</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/admin/users">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-chart-2/10">
                <Users className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="font-medium">Manage Users</p>
                <p className="text-sm text-muted-foreground">View and manage all users</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/admin/analytics">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-chart-3/10">
                <TrendingUp className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="font-medium">View Analytics</p>
                <p className="text-sm text-muted-foreground">Trends and insights</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
