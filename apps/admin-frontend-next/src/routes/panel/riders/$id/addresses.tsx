import { useQuery } from "@apollo/client";
import { MapPin } from "lucide-react";
import { useOutletContext } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { RIDER_ADDRESSES_QUERY } from "@/lib/graphql/documents/rider-detail";
import type { RiderContext } from "./layout";

export default function RiderAddressesTab() {
  const { rider } = useOutletContext<RiderContext>();
  const { data, loading } = useQuery(RIDER_ADDRESSES_QUERY, {
    variables: { riderId: rider.id },
  });

  if (loading && !data) return <LoadingBlock />;

  const addresses = data?.riderAddresses.nodes ?? [];
  if (addresses.length === 0) {
    return (
      <EmptyBlock
        title="No saved addresses"
        description="This rider has not saved any addresses."
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {addresses.map((a) => (
        <Card key={a.id} size="sm">
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="grid size-9 place-items-center rounded-md bg-muted text-muted-foreground">
                <MapPin className="size-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{a.title}</div>
                  <Badge variant="outline">{a.type}</Badge>
                </div>
                {a.details ? (
                  <p className="text-sm text-muted-foreground">{a.details}</p>
                ) : null}
                <p className="font-mono text-xs text-muted-foreground">
                  {a.location.lat.toFixed(5)}, {a.location.lng.toFixed(5)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
