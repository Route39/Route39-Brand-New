import { Map as GoogleMap, Marker, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

import { MissingMapsKey, useMapsKey } from "@/components/maps/MapsProvider";

interface LatLng {
  lat: number;
  lng: number;
}

interface RouteMapProps {
  /** Stops along the route, in order. First = pickup, last = dropoff. */
  waypoints: LatLng[];
  /** Optional polyline path connecting the waypoints (overrides default straight line). */
  directions?: LatLng[];
  height?: number;
}

/**
 * Read-only route map: renders the pickup/dropoff markers and a polyline.
 * Auto-fits the viewport to the route bounds.
 */
export function RouteMap({ waypoints, directions, height = 320 }: RouteMapProps) {
  const apiKey = useMapsKey();
  if (!apiKey) return <MissingMapsKey />;
  if (waypoints.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        No route to display.
      </div>
    );
  }

  const path = directions && directions.length > 1 ? directions : waypoints;

  return (
    <div className="overflow-hidden rounded-md border border-border" style={{ height }}>
      <GoogleMap
        mapId="ridy-admin-route"
        defaultCenter={waypoints[0]}
        defaultZoom={13}
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        <RouteOverlay waypoints={waypoints} path={path} />
      </GoogleMap>
    </div>
  );
}

function RouteOverlay({ waypoints, path }: { waypoints: LatLng[]; path: LatLng[] }) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || path.length < 2) return;
    const polyline = new google.maps.Polyline({
      map,
      path,
      strokeColor: "#0ea5e9",
      strokeWeight: 4,
      strokeOpacity: 0.85,
    });
    polylineRef.current = polyline;
    return () => polyline.setMap(null);
  }, [map, path]);

  // Auto-fit bounds to all waypoints + path.
  useEffect(() => {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    [...waypoints, ...path].forEach((p) => bounds.extend(p));
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 64);
    }
  }, [map, waypoints, path]);

  return (
    <>
      {waypoints.map((p, i) => (
        <Marker
          key={i}
          position={p}
          label={{
            text: i === 0 ? "A" : i === waypoints.length - 1 ? "B" : String(i + 1),
            color: "#fff",
            fontSize: "12px",
            fontWeight: "600",
          }}
        />
      ))}
    </>
  );
}
