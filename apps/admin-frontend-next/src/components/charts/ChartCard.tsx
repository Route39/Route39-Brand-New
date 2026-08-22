import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  description,
  loading,
  empty,
  emptyMessage = "No data for this timeframe.",
  actions,
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{title}</span>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </CardTitle>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="relative h-64 w-full">
          {loading ? (
            <div className="absolute inset-0 grid place-items-center">
              <Spinner />
            </div>
          ) : empty ? (
            <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}
