"use client";
import { useSession } from "next-auth/react";


import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  Shield,
  Star,
  Bell,
  Moon,
  Globe,
  ChevronRight,
  AlertCircle,
  Loader2,
  Ticket,
  Calendar,
  Edit2,
} from "lucide-react";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
}

interface Stats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
}

interface PriorityRequest {
  _id: string;
  types: string[];
  status: string;
  selectedVisitors: { name: string }[];
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [priorityRequests, setPriorityRequests] = useState<PriorityRequest[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    relation: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setStats(data.stats);
          setPriorityRequests(data.priorityRequests || []);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleEditEmergency = () => {
    setEditForm({
      name: profile?.emergencyContact?.name || "",
      phone: profile?.emergencyContact?.phone || "",
      relation: profile?.emergencyContact?.relation || "",
    });
    setShowEditDialog(true);
  };

  const handleSaveEmergency = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyContactName: editForm.name,
          emergencyContactPhone: editForm.phone,
          emergencyContactRelation: editForm.relation,
        }),
      });

      if (res.ok) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                emergencyContact: {
                  name: editForm.name,
                  phone: editForm.phone,
                  relation: editForm.relation,
                },
              }
            : null,
        );
        setShowEditDialog(false);
      }
    } catch (error) {
      console.error("Failed to update:", error);
    } finally {
      setSaving(false);
    }
  };

  const priorityTypeLabels: Record<string, string> = {
    elderly: "Senior Citizen",
    differently_abled: "Differently Abled",
    pregnant: "Pregnant",
    woman_with_child: "Woman with Child",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-24 bg-linear-to-r from-primary to-primary/70" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left sm:pb-2 flex-1">
              <h2 className="text-2xl font-bold">
                {profile?.firstName || user?.firstName}{" "}
                {profile?.lastName || user?.lastName}
              </h2>
              <p className="text-muted-foreground text-sm">
                Member since{" "}
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "Recently"}
              </p>
            </div>
            {priorityRequests.length > 0 && (
              <Badge className="bg-amber-500 text-white gap-1">
                <Star className="h-3 w-3" />
                Priority Access
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Ticket className="h-5 w-5 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{stats.totalBookings}</p>
              <p className="text-xs text-muted-foreground">Total Bookings</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 mx-auto text-chart-2 mb-2" />
              <p className="text-2xl font-bold">{stats.upcomingBookings}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Star className="h-5 w-5 mx-auto text-chart-3 mb-2" />
              <p className="text-2xl font-bold">{stats.completedBookings}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Personal Information */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile?.firstName || user?.firstName || ""}
                readOnly
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile?.lastName || user?.lastName || ""}
                readOnly
                className="bg-muted/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                value={
                  profile?.email ||
                  user?.primaryEmailAddress?.emailAddress ||
                  ""
                }
                readOnly
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={
                  profile?.phone || user?.primaryPhoneNumber?.phoneNumber || ""
                }
                readOnly
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleEditEmergency}>
            <Edit2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.emergencyContact?.name ? (
            <div className="p-4 rounded-xl bg-muted/50 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">
                  {profile.emergencyContact.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">
                  {profile.emergencyContact.phone}
                </span>
              </div>
              {profile.emergencyContact.relation && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Relation</span>
                  <span className="font-medium">
                    {profile.emergencyContact.relation}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No emergency contact set</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={handleEditEmergency}
              >
                Add Emergency Contact
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Priority Access Status */}
      {priorityRequests.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Priority Access Applied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityRequests.map((pr) => (
              <div key={pr._id} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-wrap gap-1">
                    {pr.types.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {priorityTypeLabels[t] || t}
                      </Badge>
                    ))}
                  </div>
                  <Badge className="bg-amber-500 text-xs">Applied</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {pr.selectedVisitors?.length || 0} visitor(s) •{" "}
                  {new Date(pr.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-center">
              Bring documents for verification on visit
            </p>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <SettingItem
            icon={Bell}
            title="Notifications"
            description="Manage notification preferences"
          />
          <SettingItem
            icon={Moon}
            title="Appearance"
            description="Dark mode and theme settings"
          />
          <SettingItem
            icon={Globe}
            title="Language"
            description="English (India)"
          />
          <SettingItem
            icon={Shield}
            title="Privacy & Security"
            description="Manage your data and security"
          />
        </CardContent>
      </Card>

      {/* Edit Emergency Contact Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emergency Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ecName">Contact Name</Label>
              <Input
                id="ecName"
                placeholder="e.g. John Doe"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ecPhone">Phone Number</Label>
              <Input
                id="ecPhone"
                placeholder="+91 98765 43210"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ecRelation">Relation</Label>
              <Input
                id="ecRelation"
                placeholder="e.g. Father, Spouse"
                value={editForm.relation}
                onChange={(e) =>
                  setEditForm({ ...editForm, relation: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEmergency} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-left">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
