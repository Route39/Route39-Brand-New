import { useLazyQuery, useMutation } from "@apollo/client";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/Field";
import { Input } from "@/components/ui/input";
import { LoadingBlock } from "@/components/panel/StateBlock";
import { Spinner } from "@/components/ui/spinner";
import {
  CALCULATE_FARE_MUTATION,
  CREATE_ORDER_MUTATION,
  CREATE_QUICK_RIDER_MUTATION,
  DISPATCHER_RIDER_BY_MOBILE_QUERY,
} from "@/lib/graphql/documents/dispatcher";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface LatLng {
  lat: number;
  lng: number;
}

interface LocationValue {
  point: LatLng | null;
  address: string;
}

const EMPTY_LOCATION: LocationValue = { point: null, address: "" };

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function waypointFieldLabel(idx: number, total: number): string {
  if (idx === 0) return "Pickup location";
  if (idx === total - 1) return "Drop location";
  return `Stop ${idx}`;
}

export function NewBookingDialog() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [riderName, setRiderName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [waypoints, setWaypoints] = useState<LocationValue[]>([EMPTY_LOCATION, EMPTY_LOCATION]);
  const [serviceId, setServiceId] = useState<string | null>(null);
  // Set once we find (or plan to create) a rider for this mobile number.
  const [existingRiderId, setExistingRiderId] = useState<string | null>(null);

  const mobileValid = digitsOnly(mobileNumber).length === 10;
  const locationsSet = waypoints.length >= 2 && waypoints.every((w) => w.point !== null);

  function updateWaypoint(idx: number, patch: Partial<LocationValue>) {
    setWaypoints((prev) => prev.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  }
  function addStop() {
    setWaypoints((prev) => {
      const next = [...prev];
      const insertAt = Math.max(1, next.length - 1);
      next.splice(insertAt, 0, { ...EMPTY_LOCATION });
      return next;
    });
  }
  function removeWaypoint(idx: number) {
    setWaypoints((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length >= 2 ? next : prev;
    });
  }

  const [lookupRider] = useLazyQuery(DISPATCHER_RIDER_BY_MOBILE_QUERY, {
    fetchPolicy: "network-only",
  });
  const [createRider] = useMutation(CREATE_QUICK_RIDER_MUTATION);
  const [calculateFare, { data: fareData, loading: fareLoading }] = useLazyQuery(
    CALCULATE_FARE_MUTATION,
  );
  const [createOrder, { loading: creating }] = useMutation(CREATE_ORDER_MUTATION);

  // Debounced lookup: reuse an existing rider by mobile number instead of
  // creating a duplicate every time the same customer calls in.
  useEffect(() => {
    if (!mobileValid) {
      setExistingRiderId(null);
      return;
    }
    const handle = setTimeout(() => {
      void lookupRider({
        variables: { mobileNumber: digitsOnly(mobileNumber) },
      }).then(({ data }) => {
        setExistingRiderId(data?.riders.nodes[0]?.id ?? null);
      });
    }, 400);
    return () => clearTimeout(handle);
  }, [mobileNumber, mobileValid, lookupRider]);

  // Preview the fare as soon as we have a valid mobile number and both
  // locations. The rider record itself is only created (if needed) when
  // "Create order" is pressed — riderId here is a placeholder when no
  // existing rider was found, since the fare calculation never uses it.
  useEffect(() => {
    if (!mobileValid || !locationsSet) return;
    setServiceId(null);
    void calculateFare({
      variables: {
        input: {
          riderId: existingRiderId ?? "0",
          orderType: "Ride" as never,
          points: waypoints.map((w) => w.point),
        } as never,
      },
    });
  }, [mobileValid, locationsSet, waypoints, existingRiderId, calculateFare]);

  function reset() {
    setRiderName("");
    setMobileNumber("");
    setWaypoints([EMPTY_LOCATION, EMPTY_LOCATION]);
    setServiceId(null);
    setExistingRiderId(null);
  }

  async function handleCreateOrder() {
    if (!mobileValid || !locationsSet || !serviceId) return;
    try {
      let riderId = existingRiderId;
      if (!riderId) {
        const { data } = await createRider({
          variables: {
            input: {
              mobileNumber: digitsOnly(mobileNumber),
              firstName: riderName.trim() || undefined,
            } as never,
          },
        });
        riderId = data?.createOneRider.id ?? null;
      }
      if (!riderId) throw new Error("Could not resolve rider");

      const { data } = await createOrder({
        variables: {
          input: {
            riderId,
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
      setOpen(false);
      reset();
      if (id) navigate(`/requests/${id}`);
      else navigate("/requests");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Order creation failed");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
      modal={false}
    >
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="size-3.5" />
          New booking
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg"
        onPointerDownOutside={(event) => {
          // Google's suggestion dropdown (.pac-container) is appended
          // directly to <body>, outside this dialog's DOM subtree. Radix
          // treats a click on it as an "outside click" and intercepts the
          // pointerdown before Google's own mousedown-based selection
          // handler runs — so the suggestion never gets picked. Ignore
          // outside-clicks that land inside the suggestion dropdown.
          if (
            event.target instanceof Element &&
            event.target.closest(".pac-container")
          ) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription>
            Create an order for a rider without adding them in the Riders tab first.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Rider name" htmlFor="nbRiderName">
            <Input
              id="nbRiderName"
              value={riderName}
              onChange={(e) => setRiderName(e.target.value)}
              placeholder="Optional"
            />
          </Field>
          <Field
            label="Rider mobile number"
            htmlFor="nbRiderMobile"
            required
            error={mobileNumber.length > 0 && !mobileValid ? "Enter a valid 10-digit mobile number" : undefined}
          >
            <Input
              id="nbRiderMobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={mobileNumber}
              onChange={(e) => setMobileNumber(digitsOnly(e.target.value).slice(0, 10))}
              placeholder="e.g. 9876543210"
            />
          </Field>
          {waypoints.map((w, i) => (
            <LocationField
              key={i}
              label={waypointFieldLabel(i, waypoints.length)}
              value={w}
              onChange={(next) => updateWaypoint(i, next)}
              onRemove={i !== 0 && i !== waypoints.length - 1 ? () => removeWaypoint(i) : undefined}
            />
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addStop}>
            <Plus className="size-3.5" />
            Add stop
          </Button>

          {mobileValid && locationsSet ? (
            <Field label="Service" required>
              {fareLoading && !fareData ? (
                <LoadingBlock />
              ) : fareData?.calculateFare?.error ? (
                <p className="text-sm text-destructive">
                  Fare error: {fareData.calculateFare.error}
                </p>
              ) : !fareData?.calculateFare ? (
                <p className="text-sm text-muted-foreground">Calculating fare…</p>
              ) : (
                <ul className="max-h-56 space-y-1.5 overflow-y-auto">
                  {fareData.calculateFare.services.flatMap((cat) =>
                    cat.services.map((svc) => {
                      const gstAmount = (svc.cost * (svc.gstPercent ?? 0)) / 100;
                      const total = svc.cost + gstAmount + (svc.platformFee ?? 0);
                      return (
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
                              {formatCurrency(total, fareData.calculateFare.currency)}
                            </Badge>
                          </button>
                        </li>
                      );
                    }),
                  )}
                </ul>
              )}
            </Field>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateOrder}
            disabled={!mobileValid || !locationsSet || !serviceId || creating}
          >
            {creating ? <Spinner size="sm" className="text-primary-foreground" /> : "Create order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LocationField({
  label,
  value,
  onChange,
  onRemove,
}: {
  label: string;
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  onRemove?: () => void;
}) {
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
        onChange({
          point: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() },
          address: place.formatted_address || place.name || "",
        });
      }
    });
    return () => google.maps.event.removeListener(listener);
  }, [autocomplete, onChange]);

  return (
    <Field label={label} required>
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="Type an address"
        />
        {onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Remove stop"
            onClick={onRemove}
            className="size-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </Field>
  );
}