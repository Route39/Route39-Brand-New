import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  total: number | null | undefined;
  change?: number | null | undefined;
  unit?: string | null;
  loading?: boolean;
}

export function KpiCard({ label, total, change, unit, loading }: KpiCardProps) {
  const direction = change == null ? "neutral" : change > 0 ? "up" : change < 0 ? "down" : "neutral";

  return (
    <Card>
      <CardContent>
        <div className="text-xs font-medium tracking-[0.08em] uppercase text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums">
              {unit === "$" ? "$" : null}
              {total != null ? total.toLocaleString() : "—"}
              {unit && unit !== "$" ? (
                <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
              ) : null}
            </span>
          )}
        </div>
        {change != null && !loading ? (
          <div
            className={cn(
              "mt-1 inline-flex items-center gap-1 text-xs",
              direction === "up" && "text-emerald-600 dark:text-emerald-400",
              direction === "down" && "text-destructive",
              direction === "neutral" && "text-muted-foreground",
            )}
          >
            {direction === "up" ? (
              <ArrowUp className="size-3" />
            ) : direction === "down" ? (
              <ArrowDown className="size-3" />
            ) : (
              <Minus className="size-3" />
            )}
            {Math.abs(change).toFixed(1)}% vs previous period
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
