import { Button } from "@/components/ui/button";
import { useQuery } from "@apollo/client";
import { Search, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { CsvExportButton } from "@/components/tables/CsvExportButton";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { VEHICLES_LIST_QUERY } from "@/lib/graphql/documents/drivers";
import { DRIVER_COLLECTION_AGGREGATE_QUERY } from "@/lib/graphql/documents/daily-collection";
import { useState as useStatusState } from "react";
import { EXPORT_DRIVERS_QUERY } from "@/lib/graphql/documents/extras-2";
import {
  buildFilterInput,
  buildSortInput,
  useFilterField,
  usePageState,
} from "@/lib/panel/page-state";
import { cn } from "@/lib/utils";

type VehicleRow = {
  id: string;
  driverCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  mobileNumber: string;
  status: string;
  carPlate?: string | null;
  city?: string | null;
  canDeliver: boolean;
};

const CITY_TABS: { value: string; label: string; dot: string }[] = [
  { value: "", label: "All cities", dot: "bg-neutral-400" },
  { value: "Tiruppur", label: "Tiruppur", dot: "bg-sky-400" },
  { value: "Coimbatore", label: "Coimbatore", dot: "bg-rose-500" },
  { value: "Chennai", label: "Chennai", dot: "bg-violet-500" },
  { value: "Bangalore", label: "Bangalore", dot: "bg-emerald-500" },
];

const TYPE_TABS: { value: string; label: string; dot: string }[] = [
  { value: "", label: "All", dot: "bg-neutral-400" },
  { value: "false", label: "Auto", dot: "bg-violet-500" },
  { value: "true", label: "Cargo", dot: "bg-rose-500" },
];

function TabPill({
  active,
  dot,
  label,
  onClick,
}: {
  active: boolean;
  dot: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-white bg-white text-black"
          : "border-neutral-800 bg-transparent text-neutral-400 hover:text-neutral-200"
      )}
    >
      <span className={cn("size-2 rounded-full", dot)} />
      {label}
    </button>
  );
}

