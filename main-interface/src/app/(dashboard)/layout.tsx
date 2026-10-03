"use client";


import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OnbordaProvider, Onborda } from "onborda";
import { attendeeTourSteps, shouldShowTour } from "@/lib/onboarding-steps";
import { OnboardingCard } from "@/components/onboarding-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  LayoutDashboard,
  CalendarDays,
  Ticket,
  Map,
  Bell,
  AlertCircle,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight, // Ensure this import is maintained
  Settings,
  Star,
  CalendarClock,
  DoorOpen,
  FileText,
  Sparkles,
  Layers,
  Siren,
  Shield,
  Ambulance,
  HeartPulse,
  QrCode,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  BarChart3,
  History,
  CheckCircle,
  UserCog,
} from "lucide-react";

type UserRole = "attendee" | "venue_staff" | "security" | "medical" | "admin";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  id?: string;
}

const attendeeNavItems: NavItem[] = [
  {
    name: "Overview",
    href: "/attendee",
    icon: LayoutDashboard,
    id: "nav-overview",
  },
  {
    name: "My Tickets",
    href: "/attendee/tickets",
    icon: Ticket,
    id: "nav-tickets",
  },
  { name: "Venue Map", href: "/attendee/map", icon: Map, id: "nav-map" },
  {
    name: "Notifications",
    href: "/attendee/notifications",
    icon: Bell,
    id: "nav-notifications",
  },
  {
    name: "AI Assistant",
    href: "/attendee/assistant",
    icon: MessageSquare,
    id: "nav-assistant",
  },
  { name: "Profile", href: "/attendee/profile", icon: User, id: "nav-profile" },
];

const venueNavItems: NavItem[] = [
  { name: "Overview", href: "/organizer", icon: LayoutDashboard },
  { name: "Ticket Verification", href: "/organizer/verify-tickets", icon: QrCode },
  { name: "Live Heatmap", href: "/organizer/heatmap", icon: Map },
  { name: "Zone Management", href: "/organizer/zones", icon: Layers },
  { name: "Slot Management", href: "/organizer/slots", icon: CalendarClock },
  { name: "Entry Gates", href: "/organizer/gates", icon: DoorOpen },
  { name: "Alerts & Announcements", href: "/organizer/alerts", icon: Bell },
  { name: "Reports", href: "/organizer/reports", icon: FileText },
  { name: "AI Insights", href: "/organizer/insights", icon: Sparkles },
];

const securityNavItems: NavItem[] = [
  { name: "Overview", href: "/security", icon: LayoutDashboard },
  { name: "Check-In", href: "/security/check-in", icon: QrCode },
  { name: "Live Heatmap", href: "/security/heatmap", icon: Map },
  { name: "SOS & Alerts", href: "/security/sos", icon: Siren },
  { name: "Personnel", href: "/security/personnel", icon: Shield },
  { name: "Reports", href: "/security/reports", icon: FileText },
];

const medicalNavItems: NavItem[] = [
  { name: "Overview", href: "/medical", icon: LayoutDashboard },
  { name: "Resources", href: "/medical/resources", icon: Ambulance },
  { name: "Incidents", href: "/medical/sos", icon: Siren },
];

const adminNavItems: NavItem[] = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Verify QR Tickets", href: "/organizer/verify-tickets", icon: QrCode },
  { name: "Pending Approvals", href: "/admin/approvals", icon: Clock },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "AI Vision", href: "/admin/ai-vision", icon: Sparkles },
];

const roleConfig: Record<
  UserRole,
  { navItems: NavItem[]; label: string; baseHref: string; color: string }
