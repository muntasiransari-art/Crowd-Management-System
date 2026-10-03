"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  AlertTriangle,
  Building2,
} from "lucide-react";

interface AnalyticsData {
  visitorTrends: { date: string; visitors: number }[];
  hourlyPatterns: { hour: string; visitors: number }[];
  bookingStatus: { name: string; value: number }[];
  sosTrends: { date: string; count: number }[];
  sosByType: { type: string; count: number }[];
  venueComparison: { name: string; visitors: number; bookings: number }[];
  weekComparison: { current: number; previous: number; percentChange: number };
}

const CHART_COLORS = [
  "#22c55e", // Green
  "#8b5cf6", // Purple
  "#f97316", // Orange
  "#3b82f6", // Blue
  "#6b7280", // Gray
];

// Specific colors for booking status
const BOOKING_STATUS_COLORS: Record<string, string> = {
  confirmed: "#3b82f6",    // Blue
  completed: "#22c55e",    // Green
  cancelled: "#ef4444",    // Red
  pending: "#f97316",      // Orange
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState("7d");
  const [liveAI, setLiveAI] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
    
    // Poll Live AI data
    const fetchLiveAI = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/stats");
        if (res.ok) {
          setLiveAI(await res.json());
        }
      } catch (e) {
        // AI server offline
      }
    };
    fetchLiveAI();
    const interval = setInterval(fetchLiveAI, 2000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (res.ok) {
        const analyticsData = await res.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  const totalVisitors = (data.visitorTrends || []).reduce((sum, d) => sum + d.visitors, 0);
  const totalSOS = (data.sosTrends || []).reduce((sum, d) => sum + d.count, 0);
  const totalBookings = (data.bookingStatus || []).reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Platform trends and insights
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Visitors</p>
                <p className="text-2xl font-bold">{totalVisitors.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-chart-1" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              {data.weekComparison.percentChange >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-chart-4" />
                  <span className="text-chart-4">+{data.weekComparison.percentChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">{data.weekComparison.percentChange}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{totalBookings.toLocaleString()}</p>
              </div>
              <Calendar className="h-8 w-8 text-chart-2" />
            </div>
            <div className="mt-2 flex gap-1 flex-wrap">
              {data.bookingStatus.slice(0, 3).map((status, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {status.name}: {status.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SOS Alerts</p>
                <p className="text-2xl font-bold">{totalSOS}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-chart-3" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Most common: {data.sosByType[0]?.type || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Venues</p>
                <p className="text-2xl font-bold">{data.venueComparison.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-chart-4" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Top: {data.venueComparison[0]?.name || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live AI Telemetry */}
      {liveAI && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live AI Vision Telemetry
            </CardTitle>
            <CardDescription>Real-time analytics from active camera feeds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Headcount</p>
                <p className="text-3xl font-bold">{liveAI.count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Flow Direction</p>
                <p className="text-xl font-bold capitalize mt-1">{liveAI.dominant_direction}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Density Status</p>
                <Badge className={liveAI.density_ratio > 80 ? "bg-red-500" : liveAI.density_ratio > 50 ? "bg-orange-500" : "bg-emerald-500"}>
                  {liveAI.density_level} ({liveAI.density_ratio}%)
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Threats</p>
                <p className="text-sm font-bold text-red-500 mt-1">
                  {liveAI.weapon_detected ? "Weapon Detected!" : liveAI.overcrowding_alert ? "Overcrowding!" : "None"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="visitors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visitors">Visitor Trends</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Patterns</TabsTrigger>
          <TabsTrigger value="sos">SOS Analysis</TabsTrigger>
          <TabsTrigger value="venues">Venue Comparison</TabsTrigger>
        </TabsList>

        {/* Visitor Trends */}
        <TabsContent value="visitors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Daily Visitors</CardTitle>
                <CardDescription>
                  Visitor count over the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.visitorTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Status</CardTitle>
                <CardDescription>Distribution by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.bookingStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {(data.bookingStatus || []).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={BOOKING_STATUS_COLORS[entry.name?.toLowerCase()] || CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Hourly Patterns */}
        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Visitor Patterns</CardTitle>
              <CardDescription>
                Average visitor count by hour of day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hourlyPatterns}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="hour"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="visitors"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOS Analysis */}
        <TabsContent value="sos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>SOS Alerts Over Time</CardTitle>
                <CardDescription>Daily SOS alert count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.sosTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ fill: "#f97316" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SOS by Type</CardTitle>
                <CardDescription>Breakdown of SOS alert types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.sosByType}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        type="number"
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="type"
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Venue Comparison */}
        <TabsContent value="venues">
          <Card>
            <CardHeader>
              <CardTitle>Venue Performance Comparison</CardTitle>
              <CardDescription>
                Visitors and bookings by venue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.venueComparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="visitors"
                      name="Visitors"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="bookings"
                      name="Bookings"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
