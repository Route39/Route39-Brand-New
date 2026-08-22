import { useApolloClient, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { Map, Marker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Check, ChevronLeft, ChevronRight, MapPin, Plus, Search, Target, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/forms/Field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingBlock } from "@/components/panel/StateBlock";
import { MissingMapsKey, useMapsKey } from "@/components/maps/MapsProvider";
import { PageHeader } from "@/components/panel/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  CALCULATE_FARE_MUTATION,
  CREATE_ORDER_MUTATION,
  DISPATCHER_RIDERS_QUERY,
  REVERSE_GEOCODE_QUERY,
} from "@/lib/graphql/documents/dispatcher";
import { cn } from "@/lib/utils";
import { formatCurrency, formatName } from "@/lib/format";

interface LatLng {
  lat: number;
  lng: number;
}

interface Waypoint {
  point: LatLng | null;
  address: string;
}

interface RiderOption {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  mobileNumber: string;
}

function waypointLabel(idx: number, total: number): string {
  if (idx === 0) return "Pickup";
  if (idx === total - 1) return "Dropoff";
  return `Stop ${idx}`;
}

function waypointMarker(idx: number): string {
  return String.fromCharCode(65 + idx);
}

const STEPS = ["rider", "locations", "service", "confirm"] as const;
type Step = (typeof STEPS)[number];

const ORDER_TYPES = [
  { value: "Ride", label: "Ride" },
  { value: "Rideshare", label: "Rideshare" },
  { value: "ParcelDelivery", label: "Parcel delivery" },
];

