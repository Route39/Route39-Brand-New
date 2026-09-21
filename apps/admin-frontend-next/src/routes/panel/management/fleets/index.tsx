import { Button } from "@/components/ui/button";
import { useQuery } from "@apollo/client";
import { Search, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { CsvExportButton } from "@/components/tables/CsvExportButton";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { VEHICLES_LIST_QUERY } from "@/lib/graphql/documents/drivers";
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

function statusMeta(status: string): { label: string; dot: string; text: string } {
  if (status === "Online" || status === "InService") {
    return { label: "MOVING", dot: "bg-emerald-500", text: "text-emerald-400" };
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

  const totalCount = rows.length;
  const activeCount = rows.filter((r) => r.status === "Online").length;
  const inactiveCount = rows.filter((r) => r.status !== "Online").length;

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
      key: "location",
      header: "Location",
      sortField: "city",
      cell: (r) => (
        <div className="flex flex-col">
          <span>{r.city ?? "Unassigned"}</span>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Depot</span>
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
      cell: () => (
        <div className="flex flex-col items-end text-right">
          <span>—</span>
          <span className="text-xs text-muted-foreground">no data</span>
        </div>
      ),
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

      <DataTable
        columns={columns}
        rows={rows}
        totalCount={totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/drivers/${r.id}`)}
      />
    </div>
  );
}
