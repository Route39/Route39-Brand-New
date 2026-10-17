import { useQuery } from "@apollo/client";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/charts/ChartCard";
import {
  TimeframeSelector,
  formatChartTime,
  type Timeframe,
} from "@/components/charts/TimeframeSelector";
import { REQUEST_CHART_QUERY } from "@/lib/graphql/documents/overview";

export function RequestsChart() {
  const [timeframe, setTimeframe] = useState<Timeframe>("Monthly");
  const { data, loading } = useQuery(REQUEST_CHART_QUERY, { variables: { timeframe } });

  // Aggregate by time bucket and stack by simplified status group.
  const points = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>();
    for (const p of data?.requestChart ?? []) {
      const key = String(p.time);
      const row = map.get(key) ?? { time: Number(p.time), Completed: 0, Cancelled: 0, "No driver": 0, Ongoing: 0 };
      const group = statusGroup(p.status);
      row[group] = (Number(row[group]) || 0) + Number(p.count);
      map.set(key, row);
    }
    return Array.from(map.values()).sort((a, b) => Number(a.time) - Number(b.time));
  }, [data?.requestChart]);

  const statuses = ["Completed", "Cancelled", "No driver", "Ongoing"];
  const colors: Record<string, string> = {
    Completed: "#10b981",
    Cancelled: "#ef4444",
    "No driver": "#f59e0b",
    Ongoing: "#3b82f6",
  };

  return (
    <ChartCard
      title="Requests"
      description="Ride requests: completed, cancelled, no driver, ongoing"
      loading={loading && points.length === 0}
      empty={!loading && points.length === 0}
      actions={<TimeframeSelector value={timeframe} onChange={setTimeframe} />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="time"
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            tickFormatter={(value) => formatChartTime(value, timeframe)}
          />
          <YAxis stroke="var(--color-muted-foreground)" fontSize={11} width={40} />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
              fontSize: "0.8rem",
            }}
            labelFormatter={(value) => formatChartTime(value, timeframe, "tooltip")}
          />
          <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
          {statuses.map((status) => (
            <Bar key={status} dataKey={status} stackId="status" fill={colors[status]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function statusGroup(status: string): string {
  if (status === "Finished" || status === "WaitingForReview") return "Completed";
  if (status === "RiderCanceled" || status === "DriverCanceled") return "Cancelled";
  if (status === "NotFound" || status === "NoCloseFound" || status === "Expired") return "No driver";
  return "Ongoing";
}