export default function DispatcherPage() {
  const navigate = useNavigate();
  const apiKey = useMapsKey();
  const client = useApolloClient();
  const [step, setStep] = useState<Step>("rider");
  const [rider, setRider] = useState<RiderOption | null>(null);
  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState("Ride");
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    { point: null, address: "" },
    { point: null, address: "" },
  ]);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [serviceId, setServiceId] = useState<string | null>(null);

  const allWaypointsSet = waypoints.length >= 2 && waypoints.every((w) => w.point !== null);

  function updateWaypoint(idx: number, patch: Partial<Waypoint>) {
    setWaypoints((prev) => prev.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  }
  function clearWaypoint(idx: number) {
    updateWaypoint(idx, { point: null, address: "" });
    setActiveIdx(idx);
  }
  function removeWaypoint(idx: number) {
    setWaypoints((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length >= 2 ? next : prev;
    });
    setActiveIdx((curr) => {
      if (curr === idx) {
        const firstEmpty = waypoints.findIndex((w, i) => i !== idx && w.point === null);
        return firstEmpty === -1 ? 0 : firstEmpty;
      }
      return curr > idx ? curr - 1 : curr;
    });
  }
  function addStop() {
    setWaypoints((prev) => {
      const next = [...prev];
      const insertAt = Math.max(1, next.length - 1);
      next.splice(insertAt, 0, { point: null, address: "" });
      setActiveIdx(insertAt);
      return next;
    });
  }

  async function resolveAddress(idx: number, point: LatLng) {
    updateWaypoint(idx, { point, address: "Resolving address…" });
    try {
      const { data } = await client.query({
        query: REVERSE_GEOCODE_QUERY,
        variables: { location: point },
        fetchPolicy: "network-only",
      });
      const resolved = data?.reverseGeocode?.address;
      updateWaypoint(idx, {
        point,
        address:
          resolved && resolved.length > 0
            ? resolved
            : `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
      });
    } catch {
      updateWaypoint(idx, {
        point,
        address: `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
      });
    }
  }

  function handleMapClick(point: LatLng) {
    if (step !== "locations") return;
    const targetIdx =
      activeIdx >= 0 && activeIdx < waypoints.length && waypoints[activeIdx].point === null
        ? activeIdx
        : waypoints.findIndex((w) => w.point === null);
    if (targetIdx === -1) return;
    void resolveAddress(targetIdx, point);
    const nextEmpty = waypoints.findIndex((w, i) => i !== targetIdx && w.point === null);
    setActiveIdx(nextEmpty === -1 ? targetIdx : nextEmpty);
  }

  const { data: ridersData, refetch: refetchRiders, loading: ridersLoading } = useQuery(
    DISPATCHER_RIDERS_QUERY,
    { variables: { search: search ? `%${search}%` : "%" } as never },
  );
  const riders = (ridersData?.riders.nodes ?? []) as RiderOption[];

  const [calculateFare, { data: fareData, loading: fareLoading }] = useLazyQuery(
    CALCULATE_FARE_MUTATION,
  );

  const [createOrder, { loading: creating }] = useMutation(CREATE_ORDER_MUTATION);

  useEffect(() => {
    if (step === "service" && rider && allWaypointsSet) {
      void calculateFare({
        variables: {
          input: {
            riderId: rider.id,
            orderType: orderType as never,
            points: waypoints.map((w) => ({ lat: w.point!.lat, lng: w.point!.lng })),
          },
        },
      });
    }
  }, [step, rider, waypoints, allWaypointsSet, orderType, calculateFare]);

  if (!apiKey) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dispatcher" />
        <MissingMapsKey />
      </div>
    );
  }

  function handleNext() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }
  function handleBack() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  async function handleCreate() {
    if (!rider || !allWaypointsSet || !serviceId) return;
    try {
      const { data } = await createOrder({
        variables: {
          input: {
            riderId: rider.id,
            serviceId,
            points: waypoints.map((w) => w.point!),
            addresses: waypoints.map((w) => w.address),
            waitingTimeMinutes: 0,
            twoWay: false,
            optionIds: [],
            intervalMinutes: 0,
          } as never,
        },
      });
      const id = data?.createOrder.id;
      toast.success("Order created");
      if (id) navigate(`/requests/${id}`);
      else navigate("/requests");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Order creation failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dispatcher" description="Create an order on behalf of a rider." />
      <Stepper active={step} />

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">{step}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {step === "rider" ? (
              <>
                <Field label="Search riders" htmlFor="riderSearch">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="riderSearch"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        void refetchRiders({ search: `%${e.target.value || ""}%` } as never);
                      }}
                      placeholder="Name or phone"
                      className="pl-8"
                    />
                  </div>
                </Field>
                {ridersLoading && riders.length === 0 ? (
                  <LoadingBlock />
                ) : (
                  <ul className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-border">
                    {riders.length === 0 ? (
                      <li className="p-3 text-sm text-muted-foreground">No riders match.</li>
                    ) : (
                      riders.map((r) => (
                        <li
                          key={r.id}
                          className={cn(
                            "flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-muted/40",
                            rider?.id === r.id && "bg-muted/60",
                          )}
                          onClick={() => setRider(r)}
                        >
                          <div>
                            <div className="font-medium">{formatName(r)}</div>
                            <div className="text-xs text-muted-foreground">{r.mobileNumber}</div>
                          </div>
                          {rider?.id === r.id ? <Check className="size-4 text-primary" /> : null}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </>
            ) : null}

            {step === "locations" ? (
              <>
                <Field label="Order type" htmlFor="orderType">
                  <Select value={orderType} onValueChange={setOrderType}>
                    <SelectTrigger id="orderType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="space-y-2">
                  {waypoints.map((w, i) => (
                    <WaypointRow
                      key={i}
                      label={waypointLabel(i, waypoints.length)}
                      marker={waypointMarker(i)}
                      value={w}
                      active={activeIdx === i}
                      canRemove={waypoints.length > 2}
                      onActivate={() => setActiveIdx(i)}
                      onAddressChange={(addr) => updateWaypoint(i, { address: addr })}
                      onClear={() => clearWaypoint(i)}
                      onRemove={() => removeWaypoint(i)}
                      onPlaceSelected={(point, address) => {
                        updateWaypoint(i, { point, address });
                        const nextEmpty = waypoints.findIndex((wpt, idx) => idx !== i && wpt.point === null);
                        if (nextEmpty !== -1) setActiveIdx(nextEmpty);
                      }}
                    />
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addStop}>
                  <Plus className="size-3.5" />
                  Add stop
                </Button>
                <p className="text-xs text-muted-foreground">
                  Click the map to set the highlighted waypoint. Use the pin button to re-target a row, the pencil to edit the address, or the trash to remove a stop.
                </p>
              </>
            ) : null}

            {step === "service" ? (
              <>
                {fareLoading && !fareData ? (
                  <LoadingBlock />
                ) : fareData?.calculateFare?.error ? (
                  <p className="text-sm text-destructive">
                    Fare error: {fareData.calculateFare.error}
                  </p>
                ) : !fareData?.calculateFare ? (
                  <p className="text-sm text-muted-foreground">Calculating fare…</p>
                ) : (
                  <ul className="space-y-1.5">
                    {fareData.calculateFare.services.flatMap((cat) =>
                      cat.services.map((svc) => (
                        <li key={svc.id}>
                          <button
                            type="button"
                            onClick={() => setServiceId(svc.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-muted/40",
                              serviceId === svc.id && "border-primary bg-muted/60",
                            )}
                          >
                            <div>
                              <div className="text-sm font-medium">{svc.name}</div>
                              {svc.description ? (
                                <div className="text-xs text-muted-foreground">{svc.description}</div>
                              ) : null}
                            </div>
                            <Badge variant="default">
                              {formatCurrency(svc.cost, fareData.calculateFare.currency)}
                            </Badge>
                          </button>
                        </li>
                      )),
                    )}
                  </ul>
                )}
              </>
            ) : null}

            {step === "confirm" ? (
              <div className="space-y-2 text-sm">
                <Label className="text-xs">Rider</Label>
                <div>{rider ? formatName(rider) : "—"}</div>
                <Label className="text-xs">Route</Label>
                <ol className="space-y-1">
                  {waypoints.map((w, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                        {waypointMarker(i)}
                      </span>
                      <span>
                        {w.address || "—"}
                        <span className="block text-xs text-muted-foreground">
                          {waypointLabel(i, waypoints.length)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                <Label className="text-xs">Service</Label>
                <div>
                  {serviceId
                    ? fareData?.calculateFare.services
                        .flatMap((c) => c.services)
                        .find((s) => s.id === serviceId)?.name
                    : "—"}
                </div>
              </div>
            ) : null}

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === "rider"}
              >
                <ChevronLeft className="size-3.5" />
                Back
              </Button>
              {step === "confirm" ? (
                <Button type="button" onClick={handleCreate} disabled={creating || !serviceId}>
                  {creating ? <Spinner size="sm" className="text-primary-foreground" /> : "Create order"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (step === "rider" && !rider) ||
                    (step === "locations" && !allWaypointsSet) ||
                    (step === "service" && !serviceId)
                  }
                >
                  Next
                  <ChevronRight className="size-3.5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-[480px]">
            <Map
              mapId="ridy-admin-dispatch"
              defaultCenter={waypoints[0]?.point ?? { lat: 40.7128, lng: -74.006 }}
              defaultZoom={12}
              gestureHandling="greedy"
              disableDefaultUI={false}
            >
              <DispatchMapClicks onClick={handleMapClick} />
              {waypoints.map((w, i) =>
                w.point ? (
                  <Marker
                    key={i}
                    position={w.point}
                    label={{
                      text: waypointMarker(i),
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                    title={`${waypointLabel(i, waypoints.length)} · ${w.address}`}
                  />
                ) : null,
              )}
            </Map>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stepper({ active }: { active: Step }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {STEPS.map((s, i) => {
        const isActive = s === active;
        const isPast = STEPS.indexOf(s) < STEPS.indexOf(active);
        return (
          <li
            key={s}
            className={cn(
              "flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 capitalize",
              isActive && "border-primary bg-primary text-primary-foreground",
              isPast && "border-muted-foreground/40 bg-muted text-muted-foreground",
            )}
          >
            <span>{i + 1}.</span>
            {s}
          </li>
        );
      })}
    </ol>
  );
}

interface WaypointRowProps {
  label: string;
  marker: string;
  value: Waypoint;
  active: boolean;
  canRemove: boolean;
  onActivate: () => void;
  onAddressChange: (next: string) => void;
  onClear: () => void;
  onRemove: () => void;
  onPlaceSelected?: (point: LatLng, address: string) => void;
}

function WaypointRow({
  label,
  marker,
  value,
  active,
  canRemove,
  onActivate,
  onAddressChange,
  onClear,
  onRemove,
  onPlaceSelected,
}: WaypointRowProps) {
  const isSet = value.point !== null;
  const places = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!places || !inputRef.current) return;
    const instance = new places.Autocomplete(inputRef.current, {
      fields: ["geometry", "name", "formatted_address"],
    });
    setAutocomplete(instance);
  }, [places]);

  useEffect(() => {
    if (!autocomplete) return;
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name || "";
        onPlaceSelected?.({ lat, lng }, address);
      }
    });
    return () => google.maps.event.removeListener(listener);
  }, [autocomplete, onPlaceSelected]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-border bg-input/20 px-2 py-1.5",
        active && "ring-2 ring-primary/40",
      )}
    >
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
        {marker}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <Input
          ref={inputRef}
          value={value.address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={active ? "Type address or click map" : "Not set"}
          className="h-7 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title={isSet ? "Re-pin on map" : "Set on map"}
        onClick={() => {
          onActivate();
          if (isSet) onClear();
        }}
        className={cn("size-7", active && "text-primary")}
      >
        {isSet ? <MapPin className="size-3.5" /> : <Target className="size-3.5" />}
      </Button>
      {canRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Remove stop"
          onClick={onRemove}
          className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

function DispatchMapClicks({ onClick }: { onClick: (p: LatLng) => void }) {
  const map = useMap();
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      onClickRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });
    return () => google.maps.event.removeListener(listener);
  }, [map]);

  return null;
}