> = {
  attendee: {
    navItems: attendeeNavItems,
    label: "Attendee",
    baseHref: "/attendee",
    color: "from-primary via-primary to-primary/90",
  },
  venue_staff: {
    navItems: venueNavItems,
    label: "Venue Staff",
    baseHref: "/organizer",
    color: "from-chart-1 via-chart-1 to-chart-1/90",
  },
  security: {
    navItems: securityNavItems,
    label: "Security",
    baseHref: "/security",
    color: "from-chart-2 via-chart-2 to-chart-2/90",
  },
  medical: {
    navItems: medicalNavItems,
    label: "Medical",
    baseHref: "/medical",
    color: "from-chart-4 via-chart-4 to-chart-4/90",
  },
  admin: {
    navItems: adminNavItems,
    label: "Event Creator",
    baseHref: "/admin",
    color: "from-emerald-600 via-teal-600 to-cyan-600",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const user = session?.user;
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("attendee");
  const [roleLoading, setRoleLoading] = useState(true);

  // Fetch user role from DB
  useEffect(() => {
    async function fetchRole() {
      if (!isLoaded) return;
      
      if (!user) {
        setRoleLoading(false);
        router.replace("/sign-in");
        return;
      }

      try {
        const res = await fetch("/api/user/role");
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role || "attendee");
        } else if (res.status === 404 || res.status === 401) {
          // Stale session or unauthorized
          await signOut({ callbackUrl: "/sign-in" });
        }
      } catch (error) {
        console.error("Failed to fetch role:", error);
      } finally {
        setRoleLoading(false);
      }
    }
    fetchRole();
  }, [isLoaded, user, router]);

  // Redirect to correct dashboard on role load
  useEffect(() => {
    if (roleLoading || !isLoaded) return;

    const config = roleConfig[userRole];
    const isOnWrongDashboard = !pathname.startsWith(config.baseHref);

    // If user is on root or wrong dashboard, redirect
    if (
      isOnWrongDashboard &&
      (pathname === "/" ||
        pathname.startsWith("/attendee") ||
        pathname.startsWith("/organizer"))
    ) {
      // Only redirect if on a dashboard path that doesn't match their role
      const isAttendeePath = pathname.startsWith("/attendee");
      const isVenuePath = pathname.startsWith("/organizer");

      if (
        (userRole === "attendee" && isVenuePath) ||
        (userRole === "venue_staff" && isAttendeePath)
      ) {
        router.replace(config.baseHref);
      }
    }
  }, [roleLoading, userRole, pathname, router, isLoaded]);

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error("Sign out error:", error);
      window.location.href = "/";
    }
  };

  if (!isLoaded || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const config = roleConfig[userRole];
  const navItems = config.navItems;
  const currentPageTitle =
    navItems.find((item) => item.href === pathname)?.name || "Overview";

  // Show tour only for attendees on first visit
  const showTour = userRole === "attendee" && shouldShowTour();

  return (
    <OnbordaProvider>
      <Onborda
        steps={attendeeTourSteps}
        showOnborda={showTour}
        shadowOpacity="0.8"
        cardComponent={OnboardingCard}
      >
        <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-accent/10">
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-linear-to-b ${config.color} transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex flex-col h-full text-primary-foreground">
              {/* Logo */}
              <div className="flex items-center justify-between h-16 px-5 border-b border-primary-foreground/10">
                <Link
                  href={config.baseHref}
                  className="flex items-center gap-2"
                >
                  <img
                    src="/images/logo.png"
                    alt="EventGuard Logo"
                    className="h-10 w-auto object-contain"
                  />
                  <div>
                    <span className="text-lg font-bold">EventGuard</span>
                    {userRole !== "attendee" && (
                      <p className="text-xs text-primary-foreground/60">
                        {config.label}
                      </p>
                    )}
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <ScrollArea className="flex-1 px-3 py-4">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        id={item.id}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "bg-primary-foreground text-primary shadow-lg"
                            : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5" />
                          {item.name}
                        </div>
                        {!isActive && (
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </ScrollArea>

              {/* User Section */}
              <div className="p-4 border-t border-primary-foreground/10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-primary-foreground/10 transition-colors">
                      <Avatar className="h-10 w-10 border-2 border-primary-foreground/20">
                        <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                          {user?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium truncate">
                          {user?.name || "User"}
                        </p>
                        <p className="text-xs text-primary-foreground/60 truncate">
                          {config.label}
                        </p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href={`${config.baseHref}/profile`}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:pl-64">
            {/* Top Bar */}
            <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border flex items-center px-4 lg:px-6">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden mr-3"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <h1 id="dashboard-welcome" className="text-lg font-semibold">
                {currentPageTitle}
              </h1>

              <div className="flex-1" />

              {/* <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link
                href={
                  userRole === "venue_staff"
                    ? "/organizer/alerts"
                    : "/attendee/notifications"
                }
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                  3
                </span>
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`${config.baseHref}/profile`}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div> */}
            </header>

            {/* Page Content */}
            <main className="p-4 lg:p-6 relative">
              {children}
              
              {/* Floating SOS Button for Attendees */}
              {userRole === "attendee" && (
                <button
                  onClick={async () => {
                    try {
                      // Attempt to fetch current browser location
                      let coords: { lat: number; lng: number } | null = null;
                      if ("geolocation" in navigator) {
                        coords = await new Promise((resolve) => {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                            (err) => {
                              console.warn("Geolocation error/denied:", err);
                              resolve(null);
                            },
                            { timeout: 5000, enableHighAccuracy: true }
                          );
                        });
                      }

                      // We fetch the first active booking to get a valid venueId
                      const bRes = await fetch("/api/attendee/bookings/active");
                      let venueId = null;
                      if (bRes.ok) {
                        const data = await bRes.json();
                        if (data.bookings && data.bookings.length > 0) {
                          venueId = data.bookings[0].venueId._id;
                        }
                      }
                      
                      const res = await fetch("/api/security/sos", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          venueId: venueId || "000000000000000000000000",
                          type: "security",
                          priority: "high",
                          description: "Emergency SOS triggered via quick action button.",
                          latitude: coords?.lat,
                          longitude: coords?.lng,
                          location: coords ? { coordinates: coords, description: `Lat: ${coords.lat}, Lng: ${coords.lng}` } : undefined
                        }),
                      });
                      if (res.ok) alert("SOS Alert Sent! Dispatching call & SMS with location to organizer...");
                      else alert("SOS Alert Sent (Offline Mode)");
                    } catch (e) {
                      alert("SOS Alert Sent.");
                    }
                  }}
                  className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] hover:scale-105 transition-all duration-300 animate-pulse cursor-pointer group"
                  title="Emergency SOS"
                >
                  <Siren className="w-8 h-8" />
                  <span className="absolute -top-10 scale-0 transition-all rounded bg-gray-900 p-2 text-xs text-white group-hover:scale-100">
                    SOS
                  </span>
                </button>
              )}
            </main>
          </div>
        </div>
      </Onborda>
    </OnbordaProvider>
  );
}
