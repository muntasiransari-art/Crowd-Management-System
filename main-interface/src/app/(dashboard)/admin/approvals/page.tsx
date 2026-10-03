"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  UserCheck,
  CheckCircle2,
  Clock,
  Shield,
  Building2,
  HeartPulse,
  User,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface UserData {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  roleData: any;
  isActive: boolean;
  createdAt: string;
}

const roleIcons: Record<string, any> = {
  attendee: User,
  venue_staff: Building2,
  security: Shield,
  medical: HeartPulse,
  admin: UserCheck,
};

export default function ApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      // Fetch inactive users who need staff/role approval
      const res = await fetch("/api/admin/users?status=inactive");
      if (res.ok) {
        const data = await res.json();
        setPendingUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending approvals:", error);
      toast.error("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user: UserData) => {
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });

      if (res.ok) {
        toast.success(`Approved ${user.firstName} ${user.lastName} successfully!`);
        fetchPendingUsers();
      } else {
        toast.error("Failed to approve user account");
      }
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Approval request failed");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pending Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve staff, security, and medical personnel registrations.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/users">View All Users</Link>
        </Button>
      </div>

      {/* Approvals Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" /> Pending Registrations ({pendingUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email & Phone</TableHead>
                <TableHead>Requested Role</TableHead>
                <TableHead>Assigned Venue</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-12"
                  >
                    <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
                    <p className="font-semibold text-foreground">No Pending Approvals</p>
                    <p className="text-xs text-muted-foreground mt-1">All staff and user accounts are active.</p>
                  </TableCell>
                </TableRow>
              ) : (
                pendingUsers.map((user) => {
                  const RoleIcon = roleIcons[user.role] || User;
                  return (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold">
                              {user.firstName?.[0] || "U"}
                              {user.lastName?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Registered {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <p>{user.email}</p>
                        <p className="text-xs text-muted-foreground font-mono">{user.phone || "-"}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize flex items-center gap-1.5 py-1 px-2.5">
                            <RoleIcon className="h-3.5 w-3.5" />
                            {user.role.replace("_", " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.roleData?.venueName || "Unassigned"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 ml-auto"
                          onClick={() => handleApprove(user)}
                        >
                          <Check className="h-4 w-4" /> Approve Account
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
