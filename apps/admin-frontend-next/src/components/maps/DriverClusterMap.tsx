import { useApolloClient, useLazyQuery } from "@apollo/client";
import { Map as GoogleMap, Marker, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useRef, useState } from "react";

import { MissingMapsKey, useMapsKey } from "@/components/maps/MapsProvider";
import {
  DRIVER_LOCATIONS_BY_VIEWPORT_QUERY,
  DRIVER_LOCATION_CLUSTER_SUBSCRIPTION,
} from "@/lib/graphql/documents/admin-actions";

interface Cluster {
  h3Index: string;
  count: number;
  lat: number;
  lng: number;
}

interface Single {
  driverId: string;
  lat: number;
  lng: number;
}

const DEFAULT_CENTER = { lat: 20, lng: 0 };
const DEFAULT_ZOOM = 2;
const REFETCH_DEBOUNCE_MS = 250;

/**
 * Live driver map. On every viewport change the `driverLocationsByViewport`
 * query reloads clusters + singles for the current bounds — the backend
 * decides h3 resolution from zoom and only emits clusters once a cell hits
 * the threshold. The `driverLocationClusterUpdate` subscription pushes
 * incremental changes for the h3 cells currently in view.
 */
export function DriverClusterMap({ height = 380 }: { height?: number }) {
  const apiKey = useMapsKey();
  const [totalCount, setTotalCount] = useState<number | null>(null);
  if (!apiKey) return <MissingMapsKey />;
  return (
    <div className="relative overflow-hidden rounded-lg border border-border" style={{ height }}>
      <GoogleMap
        mapId="ridy-admin-cluster"
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI
        clickableIcons={false}
      >
        <ClusterLayer onTotalCountChange={setTotalCount} />
      </GoogleMap>
      {totalCount != null && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-background/90 px-2 py-1 text-xs font-medium shadow-sm ring-1 ring-border">
          {totalCount.toLocaleString()} online
        </div>
      )}
    </div>
  );
}

