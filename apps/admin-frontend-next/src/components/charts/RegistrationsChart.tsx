import { useQuery } from "@apollo/client";
import { type DocumentNode } from "graphql";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
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
import {
  DRIVER_REGISTRATIONS_QUERY,
  RIDER_REGISTRATIONS_QUERY,
} from "@/lib/graphql/documents/overview";

interface Props {
  variant: "driver" | "rider";
}

const VARIANTS: Record<
  Props["variant"],
  { title: string; query: DocumentNode; color: string; dataKey: string }
> = {
  driver: {
    title: "Driver registrations",
    query: DRIVER_REGISTRATIONS_QUERY as unknown as DocumentNode,
    color: "var(--color-chart-3)",
    dataKey: "driverRegistrations",
  },
  rider: {
    title: "Rider registrations",
    query: RIDER_REGISTRATIONS_QUERY as unknown as DocumentNode,
    color: "var(--color-chart-4)",
    dataKey: "riderRegistrations",
  },
};

export function RegistrationsChart({ variant }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>("Monthly");
  const config = VARIANTS[variant];
  const { data, loading } = useQuery(config.query, { variables: { timeframe } });

  const items = (data as Record<string, { time: string; count: number }[]> | undefined)?.[
    config.dataKey
  ] ?? [];

  return (
    <ChartCard
      title={config.title}
      loading={loading && items.length === 0}
      empty={!loading && items.length === 0}
      actions={<TimeframeSelector value={timeframe} onChange={setTimeframe} />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={items} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
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
          <Line
            type="monotone"
            dataKey="count"
            stroke={config.color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
