import { useQuery } from "@apollo/client";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { CsvExportButton } from "@/components/tables/CsvExportButton";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { Badge } from "@/components/ui/badge";
//import { Button } from "@/components/ui/button";
import { FilterSelect, TableToolbar } from "@/components/tables/TableToolbar";
import { ORDERS_AGGREGATE_QUERY, ORDERS_LIST_QUERY } from "@/lib/graphql/documents/orders";
import { EXPORT_ORDERS_QUERY } from "@/lib/graphql/documents/extras-2";
import {
  ORDER_STATUS_OPTIONS,
  ORDER_TYPE_OPTIONS,
} from "@/lib/panel/enum-options";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
  // type FilterEntry,
} from "@/lib/panel/page-state";
import { orderStatusVariant } from "@/lib/panel/status-styles";
import { formatCurrency, formatDateTime } from "@/lib/format";

type OrderRow = {
  id: string;
  createdOn: string;
  startTimestamp?: string | null;
  finishTimestamp?: string | null;
  type: string;
  status: string;
  costBest: number;
  costAfterCoupon: number;
  gstAmount: number;
  platformFeeAmount: number;
  paymentGatewayFeeAmount: number;
  waitingChargeAmount: number;
  currency: string;
  addresses: string[];
  riderId: string;
  driverId?: string | null;
  fleetId?: string | null;
};

//type QuickRange = "today" | "week" | "last30";

// function pad(n: number): string {
//   return String(n).padStart(2, "0");
// }

// /** Local calendar date (YYYY-MM-DD) — matches what a native `<input type="date">` shows. */
// function toDateInput(d: Date): string {
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// }

// function startOfWeek(d: Date): Date {
//   const day = d.getDay(); // 0 = Sunday
//   const diffToMonday = (day + 6) % 7;
//   const start = new Date(d);
//   start.setDate(d.getDate() - diffToMonday);
//   return start;
// }

// function presetRange(range: QuickRange): { from: string; to: string } {
//   const now = new Date();
//   const to = toDateInput(now);
//   if (range === "today") return { from: to, to };
//   if (range === "week") return { from: toDateInput(startOfWeek(now)), to };
//   const from = new Date(now);
//   from.setDate(now.getDate() - 29);
//   return { from: toDateInput(from), to };
// }

// function activeQuickRange(from: string, to: string): QuickRange | "custom" | null {
//   if (!from && !to) return null;
//   if (from === presetRange("today").from && to === presetRange("today").to) return "today";
//   if (from === presetRange("week").from && to === presetRange("week").to) return "week";
//   if (from === presetRange("last30").from && to === presetRange("last30").to) return "last30";
//   return "custom";
// }

// /** Date-only string (as produced by an `<input type="date">`) to a UTC day-start ISO instant. */
// function dayStartISO(dateStr: string): string {
//   const [year, month, day] = dateStr.split("-").map(Number);

//   return new Date(
//     year,
//     month - 1,
//     day,
//     0,
//     0,
//     0,
//     0,
//   ).toISOString();
// }

// function dayEndISO(dateStr: string): string {
//   const [year, month, day] = dateStr.split("-").map(Number);

//   return new Date(
//     year,
//     month - 1,
//     day,
//     23,
//     59,
//     59,
//     999,
//   ).toISOString();
// }

