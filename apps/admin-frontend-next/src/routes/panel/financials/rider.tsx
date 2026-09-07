import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { WalletExportButton } from "@/components/tables/WalletExportButton";
import { PageHeader } from "@/components/panel/PageHeader";
import { RIDER_WALLETS_LIST_QUERY } from "@/lib/graphql/documents/payouts";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { formatCurrency } from "@/lib/format";

type Row = { id: string; balance: number; currency: string; riderId: string };

export default function RiderFinancialsPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();
  const { data, loading, error } = useQuery(RIDER_WALLETS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.riderWallets.nodes ?? []) as Row[];
  const columns: DataTableColumn<Row>[] = [
    { key: "riderId", header: "Rider", cell: (r) => <span className="font-mono text-xs">#{r.riderId}</span> },
    { key: "currency", header: "Currency" },
    { key: "balance", header: "Balance", align: "right", cell: (r) => formatCurrency(r.balance, r.currency) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rider wallets"
        description="Balances held by riders."
        actions={<WalletExportButton table="RiderWallet" relations={["rider"]} entityLabel="Rider wallets" />}
      />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.riderWallets.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/riders/${r.riderId}/financials`)}
      />
    </div>
  );
}
