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
  Radio,
  Loader2,
  Filter,
  Users,
  MapPin,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface SecurityStaff {
  _id: string;
  firstName: string;
  lastName: string;
  badgeNumber: string;
  unitType: "police" | "crowd_control" | "barricade" | "response_team";
  status: "on_duty" | "off_duty" | "on_break" | "responding";
  currentZone?: string;
  lastActive?: string;
}

export default function PersonnelPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [venueId, setVenueId] = useState<string>("");
  const [staff, setStaff] = useState<SecurityStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");

  // My Status State
  const [myStatus, setMyStatus] = useState<string>("off_duty");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch("/api/user/role");
        if (res.ok) {
          const data = await res.json();
          if (data.roleData?.venueId) {
            setVenueId(data.roleData.venueId);
            fetchPersonnel(data.roleData.venueId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setLoading(false);
      }
    }
    fetchUserData();
  }, []);

  // Update local "My Status" when staff list loads
  useEffect(() => {
    if (user && staff.length > 0) {
      const me = staff.find(
        (s) => s.firstName === user.firstName && s.lastName === user.lastName,
      );
      if (me) {
        setMyStatus(me.status);
      }
    }
  }, [staff, user]);

  async function fetchPersonnel(tid: string) {
    try {
      const res = await fetch(`/api/security/personnel?venueId=${tid}`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data.personnel || []);
      }
    } catch (error) {
      console.error("Failed to fetch personnel:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateMyStatus(newStatus: string) {
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/security/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          status: newStatus,
          currentZone: "Main Gate", // Default for now, could be dynamic
        }),
      });

      if (res.ok) {
        toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
        setMyStatus(newStatus);
        fetchPersonnel(venueId); // Refresh roster
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Status update failed", error);
      toast.error("Network error");
    } finally {
      setUpdatingStatus(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_duty":
        return "bg-green-500";
      case "responding":
        return "bg-red-500 animate-pulse";
      case "on_break":
        return "bg-amber-500";
      default:
        return "bg-slate-400";
    }
  };

  const filteredStaff = staff.filter(
    (member) => filterType === "all" || member.unitType === filterType,
  );

  const stats = {
    total: staff.length,
    active: staff.filter((s) => s.status !== "off_duty").length,
    responding: staff.filter((s) => s.status === "responding").length,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Personnel Management
          </h1>
          <p className="text-muted-foreground">
            Real-time deployment and status tracking
          </p>
        </div>

        {/* My Status Control */}
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${getStatusColor(myStatus)}`}
              />
              <span className="text-sm font-medium">My Status:</span>
            </div>
            <Select
              value={myStatus}
              onValueChange={updateMyStatus}
              disabled={updatingStatus}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on_duty">On Duty</SelectItem>
                <SelectItem value="on_break">On Break</SelectItem>
                <SelectItem value="responding">Responding</SelectItem>
                <SelectItem value="off_duty">Off Duty</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-xl dark:bg-slate-800">
              <Users className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Total Staff
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50/50 dark:bg-green-900/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl dark:bg-green-900/50">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                Active Duty
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {stats.active}
              </p>
            </div>
          </div>
        </Card>
        <Card
          className={`p-4 ${stats.responding > 0 ? "border-red-200 bg-red-50/50 dark:bg-red-900/10 animate-pulse" : ""}`}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl dark:bg-red-900/50">
              <Activity className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                Responding
              </p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {stats.responding}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={setFilterType}
        >
          <TabsList>
            <TabsTrigger value="all">All Units</TabsTrigger>
            <TabsTrigger value="police">Police</TabsTrigger>
            <TabsTrigger value="crowd_control">Crowd Control</TabsTrigger>
            <TabsTrigger value="barricade">Barricade</TabsTrigger>
            <TabsTrigger value="response_team">Response Team</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStaff.map((member) => (
          <Card
            key={member._id}
            className="overflow-hidden transition-all hover:shadow-md"
          >
            <div className={`h-1.5 w-full ${getStatusColor(member.status)}`} />
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Avatar className="h-10 w-10 border bg-muted">
                <AvatarFallback className="text-xs uppercase">
                  {member.firstName[0]}
                  {member.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base truncate">
                    {member.firstName} {member.lastName}
                  </CardTitle>
                  {(member._id === user?.publicMetadata?.userId ||
                    (member.firstName === user?.firstName &&
                      member.lastName === user.lastName)) && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      YOU
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-1.5 mt-0.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-5 font-mono"
                  >
                    {member.badgeNumber || "N/A"}
                  </Badge>
                  <span className="text-xs capitalize truncate">
                    {member.unitType?.replace("_", " ") || "Security"}
                  </span>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Status
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${getStatusColor(member.status)}`}
                      />
                      <span className="font-medium capitalize">
                        {member.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Location
                    </span>
                    <div className="flex items-center justify-end gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {member.currentZone || "Base"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    disabled={member.status === "off_duty"}
                  >
                    <Radio className="h-3 w-3 mr-2" />
                    Radio
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredStaff.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed flex flex-col items-center">
            <Users className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">No personnel found</p>
            <p className="text-xs opacity-70">
              Try changing filters or adding staff
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
