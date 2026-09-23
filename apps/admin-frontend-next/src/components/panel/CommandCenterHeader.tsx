import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { Link } from "react-router-dom";
import { DollarSign, Grid2x2, Navigation, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TOTAL_ONLINE_DRIVERS_QUERY } from "@/lib/graphql/documents/command-center";
import { ORDERS_AGGREGATE_QUERY } from "@/lib/graphql/documents/orders";
import { formatCurrency } from "@/lib/format";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function lastMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 0, 0, 0, 0);
  return { start: start.toISOString(), end: now.toISOString() };
}

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function sumRevenue(row: {
  sum?: {
    costAfterCoupon?: number | null;
    gstAmount?: number | null;
    platformFeeAmount?: number | null;
    paymentGatewayFeeAmount?: number | null;
  } | null;
} | undefined) {
  return (
    (row?.sum?.costAfterCoupon ?? 0) +
    (row?.sum?.gstAmount ?? 0) +
    (row?.sum?.platformFeeAmount ?? 0) +
    (row?.sum?.paymentGatewayFeeAmount ?? 0)
  );
}

export function CommandCenterHeader() {
  const now = useClock();
  const { start: lmStart, end: lmEnd } = lastMonthRange();
  const { start: tdStart, end: tdEnd } = todayRange();

  const { data: lastMonthData } = useQuery(ORDERS_AGGREGATE_QUERY, {
    variables: { filter: { createdOn: { gte: lmStart, lte: lmEnd } } as never },
  });
  const { data: todayData } = useQuery(ORDERS_AGGREGATE_QUERY, {
    variables: { filter: { createdOn: { gte: tdStart, lte: tdEnd } } as never },
  });
  const { data: onlineData } = useQuery(TOTAL_ONLINE_DRIVERS_QUERY, {
    variables: { filter: { status: { eq: "Online" } } as never },
  });

  const lastMonth = lastMonthData?.orderAggregate?.[0];
  const today = todayData?.orderAggregate?.[0];
  const onlineCount = onlineData?.driverAggregate?.[0]?.count?.id ?? 0;

  const dateLabel = now.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
      <style>{`@keyframes ccPulse { 0%,100% { opacity: .75; transform: scale(1); } 50% { opacity: 0; transform: scale(2.4); } }`}</style>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <span className="relative inline-flex size-2 items-center justify-center">
              <span
                className="absolute inset-0 rounded-full bg-emerald-400"
                style={{ animation: "ccPulse 2s infinite" }}
              />
              <span className="relative size-2 rounded-full bg-emerald-400" />
            </span>
            Live operations · {dateLabel} · {timeLabel}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Command Center</h1>
        </div>
        <Button asChild className="gap-1.5 bg-[#c62828] text-white hover:bg-[#a81f1f]">
          <Link to="/dispatcher">
            <Plus className="size-4" />
            New Trip
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-xl border border-border bg-background p-5">
          <div className="flex items-start justify-between">
            <div className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Last month revenue collected
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#c62828]/20">
              <DollarSign className="size-4 text-[#c62828]" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
            {formatCurrency(sumRevenue(lastMonth), "INR")}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {(lastMonth?.count?.id ?? 0).toLocaleString()} trips · all cities
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-background p-5">
          <div className="flex items-start justify-between">
            <div className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Total auto running
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-400/20">
              <Navigation className="size-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{onlineCount}</div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-background p-5">
          <div className="flex items-start justify-between">
            <div className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Today revenue
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-400/20">
              <Grid2x2 className="size-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
            {formatCurrency(sumRevenue(today), "INR")}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {(today?.count?.id ?? 0).toLocaleString()} trips today
          </div>
        </div>
      </div>
    </div>
  );
}
