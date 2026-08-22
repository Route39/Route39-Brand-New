import { useQuery } from "@apollo/client";
import { Star } from "lucide-react";
import { useOutletContext } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { DRIVER_FEEDBACKS_QUERY } from "@/lib/graphql/documents/driver-detail";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DriverContext } from "./layout";

export default function DriverReviewsTab() {
  const { driver } = useOutletContext<DriverContext>();
  const { data, loading } = useQuery(DRIVER_FEEDBACKS_QUERY, {
    variables: { driverId: driver.id, paging: { limit: 50 } },
  });

  if (loading && !data) return <LoadingBlock />;

  const feedbacks = data?.feedbacks.nodes ?? [];
  if (feedbacks.length === 0) {
    return <EmptyBlock title="No reviews yet" description="This driver has not received any feedback." />;
  }

  return (
    <div className="space-y-3">
      {feedbacks.map((f) => (
        <Card key={f.id} size="sm">
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-4",
                      i < f.score
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40",
                    )}
                  />
                ))}
                <span className="ml-2 text-sm font-medium tabular-nums">{f.score}/5</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(f.reviewTimestamp)}
              </span>
            </div>
            {f.description ? (
              <p className="mt-2 text-sm">{f.description}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground italic">No comment.</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Order #{f.requestId}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
