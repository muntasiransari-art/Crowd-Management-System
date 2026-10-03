"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  CameraOff,
  Loader2,
  AlertTriangle,
  Lock,
  CheckCircle,
  Copy,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
}

export default function QRScanner({
  onScanSuccess,
  onScanError,
}: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsHttps, setNeedsHttps] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if we're on HTTPS or localhost
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSecure =
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      setNeedsHttps(!isSecure);
    }
  }, []);

  const cleanupScanner = useCallback(async () => {
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;

      try {
        if (scanner.getState() === 2 /* SCANNING */ || scanner.isScanning) {
          await scanner.stop();
        }
      } catch (e) {
        // Ignore if already stopped
      }

      try {
        await scanner.clear();
      } catch (e) {
        // Ignore if already cleared
      }
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  }, []);

  const stopScanner = useCallback(async () => {
    setIsScanning(false);
    setIsLoading(false);
    await cleanupScanner();
  }, [cleanupScanner]);

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      // Try environment first, fallback to standard video stream
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      // Stop stream immediately
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err: any) {
      console.error("Camera permission error:", err);
      if (err.name === "NotAllowedError") {
        setError(
          "Camera access was denied. Please allow camera permission in browser site settings.",
        );
      } else if (err.name === "NotFoundError") {
        setError("No camera device detected on this hardware.");
      } else if (err.name === "NotReadableError") {
        setError("Camera is currently in use by another app.");
      } else {
        setError(`Camera error: ${err.message || "Unknown camera error"}`);
      }
      return false;
    }
  };

  const startScanner = async () => {
    if (!containerRef.current) return;

    if (needsHttps) {
      setError("Camera requires HTTPS or localhost.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      await cleanupScanner();

      const scannerId = `qr-scanner-${Date.now()}`;
      const scannerElement = document.createElement("div");
      scannerElement.id = scannerId;
      scannerElement.style.width = "100%";
      containerRef.current.appendChild(scannerElement);

      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(scannerId, { verbose: false });
      scannerRef.current = scanner;

      const handleSuccess = (decodedText: string) => {
        setScannedCode(decodedText);
        onScanSuccess(decodedText);
        stopScanner();
      };

      const handleIgnore = () => {};

      // Try camera constraints in order of device availability
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          handleSuccess,
          handleIgnore,
        );
      } catch (envErr) {
        console.warn("Rear camera failed, checking available cameras:", envErr);
        try {
          const cameras = await Html5Qrcode.getCameras();
          const cameraId =
            cameras && cameras.length > 0
              ? cameras[0].id
              : { facingMode: "user" };

          await scanner.start(
            cameraId,
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            handleSuccess,
            handleIgnore,
          );
        } catch (camErr: any) {
          throw camErr;
        }
      }

      setIsScanning(true);
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      let message = "Failed to access webcam.";

      if (err.message?.includes("Permission")) {
        message = "Camera access denied. Please allow camera access.";
      } else if (err.message?.includes("NotFoundError")) {
        message = "No camera found on this device.";
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
      onScanError?.(message);
      await cleanupScanner();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scannerId = `temp-qr-${Date.now()}`;
      const tempDiv = document.createElement("div");
      tempDiv.id = scannerId;
      document.body.appendChild(tempDiv);

      const html5Qrcode = new Html5Qrcode(scannerId);
      const result = await html5Qrcode.scanFile(file, true);

      document.body.removeChild(tempDiv);
      setScannedCode(result);
      onScanSuccess(result);
      toast.success("QR code decoded from image file!");
    } catch (err: any) {
      console.error("File QR error:", err);
      setError("Could not find a valid QR code in the uploaded image.");
      toast.error("Invalid QR image file.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSampleScan = () => {
    const sampleCode = "PG-2026-UP-7210";
    setScannedCode(sampleCode);
    onScanSuccess(sampleCode);
    toast.success("Simulated demo QR scan!");
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        try {
          if (scanner.getState() === 2) {
            scanner.stop().then(() => {
              try { scanner.clear(); } catch {}
            }).catch(() => {});
          } else {
            try { scanner.clear(); } catch {}
          }
        } catch {}
      }
    };
  }, []);

  if (needsHttps) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Lock className="h-12 w-12 mx-auto text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-400">
                HTTPS Required
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-500 mt-2">
                Camera access requires a secure connection (HTTPS).
                <br />
                Please access this page via HTTPS or localhost.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="p-0 relative min-h-[300px] bg-black rounded-xl">
          {/* Scanner container */}
          <div ref={containerRef} className="w-full min-h-[300px]" />

          {/* Overlay when not scanning */}
          {!isScanning && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/95 p-6 text-center">
              <Camera className="h-14 w-14 text-muted-foreground mb-3" />
              <h4 className="font-semibold text-sm">Gate Camera QR Scanner</h4>
              <p className="text-muted-foreground text-xs max-w-xs mt-1">
                Click below to start live video feed or test with sample QR code.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                <Button size="sm" onClick={startScanner}>
                  <Camera className="h-4 w-4 mr-1.5" /> Start Camera
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1.5" /> Upload Image
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={triggerSampleScan}
                >
                  <Sparkles className="h-4 w-4 mr-1.5 text-primary" /> Test Scan
                </Button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Initializing webcam feed...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-destructive font-medium">
                    Camera Status Notice
                  </p>
                  <p className="text-xs text-destructive/80 mt-1">{error}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs shrink-0"
                onClick={triggerSampleScan}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Use Sample Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanned Code Display */}
      {scannedCode && (
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Scanned Ticket Code:
                </p>
                <p className="text-base font-mono font-bold text-emerald-800 dark:text-emerald-300 break-all">
                  {scannedCode}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(scannedCode);
                  toast.success("Ticket code copied!");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isScanning && (
        <Button
          onClick={stopScanner}
          className="w-full"
          variant="destructive"
        >
          <CameraOff className="h-4 w-4 mr-2" /> Stop Scanner
        </Button>
      )}
    </div>
  );
}
