import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { WalletExportButton } from "@/components/tables/WalletExportButton";
import { PageHeader } from "@/components/panel/PageHeader";
import { FLEET_WALLETS_QUERY } from "@/lib/graphql/documents/payouts";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { formatCurrency } from "@/lib/format";

type Row = {
  id: string;
  balance: number;
  currency: string;
  fleetId: string;
  fleet: { id: string; name: string };
};

export default function FleetFinancialsPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();
  const { data, loading, error } = useQuery(FLEET_WALLETS_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.fleetWallets.nodes ?? []) as Row[];
  const columns: DataTableColumn<Row>[] = [
    { key: "fleet", header: "Fleet", cell: (r) => <span className="font-medium">{r.fleet.name}</span> },
    { key: "currency", header: "Currency" },
    { key: "balance", header: "Balance", align: "right", cell: (r) => formatCurrency(r.balance, r.currency) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet wallets"
        description="Balances held by fleet operators."
        actions={<WalletExportButton table="FleetWallet" relations={["fleet"]} entityLabel="Fleet wallets" />}
      />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.fleetWallets.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/management/fleets/${r.fleetId}`)}
      />
    </div>
  );
}
