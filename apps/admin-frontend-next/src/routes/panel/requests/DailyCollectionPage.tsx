import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Calendar, Download, FileText } from "lucide-react";

import { PageHeader } from "@/components/panel/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DRIVERS_BY_IDS_QUERY,
  DRIVER_COLLECTION_AGGREGATE_QUERY,
} from "@/lib/graphql/documents/daily-collection";
import { formatCurrency, formatName, formatPhone } from "@/lib/format";
import { usePageState, type FilterEntry } from "@/lib/panel/page-state";
import { DriverInvoiceDialog } from "./DriverInvoiceDialog";
import { DailyCollectionBillDialog } from "./DailyCollectionBillDialog";

type QuickRange = "today" | "week" | "last30";

/** City pills are UI-only for now — selecting one does not filter the table. */
const CITY_TABS: { key: string; label: string; color: string }[] = [
  { key: "bangalore", label: "Bangalore", color: "#34d399" },
  { key: "chennai", label: "Chennai", color: "#a78bfa" },
  { key: "coimbatore", label: "Coimbatore", color: "#f87171" },
  { key: "tiruppur", label: "Tiruppur", color: "#38bdf8" },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - diffToMonday);
  return start;
}

function presetRange(range: QuickRange): { from: string; to: string } {
  const now = new Date();
  const to = toDateInput(now);
  if (range === "today") return { from: to, to };
  if (range === "week") return { from: toDateInput(startOfWeek(now)), to };
  const from = new Date(now);
  from.setDate(now.getDate() - 29);
  return { from: toDateInput(from), to };
}

function activeQuickRange(from: string, to: string): QuickRange | "custom" | null {
  if (!from && !to) return null;
  if (from === presetRange("today").from && to === presetRange("today").to) return "today";
  if (from === presetRange("week").from && to === presetRange("week").to) return "week";
  if (from === presetRange("last30").from && to === presetRange("last30").to) return "last30";
  return "custom";
}

