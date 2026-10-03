"use client";

import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface BookingQRProps {
  bookingCode: string;
  size?: number;
  className?: string;
  showCode?: boolean;
}

export function BookingQR({
  bookingCode,
  size = 128,
  className,
  showCode = true,
}: BookingQRProps) {
  // QR data format: PILGRIMGUARD:{bookingCode}
  const qrData = `PILGRIMGUARD:${bookingCode}`;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="p-4 bg-white rounded-xl shadow-sm border border-border">
        <QRCodeSVG
          value={qrData}
          size={size}
          level="M"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      {showCode && (
        <p className="mt-2 font-mono font-semibold text-sm tracking-wider text-primary">
          {bookingCode}
        </p>
      )}
    </div>
  );
}

// Large QR for ticket detail page with download capability
interface LargeBookingQRProps {
  bookingCode: string;
  venueName: string;
  date: string;
  time: string;
}

export function LargeBookingQR({
  bookingCode,
  venueName,
  date,
  time,
}: LargeBookingQRProps) {
  const qrData = `PILGRIMGUARD:${bookingCode}`;

  const handleDownload = () => {
    const svg = document.getElementById("booking-qr-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 500;

      if (ctx) {
        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code
        ctx.drawImage(img, 50, 50, 300, 300);

        // Add text
        ctx.fillStyle = "#000000";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(bookingCode, 200, 400);

        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#666666";
        ctx.fillText(venueName, 200, 430);
        ctx.fillText(`${date} | ${time}`, 200, 455);

        // Download
        const link = document.createElement("a");
        link.download = `EventGuard-${bookingCode}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="p-6 bg-white rounded-2xl shadow-md border border-border mb-4">
        <QRCodeSVG
          id="booking-qr-svg"
          value={qrData}
          size={160}
          level="H"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <p className="text-2xl font-mono font-bold tracking-wider mb-1">
        {bookingCode}
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        Show this QR code at the entry gate
      </p>
      <button
        onClick={handleDownload}
        className="text-sm text-primary hover:underline"
      >
        Download QR Code
      </button>
    </div>
  );
}
