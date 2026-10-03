"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface IncidentReport {
  _id: string;
  type: string;
  priority: string;
  description: string;
  location: {
    zone: string;
    description?: string;
  };
  status: string;
  createdAt: string;
  resolvedAt?: string;
  responseTime?: number;
}

export default function ReportsPage() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/user/role");
      const user = await res.json();
      const venueId = user.roleData?.venueId;

      if (venueId) {
        // Fetch ALL incidents to filter client-side for reports capabilities
        // Ideally this would be a specific /api/security/reports endpoint for better performance
        const reportsRes = await fetch(
          `/api/security/sos?venueId=${venueId}&status=resolved`,
        );
        const data = await reportsRes.json();
        setIncidents(data.alerts || []);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExport = () => {
    // Mock CSV Export
    const headers = "ID,Type,Priority,Zone,Created,Resolved,Description\n";
    const rows = filteredIncidents
      .map(
        (inc) =>
          `${inc._id},${inc.type},${inc.priority},${inc.location?.zone || "N/A"},${inc.createdAt},${inc.resolvedAt},"${inc.description}"`,
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesType = filterType === "all" || inc.type === filterType;
    const matchesSearch =
      inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.location?.zone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    if (priority === "critical") return "text-red-600 bg-red-100";
    if (priority === "high") return "text-orange-600 bg-orange-100";
    return "text-blue-600 bg-blue-100";
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Incident Reports
          </h1>
          <p className="text-muted-foreground">
            Historical logs of resolved security incidents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReports}>
            <Filter className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="fire">Fire</SelectItem>
                <SelectItem value="lost_child">Lost Child</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Reported At</TableHead>
                  <TableHead>Resolved At</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No reports found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncidents.map((incident) => (
                    <TableRow key={incident._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {incident.type === "medical" && (
                            <FileText className="h-4 w-4 text-red-500" />
                          )}
                          {incident.type === "security" && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                          <span className="capitalize font-medium">
                            {incident.type.replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize rounded-sm ${getPriorityColor(incident.priority)}`}
                        >
                          {incident.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {incident.location?.zone || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {incident.location?.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(incident.createdAt).toLocaleDateString()}
                        <br />
                        {new Date(incident.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {incident.resolvedAt ? (
                          <>
                            <div className="flex items-center gap-1.5 text-green-600 mb-0.5">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Resolved</span>
                            </div>
                            {new Date(incident.resolvedAt).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Incidents (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~4 mins</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Most Frequent Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Medical</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
