"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, Siren, Activity, Video, Map, ShieldAlert,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Settings2, Trash2, Camera, PlaySquare,
  Upload, FileVideo, Film, CheckCircle2, RefreshCw
} from "lucide-react";

const YOLO_SERVER_URL = "http://localhost:5000";

export default function AIVisionPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [availableVideos, setAvailableVideos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [threshold, setThreshold] = useState(20);

  useEffect(() => {
    // Poll the YOLO backend for live statistics
    const fetchStats = async () => {
      try {
        const response = await fetch(`${YOLO_SERVER_URL}/api/stats`);
        if (!response.ok) throw new Error("Server error");
        const data = await response.json();
        setStats(data);
        if (data.threshold && !threshold) setThreshold(data.threshold); // Init threshold
        setError(false);
      } catch (err) {
        console.warn("YOLO Server disconnected, retrying...");
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    const fetchVideos = async () => {
      try {
        const res = await fetch(`${YOLO_SERVER_URL}/api/videos`);
        if (res.ok) {
          const data = await res.json();
          setAvailableVideos(data.videos || []);
        }
      } catch (e) {}
    };

    fetchStats();
    fetchVideos();
    const interval = setInterval(fetchStats, 1000); // 1-second real-time polling
    return () => clearInterval(interval);
  }, []);

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "right": return <ArrowRight className="h-6 w-6 text-blue-500" />;
      case "left": return <ArrowLeft className="h-6 w-6 text-blue-500" />;
      case "up": return <ArrowUp className="h-6 w-6 text-blue-500" />;
      case "down": return <ArrowDown className="h-6 w-6 text-blue-500" />;
      default: return <Activity className="h-6 w-6 text-blue-500" />;
    }
  };

  // --- YOLOv8 Control Methods ---
  const sendYoloCommand = async (endpoint: string, payload?: any) => {
    try {
      await fetch(`${YOLO_SERVER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined
      });
    } catch (e) {
      console.error("Failed to send command to YOLO:", e);
    }
  };

  const toggleBoxes = () => sendYoloCommand('/api/toggle_overlay', { overlay: 'boxes' });
  const setSourceWebcam = () => sendYoloCommand('/api/set_source', { type: 'webcam' });
  const setSourceSample = () => sendYoloCommand('/api/set_source', { type: 'sample' });
  const setSourceFile = (filename: string) => sendYoloCommand('/api/set_source', { type: 'file', source: filename });
  const triggerWeaponAlert = () => sendYoloCommand('/api/test_alert', { type: 'weapon' });
  const triggerCrowdAlert = () => sendYoloCommand('/api/test_alert', { type: 'overcrowding' });
  const clearAlerts = () => sendYoloCommand('/api/clear_alerts');

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("video", file);

      const res = await fetch(`${YOLO_SERVER_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        alert(`🎉 Video "${data.filename}" uploaded successfully! Activating live AI stream...`);
        // Refresh available videos list
        const vRes = await fetch(`${YOLO_SERVER_URL}/api/videos`);
        if (vRes.ok) {
          const vData = await vRes.json();
          setAvailableVideos(vData.videos || []);
        }
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.error || "Unknown error"}`);
      }
    } catch (error) {
      alert("Error: Could not connect to YOLO backend server (http://localhost:5000). Ensure python app.py is running.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setThreshold(val);
    sendYoloCommand('/api/set_threshold', { threshold: val });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" /> AI Vision Command Center
          </h2>
          <p className="text-muted-foreground">
            Live YOLOv8 feed & Real-time Crowd Analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error ? (
            <Badge variant="destructive" className="animate-pulse">Disconnected from AI Server</Badge>
          ) : (
            <Badge className="bg-emerald-500 animate-pulse text-white border-0">Live Connection Active</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live Video Feed */}
        <Card className="lg:col-span-2 border-0 shadow-lg overflow-hidden bg-black/90 relative group rounded-2xl h-fit">
          <CardHeader className="absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-black/80 to-transparent pt-4 pb-12 border-none">
            <CardTitle className="text-white flex justify-between items-center text-sm font-medium">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                CAM-01: {stats?.source || "Main Entrance"}
              </span>
              {stats && (
                <span className="text-white/70 text-xs font-mono">{stats.fps} FPS</span>
              )}
            </CardTitle>
          </CardHeader>
          <div className="relative w-full aspect-video flex items-center justify-center bg-zinc-950 min-h-[400px]">
            {error ? (
              <div className="text-center text-zinc-500">
                <Video className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Ensure YOLOv8 Python server is running on port 5000</p>
                <p className="text-xs mt-1 font-mono">http://localhost:5000</p>
              </div>
            ) : (
              <img 
                src={`${YOLO_SERVER_URL}/video`} 
                alt="Live AI Feed" 
                className="w-full h-full object-contain"
                onError={() => setError(true)}
              />
            )}
          </div>
          {/* Overcrowding Alert Overlay */}
          {stats?.overcrowding_alert && (
            <div className="absolute inset-0 border-4 border-orange-500/80 pointer-events-none animate-pulse z-20">
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-orange-600/90 text-white px-4 py-1.5 rounded-full font-bold shadow-2xl flex items-center gap-2">
                <Siren className="h-4 w-4" /> OVERCROWDING DETECTED
              </div>
            </div>
          )}
          {/* Weapon Threat Overlay */}
          {stats?.weapon_detected && (
            <div className="absolute inset-0 border-4 border-red-600 pointer-events-none animate-pulse z-30">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-8 py-4 rounded-xl font-black text-2xl shadow-2xl flex items-center gap-4 uppercase tracking-wider">
                <ShieldAlert className="h-8 w-8" /> WEAPON THREAT DETECTED
              </div>
            </div>
          )}
        </Card>

        {/* Telemetry & Controls Panel */}
        <div className="space-y-6">
          <Card className="border-0 shadow-md bg-linear-to-br from-card to-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Live Headcount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-5xl font-black tracking-tighter">
                  {stats?.count || 0}
                </div>
                <Badge className={
                  stats?.density_level === "Low" ? "bg-emerald-500" :
                  stats?.density_level === "Moderate" ? "bg-amber-500" :
                  "bg-red-500 animate-pulse"
                }>
                  {stats?.density_level || "Unknown"} Density
                </Badge>
              </div>
              <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    (stats?.density_ratio || 0) > 85 ? "bg-red-500" : 
                    (stats?.density_ratio || 0) > 50 ? "bg-amber-500" : "bg-emerald-500"
                  }`} 
                  style={{ width: `${Math.min(stats?.density_ratio || 0, 100)}%` }} 
                />
              </div>
            </CardContent>
          </Card>

          {/* YOLO Controls */}
          <Card className="border-0 shadow-md bg-linear-to-br from-card to-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> Video Source & Hardware Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Upload Custom Video Button */}
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="video/mp4,video/avi,video/mov,video/mkv,video/webm" 
                  className="hidden" 
                  onChange={handleVideoUpload} 
                />
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 py-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || error}
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Uploading Video...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Upload Custom Video File
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center mt-1">
                  Upload MP4, AVI, MOV or WEBM to run live AI analysis
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={setSourceWebcam} className="w-full text-xs" disabled={error}>
                  <Camera className="h-3 w-3 mr-2" /> Live WebCam
                </Button>
                <Button variant="outline" size="sm" onClick={setSourceSample} className="w-full text-xs" disabled={error}>
                  <PlaySquare className="h-3 w-3 mr-2" /> Sample Video
                </Button>
              </div>

              {/* Available Video List Selector */}
              {availableVideos.length > 0 && (
                <div className="pt-2 border-t">
                  <span className="text-xs font-medium text-muted-foreground block mb-1">Select Active Video:</span>
                  <select 
                    className="w-full text-xs p-2 rounded-lg border bg-background text-foreground"
                    value={stats?.source || ""}
                    onChange={(e) => setSourceFile(e.target.value)}
                    disabled={error}
                  >
                    {availableVideos.map((v, i) => (
                      <option key={i} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <Button variant="secondary" size="sm" onClick={toggleBoxes} className="w-full text-xs" disabled={error}>
                  Toggle Bounding Boxes
                </Button>
                <Button variant="destructive" size="sm" onClick={triggerWeaponAlert} className="w-full text-xs" disabled={error}>
                  Test Weapon Alert
                </Button>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Overcrowding Alert Threshold</span>
                  <Badge variant="outline" className="font-mono text-xs">{threshold} people</Badge>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={threshold}
                  onChange={handleThresholdChange}
                  disabled={error}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Alert Feed / Incident Logs */}
          <Card className="border-0 shadow-md flex-1">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Siren className="h-4 w-4 text-red-500 animate-pulse" /> Live AI Threat & Overcrowding Logs
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Clear Logs" onClick={clearAlerts} disabled={error}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500 transition-colors" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[260px] overflow-y-auto p-4 space-y-3">
                {!stats?.alerts || stats.alerts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground space-y-1">
                    <ShieldAlert className="h-8 w-8 mx-auto opacity-20" />
                    <p className="text-xs">No active threats or overcrowding logs.</p>
                  </div>
                ) : (
                  stats.alerts.map((alert: any, idx: number) => {
                    const isWeapon = alert.type?.toUpperCase().includes("WEAPON");
                    const isCrowdExceeded = alert.type?.toUpperCase().includes("ATTENDEE") || alert.type?.toUpperCase().includes("OVERCROWD");

                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border text-xs flex gap-3 transition-all ${
                          isWeapon
                            ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                            : isCrowdExceeded
                            ? "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300"
                            : "bg-muted/40 border-border text-foreground"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isWeapon ? (
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                          ) : isCrowdExceeded ? (
                            <Users className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Activity className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold tracking-wide uppercase">{alert.type}</span>
                            <span className="font-mono text-[10px] opacity-70">{alert.time || alert.timestamp}</span>
                          </div>
                          <p className="leading-relaxed opacity-90">{alert.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
