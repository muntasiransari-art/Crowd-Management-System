"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  HeartPulse,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  FileText,
  Bot,
  Ambulance,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { MapMarker } from "@/components/maps/LiveMap";

const LiveMap = dynamic(() => import("@/components/maps/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg" />
  ),
});

// Mock AI SOP Generator function
const generateSOP = (type: string, description: string) => {
  const sops = [
    "Assess immediate danger to the patient and surrounding crowd.",
    "Secure the area to prevent crowd surge.",
    "Check vital signs (Pulse, BP, Breathing).",
    "Establish communication with the main control room.",
  ];

  if (type === "medical") {
    if (
      description.toLowerCase().includes("heart") ||
      description.toLowerCase().includes("chest")
    ) {
      sops.push("Administer CPR if pulse is absent.");
      sops.push("Prepare AED immediately.");
      sops.push("Transport to nearest ICU ambulance.");
    } else if (
      description.toLowerCase().includes("faint") ||
      description.toLowerCase().includes("dehydration")
    ) {
      sops.push("Move patient to a shaded, cool area.");
      sops.push("Elevate legs and loosen tight clothing.");
      sops.push("Administer oral rehydration salts if conscious.");
    } else {
      sops.push("Assess patient condition and provide first aid as needed.");
      sops.push("Stabilize and prepare for transport if critical.");
    }
  }

  return sops;
};

export default function SOSDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [sos, setSOS] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [availableResources, setAvailableResources] = useState<any[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/medical/sos/${id}`);
        const data = await res.json();

        if (res.ok) {
          setSOS(data.sos);
          // Pre-select already assigned resources if any
          if (data.sos.assignedResources) {
            setSelectedResources(
              data.sos.assignedResources.map((r: any) => r._id),
            );
          }
        } else {
          toast.error("Failed to fetch incident details");
        }
      } catch (error) {
        toast.error("Error loading details");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchResources = async () => {
      try {
        const res = await fetch(`/api/medical/resources?status=available`);
        const data = await res.json();
        if (res.ok) {
          setAvailableResources(data.resources || []);
        }
      } catch (error) {
        console.error("Failed to fetch resources");
      }
    };

    if (id) {
      fetchDetails();
      fetchResources();
    }
  }, [id]);

  const handleAssignResources = async () => {
    try {
      const res = await fetch(`/api/medical/sos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedResources: selectedResources,
        }),
      });

      if (res.ok) {
        toast.success("Resources assigned successfully");
      } else {
        toast.error("Failed to assign resources");
      }
    } catch (error) {
      toast.error("Error assigning resources");
    }
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      toast.error("Please add resolution notes before closing.");
      return;
    }

    setIsResolving(true);
    try {
      const res = await fetch(`/api/medical/sos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          resolutionNotes: resolutionNotes,
        }),
      });

      if (res.ok) {
        toast.success("Incident resolved successfully");
        router.push("/medical/sos");
      } else {
        toast.error("Failed to resolve incident");
      }
    } catch (err) {
      toast.error("Error updating status");
    } finally {
      setIsResolving(false);
    }
  };

  if (isLoading)
    return <div className="p-8 text-center bg-background">Loading...</div>;
  if (!sos) return <div className="p-8 text-center">Incident not found</div>;

  const sopSteps = generateSOP(sos.type, sos.description);

  const mapMarkers: MapMarker[] = [
    {
      id: sos._id,
      lat: sos.location?.coordinates?.lat || 20.5937,
      lng: sos.location?.coordinates?.lng || 78.9629,
      type: "incident",
      title: "Incident Location",
      description: sos.description,
      status: "active",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant={sos.priority === "critical" ? "destructive" : "outline"}
            >
              {sos.priority.toUpperCase()} PRIORITY
            </Badge>
            <Badge
              variant={sos.status === "resolved" ? "secondary" : "default"}
              className={sos.status === "active" ? "bg-green-500" : ""}
            >
              {sos.status.toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight capitalize flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-primary" />
            {sos.type} Incident #{sos._id.slice(-4)}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
            <Clock className="h-3 w-3" />
            Reported{" "}
            {formatDistanceToNow(new Date(sos.createdAt), { addSuffix: true })}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back to List
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Col - Details & Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <Card>
            <CardContent className="p-0">
              <div className="h-[350px] w-full relative">
                <LiveMap
                  markers={mapMarkers}
                  center={[mapMarkers[0].lat, mapMarkers[0].lng]}
                  zoom={16}
                  className="h-full w-full rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Description & User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Incident Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <div className="p-4 bg-muted/30 rounded-lg text-sm">
                  {sos.description}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Reported By
                  </h4>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">
                      {sos.userId?.firstName} {sos.userId?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    <a
                      href={`tel:${sos.userId?.phone}`}
                      className="hover:underline"
                    >
                      {sos.userId?.phone}
                    </a>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Location
                  </h4>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{sos.location?.zone || "Unknown Zone"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    {sos.location?.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col - AI SOP & Actions */}
        <div className="space-y-6">
          {/* AI SOP */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Bot className="h-5 w-5" /> AI Response Protocol
              </CardTitle>
              <CardDescription>
                Suggested actions based on incident type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {sopSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Resolution Action */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Incident Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resource Assignment Section */}
              {sos.status !== "resolved" && (
                <div className="space-y-3 pb-4 border-b">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Ambulance className="h-4 w-4" /> Assign Resources
                  </h4>
                  <div className="space-y-2">
                    {availableResources.length > 0 ? (
                      <div className="grid gap-2">
                        {availableResources.map((resource) => (
                          <div
                            key={resource._id}
                            className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={resource._id}
                              checked={selectedResources.includes(resource._id)}
                              onCheckedChange={(checked) => {
                                if (checked)
                                  setSelectedResources([
                                    ...selectedResources,
                                    resource._id,
                                  ]);
                                else
                                  setSelectedResources(
                                    selectedResources.filter(
                                      (id) => id !== resource._id,
                                    ),
                                  );
                              }}
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={resource._id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer block pb-1"
                              >
                                {resource.name}
                              </label>
                              <div className="flex gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 h-4"
                                >
                                  {resource.type}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {resource.location?.zone || "Remote"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No available resources found.
                      </p>
                    )}

                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full mt-2"
                      onClick={handleAssignResources}
                      disabled={selectedResources.length === 0 || isResolving}
                    >
                      Assign Selected ({selectedResources.length})
                    </Button>
                  </div>
                </div>
              )}

              {/* Resolution Section */}
              {sos.status === "resolved" ? (
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
                    <CheckCircle2 className="h-5 w-5" /> Resolved
                  </div>
                  <p className="text-sm text-green-800">
                    {sos.resolutionNotes}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Closed{" "}
                    {formatDistanceToNow(new Date(sos.resolvedAt), {
                      addSuffix: true,
                    })}
                  </p>

                  {sos.assignedResources &&
                    sos.assignedResources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-green-500/10">
                        <p className="text-xs font-semibold text-green-800 mb-1">
                          Resources Deployed:
                        </p>
                        <ul className="text-xs text-green-700 list-disc list-inside">
                          {sos.assignedResources.map((res: any) => (
                            <li key={res._id}>
                              {res.name} ({res.type})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Outcome/Resolution Notes
                    </label>
                    <Textarea
                      placeholder="Describe actions taken and final outcome..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleResolve}
                    disabled={isResolving}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
