"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeartPulse, Clock, MapPin, ArrowRight, Filter } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function SOSPage() {
  const [activeTab, setActiveTab] = useState("active");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      try {
        let status = activeTab;
        if (activeTab === "all") status = "";

        const res = await fetch(`/api/medical/sos?status=${status}`);
        const data = await res.json();
        setAlerts(data.alerts || []);
      } catch (error) {
        toast.error("Failed to fetch alerts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000); // Polling
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Emergency Incidents
        </h1>
        <p className="text-muted-foreground">
          Monitor and respond to incoming SOS alerts.
        </p>
      </div>

      <Tabs
        defaultValue="active"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All History</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                Loading incidents...
              </div>
            )}

            {!isLoading && alerts.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg">
                No {activeTab.replace("_", " ")} incidents found.
              </div>
            )}

            {alerts.map((sos) => (
              <Card
                key={sos._id}
                className={`border-l-4 ${
                  sos.priority === "critical"
                    ? "border-l-destructive"
                    : sos.priority === "high"
                      ? "border-l-orange-500"
                      : "border-l-blue-500"
                } hover:shadow-md transition-shadow`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge
                      variant={
                        sos.priority === "critical"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {sos.priority.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(sos.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <CardTitle className="text-lg capitalize flex items-center gap-2">
                    <HeartPulse
                      className={`h-5 w-5 ${
                        sos.priority === "critical"
                          ? "text-destructive"
                          : "text-primary"
                      }`}
                    />
                    {sos.type} Issue
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {sos.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      <MapPin className="h-4 w-4" />
                      {sos.location?.zone || "Unknown Location"}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/medical/sos/${sos._id}`}>
                          View Details <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
