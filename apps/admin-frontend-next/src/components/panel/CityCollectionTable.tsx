import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { MapPin } from "lucide-react";

import {
  CITY_DRIVERS_BY_IDS_QUERY,
  CITY_ONLINE_DRIVERS_QUERY,
  CITY_ORDERS_TODAY_QUERY,
} from "@/lib/graphql/documents/city-collection";
import { formatCurrency } from "@/lib/format";

const CITIES = ["Bangalore", "Tiruppur", "Coimbatore", "Chennai"];

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function CityCollectionTable() {
  const { start, end } = todayRange();

  const { data: ordersData, loading: ordersLoading } = useQuery(CITY_ORDERS_TODAY_QUERY, {
    variables: {
      filter: { createdOn: { gte: start, lte: end } } as never,
      cashFilter: {
        createdOn: { gte: start, lte: end },
        paymentMode: { eq: "Cash" },
      } as never,
    },
  });

  const { data: driversAggData, loading: driversAggLoading } = useQuery(
    CITY_ONLINE_DRIVERS_QUERY,
    { variables: { filter: { status: { eq: "Online" } } as never } },
  );

  const perDriver = useMemo(() => {
    const trips = new Map<string, { trips: number; collected: number }>();
    for (const row of ordersData?.allOrders ?? []) {
      const id = row.groupBy?.driverId;
      if (!id) continue;
      trips.set(id, {
        trips: row.count?.id ?? 0,
        collected:
          (row.sum?.costAfterCoupon ?? 0) +
          (row.sum?.gstAmount ?? 0) +
          (row.sum?.platformFeeAmount ?? 0) +
          (row.sum?.paymentGatewayFeeAmount ?? 0),
      });
    }
    const cash = new Map<string, number>();
    for (const row of ordersData?.cashOrders ?? []) {
      const id = row.groupBy?.driverId;
      if (!id) continue;
      cash.set(
        id,
        (row.sum?.costAfterCoupon ?? 0) +
          (row.sum?.gstAmount ?? 0) +
          (row.sum?.platformFeeAmount ?? 0) +
          (row.sum?.paymentGatewayFeeAmount ?? 0),
      );
    }
    return { trips, cash };
  }, [ordersData]);

  const driverIds = useMemo(() => Array.from(perDriver.trips.keys()), [perDriver]);

  const { data: driversData, loading: driversLoading } = useQuery(CITY_DRIVERS_BY_IDS_QUERY, {
    variables: {
      filter: { id: { in: driverIds } } as never,
      paging: { limit: Math.max(driverIds.length, 1), offset: 0 },
      sorting: [] as never,
    },
    skip: driverIds.length === 0,
  });

  const loading = ordersLoading || driversAggLoading || driversLoading;

  const rows = useMemo(() => {
    type CityBucket = { running: number; trips: number; collected: number; cash: number };
    const byCity = new Map<string, CityBucket>();
    for (const city of CITIES) byCity.set(city, { running: 0, trips: 0, collected: 0, cash: 0 });

    for (const row of driversAggData?.driverAggregate ?? []) {
      const city = row.groupBy?.city;
      if (!city || !byCity.has(city)) continue;
      byCity.get(city)!.running = row.count?.id ?? 0;
    }

    for (const driver of driversData?.drivers.nodes ?? []) {
      const city = driver.city;
      if (!city || !byCity.has(city)) continue;
      const t = perDriver.trips.get(driver.id);
      const c = perDriver.cash.get(driver.id) ?? 0;
      if (t) {
        byCity.get(city)!.trips += t.trips;
        byCity.get(city)!.collected += t.collected;
      }
      byCity.get(city)!.cash += c;
    }

    return CITIES.map((city) => {
      const v = byCity.get(city)!;
      return { city, ...v, pending: Math.max(v.collected - v.cash, 0) };
    });
  }, [driversAggData, driversData, perDriver]);

  const total = rows.reduce(
    (acc, r) => ({
      running: acc.running + r.running,
      trips: acc.trips + r.trips,
      collected: acc.collected + r.collected,
      cash: acc.cash + r.cash,
      pending: acc.pending + r.pending,
    }),
    { running: 0, trips: 0, collected: 0, cash: 0, pending: 0 },
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
          <MapPin className="size-3.5 text-[#c62828]" />
          City-wise collection · Today
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[0.65rem] uppercase tracking-[0.08em] text-muted-foreground">
            <th className="px-4 py-2 font-medium">City</th>
            <th className="px-4 py-2 text-right font-medium">Running autos</th>
            <th className="px-4 py-2 text-right font-medium">Trips</th>
            <th className="px-4 py-2 text-right font-medium">Collection</th>
            <th className="px-4 py-2 text-right font-medium">Cash</th>
            <th className="px-4 py-2 text-right font-medium">Pending</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? null
            : rows.map((r) => (
                <tr key={r.city} className="border-t border-border/60">
                  <td className="px-4 py-3 font-medium">{r.city}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.running}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.trips}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatCurrency(r.collected, "INR")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {formatCurrency(r.cash, "INR")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-600">
                    {formatCurrency(r.pending, "INR")}
                  </td>
                </tr>
              ))}
          <tr className="border-t border-border bg-[#c62828]/5 font-semibold">
            <td className="px-4 py-3 text-[#c62828]">Total</td>
            <td className="px-4 py-3 text-right tabular-nums">{total.running}</td>
            <td className="px-4 py-3 text-right tabular-nums">{total.trips}</td>
            <td className="px-4 py-3 text-right tabular-nums">
              {formatCurrency(total.collected, "INR")}
            </td>
            <td className="px-4 py-3 text-right tabular-nums">
              {formatCurrency(total.cash, "INR")}
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-emerald-600">
              {formatCurrency(total.pending, "INR")}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
