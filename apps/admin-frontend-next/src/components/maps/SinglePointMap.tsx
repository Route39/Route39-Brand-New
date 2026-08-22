import { Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";

import { MissingMapsKey, useMapsKey } from "@/components/maps/MapsProvider";

interface SinglePointMapProps {
  point: { lat: number; lng: number };
  label?: string;
  height?: number;
  zoom?: number;
}

export function SinglePointMap({ point, label, height = 280, zoom = 14 }: SinglePointMapProps) {
  const apiKey = useMapsKey();
  if (!apiKey) return <MissingMapsKey />;
  return (
    <div className="overflow-hidden rounded-md border border-border" style={{ height }}>
      <GoogleMap
        mapId="ridy-admin-point"
        defaultCenter={point}
        defaultZoom={zoom}
        gestureHandling="greedy"
      >
        <Marker
          position={point}
          label={
            label
              ? { text: label, color: "#fff", fontSize: "12px", fontWeight: "600" }
              : undefined
          }
        />
      </GoogleMap>
    </div>
  );
}
