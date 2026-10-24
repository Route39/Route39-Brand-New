import { ControlPosition, Map, MapControl, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Eraser, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { MissingMapsKey, useMapsKey } from "@/components/maps/MapsProvider";
import { cn } from "@/lib/utils";

export interface LatLng {
  lat: number;
  lng: number;
}

const DEFAULT_CENTER: LatLng = { lat: 11.1085, lng: 77.3411 }; // Tiruppur
const DEFAULT_ZOOM = 12;

interface SinglePolygonProps {
  value: LatLng[];
  onChange: (next: LatLng[]) => void;
  defaultCenter?: LatLng;
  defaultZoom?: number;
  height?: number;
  autoFill?: boolean;
  onPlaceName?: (name: string) => void;
  defaultFill?: string;
}

/**
 * Edit a single polygon. Click map to add a vertex, drag vertices to move,
 * right-click a vertex to delete.
 */
export function PolygonEditor(props: SinglePolygonProps) {
  const apiKey = useMapsKey();
  const [radius, setRadius] = useState(props.defaultFill ?? "1000");
  const lastPick = useRef<{ loc: google.maps.LatLng; vp?: google.maps.LatLngBounds; name?: string } | null>(null);
  if (!apiKey) return <MissingMapsKey />;

  return (
    <div className="space-y-2">
      <div
        className="overflow-hidden rounded-md border border-border"
        style={{ height: props.height ?? 360 }}
      >
        <Map
          mapId="ridy-admin-polygon"
          defaultCenter={props.value[0] ?? props.defaultCenter ?? DEFAULT_CENTER}
          defaultZoom={props.defaultZoom ?? DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          <MapControl position={ControlPosition.TOP_CENTER}>
            <PlaceSearch
              onPicked={
                props.autoFill
                  ? (loc, vp, name) => {
                      lastPick.current = { loc, vp, name };
                      if (radius === "boundary") void fetchBoundary(name, loc, vp).then(props.onChange); else props.onChange(buildPolygon(loc, vp, radius));
                      props.onPlaceName?.(name);
                    }
                  : undefined
              }
            />
          </MapControl>
          <SinglePolygonInternal {...props} />
        </Map>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {props.value.length === 0
            ? "Click the map to add the first vertex."
            : `${props.value.length} vertices · click to add, drag to move, right-click to delete.`}
        </span>
        {props.autoFill ? (
          <select
            value={radius}
            onChange={(e) => {
              const v = e.target.value;
              setRadius(v);
              if (lastPick.current) { const p = lastPick.current; if (v === "boundary") void fetchBoundary(p.name ?? "", p.loc, p.vp).then(props.onChange); else props.onChange(buildPolygon(p.loc, p.vp, v)); }
            }}
            className="ml-auto mr-2 h-7 rounded border border-input bg-background px-2 text-xs"
            title="Zone size when you search a place"
          >
            <option value="500">500 m around</option>
            <option value="1000">1 km around</option>
            <option value="2000">2 km around</option>
            <option value="3000">3 km around</option>
            <option value="area">Whole area</option>
            <option value="boundary">City boundary (auto)</option>
          </select>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => props.onChange([])}
          disabled={props.value.length === 0}
        >
          <Eraser className="size-3.5" />
          Clear
        </Button>
      </div>
    </div>
  );
}

function SinglePolygonInternal({ value, onChange }: SinglePolygonProps) {
  const map = useMap();
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      onChangeRef.current([...value, { lat: e.latLng.lat(), lng: e.latLng.lng() }]);
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, value]);

  useEffect(() => {
    if (!map) return;
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    if (value.length < 1) return;

    const polygon = new google.maps.Polygon({
      map,
      paths: value,
      editable: true,
      draggable: false,
      strokeColor: "#0ea5e9",
      strokeWeight: 2,
      fillColor: "#0ea5e9",
      fillOpacity: 0.18,
    });

    const path = polygon.getPath();
    const sync = () => {
      const next: LatLng[] = [];
      path.forEach((p) => next.push({ lat: p.lat(), lng: p.lng() }));
      onChangeRef.current(next);
    };
    const listeners = [
      path.addListener("set_at", sync),
      path.addListener("insert_at", sync),
      path.addListener("remove_at", sync),
    ];
    polygon.addListener("rightclick", (e: google.maps.PolyMouseEvent) => {
      if (e.vertex == null) return;
      path.removeAt(e.vertex);
    });

    polygonRef.current = polygon;
    return () => {
      listeners.forEach((l) => google.maps.event.removeListener(l));
      polygon.setMap(null);
    };
  }, [map, value]);

  return null;
}

interface MultiPolygonProps {
  /** Array of polygons. Each polygon is an array of vertices. */
  value: LatLng[][];
  onChange: (next: LatLng[][]) => void;
  height?: number;
  autoFill?: boolean;
  onPlaceName?: (name: string) => void;
  defaultFill?: string;
}

/**
 * Edit several polygons that together describe a multi-polygon geo-fence.
 * Pick one polygon at a time to edit; add or remove polygons via the toolbar.
 */
export function MultiPolygonEditor({ value, onChange, height = 420, autoFill, onPlaceName, defaultFill }: MultiPolygonProps) {
  const apiKey = useMapsKey();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!apiKey) return <MissingMapsKey />;

  // Coerce any legacy empty value into a single empty polygon for editing.
  const polygons = value.length === 0 ? [[]] : value;
  const idx = Math.min(activeIndex, polygons.length - 1);
  const active = polygons[idx];

  function patch(next: LatLng[]) {
    const copy = polygons.map((p) => p.slice());
    copy[idx] = next;
    onChange(copy.filter((p, i) => p.length > 0 || i === 0));
  }

  function addPolygon() {
    const next = [...polygons, [] as LatLng[]];
    onChange(next);
    setActiveIndex(next.length - 1);
  }

  function removeActive() {
    if (polygons.length <= 1) {
      onChange([[]]);
      setActiveIndex(0);
      return;
    }
    const copy = polygons.filter((_, i) => i !== idx);
    onChange(copy);
    setActiveIndex(Math.min(idx, copy.length - 1));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1">
        {polygons.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={cn(
              "rounded-md border border-border px-2.5 py-1 text-xs transition-colors",
              i === idx
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted/40",
            )}
          >
            Polygon {i + 1} <span className="opacity-70">({p.length})</span>
          </button>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={addPolygon} className="h-7">
          <Plus className="size-3.5" />
          Add polygon
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={removeActive}
          className="h-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={polygons.length <= 1 && active.length === 0}
        >
          Remove polygon {idx + 1}
        </Button>
      </div>
      <PolygonEditor
        key={idx}
        value={active}
        onChange={patch}
        height={height}
        autoFill={autoFill} defaultFill={defaultFill}
        onPlaceName={onPlaceName}
      />
    </div>
  );
}


/** Build a polygon from a searched place: circle of `radius` metres, or the place's whole viewport. */
function buildPolygon(
  loc: google.maps.LatLng,
  vp: google.maps.LatLngBounds | undefined,
  radius: string,
): LatLng[] {
  if (radius === "area" && vp) {
    const ne = vp.getNorthEast();
    const sw = vp.getSouthWest();
    return [
      { lat: ne.lat(), lng: sw.lng() },
      { lat: ne.lat(), lng: ne.lng() },
      { lat: sw.lat(), lng: ne.lng() },
      { lat: sw.lat(), lng: sw.lng() },
    ];
  }
  const r = radius === "area" ? 1000 : Number(radius);
  const lat = loc.lat();
  const lng = loc.lng();
  const dLat = r / 111320;
  const dLng = r / (111320 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * 2 * Math.PI;
    return { lat: lat + dLat * Math.sin(a), lng: lng + dLng * Math.cos(a) };
  });
}

