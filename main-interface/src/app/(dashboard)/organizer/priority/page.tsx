"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Star,
  Check,
  X,
  Loader2,
  User,
  FileText,
  ExternalLink,
} from "lucide-react";

interface PriorityRequest {
  _id: string;
  selectedVisitors: { name: string; age: number }[];
  types: string[];
  reason: string;
  documents: string[];
  status: string;
  createdAt: string;
  bookingId: { bookingCode: string; date: string };
}

const priorityTypeLabels: Record<string, string> = {
  elderly: "Senior Citizen",
  differently_abled: "Differently Abled",
  pregnant: "Pregnant",
  woman_with_child: "Woman with Child",
};

export default function VenuePriorityPage() {
  const [requests, setRequests] = useState<PriorityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<PriorityRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [activeTab, setActiveTab] = useState("applied");

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch("/api/venue/priority-requests");
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests || []);
        }
      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((r) => r.status === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-chart-1" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Priority Request Approvals</h2>
        <p className="text-muted-foreground">
          Review and approve priority access requests
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="applied">Applied</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredRequests.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center text-muted-foreground">
                No {activeTab} requests found
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request._id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className="font-medium">
                            {request.selectedVisitors?.length || 0} visitor(s)
                          </span>
                          <Badge variant="secondary">
                            {request.bookingId?.bookingCode}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {request.types?.map((t) => (
                            <Badge
                              key={t}
                              variant="outline"
                              className="text-xs"
                            >
                              {priorityTypeLabels[t] || t}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === "applied" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </>
                        )}
                        {request.status !== "applied" && (
                          <Badge
                            className={
                              request.status === "approved"
                                ? "bg-emerald-500"
                                : "bg-destructive"
                            }
                          >
                            {request.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => setSelectedRequest(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Priority Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Visitors</Label>
                <div className="space-y-2 mt-1">
                  {selectedRequest.selectedVisitors?.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-muted rounded"
                    >
                      <User className="h-4 w-4" />
                      <span>{v.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({v.age} yrs)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Reason</Label>
                <p className="mt-1 text-sm">{selectedRequest.reason}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Documents</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedRequest.documents?.map((doc, i) => (
                    <Button key={i} variant="outline" size="sm" asChild>
                      <a href={doc} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Document {i + 1}
                      </a>
                    </Button>
                  )) || (
                    <span className="text-muted-foreground">No documents</span>
                  )}
                </div>
              </div>

              <div>
                <Label>Rejection Note (optional)</Label>
                <Textarea
                  placeholder="Reason for rejection..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
