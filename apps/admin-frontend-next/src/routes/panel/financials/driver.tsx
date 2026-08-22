import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { DRIVER_WALLETS_LIST_QUERY } from "@/lib/graphql/documents/payouts";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { formatCurrency } from "@/lib/format";

type Row = { id: string; balance: number; currency: string; driverId: string };

export default function DriverFinancialsPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();
  const { data, loading, error } = useQuery(DRIVER_WALLETS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.driverWallets.nodes ?? []) as Row[];
  const columns: DataTableColumn<Row>[] = [
    { key: "driverId", header: "Driver", cell: (r) => <span className="font-mono text-xs">#{r.driverId}</span> },
    { key: "currency", header: "Currency" },
    { key: "balance", header: "Balance", align: "right", cell: (r) => formatCurrency(r.balance, r.currency) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Driver wallets" description="Balances held by drivers." />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.driverWallets.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/drivers/${r.driverId}/financial`)}
      />
    </div>
  );
}
