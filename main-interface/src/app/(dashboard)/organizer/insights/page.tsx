"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Loader2,
  RefreshCw,
  Clock,
  Users,
  Ticket,
  CheckCircle2,
  Siren,
  Bot,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  todayBookings: number;
  todayVisitors: number;
  checkedIn: number;
  activeSOS: number;
}

interface ZoneData {
  id: string;
  name: string;
  capacity: number;
  currentCount: number;
  status: "low" | "medium" | "high" | "critical";
  percentage: number;
}

interface AIInsight {
  id: string;
  timestamp: Date;
  alerts: string[];
  predictions: string[];
  recommendations: string[];
  summary: string;
}

export default function InsightsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [currentInsight, setCurrentInsight] = useState<AIInsight | null>(null);
  const [insightHistory, setInsightHistory] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const statusColors: Record<string, string> = {
    low: "bg-emerald-500",
    medium: "bg-amber-500",
    high: "bg-orange-500",
    critical: "bg-destructive",
  };

  const statusBgColors: Record<string, string> = {
    low: "border-emerald-500 bg-emerald-500/10",
    medium: "border-amber-500 bg-amber-500/10",
    high: "border-orange-500 bg-orange-500/10",
    critical: "border-destructive bg-destructive/10",
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch("/api/venue/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setZones(data.zones || []);
        setLastDataUpdate(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Build AI analysis prompt
  const buildAnalysisPrompt = useCallback(
    (statsData: DashboardStats, zonesData: ZoneData[]): string => {
      const zoneInfo = zonesData
        .map(
          (z) =>
            `- ${z.name}: ${z.currentCount}/${z.capacity} (${z.percentage}%, ${z.status.toUpperCase()})`,
        )
        .join("\n");

      const currentHour = new Date().getHours();

      return `You are a Venue Crowd Management AI Assistant. Analyze the following LIVE data and provide actionable insights.

CURRENT TIME: ${new Date().toLocaleTimeString()}
CURRENT HOUR: ${currentHour}:00

DASHBOARD STATS:
- Today's Bookings: ${statsData.todayBookings}
- Expected Visitors: ${statsData.todayVisitors}
- Checked In: ${statsData.checkedIn}
- Active SOS Cases: ${statsData.activeSOS}

ZONE STATUS (Live):
${zoneInfo}

Respond in this EXACT JSON format only (no markdown, no extra text, no code blocks):
{"alerts": ["alert1", "alert2"], "predictions": ["prediction1", "prediction2"], "recommendations": ["rec1", "rec2", "rec3"], "summary": "One line summary"}

RULES:
- ALERTS: Issues needing immediate attention (HIGH/CRITICAL zones, SOS cases)
- PREDICTIONS: What will happen in next 15-30 minutes based on trends
- RECOMMENDATIONS: Specific actionable steps for venue staff
- Be concise and specific - mention zone names and numbers
- If SOS > 0, always include an alert about it
- If any zone is CRITICAL (90%+), it's the top priority
- Maximum 3 items per category`;
    },
    [],
  );

  // Parse AI response
  const parseAIResponse = (
    response: string,
  ): Omit<AIInsight, "id" | "timestamp"> => {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          alerts: parsed.alerts || [],
          predictions: parsed.predictions || [],
          recommendations: parsed.recommendations || [],
          summary: parsed.summary || "Analysis complete",
        };
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
    }

    // Fallback
    return {
      alerts: [],
      predictions: [],
      recommendations: [],
      summary: response.slice(0, 200),
    };
  };

  // Run AI analysis
  const runAIAnalysis = useCallback(async () => {
    if (zones.length === 0 || !stats) {
      toast.error("No data available for analysis");
      return;
    }

    setIsAnalyzing(true);

    try {
      const prompt = buildAnalysisPrompt(stats, zones);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          history: [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const parsed = parseAIResponse(data.response);

        const newInsight: AIInsight = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          ...parsed,
        };

        setCurrentInsight(newInsight);
        setInsightHistory((prev) => [newInsight, ...prev].slice(0, 10));

        // Show toast for alerts
        if (parsed.alerts.length > 0) {
          toast.warning(`AI Alert: ${parsed.alerts[0]}`, {
            duration: 5000,
          });
        } else {
          toast.success("Analysis complete - All systems normal");
        }
      } else {
        throw new Error("API request failed");
      }
    } catch (error) {
      console.error("AI analysis failed:", error);
      toast.error("Failed to analyze crowd data");
    } finally {
      setIsAnalyzing(false);
    }
  }, [zones, stats, buildAnalysisPrompt]);

  // Polling effects
  useEffect(() => {
    // Initial fetch
    fetchDashboardData();

    // Poll for data every 10 seconds
    const dataInterval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => {
      clearInterval(dataInterval);
    };
  }, [fetchDashboardData]);

  // Auto-analyze effect (separate to handle autoAnalyze toggle)
  useEffect(() => {
    if (!autoAnalyze) return;

    // Run AI analysis every 30 seconds when auto is enabled
    const analysisInterval = setInterval(() => {
      if (zones.length > 0 && stats) {
        runAIAnalysis();
      }
    }, 30000);

    // Run initial analysis after first data load
    const initialTimeout = setTimeout(() => {
      if (zones.length > 0 && stats) {
        runAIAnalysis();
      }
    }, 2000);

    return () => {
      clearInterval(analysisInterval);
      clearTimeout(initialTimeout);
    };
  }, [autoAnalyze, zones.length, stats, runAIAnalysis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-chart-1" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-chart-1" />
            AI Insights
          </h2>
          <p className="text-muted-foreground">
            Real-time crowd analysis powered by AI
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-analyze"
              checked={autoAnalyze}
              onCheckedChange={setAutoAnalyze}
            />
            <Label htmlFor="auto-analyze" className="text-sm">
              Auto-Analyze (30s)
            </Label>
          </div>
          <Button
            onClick={runAIAnalysis}
            disabled={isAnalyzing || zones.length === 0}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Analyze Now
          </Button>
        </div>
      </div>

      {/* Live Stats */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Live Dashboard Stats
            </CardTitle>
            {lastDataUpdate && (
              <span className="text-xs text-muted-foreground">
                Updated: {lastDataUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-chart-1/10 text-center">
              <Ticket className="h-5 w-5 mx-auto mb-2 text-chart-1" />
              <p className="text-2xl font-bold">{stats?.todayBookings || 0}</p>
              <p className="text-xs text-muted-foreground">Today's Bookings</p>
            </div>
            <div className="p-4 rounded-xl bg-chart-2/10 text-center">
              <Users className="h-5 w-5 mx-auto mb-2 text-chart-2" />
              <p className="text-2xl font-bold">{stats?.todayVisitors || 0}</p>
              <p className="text-xs text-muted-foreground">Expected Visitors</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 text-center">
              <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
              <p className="text-2xl font-bold">{stats?.checkedIn || 0}</p>
              <p className="text-xs text-muted-foreground">Checked In</p>
            </div>
            <div
              className={`p-4 rounded-xl text-center ${(stats?.activeSOS || 0) > 0 ? "bg-destructive/10" : "bg-muted"}`}
            >
              <Siren
                className={`h-5 w-5 mx-auto mb-2 ${(stats?.activeSOS || 0) > 0 ? "text-destructive" : "text-muted-foreground"}`}
              />
              <p className="text-2xl font-bold">{stats?.activeSOS || 0}</p>
              <p className="text-xs text-muted-foreground">Active SOS</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Status Grid */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Zone Status (Live)</CardTitle>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No zones configured
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-3 rounded-xl border-2 ${statusBgColors[zone.status]}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium truncate">
                      {zone.name}
                    </span>
                    <Badge
                      className={`${statusColors[zone.status]} text-[10px] px-1.5`}
                    >
                      {zone.status}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold">{zone.percentage}%</p>
                  <p className="text-xs text-muted-foreground">
                    {zone.currentCount}/{zone.capacity}
                  </p>
                  <Progress value={zone.percentage} className="h-1.5 mt-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <Card className="border-0 shadow-sm border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : currentInsight?.alerts && currentInsight.alerts.length > 0 ? (
              <ul className="space-y-2">
                {currentInsight.alerts.map((alert, i) => (
                  <li
                    key={i}
                    className="text-sm p-2 rounded-lg bg-destructive/10 text-foreground"
                  >
                    • {alert}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No alerts - all systems normal
              </p>
            )}
          </CardContent>
        </Card>

        {/* Predictions */}
        <Card className="border-0 shadow-sm border-l-4 border-l-chart-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-1" />
              Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : currentInsight?.predictions &&
              currentInsight.predictions.length > 0 ? (
              <ul className="space-y-2">
                {currentInsight.predictions.map((pred, i) => (
                  <li key={i} className="text-sm p-2 rounded-lg bg-chart-1/10">
                    • {pred}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Run analysis to see predictions
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-0 shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-emerald-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : currentInsight?.recommendations &&
              currentInsight.recommendations.length > 0 ? (
              <ul className="space-y-2">
                {currentInsight.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="text-sm p-2 rounded-lg bg-emerald-500/10"
                  >
                    • {rec}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Run analysis to see recommendations
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Summary */}
      {currentInsight && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-chart-1/10">
                <Bot className="h-5 w-5 text-chart-1" />
              </div>
              <div className="flex-1">
                <p className="font-medium">AI Summary</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentInsight.summary}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Analyzed{" "}
                  {formatDistanceToNow(currentInsight.timestamp, {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis History */}
      {insightHistory.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Analysis History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {insightHistory.map((insight) => (
                  <div
                    key={insight.id}
                    className="p-3 rounded-lg bg-muted/50 text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {insight.timestamp.toLocaleTimeString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {insight.alerts.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {insight.alerts.length} alerts
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground truncate">
                      {insight.summary}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
