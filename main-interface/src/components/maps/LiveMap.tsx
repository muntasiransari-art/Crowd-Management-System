"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";

// Fix for default Leaflet marker icons in Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl =
  "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl =
  "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

// Custom Icons
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2893/2893043.png", // Example Ambulance Icon
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const boothIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3063/3063205.png", // Example Hospital/Booth Icon
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const incidentIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/10336/10336582.png", // Example SOS/Alert Icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: "animate-pulse",
});

const defaultIcon = new L.Icon({
  iconUrl: iconUrl,
  iconRetinaUrl: iconRetinaUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

type MarkerType = "ambulance" | "booth" | "incident" | "default";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: MarkerType;
  title: string;
  description?: string;
  status?: string;
}

interface LiveMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
}

export default function LiveMap({
  center = [20.5937, 78.9629], // Default to India center
  zoom = 13,
  markers = [],
  className = "h-[400px] w-full rounded-lg z-0",
}: LiveMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        className={`bg-muted/50 animate-pulse flex items-center justify-center ${className}`}
      >
        <p className="text-muted-foreground">Loading Map...</p>
      </div>
    );
  }

  const getIcon = (type: MarkerType) => {
    switch (type) {
      case "ambulance":
        return ambulanceIcon;
      case "booth":
        return boothIcon;
      case "incident":
        return incidentIcon;
      default:
        return defaultIcon;
    }
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      className={className}
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={getIcon(marker.type)}
        >
          <Popup>
            <div className="space-y-1 min-w-[150px]">
              <h3 className="font-bold text-sm">{marker.title}</h3>
              {marker.description && (
                <p className="text-xs text-muted-foreground">
                  {marker.description}
                </p>
              )}
              {marker.status && (
                <Badge
                  variant={
                    marker.status === "available"
                      ? "outline"
                      : marker.status === "active" || marker.status === "busy"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-[10px] h-5"
                >
                  {marker.status}
                </Badge>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
