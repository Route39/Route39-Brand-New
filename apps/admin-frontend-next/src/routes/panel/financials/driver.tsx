import { gql, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { WalletExportButton } from "@/components/tables/WalletExportButton";
import { PageHeader } from "@/components/panel/PageHeader";
const DRIVER_WALLETS_WITH_NAME_QUERY = gql`
  query DriverWalletsWithName($paging: OffsetPaging!, $filter: DriverWalletFilter!, $sorting: [DriverWalletSort!]!) {
    driverWallets(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes { id balance currency driverId driver { firstName lastName mobileNumber } }
    }
  }
`;
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { formatCurrency } from "@/lib/format";

type Row = { id: string; balance: number; currency: string; driverId: string; driver?: { firstName?: string | null; lastName?: string | null; mobileNumber?: string | null } | null };

export default function DriverFinancialsPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();
  const { data, loading, error } = useQuery<any>(DRIVER_WALLETS_WITH_NAME_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.driverWallets.nodes ?? []) as Row[];
  const columns: DataTableColumn<Row>[] = [
    { key: "driverId", header: "Driver", cell: (r) => {
      const name = `${r.driver?.firstName ?? ""} ${r.driver?.lastName ?? ""}`.trim();
      return (
        <div>
          <div className="font-medium">{name || `Driver #${r.driverId}`}</div>
          <div className="text-xs text-muted-foreground">#{r.driverId}{r.driver?.mobileNumber ? ` · ${r.driver.mobileNumber}` : ""}</div>
        </div>
      );
    } },
    { key: "currency", header: "Currency" },
    { key: "balance", header: "Balance", align: "right", cell: (r) => formatCurrency(r.balance, r.currency) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver wallets"
        description="Balances held by drivers."
        actions={<WalletExportButton table="DriverWallet" relations={["driver"]} entityLabel="Driver wallets" />}
      />
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