function dayStartISO(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

function dayEndISO(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

/** Accepts either a plain "yyyy-mm-dd" or a full ISO timestamp (legacy stored
 * filter values) and returns just the date part. */
function toDatePart(value: string): string {
  if (value.length <= 10) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

interface DriverGroup {
  driverId: string;
  trips: number;
  collected: number;
}

interface DriverInfo {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  mobileNumber?: string | null;
  carPlate?: string | null;
  city?: string | null;
}

export default function DailyCollectionPage() {
  const { page, pageSize, filters, setFilters, setPage } = usePageState();
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [invoiceDriverId, setInvoiceDriverId] = useState<string | null>(null);
  const [billOpen, setBillOpen] = useState(false);

  const dateFrom = toDatePart(
    filters.find((f) => f.field === "finishTimestamp" && f.operator === "gte")?.value ?? "",
  );
  const dateTo = toDatePart(
    filters.find((f) => f.field === "finishTimestamp" && f.operator === "lte")?.value ?? "",
  );
  const [pickedRange, setPickedRange] = useState<QuickRange | null>(null);
  const detectedRange = activeQuickRange(dateFrom, dateTo);
  // On days when two presets cover the same dates (e.g. "Today" and "This week"
  // on a Monday), keep the button the user actually clicked highlighted.
  const activeRange =
    pickedRange &&
    dateFrom === presetRange(pickedRange).from &&
    dateTo === presetRange(pickedRange).to
      ? pickedRange
      : detectedRange;
  const [fromD, setFromD] = useState(dateFrom);
  const [toD, setToD] = useState(dateTo);
  useEffect(() => {
    setFromD(dateFrom);
  }, [dateFrom]);
  useEffect(() => {
    setToD(dateTo);
  }, [dateTo]);
  const okDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number(d.slice(0, 4)) >= 2000;
  function onFromChange(v: string) {
    setFromD(v);
    if (v === "") applyDateRange("", okDate(toD) ? toD : "");
    else if (okDate(v)) applyDateRange(v, okDate(toD) ? toD : "");
  }
  function onToChange(v: string) {
    setToD(v);
    if (v === "") applyDateRange(okDate(fromD) ? fromD : "", "");
    else if (okDate(v)) applyDateRange(okDate(fromD) ? fromD : "", v);
  }

  function applyDateRange(from: string, to: string) {
    const without = filters.filter((f) => f.field !== "finishTimestamp");
    const next: FilterEntry[] = [...without];
    if (from) next.push({ field: "finishTimestamp", operator: "gte", value: from });
    if (to) next.push({ field: "finishTimestamp", operator: "lte", value: to });
    setFilters(next);
  }

  function handleQuickRange(range: QuickRange) {
    const { from, to } = presetRange(range);
    setPickedRange(range);
    applyDateRange(from, to);
  }

  function handleClearFilters() {
    setFilters(filters.filter((f) => f.field !== "finishTimestamp"));
    setActiveCity(null);
  }

  const orderFilter = useMemo(() => {
    const f: Record<string, Record<string, unknown>> = {
      driverId: { isNot: true },
      status: { eq: "Finished" },
    };
    if (dateFrom && dateTo) {
      f.createdOn = { between: { lower: dayStartISO(dateFrom), upper: dayEndISO(dateTo) } };
    } else if (dateFrom) {
      f.createdOn = { gte: dayStartISO(dateFrom) };
    } else if (dateTo) {
      f.createdOn = { lte: dayEndISO(dateTo) };
    }
    return f;
  }, [dateFrom, dateTo]);

  const {
    data: aggregateData,
    loading: aggregateLoading,
    error: aggregateError,
  } = useQuery(DRIVER_COLLECTION_AGGREGATE_QUERY, {
    variables: { filter: orderFilter as never },
  });

  const groups: DriverGroup[] = useMemo(() => {
    const rows = aggregateData?.orderAggregate ?? [];
    return rows
      .filter((r) => Boolean(r.groupBy?.driverId))
      .map((r) => ({
        driverId: r.groupBy!.driverId as string,
        trips: r.count?.id ?? 0,
        collected:
          (r.sum?.costAfterCoupon ?? 0) +
          (r.sum?.gstAmount ?? 0) +
          (r.sum?.platformFeeAmount ?? 0) +
          (r.sum?.paymentGatewayFeeAmount ?? 0) +
          (r.sum?.tipAmount ?? 0),
      }))
      .sort((a, b) => b.collected - a.collected);
  }, [aggregateData]);

  const driverIds = useMemo(() => groups.map((g) => g.driverId), [groups]);

  const { data: driversData } = useQuery(DRIVERS_BY_IDS_QUERY, {
    variables: {
      filter: { id: { in: driverIds } } as never,
      paging: { limit: Math.max(driverIds.length, 1), offset: 0 },
      sorting: [] as never,
    },
    skip: driverIds.length === 0,
  });

  const driverMap = useMemo(() => {
    const m = new Map<string, DriverInfo>();

    for (const d of driversData?.drivers.nodes ?? []) {
      m.set(d.id, d as DriverInfo);
    }

    return m;
  }, [driversData]);

  const filteredGroups = useMemo(() => {
    if (!activeCity) {
      return groups;
    }

    const selectedCity = CITY_TABS.find(
      (city) => city.key === activeCity,
    )?.label;

    if (!selectedCity) {
      return groups;
    }

    return groups.filter((group) => {
      const driver = driverMap.get(group.driverId);

      return (
        driver?.city?.trim().toLowerCase() ===
        selectedCity.trim().toLowerCase()
      );
    });
  }, [groups, driverMap, activeCity]);

  const totalCollection = filteredGroups.reduce(
    (sum, g) => sum + g.collected,
    0,
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredGroups.length / pageSize),
  );

  const pageRows = filteredGroups.slice(
    (page - 1) * pageSize,
    (page - 1) * pageSize + pageSize,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Collection"
        description="Driver-wise collection summary across the platform."
      />

      <div className="flex flex-wrap gap-2">
        {CITY_TABS.map((city) => (
          <Button
            key={city.key}
            type="button"
            size="sm"
            variant={activeCity === city.key ? "default" : "outline"}
            className="gap-2 rounded-full"
            onClick={() => {
  setPage(1);
  setActiveCity((cur) => (cur === city.key ? null : city.key));
}}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: city.color }} />
            {city.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeRange === "today" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => handleQuickRange("today")}
          >
            Today
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeRange === "week" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => handleQuickRange("week")}
          >
            This week
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeRange === "last30" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => handleQuickRange("last30")}
          >
            Last 30
          </Button>
          <div className="flex items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1.5">
            <Calendar className="size-3.5 text-muted-foreground" />
            <input
              type="date"
              value={fromD}
              onChange={(e) => onFromChange(e.target.value)}
              className="bg-transparent text-sm outline-none"
            />
            <span className="text-muted-foreground">→</span>
            <input
              type="date"
              value={toD}
              onChange={(e) => onToChange(e.target.value)}
              className="bg-transparent text-sm outline-none"
            />
          </div>
          <Button
  type="button"
  size="sm"
  variant="ghost"
  disabled={!dateFrom && !dateTo && !activeCity}
  onClick={handleClearFilters}
>
  Clear filter
</Button>
        </div>

        <div className="text-right">
          <div className="text-xs text-muted-foreground">Total collection</div>
          <div className="text-lg font-semibold">{formatCurrency(totalCollection, "INR")}</div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2 gap-2"
            disabled={filteredGroups.length === 0}
            onClick={() => setBillOpen(true)}
          >
            <FileText className="size-4" />
            Download bill
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S.No</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead className="text-right">Trips</TableHead>
              <TableHead className="text-right">Collected Amount</TableHead>
              <TableHead className="text-center">Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aggregateLoading && pageRows.length === 0
              ? null
              : pageRows.map((group, i) => {
                  const driver = driverMap.get(group.driverId);
                  return (
                    <TableRow key={group.driverId}>
                      <TableCell>{(page - 1) * pageSize + i + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{formatName(driver)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatPhone(driver?.mobileNumber)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{group.trips}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(group.collected, "INR")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Download invoice"
                          onClick={() => setInvoiceDriverId(group.driverId)}
                        >
                          <Download className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
        {!aggregateLoading && pageRows.length === 0 ? (
          <TableEmpty>
            {aggregateError ? (
              <span className="text-destructive">{aggregateError.message}</span>
            ) : (
              "No collections found for the selected filters."
            )}
          </TableEmpty>
        ) : null}
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          <div>
            {groups.length > 0
              ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, groups.length)} of ${groups.length}`
              : null}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {billOpen ? (
        <DailyCollectionBillDialog
          rows={filteredGroups.map((g) => {
            const d = driverMap.get(g.driverId);
            return {
              driverId: g.driverId,
              name: formatName(d),
              phone: formatPhone(d?.mobileNumber),
              trips: g.trips,
              collected: g.collected,
            };
          })}
          total={totalCollection}
          dateFrom={dateFrom}
          dateTo={dateTo}
          cityLabel={CITY_TABS.find((c) => c.key === activeCity)?.label ?? null}
          onClose={() => setBillOpen(false)}
        />
      ) : null}

      {invoiceDriverId ? (
        <DriverInvoiceDialog
          driverId={invoiceDriverId}
          driver={driverMap.get(invoiceDriverId) ?? null}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onClose={() => setInvoiceDriverId(null)}
        />
      ) : null}
    </div>
  );
}