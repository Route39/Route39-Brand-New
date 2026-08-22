import { useQuery } from "@apollo/client";
import { useNavigate, useOutletContext } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { ORDERS_LIST_QUERY } from "@/lib/graphql/documents/orders";
import {
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { orderStatusVariant } from "@/lib/panel/status-styles";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { RiderContext } from "./layout";

type OrderRow = {
  id: string;
  createdOn: string;
  status: string;
  type: string;
  costBest: number;
  currency: string;
  addresses: string[];
  driverId?: string | null;
};

export default function RiderOrdersTab() {
  const { rider } = useOutletContext<RiderContext>();
  const navigate = useNavigate();
  const { page, pageSize, sort } = usePageState();

  const { data, loading, error } = useQuery(ORDERS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: { riderId: { eq: rider.id } } as never,
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
      header: "Status",
      sortField: "status",
      cell: (r) => <Badge variant={orderStatusVariant(r.status)}>{r.status}</Badge>,
    },
    { key: "type", header: "Type" },
    {
      key: "addresses",
      header: "Route",
      cell: (r) =>
        r.addresses.length > 0 ? (
          <span className="line-clamp-1">{r.addresses[0]}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "costBest",
      header: "Cost",
      sortField: "costBest",
      align: "right",
      cell: (r) => formatCurrency(r.costBest, r.currency),
    },
    {
      key: "createdOn",
      header: "Created",
      sortField: "createdOn",
      cell: (r) => formatDateTime(r.createdOn),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      totalCount={data?.orders.totalCount}
      loading={loading}
      error={error?.message ?? null}
      rowKey={(r) => r.id}
      onRowClick={(r) => navigate(`/requests/${r.id}`)}
      emptyMessage="This rider has no orders yet."
    />
  );
}
