import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { CsvExportButton } from "@/components/tables/CsvExportButton";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { Badge } from "@/components/ui/badge";
import { FilterSelect, TableToolbar } from "@/components/tables/TableToolbar";
import { ORDERS_LIST_QUERY } from "@/lib/graphql/documents/orders";
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
  currency: string;
  addresses: string[];
  riderId: string;
  driverId?: string | null;
  fleetId?: string | null;
};

export default function RequestsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();

  const { data, loading, error } = useQuery(ORDERS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

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
      cell: (r) => formatCurrency(r.costBest, r.currency),
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
      <PageHeader
        title={t("menu.requests", { defaultValue: "Requests" })}
        description={t("requests.list.description", {
          defaultValue: "All ride requests across the platform.",
        })}
        actions={
          <CsvExportButton
            query={EXPORT_ORDERS_QUERY}
            resultField="exportOrders"
            fields={[
              { field: "id", label: "ID" },
              { field: "createdOn", label: "Created" },
              { field: "status", label: "Status" },
              { field: "type", label: "Type" },
              { field: "costBest", label: "Cost" },
              { field: "currency", label: "Currency" },
              { field: "riderId", label: "Rider" },
              { field: "driverId", label: "Driver" },
            ]}
            filter={buildFilterInput(filters)}
            sorting={buildSortInput(sort)}
            entityLabel="orders"
          />
        }
      />
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
        onRowClick={(r) => navigate(`/requests/${r.id}`)}
      />
    </div>
  );
}
