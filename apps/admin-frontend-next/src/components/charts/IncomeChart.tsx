import { useQuery } from "@apollo/client";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
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
import { INCOME_CHART_QUERY } from "@/lib/graphql/documents/overview";

export function IncomeChart() {
  const [timeframe, setTimeframe] = useState<Timeframe>("Monthly");
  const { data, loading } = useQuery(INCOME_CHART_QUERY, { variables: { timeframe } });

  const points = useMemo(
    () => (data?.incomeChart ?? []).map((p) => ({ time: p.time, sum: p.sum })),
    [data?.incomeChart],
  );

  return (
    <ChartCard
      title="Income"
      description="Total revenue across all currencies"
      loading={loading && points.length === 0}
      empty={!loading && points.length === 0}
      actions={<TimeframeSelector value={timeframe} onChange={setTimeframe} />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="time"
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            tickFormatter={(value) => formatChartTime(value, timeframe)}
          />
          <YAxis stroke="var(--color-muted-foreground)" fontSize={11} width={50} />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
              fontSize: "0.8rem",
            }}
            labelFormatter={(value) => formatChartTime(value, timeframe, "tooltip")}
          />
          <Area
            type="monotone"
            dataKey="sum"
            stroke="var(--color-chart-2)"
            strokeWidth={2}
            fill="url(#incomeGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
