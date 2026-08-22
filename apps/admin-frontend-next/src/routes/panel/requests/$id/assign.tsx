import { useMutation, useQuery } from "@apollo/client";
import { Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";
import { Star, UserCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { ConfirmAction } from "@/components/panel/ConfirmAction";
import { MissingMapsKey, useMapsKey } from "@/components/maps/MapsProvider";
import {
  ASSIGN_DRIVER_TO_ORDER_MUTATION,
  NEARBY_DRIVERS_QUERY,
} from "@/lib/graphql/documents/admin-actions";
import { DRIVERS_LOCATION_QUERY } from "@/lib/graphql/documents/extras";
import { ORDER_DETAIL_QUERY } from "@/lib/graphql/documents/order-detail";
import { driverStatusVariant } from "@/lib/panel/status-styles";
import { cn } from "@/lib/utils";
import { formatName } from "@/lib/format";
import type { OrderContext } from "./layout";

interface DriverRow {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  mobileNumber: string;
  carPlate?: string | null;
  status: string;
  rating?: number | null;
}

interface DriverLocation {
  id: string;
  location: { lat: number; lng: number };
  firstName?: string | null;
  lastName?: string | null;
}

export default function OrderAssignTab() {
  const { order } = useOutletContext<OrderContext>();
  const { data, loading } = useQuery(NEARBY_DRIVERS_QUERY);
  const pickup = order.points[0];
  const { data: locationsData } = useQuery(DRIVERS_LOCATION_QUERY, {
    skip: !pickup,
    variables: pickup
      ? { center: { lat: pickup.lat, lng: pickup.lng }, count: 50 }
      : undefined,
  });
  const [assign, { loading: assigning }] = useMutation(ASSIGN_DRIVER_TO_ORDER_MUTATION, {
    refetchQueries: [{ query: ORDER_DETAIL_QUERY, variables: { id: order.id } }],
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  const drivers = (data?.drivers.nodes ?? []) as DriverRow[];
  const driverLocations = (locationsData?.getDriversLocationWithData ?? []) as DriverLocation[];
  const locationById = useMemo(() => {
    const map = new Map<string, DriverLocation>();
    for (const d of driverLocations) map.set(d.id, d);
    return map;
  }, [driverLocations]);

  const cannotAssign = ["Finished", "DriverCanceled", "RiderCanceled", "Expired"].includes(
    order.status,
  );

  if (loading && !data) return <LoadingBlock />;

  if (cannotAssign) {
    return (
      <EmptyBlock
        title="Cannot assign"
        description="This order has already finished or been cancelled."
      />
    );
  }

  if (drivers.length === 0) {
    return (
      <EmptyBlock
        title="No available drivers"
        description="No drivers are currently online or in service."
      />
    );
  }

  async function handleAssign(driverId: string) {
    setActiveId(driverId);
    try {
      await assign({ variables: { orderId: order.id, driverId } });
      toast.success("Driver assigned");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setActiveId(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <AssignMap
        pickup={pickup ? { lat: pickup.lat, lng: pickup.lng } : undefined}
        drivers={driverLocations}
        highlightId={highlight}
        onHighlight={setHighlight}
      />
      <div className="grid gap-3 sm:grid-cols-1 xl:grid-cols-1">
        {drivers.map((d) => {
          const loc = locationById.get(d.id);
          return (
            <Card
              key={d.id}
              size="sm"
              className={cn(highlight === d.id && "ring-2 ring-primary")}
              onMouseEnter={() => setHighlight(d.id)}
              onMouseLeave={() => setHighlight(null)}
            >
              <CardContent className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{formatName(d)}</div>
                    <div className="text-xs text-muted-foreground">{d.mobileNumber}</div>
                  </div>
                  <Badge variant={driverStatusVariant(d.status)}>{d.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{d.carPlate ?? (loc ? "Live" : "—")}</span>
                  {d.rating != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {d.rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <ConfirmAction
                  title={`Assign ${formatName(d)}?`}
                  description={`Order #${order.id} will be re-routed to this driver.`}
                  actionLabel="Assign"
                  onConfirm={() => handleAssign(d.id)}
                  trigger={
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      disabled={assigning && activeId === d.id}
                    >
                      <UserCheck className="size-3.5" />
                      Assign
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface AssignMapProps {
  pickup?: { lat: number; lng: number };
  drivers: DriverLocation[];
  highlightId: string | null;
  onHighlight: (id: string | null) => void;
}

function AssignMap({ pickup, drivers, highlightId, onHighlight }: AssignMapProps) {
  const apiKey = useMapsKey();
  if (!apiKey) return <MissingMapsKey />;
  const center = pickup ?? drivers[0]?.location ?? { lat: 40.7128, lng: -74.006 };
  return (
    <div className="h-[480px] overflow-hidden rounded-lg border border-border">
      <GoogleMap
        mapId="ridy-admin-assign"
        defaultCenter={center}
        defaultZoom={12}
        gestureHandling="greedy"
      >
        {pickup ? (
          <Marker
            position={pickup}
            label={{ text: "A", color: "#fff", fontSize: "12px", fontWeight: "600" }}
          />
        ) : null}
        {drivers.map((d) => (
          <Marker
            key={d.id}
            position={d.location}
            onClick={() => onHighlight(d.id)}
            label={{
              text: (d.firstName ?? "").slice(0, 1) + (d.lastName ?? "").slice(0, 1) || "·",
              color: "#fff",
              fontSize: "11px",
              fontWeight: "600",
            }}
            zIndex={highlightId === d.id ? 1000 : undefined}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
