import { Map, useMap } from "@vis.gl/react-google-maps";
import { Eraser, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { MissingMapsKey, useMapsKey } from "@/components/maps/MapsProvider";
import { cn } from "@/lib/utils";

export interface LatLng {
  lat: number;
  lng: number;
}

const DEFAULT_CENTER: LatLng = { lat: 40.7128, lng: -74.006 };
const DEFAULT_ZOOM = 11;

interface SinglePolygonProps {
  value: LatLng[];
  onChange: (next: LatLng[]) => void;
  defaultCenter?: LatLng;
  defaultZoom?: number;
  height?: number;
}

/**
 * Edit a single polygon. Click map to add a vertex, drag vertices to move,
 * right-click a vertex to delete.
 */
export function PolygonEditor(props: SinglePolygonProps) {
  const apiKey = useMapsKey();
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
          <SinglePolygonInternal {...props} />
        </Map>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {props.value.length === 0
            ? "Click the map to add the first vertex."
            : `${props.value.length} vertices · click to add, drag to move, right-click to delete.`}
        </span>
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
}

/**
 * Edit several polygons that together describe a multi-polygon geo-fence.
 * Pick one polygon at a time to edit; add or remove polygons via the toolbar.
 */
export function MultiPolygonEditor({ value, onChange, height = 420 }: MultiPolygonProps) {
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
      />
    </div>
  );
}
