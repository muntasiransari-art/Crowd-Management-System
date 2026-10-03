"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  Star,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Report {
  _id: string;
  type: string;
  date: string;
  stats: {
    totalBookings: number;
    totalVisitors: number;
    peakHour: string;
    avgWaitTime: number;
    priorityRequests: number;
    sosIncidents: number;
  };
  fileUrl: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const res = await fetch("/api/venue/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast.error("Failed to load past reports");
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const res = await fetch("/api/venue/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "daily", date: new Date().toISOString() }), // Default to today
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      setReports([data.report, ...reports]);
      toast.success("Daily report generated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-chart-1" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-muted-foreground">
            View and download daily/weekly reports
          </p>
        </div>
        <Button onClick={handleGenerateReport} disabled={generating}>
          {generating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          {generating ? "Generating..." : "Generate Daily Report"}
        </Button>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Reports</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4 space-y-4">
          {reports.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2" />
                <p>No reports generated yet</p>
                <Button
                  variant="link"
                  onClick={handleGenerateReport}
                  disabled={generating}
                >
                  Generate your first report
                </Button>
              </CardContent>
            </Card>
          ) : (
            reports
              .filter((r) => r.type === "daily")
              .map((report) => (
                <Card key={report._id} className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5" />
                        {format(new Date(report.date), "PPP")}
                      </CardTitle>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={report.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </a>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="p-3 rounded-lg bg-chart-1/10 text-center">
                        <TrendingUp className="h-5 w-5 mx-auto text-chart-1 mb-1" />
                        <p className="text-xl font-bold">
                          {report.stats.totalBookings}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bookings
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-chart-2/10 text-center">
                        <Users className="h-5 w-5 mx-auto text-chart-2 mb-1" />
                        <p className="text-xl font-bold">
                          {report.stats.totalVisitors}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Visitors
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                        <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                        <p className="text-xl font-bold">
                          {report.stats.peakHour}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Peak Hour
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                        <Clock className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                        <p className="text-xl font-bold">
                          {report.stats.avgWaitTime}m
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Avg Wait
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                        <Star className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                        <p className="text-xl font-bold">
                          {report.stats.priorityRequests}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Priority
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-destructive/10 text-center">
                        <AlertTriangle className="h-5 w-5 mx-auto text-destructive mb-1" />
                        <p className="text-xl font-bold">
                          {report.stats.sosIncidents}
                        </p>
                        <p className="text-xs text-muted-foreground">SOS</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2" />
              <p>
                Weekly reports reporting configured to run automatically every
                Sunday.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
