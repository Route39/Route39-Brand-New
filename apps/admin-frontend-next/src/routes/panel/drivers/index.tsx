import { useQuery } from "@apollo/client";
import { Calendar, Plus, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { CsvExportButton } from "@/components/tables/CsvExportButton";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FilterSelect,
  FilterText,
  TableToolbar,
  FilterTabs,
} from "@/components/tables/TableToolbar";
import { DRIVERS_LIST_QUERY } from "@/lib/graphql/documents/drivers";
import { EXPORT_DRIVERS_QUERY } from "@/lib/graphql/documents/extras-2";
import { buildSortInput as buildSortInputForExport } from "@/lib/panel/page-state";
import { DRIVER_STATUS_OPTIONS, DRIVER_CITY_OPTIONS } from "@/lib/panel/enum-options";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
  type FilterEntry,
} from "@/lib/panel/page-state";
import { driverStatusVariant } from "@/lib/panel/status-styles";
import { formatDateTime, formatName } from "@/lib/format";

type QuickRange = "today" | "week" | "last30";

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

function toDatePart(value: string): string {
  return value.length > 10 ? value.slice(0, 10) : value;
}

type DriverRow = {
  id: string;
  driverCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  mobileNumber: string;
  status: string;
  carPlate?: string | null;
  rating?: number | null;
  reviewCount: number;
  registrationTimestamp: string;
  lastSeenTimestamp?: string | null;
  fleetId?: string | null;
};

export default function DriversListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page, pageSize, sort, filters, setFilters } = usePageState();

  const dateFrom = toDatePart(
    filters.find((f) => f.field === "registrationTimestamp" && f.operator === "gte")?.value ?? "",
  );
  const dateTo = toDatePart(
    filters.find((f) => f.field === "registrationTimestamp" && f.operator === "lte")?.value ?? "",
  );
  const activeRange = activeQuickRange(dateFrom, dateTo);

  function applyDateRange(from: string, to: string) {
    const without = filters.filter((f) => f.field !== "registrationTimestamp");
    const next: FilterEntry[] = [...without];
    if (from) next.push({ field: "registrationTimestamp", operator: "gte", value: dayStartISO(from) });
    if (to) next.push({ field: "registrationTimestamp", operator: "lte", value: dayEndISO(to) });
    setFilters(next);
  }

  function handleQuickRange(range: QuickRange) {
    const { from, to } = presetRange(range);
    applyDateRange(from, to);
  }

  function handleClearDateRange() {
    setFilters(filters.filter((f) => f.field !== "registrationTimestamp"));
  }

  const { data, loading, error } = useQuery(DRIVERS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.drivers.nodes ?? []) as DriverRow[];

  const columns: DataTableColumn<DriverRow>[] = [
    {
      key: "id",
      header: "ID",
      sortField: "id",
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.driverCode ?? r.id}</span>,
    },
    {
      key: "carPlate",
      header: t("driver.carPlate", { defaultValue: "Vehicle Number" }),
      cell: (r) => r.carPlate ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "name",
      header: t("driver.name", { defaultValue: "Name" }),
      sortField: "lastName",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{formatName(r)}</span>
          <span className="text-xs text-muted-foreground">{r.mobileNumber}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: t("status", { defaultValue: "Status" }),
      sortField: "status",
      cell: (r) => (
        <Badge variant={driverStatusVariant(r.status)}>
          {t(`enum.driver.status.${r.status[0]?.toLowerCase()}${r.status.slice(1)}`, {
            defaultValue: r.status,
          })}
        </Badge>
      ),
    },
    {
      key: "rating",
      header: t("driver.rating", { defaultValue: "Rating" }),
      align: "right",
      cell: (r) =>
        r.rating != null ? (
          <span className="inline-flex items-center justify-end gap-1">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {(r.rating / 20).toFixed(1)}
            <span className="text-xs text-muted-foreground">({r.reviewCount})</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "registrationTimestamp",
      header: t("driver.registered", { defaultValue: "Registered" }),
      sortField: "registrationTimestamp",
      cell: (r) => formatDateTime(r.registrationTimestamp),
    },
    {
      key: "lastSeenTimestamp",
      header: t("driver.lastSeen", { defaultValue: "Last seen" }),
      sortField: "lastSeenTimestamp",
      cell: (r) => formatDateTime(r.lastSeenTimestamp),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("menu.driver.all", { defaultValue: "Drivers" })}
        description={t("driver.list.description", {
          defaultValue: "All drivers registered on the platform.",
        })}
        actions={
          <div className="flex gap-2">
            <CsvExportButton
              query={EXPORT_DRIVERS_QUERY}
              resultField="exportDrivers"
              fields={[
                { field: "id", label: "ID" },
                { field: "firstName", label: "First name" },
                { field: "lastName", label: "Last name" },
                { field: "mobileNumber", label: "Phone" },
                { field: "email", label: "Email" },
                { field: "status", label: "Status" },
                { field: "carPlate", label: "Plate" },
                { field: "registrationTimestamp", label: "Registered" },
              ]}
              filter={buildFilterInput(filters)}
              sorting={buildSortInputForExport(sort)}
              entityLabel="drivers"
            />
            <Button asChild>
              <Link to="/drivers/new">
                <Plus className="size-4" />
                New driver
              </Link>
            </Button>
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
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
            value={dateFrom}
            onChange={(e) => applyDateRange(e.target.value, dateTo)}
            className="bg-transparent text-sm outline-none"
          />
          <span className="text-muted-foreground">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => applyDateRange(dateFrom, e.target.value)}
            className="bg-transparent text-sm outline-none"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!dateFrom && !dateTo}
          onClick={handleClearDateRange}
        >
          Clear filter
        </Button>
      </div>
      <TableToolbar>
        <FilterText field="lastName" placeholder="Search by last name" />
        <FilterText field="mobileNumber" placeholder="Phone number" />
        <FilterSelect field="status" options={DRIVER_STATUS_OPTIONS} placeholder="Any status" width="11rem" />
      </TableToolbar>
      <FilterTabs field="city" options={DRIVER_CITY_OPTIONS} allLabel="All cities" />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.drivers.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => {
          const dest =
            r.status === "PendingApproval" ||
            r.status === "SoftReject" ||
            r.status === "HardReject"
              ? `/drivers/${r.id}/review`
              : `/drivers/${r.id}`;
          navigate(dest);
        }}
      />
    </div>
  );
}