/** Search box over the map: type a district / area and the map jumps there. */
function PlaceSearch({
  onPicked,
}: {
  onPicked?: (loc: google.maps.LatLng, vp: google.maps.LatLngBounds | undefined, name: string) => void;
}) {
  const map = useMap();
  const places = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const pickedRef = useRef(onPicked);
  pickedRef.current = onPicked;

  function apply(loc?: google.maps.LatLng, vp?: google.maps.LatLngBounds, name?: string) {
    if (!map || !loc) return;
    if (vp) map.fitBounds(vp);
    else {
      map.setCenter(loc);
      map.setZoom(14);
    }
    pickedRef.current?.(loc, vp, name ?? "");
  }

  useEffect(() => {
    if (!places || !map || !inputRef.current) return;
    try {
      const ac = new places.Autocomplete(inputRef.current, {
        fields: ["geometry", "name"],
        componentRestrictions: { country: "in" },
      });
      const l = ac.addListener("place_changed", () => {
        const p = ac.getPlace();
        apply(p.geometry?.location ?? undefined, p.geometry?.viewport ?? undefined, p.name);
      });
      return () => l.remove();
    } catch {
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, map]);

  function geocode() {
    const q = inputRef.current?.value?.trim();
    if (!q || !map) return;
    new google.maps.Geocoder().geocode({ address: `${q}, India` }, (res, status) => {
      if (status === "OK" && res?.[0]) {
        const g = res[0].geometry;
        apply(g.location, g.viewport, q);
      }
    });
  }

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search district / area (e.g. Tiruppur)"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          geocode();
        }
      }}
      style={{
        margin: 10, width: 300, height: 38, padding: "0 12px", borderRadius: 8,
        border: "1px solid #ccc", background: "#fff", color: "#111", fontSize: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }}
    />
  );
}

async function fetchBoundary(
  name: string,
  loc: google.maps.LatLng,
  vp: google.maps.LatLngBounds | undefined,
): Promise<LatLng[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&polygon_threshold=0.005&limit=5&q=${encodeURIComponent(name)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const list: any[] = await res.json();
    const hit = list.find((r) => r.geojson && (r.geojson.type === "Polygon" || r.geojson.type === "MultiPolygon"));
    if (hit) {
      const rings: number[][][] =
        hit.geojson.type === "Polygon" ? [hit.geojson.coordinates[0]] : hit.geojson.coordinates.map((p: number[][][]) => p[0]);
      const ring = rings.reduce((a, b) => (b.length > a.length ? b : a));
      const step = Math.max(1, Math.ceil(ring.length / 120));
      const same = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
      const open = same ? ring.slice(0, -1) : ring;
      const pts = open
        .filter((_, i) => i % step === 0)
        .map(([lng, lat]) => ({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) }))
        .filter((p, i, a) => i === 0 || p.lat !== a[i - 1].lat || p.lng !== a[i - 1].lng);
      if (pts.length >= 3) return pts;
    }
  } catch {
    /* fall back below */
  }
  return buildPolygon(loc, vp, "area");
}
