import { useQuery } from "@apollo/client";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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

  // Aggregate by time bucket and stack by status.
  const points = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>();
    for (const p of data?.requestChart ?? []) {
      const row = map.get(p.time) ?? { time: p.time };
      (row as Record<string, number | string>)[p.status] = p.count;
      map.set(p.time, row);
    }
    return Array.from(map.values());
  }, [data?.requestChart]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const p of data?.requestChart ?? []) set.add(p.status);
    return Array.from(set);
  }, [data?.requestChart]);

  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];

  return (
    <ChartCard
      title="Requests"
      description="Order volume grouped by status"
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
          {statuses.map((status, i) => (
            <Bar key={status} dataKey={status} stackId="status" fill={colors[i % colors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