export default function RequestsListPage({
  disableRowNavigation = false,
  showBackLink = true,
  showExportButton = true,
}: {
  disableRowNavigation?: boolean;
  showBackLink?: boolean;
  showExportButton?: boolean;
} = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();
  //const { page, pageSize, sort, filters, setFilters } = usePageState();

  // const dateFrom =
  //   filters.find((f) => f.field === "createdOn" && f.operator === "gte")?.value.slice(0, 10) ?? "";
  // const dateTo =
  //   filters.find((f) => f.field === "createdOn" && f.operator === "lte")?.value.slice(0, 10) ?? "";
  // const activeRange = activeQuickRange(dateFrom, dateTo);

  // function applyDateRange(from: string, to: string) {
  //   const without = filters.filter((f) => f.field !== "createdOn");
  //   const next: FilterEntry[] = [...without];
  //   if (from) next.push({ field: "createdOn", operator: "gte", value: dayStartISO(from) });
  //   if (to) next.push({ field: "createdOn", operator: "lte", value: dayEndISO(to) });
  //   setFilters(next);
  // }

  // function handleQuickRange(range: QuickRange) {
  //   const { from, to } = presetRange(range);
  //   applyDateRange(from, to);
  // }

  // function handleClearDateRange() {
  //   setFilters(filters.filter((f) => f.field !== "createdOn"));
  // }

  const { data, loading, error } = useQuery(ORDERS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const { data: aggregateData } = useQuery(ORDERS_AGGREGATE_QUERY, {
    variables: { filter: buildFilterInput(filters) as never },
  });
  const totalCollection =
    (aggregateData?.orderAggregate?.[0]?.sum?.costAfterCoupon ?? 0) +
    (aggregateData?.orderAggregate?.[0]?.sum?.gstAmount ?? 0) +
    (aggregateData?.orderAggregate?.[0]?.sum?.platformFeeAmount ?? 0) +
    (aggregateData?.orderAggregate?.[0]?.sum?.paymentGatewayFeeAmount ?? 0);

  const rows = (data?.orders.nodes ?? []) as OrderRow[];

  const columns: DataTableColumn<OrderRow>[] = [
    {
      key: "id",
      header: "ID",
      sortField: "id",
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span>,
    },
    {
      key: "status",
      header: t("status", { defaultValue: "Status" }),
      sortField: "status",
      cell: (r) => (
        <Badge variant={orderStatusVariant(r.status)}>
          {t(`enum.request.${r.status}`, { defaultValue: r.status })}
        </Badge>
      ),
    },
    {
      key: "type",
      header: t("order.type", { defaultValue: "Type" }),
      cell: (r) => <span className="text-xs uppercase tracking-wide">{r.type}</span>,
    },
    {
      key: "addresses",
      header: t("order.route", { defaultValue: "Route" }),
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          {r.addresses.length > 0 ? (
            <>
              <span className="truncate">{r.addresses[0]}</span>
              {r.addresses.length > 1 ? (
                <span className="truncate text-xs text-muted-foreground">
                  → {r.addresses[r.addresses.length - 1]}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
      className: "max-w-sm",
    },
    {
      key: "costBest",
      header: t("order.cost", { defaultValue: "Cost" }),
      sortField: "costBest",
      align: "right",
      // Matches the driver app's "Total" — costAfterCoupon already has the
      // discount applied, so we only need to add the fees (and any cargo
      // waiting charge) on top.
      cell: (r) =>
        formatCurrency(
          r.costAfterCoupon +
            r.gstAmount +
            r.platformFeeAmount +
            r.paymentGatewayFeeAmount +
            (r.waitingChargeAmount ?? 0),
          r.currency,
        ),
    },
    {
      key: "createdOn",
      header: t("order.createdOn", { defaultValue: "Created" }),
      sortField: "createdOn",
      cell: (r) => formatDateTime(r.createdOn),
    },
  ];

  return (
    <div className="space-y-6">
      {showBackLink ? (
        <Link
          to="/dispatcher"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to Dispatcher
        </Link>
      ) : null}
      {showBackLink ? (
      <PageHeader
        title={t("menu.requests", { defaultValue: "Requests" })}
        description={t("requests.list.description", {
          defaultValue: "All ride requests across the platform.",
        })}
        actions={
          showExportButton ? (
            <CsvExportButton
              query={EXPORT_ORDERS_QUERY}
              resultField="exportOrders"
              fields={[
                { field: "id", label: "ID" },
                { field: "createdOn", label: "Created" },
                { field: "status", label: "Status" },
                { field: "type", label: "Type" },
                { field: "costBest", label: "Base Cost" },
                { field: "gstAmount", label: "GST Amount" },
                { field: "platformFeeAmount", label: "Platform Fee" },
                { field: "paymentGatewayFeeAmount", label: "Payment Gateway Fee" },
                { field: "waitingChargeAmount", label: "Waiting Charges" },
                { field: "totalCost", label: "Total (incl. GST & fees)" },
                { field: "currency", label: "Currency" },
                { field: "riderId", label: "Rider" },
                { field: "driverId", label: "Driver" },
              ]}
              filter={buildFilterInput(filters)}
              sorting={buildSortInput(sort)}
              entityLabel="orders"
            />
          ) : null
        }
      />
      ) : null}
      {showExportButton ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
          {/* <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={activeRange === "today" ? "default" : "outline"}
              className={`rounded-full ${
  activeRange === "today" ? "font-semibold ring-2 ring-primary/30" : ""
}`}
              onClick={() => handleQuickRange("today")}
            >
              {t("requests.filters.today", { defaultValue: "Today" })}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeRange === "week" ? "default" : "outline"}
              className={`rounded-full ${
  activeRange === "week" ? "font-semibold ring-2 ring-primary/30" : ""
}`}
              onClick={() => handleQuickRange("week")}
            >
              {t("requests.filters.thisWeek", { defaultValue: "This week" })}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeRange === "last30" ? "default" : "outline"}
              className={`rounded-full ${
  activeRange === "last30" ? "font-semibold ring-2 ring-primary/30" : ""
}`}
              onClick={() => handleQuickRange("last30")}
            >
              {t("requests.filters.last30", { defaultValue: "Last 30" })}
            </Button>
            <div className="flex items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1.5">
              <CalendarIcon className="size-3.5 text-muted-foreground" />
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
              <CalendarIcon className="size-3.5 text-muted-foreground" />
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!dateFrom && !dateTo}
              onClick={handleClearDateRange}
            >
              {t("requests.filters.clear", { defaultValue: "Clear filter" })}
            </Button> 
          </div> */}

          <div className="text-right">
            <div className="text-xs text-muted-foreground">
              {t("requests.filters.totalCollection", { defaultValue: "Total collection" })}
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(totalCollection, rows[0]?.currency)}
            </div>
          </div>
        </div>
      ) : null}
      <TableToolbar>
        <FilterSelect field="status" options={ORDER_STATUS_OPTIONS} placeholder="Any status" width="11rem" />
        <FilterSelect field="type" options={ORDER_TYPE_OPTIONS} placeholder="Any type" width="10rem" />
      </TableToolbar>
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.orders.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        // Row click navigation — disabled when embedded inside Dispatcher
        onRowClick={disableRowNavigation ? undefined : (r) => navigate(`/requests/${r.id}`)}
      />
    </div>
  );
}
