import { useOutletContext } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyBlock } from "@/components/panel/StateBlock";
import { orderStatusVariant } from "@/lib/panel/status-styles";
import { formatDateTime } from "@/lib/format";
import type { OrderContext } from "./layout";

/**
 * Order activity log derived from the timestamps available on Order. The full
 * activity stream lives on TaxiOrder (active orders only); for past orders we
 * show a milestone-style timeline.
 */
export default function OrderActivitiesTab() {
  const { order } = useOutletContext<OrderContext>();

  const events: { label: string; at: string | null | undefined }[] = [
    { label: "Created", at: order.createdOn },
    { label: "Started", at: order.startTimestamp },
    { label: "Finished", at: order.finishTimestamp },
    { label: "Expected", at: order.expectedTimestamp },
  ].filter((e) => Boolean(e.at));

  if (events.length === 0) {
    return <EmptyBlock title="No timeline" description="No timestamps recorded for this order yet." />;
  }

  return (
    <Card>
      <CardContent className="py-6">
        <ol className="relative space-y-5 border-l border-border pl-5">
          {events.map((e, i) => (
            <li key={i} className="space-y-1">
              <div className="absolute -left-1.5 mt-1.5 size-3 rounded-full bg-primary" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{e.label}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(e.at)}</span>
              </div>
            </li>
          ))}
          <li className="space-y-1">
            <div className="absolute -left-1.5 mt-1.5 size-3 rounded-full bg-muted-foreground" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Current status</span>
              <Badge variant={orderStatusVariant(order.status)}>{order.status}</Badge>
            </div>
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}