function normStatus(status: string): string {
  return (status ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

function isActiveStatus(status: string): boolean {
  const s = normStatus(status);
  return s === "online" || s === "inservice";
}

function statusMeta(status: string): { label: string; dot: string; text: string } {
  const s = normStatus(status);
  if (s === "online") {
    return { label: "ONLINE", dot: "bg-emerald-500", text: "text-emerald-400" };
  }
  if (s === "inservice") {
    return { label: "MOVING", dot: "bg-sky-500", text: "text-sky-400" };
  }
  if (s === "waitingdocuments") {
    return { label: "DOCS PENDING", dot: "bg-amber-500", text: "text-amber-400" };
  }
  if (s === "pendingapproval") {
    return { label: "PENDING APPROVAL", dot: "bg-amber-500", text: "text-amber-400" };
  }
  return { label: "OFFLINE", dot: "bg-red-500", text: "text-red-400" };
}

function vehicleCode(driverCode?: string | null, canDeliver?: boolean): string {
  if (driverCode) return driverCode.slice(0, 3).toUpperCase();
  return canDeliver ? "CGO" : "AUT";
}

export default function VehiclesListPage() {
  const navigate = useNavigate();
  const { sort, filters } = usePageState();
  const [cityValue, setCityValue] = useFilterField("city", "eq");
  const [typeValue, setTypeValue] = useFilterField("vehicleType", "eq");
  const [statusFilter, setStatusFilter] = useStatusState<string | null>(null);

  // canDeliver isn't filterable on the backend DriverFilter type, so we
  // exclude it from the server-side filter and apply it client-side below.
  const serverFilters = filters.filter((f) => f.field !== "vehicleType");
  const baseFilter = buildFilterInput(serverFilters) as Record<string, unknown>;

  const { data, loading, error } = useQuery(VEHICLES_LIST_QUERY, {
    variables: {
      paging: { limit: 500, offset: 0 },
      sorting: buildSortInput(sort) as never,
      filter: baseFilter as never,
    },
  });

  const allRows = (data?.drivers.nodes ?? []) as VehicleRow[];
  const rows = allRows.filter((r) => {
    if (typeValue === "true") return r.canDeliver;
    if (typeValue === "false") return !r.canDeliver;
    return true;
  });

  // Last 7 days incl. today; start-of-day keeps the query variables stable between renders.
  const tripsSince = new Date();
  tripsSince.setHours(0, 0, 0, 0);
  tripsSince.setDate(tripsSince.getDate() - 6);
  const { data: tripsData } = useQuery(DRIVER_COLLECTION_AGGREGATE_QUERY, {
    variables: {
      filter: {
        driverId: { isNot: true },
        createdOn: { gte: tripsSince.toISOString() },
      } as never,
    },
  });
  const tripCounts = new Map<string, number>();
  for (const g of tripsData?.orderAggregate ?? []) {
    if (g.groupBy?.driverId) tripCounts.set(String(g.groupBy.driverId), g.count?.id ?? 0);
  }

  const totalCount = rows.length;
  const activeCount = rows.filter((r) => isActiveStatus(r.status)).length;
  const inactiveCount = rows.filter((r) => !isActiveStatus(r.status)).length;
  const onlineCount = rows.filter((r) => normStatus(r.status) === "online").length;
  const movingCount = rows.filter((r) => normStatus(r.status) === "inservice").length;
  const offlineCount = rows.filter((r) => normStatus(r.status) === "offline").length;
  const pendingCount = rows.filter((r) => {
    const st = normStatus(r.status);
    return st === "waitingdocuments" || st === "pendingapproval";
  }).length;
  const matchesStatus = (st: string, key: string) => {
    const n = normStatus(st);
    if (key === "online") return n === "online";
    if (key === "moving") return n === "inservice";
    if (key === "offline") return n === "offline";
    if (key === "pending") return n === "waitingdocuments" || n === "pendingapproval";
    return true;
  };
  const tableRows = statusFilter ? rows.filter((r) => matchesStatus(r.status, statusFilter)) : rows;
  const pickStatus = (key: string) => setStatusFilter(key === "all" || statusFilter === key ? null : key);
  const summaryCards = [
    { key: "all", label: "Total vehicles", value: totalCount, dot: "bg-slate-400" },
    { key: "online", label: "Online", value: onlineCount, dot: "bg-emerald-500" },
    { key: "moving", label: "Moving", value: movingCount, dot: "bg-sky-500" },
    { key: "offline", label: "Offline", value: offlineCount, dot: "bg-red-500" },
    { key: "pending", label: "Pending", value: pendingCount, dot: "bg-amber-500" },
  ];

  const columns: DataTableColumn<VehicleRow>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-indigo-950 text-[10px] font-bold text-indigo-300">
            {vehicleCode(r.driverCode, r.canDeliver)}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">
              {r.driverCode ?? r.id}
              {r.carPlate ? ` (${r.carPlate})` : ""}
            </span>
            <span className="text-xs text-muted-foreground">{r.canDeliver ? "Cargo" : "Auto"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "driverName",
      header: "Driver name",
      cell: (r) => {
        const d = r as unknown as {
          firstName?: string | null;
          lastName?: string | null;
          mobileNumber?: string | null;
        };
        const name = [d.firstName, d.lastName].filter(Boolean).join(" ");
        return (
          <div className="flex flex-col">
            <span className="font-medium">{name || "—"}</span>
            <span className="text-xs text-muted-foreground">{d.mobileNumber ?? ""}</span>
          </div>
        );
      },
    },
    {
      key: "location",
      header: "Location",
      sortField: "city",
      cell: (r) => (
        <div className="flex flex-col">
          <span>{r.city ?? "Unassigned"}</span>
          <span className="max-w-xs truncate text-xs text-muted-foreground">
            {(r as unknown as { address?: string | null }).address || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortField: "status",
      cell: (r) => {
        const meta = statusMeta(r.status);
        return (
          <span className={cn("inline-flex items-center gap-2 text-xs font-semibold", meta.text)}>
            <span className={cn("size-2 rounded-full", meta.dot)} />
            {meta.label}
          </span>
        );
      },
    },
    {
      key: "trips",
      header: "Trips · 7D",
      cell: (r) => {
        const n = tripCounts.get(String(r.id)) ?? 0;
        return (
          <div className="flex flex-col items-end text-right">
            <span>{n}</span>
            <span className="text-xs text-muted-foreground">{n === 1 ? "trip" : "trips"}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Vehicles registered on the platform, fetched live from the driver app."
        actions={
          <div className="flex gap-2">
            <Button onClick={() => navigate("/management/fleets/new")}>
              + New Vehicle
            </Button>
            <CsvExportButton
              query={EXPORT_DRIVERS_QUERY}
              resultField="exportDrivers"
              fields={[
                { field: "id", label: "ID" },
                { field: "driverCode", label: "Vehicle Code" },
                { field: "carPlate", label: "Plate" },
                { field: "city", label: "City" },
                { field: "canDeliver", label: "Cargo" },
                { field: "status", label: "Status" },
              ]}
              filter={baseFilter}
              sorting={sort ? [{ field: sort.field, direction: sort.direction }] : []}
              entityLabel="vehicles"
            />
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-800 p-2">
        {CITY_TABS.map((tab) => (
          <TabPill
            key={tab.value || "all"}
            active={(cityValue || "") === tab.value}
            dot={tab.dot}
            label={tab.label}
            onClick={() => setCityValue(tab.value)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-800 p-2 w-fit">
        {TYPE_TABS.map((tab) => (
          <TabPill
            key={tab.value || "all"}
            active={(typeValue || "") === tab.value}
            dot={tab.dot}
            label={tab.label}
            onClick={() => setTypeValue(tab.value)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-neutral-800 p-3">
        <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search by number, owner, driver..."
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white bg-white px-3 py-1.5 text-sm font-medium text-black">
          All <span>{totalCount}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          Active <span className="text-foreground">{activeCount}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          Inactive <span className="text-foreground">{inactiveCount}</span>
        </div>
        <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowUpDown className="size-4" />
          Sort: number
        </div>
      </div>

      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        // {totalCount} vehicles · sorted by number
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            role="button"
            tabIndex={0}
            onClick={() => pickStatus(c.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pickStatus(c.key);
              }
            }}
            className={cn(
              "cursor-pointer rounded-xl border bg-card p-4 transition hover:border-foreground/40",
              (statusFilter ?? "all") === c.key ? "border-primary ring-2 ring-primary/30" : "border-border",
            )}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("size-2 rounded-full", c.dot)} />
              {c.label}
            </div>
            <div className="mt-2 text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
      <DataTable
        columns={columns}
        rows={tableRows}
        totalCount={tableRows.length}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/drivers/${r.id}`)}
      />
    </div>
  );
}
