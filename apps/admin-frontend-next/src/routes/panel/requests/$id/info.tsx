import { useQuery } from "@apollo/client";
import { Link, useOutletContext } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyValueList } from "@/components/panel/KeyValue";
import { NotesSection } from "@/components/panel/NotesSection";
import { RouteMap } from "@/components/maps/RouteMap";
import {
  CREATE_ORDER_NOTE_MUTATION,
  ORDER_NOTES_QUERY,
} from "@/lib/graphql/documents/extras";
import { formatDateTime } from "@/lib/format";
import type { OrderContext } from "./layout";

export default function OrderInfoTab() {
  const { order } = useOutletContext<OrderContext>();
  const { data: notesData, loading: notesLoading, error: notesError } = useQuery(
    ORDER_NOTES_QUERY,
    { variables: { orderId: order.id } },
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              { label: "Type", value: order.type },
              { label: "Status", value: order.status },
              { label: "Created", value: formatDateTime(order.createdOn) },
              { label: "Started", value: formatDateTime(order.startTimestamp) },
              { label: "Finished", value: formatDateTime(order.finishTimestamp) },
              { label: "Expected", value: formatDateTime(order.expectedTimestamp) },
              { label: "Distance (m)", value: order.distanceBest.toLocaleString() },
              { label: "Duration (s)", value: order.durationBest.toLocaleString() },
              { label: "Wait (min)", value: order.waitMinutes.toFixed(1) },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parties</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              {
                label: "Rider",
                value: (
                  <Link to={`/riders/${order.riderId}`} className="underline-offset-2 hover:underline">
                    #{order.riderId}
                  </Link>
                ),
              },
              {
                label: "Driver",
                value: order.driverId ? (
                  <Link to={`/drivers/${order.driverId}`} className="underline-offset-2 hover:underline">
                    #{order.driverId}
                  </Link>
                ) : null,
              },
              { label: "Fleet", value: order.fleetId },
              { label: "Region", value: order.regionId },
              { label: "Service", value: order.serviceId },
              { label: "Payment mode", value: order.paymentMode },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Route</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RouteMap
            waypoints={order.points.map((p) => ({ lat: p.lat, lng: p.lng }))}
          />
          <ol className="space-y-3">
            {order.addresses.map((address, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {i === 0 ? "A" : i === order.addresses.length - 1 ? "B" : i + 1}
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm">{address}</div>
                  {order.points[i] ? (
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {order.points[i].lat.toFixed(5)}, {order.points[i].lng.toFixed(5)}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <NotesSection
          title="Order notes"
          notes={notesData?.taxiOrderNotes.nodes ?? []}
          loading={notesLoading}
          error={notesError}
          createMutation={CREATE_ORDER_NOTE_MUTATION}
          buildVariables={(note) => ({ input: { orderId: order.id, note } })}
          refetchQueries={[{ query: ORDER_NOTES_QUERY, variables: { orderId: order.id } }]}
        />
      </div>
    </div>
  );
}
