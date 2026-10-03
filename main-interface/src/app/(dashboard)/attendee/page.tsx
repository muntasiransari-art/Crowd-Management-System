"use client";
import { useSession } from "next-auth/react";



import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  Ticket,
  Bell,
  AlertCircle,
  QrCode,
  TrendingUp,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Star,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useOnborda } from "onborda";
import { resetTour } from "@/lib/onboarding-steps";

export default function AttendeeDashboard() {
  const { data: session } = useSession();
  const user = session?.user;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { startOnborda } = useOnborda();

  const handleStartTour = () => {
    resetTour(); // Clear the completed flag
    startOnborda("attendee-welcome"); // Start the tour
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/attendee/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      title: "Upcoming Visits",
      value: data?.stats?.upcomingVisits || "0",
      change: "Next 7 days", // Placeholder logic
      icon: CalendarDays,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Bookings",
      value: data?.stats?.totalBookings || "0",
      change: "Lifetime",
      icon: Ticket,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "SOS Alerts",
      value: data?.stats?.sosAlerts || "0",
      change: "Active",
      icon: AlertCircle,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Priority Status",
      value: data?.stats?.priorityStatus || "Inactive",
      change: "Check details",
      icon: Star,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ];

  const upcoming = data?.upcomingBooking;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Welcome back, {user?.firstName || "Attendee"}!
          </h2>
          <p className="text-muted-foreground">
            Your spiritual journey continues. Here&apos;s your dashboard
            overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={handleStartTour}
          >
            <HelpCircle className="h-5 w-5" />
            Take a Tour
          </Button>
          <Button asChild size="lg" className="gap-2">
            <Link href="/attendee/booking">
              <CalendarDays className="h-5 w-5" />
              Book New Slot
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-chart-2" />
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Booking & Quick QR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Upcoming Visit</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/attendee/tickets">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming ? (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {upcoming.venueId?.name || "Unknown Venue"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(upcoming.date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Time Slot</p>
                      <p className="font-medium">
                        {upcoming.timeSlot?.start} - {upcoming.timeSlot?.end}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">
                        Entry Gate
                      </p>
                      <p className="font-medium">{upcoming.gate}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Visitors</p>
                      <p className="font-medium">{upcoming.visitors} persons</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">
                        Booking Code
                      </p>
                      <p className="font-mono font-medium">
                        {upcoming.bookingCode}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-accent/10 rounded-xl min-w-[140px]">
                  <div className="p-4 bg-background rounded-xl shadow-sm mb-2">
                    <QrCode className="h-16 w-16 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Scan at entry</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href={`/attendee/tickets/${upcoming._id}`}>
                      View Ticket
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg">
                <CalendarDays className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium text-lg">No Upcoming Visits</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Schedule your next entry to see details here.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/attendee/booking">Book Now</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              asChild
            >
              <Link href="/attendee/sos">
                <div className="p-1.5 rounded-lg bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                Emergency SOS
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              asChild
            >
              <Link href="/attendee/map">
                <div className="p-1.5 rounded-lg bg-chart-1/10">
                  <MapPin className="h-4 w-4 text-chart-1" />
                </div>
                View Venue Map
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              asChild
            >
              <Link href="/attendee/priority">
                <div className="p-1.5 rounded-lg bg-chart-3/10">
                  <Star className="h-4 w-4 text-chart-3" />
                </div>
                Priority Request
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              asChild
            >
              <Link href="/attendee/notifications">
                <div className="p-1.5 rounded-lg bg-chart-4/10">
                  <Bell className="h-4 w-4 text-chart-4" />
                </div>
                Notifications
                {data?.notifications?.length > 0 && (
                  <span className="ml-auto bg-destructive/10 text-destructive text-xs px-2 py-0.5 rounded-full">
                    {data.notifications.length}
                  </span>
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/attendee/tickets">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data?.recentBookings?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentBookings.map((booking: any) => (
                    <TableRow key={booking._id}>
                      <TableCell className="font-medium">
                        {booking.venueId?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.date), "MMM dd")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize ${
                            booking.status === "confirmed"
                              ? "border-green-500 text-green-500"
                              : ""
                          }`}
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          asChild
                        >
                          <Link href={`/attendee/tickets/${booking._id}`}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No recent bookings found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Notifications */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Latest Notifications</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/attendee/notifications">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.notifications?.length > 0 ? (
                data.notifications.map((notif: any) => (
                  <div
                    key={notif._id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      {notif.type === "booking" ? (
                        <Ticket className="h-4 w-4 text-primary" />
                      ) : (
                        <Bell className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {notif.message}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {/* Simplified time display, ideally use date-fns relative time */}
                      New
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No new notifications.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