function ClusterLayer({ onTotalCountChange }: { onTotalCountChange: (n: number) => void }) {
  const map = useMap();
  const apollo = useApolloClient();
  const [fetchViewport, { data }] = useLazyQuery(DRIVER_LOCATIONS_BY_VIEWPORT_QUERY, {
    fetchPolicy: "no-cache",
  });
  const [clusters, setClusters] = useState<Record<string, Cluster>>({});
  const [singles, setSingles] = useState<Record<string, Single>>({});
  const [h3IndexIds, setH3IndexIds] = useState<string[]>([]);
  const [h3Resolution, setH3Resolution] = useState<number>(0);
  const didAutoFit = useRef(false);
  const refetchTimer = useRef<number | null>(null);

  // Refetch the viewport whenever the map settles after pan/zoom.
  useEffect(() => {
    if (!map) return;

    const run = () => {
      const b = map.getBounds();
      const z = map.getZoom();
      if (!b || z == null) return;
      const ne = b.getNorthEast();
      const sw = b.getSouthWest();
      fetchViewport({
        variables: {
          bounds: {
            northEast: { lat: ne.lat(), lng: ne.lng() },
            southWest: { lat: sw.lat(), lng: sw.lng() },
            zoom: Math.round(z),
          },
        },
      });
    };

    const schedule = () => {
      if (refetchTimer.current != null) window.clearTimeout(refetchTimer.current);
      refetchTimer.current = window.setTimeout(run, REFETCH_DEBOUNCE_MS);
    };

    const listener = map.addListener("idle", schedule);
    schedule();
    return () => {
      google.maps.event.removeListener(listener);
      if (refetchTimer.current != null) window.clearTimeout(refetchTimer.current);
    };
  }, [map, fetchViewport]);

  // Apply query results — replace state so points outside the viewport are
  // dropped. One-shot fitBounds on the first non-empty response so the map
  // opens at a useful zoom regardless of where drivers happen to be.
  useEffect(() => {
    const result = data?.driverLocationsByViewport;
    if (!result || !map) return;

    const nextClusters: Record<string, Cluster> = {};
    for (const c of result.clusters) {
      nextClusters[c.h3Index] = {
        h3Index: c.h3Index,
        count: c.count,
        lat: c.location.lat,
        lng: c.location.lng,
      };
    }
    setClusters(nextClusters);

    const nextSingles: Record<string, Single> = {};
    for (const s of result.singles) {
      nextSingles[String(s.driverId)] = {
        driverId: String(s.driverId),
        lat: s.point.lat,
        lng: s.point.lng,
      };
    }
    setSingles(nextSingles);

    setH3IndexIds(result.h3IndexesInView);
    setH3Resolution(result.h3Resolution);
    onTotalCountChange(result.totalCount);

    if (!didAutoFit.current && (result.clusters.length > 0 || result.singles.length > 0)) {
      didAutoFit.current = true;
      const bounds = new google.maps.LatLngBounds();
      for (const c of result.clusters) bounds.extend({ lat: c.location.lat, lng: c.location.lng });
      for (const s of result.singles) bounds.extend({ lat: s.point.lat, lng: s.point.lng });
      // Single-point edge case: extend with a small box so fitBounds doesn't max-zoom.
      if (result.clusters.length + result.singles.length === 1) {
        const c = bounds.getCenter();
        bounds.extend({ lat: c.lat() + 0.05, lng: c.lng() + 0.05 });
        bounds.extend({ lat: c.lat() - 0.05, lng: c.lng() - 0.05 });
      }
      map.fitBounds(bounds, 64);
    }
  }, [data, map]);

  // Live updates for the visible cells. Resubscribes whenever the viewport's
  // h3 footprint changes (key derived from sorted ids so identical sets don't
  // churn the subscription).
  const h3Key = useMemo(() => [...h3IndexIds].sort().join("|"), [h3IndexIds]);
  useEffect(() => {
    if (h3IndexIds.length === 0) return;
    const observable = apollo.subscribe({
      query: DRIVER_LOCATION_CLUSTER_SUBSCRIPTION,
      variables: { h3Resolution, h3IndexIds },
    });
    const sub = observable.subscribe({
      next: (result) => {
        const next = result.data?.driverLocationClusterUpdate ?? [];
        setClusters((prev) => {
          const merged: Record<string, Cluster> = { ...prev };
          for (const c of next) {
            if (c.count > 0) {
              merged[c.h3Index] = {
                h3Index: c.h3Index,
                count: c.count,
                lat: c.location.lat,
                lng: c.location.lng,
              };
            } else {
              delete merged[c.h3Index];
            }
          }
          return merged;
        });
      },
      error: () => {
        /* swallowed — subscription is best-effort */
      },
    });
    return () => sub.unsubscribe();
  }, [apollo, h3Key, h3Resolution]);

  const clusterList = useMemo(() => Object.values(clusters), [clusters]);
  const singleList = useMemo(() => Object.values(singles), [singles]);

  return (
    <>
      {clusterList.map((c) => (
        <Marker
          key={c.h3Index}
          position={{ lat: c.lat, lng: c.lng }}
          icon={clusterIcon(c.count)}
          label={{
            text: formatCount(c.count),
            color: "#ffffff",
            fontSize: `${labelFontSize(c.count)}px`,
            fontWeight: "700",
          }}
          zIndex={1000 + c.count}
          onClick={() => zoomTo(map, c.lat, c.lng, 3)}
        />
      ))}
      {singleList.map((s) => (
        <Marker
          key={s.driverId}
          position={{ lat: s.lat, lng: s.lng }}
          icon={singleIcon()}
          zIndex={500}
        />
      ))}
    </>
  );
}

function clusterSize(count: number) {
  if (count < 10) return 32;
  if (count < 100) return 40;
  if (count < 1000) return 52;
  return 64;
}

function clusterColor(count: number) {
  if (count < 10) return "#10b981"; // emerald-500
  if (count < 100) return "#3b82f6"; // blue-500
  if (count < 1000) return "#6366f1"; // indigo-500
  return "#8b5cf6"; // violet-500
}

function labelFontSize(count: number) {
  if (count < 10) return 12;
  if (count < 100) return 13;
  if (count < 1000) return 14;
  return 14;
}

function formatCount(n: number) {
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1) + "k";
  return Math.round(n / 1000) + "k";
}

function clusterIcon(count: number): google.maps.Icon {
  const size = clusterSize(count);
  const color = clusterColor(count);
  const half = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${half}" cy="${half}" r="${half - 4}" fill="${color}" fill-opacity="0.35"/><circle cx="${half}" cy="${half}" r="${half - 7}" fill="${color}" stroke="#ffffff" stroke-width="2"/></svg>`;
  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(half, half),
    labelOrigin: new google.maps.Point(half, half),
  };
}

function singleIcon(): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#10b981" fill-opacity="0.3"/><circle cx="8" cy="8" r="4" fill="#10b981" stroke="#ffffff" stroke-width="1.5"/></svg>`;
  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(16, 16),
    anchor: new google.maps.Point(8, 8),
  };
}

function zoomTo(map: google.maps.Map | null, lat: number, lng: number, delta: number) {
  if (!map) return;
  const z = map.getZoom() ?? DEFAULT_ZOOM;
  map.panTo({ lat, lng });
  map.setZoom(Math.min(z + delta, 18));
}
