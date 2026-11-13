import { gql, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";

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

// DriverWalletFilter has no driver name/phone field, so a search first looks up matching driver ids
const DRIVER_WALLET_SEARCH_QUERY = gql`
  query DriverWalletSearch($filter: DriverFilter!) {
    drivers(paging: { limit: 500, offset: 0 }, filter: $filter, sorting: []) {
      nodes { id }
    }
  }
`;

// Sum of every wallet balance matching the current filter (not just the current page)
const DRIVER_WALLET_TOTAL_QUERY = gql`
  query DriverWalletTotal($filter: DriverWalletAggregateFilter) {
    driverWalletAggregate(filter: $filter) {
      sum { balance }
    }
  }
`;

type Row = { id: string; balance: number; currency: string; driverId: string; driver?: { firstName?: string | null; lastName?: string | null; mobileNumber?: string | null } | null };

export default function DriverFinancialsPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters, setPage } = usePageState();

  // Search by driver name or phone number (debounced)
  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    if (searchDraft.trim() === searchTerm) return;
    const t = window.setTimeout(() => {
      setSearchTerm(searchDraft.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchDraft, searchTerm, setPage]);

  const searchActive = searchTerm.length > 0;
  const like = `%${searchTerm}%`;
  const nameParts = searchTerm.split(/\s+/);
  const driverMatchFilter = {
    or: [
      { firstName: { like } },
      { lastName: { like } },
      { mobileNumber: { like } },
      ...(nameParts.length >= 2
        ? [{ and: [{ firstName: { like: `%${nameParts[0]}%` } }, { lastName: { like: `%${nameParts.slice(1).join(" ")}%` } }] }]
        : []),
    ],
  };
  const { data: matchData, loading: matching } = useQuery<any>(DRIVER_WALLET_SEARCH_QUERY, {
    variables: { filter: driverMatchFilter },
    skip: !searchActive,
  });
  const matchedIds: string[] = (matchData?.drivers?.nodes ?? []).map((d: { id: string }) => d.id);
  const noMatch = searchActive && !matching && matchedIds.length === 0;
  const skipWallets = searchActive && (matching || noMatch);
  const walletFilter = {
    ...buildFilterInput(filters),
    ...(searchActive ? { driverId: { in: matchedIds } } : {}),
  };

  const { data, loading, error } = useQuery<any>(DRIVER_WALLETS_WITH_NAME_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: walletFilter as never,
    },
    skip: skipWallets,
  });
  const { data: totalData } = useQuery<any>(DRIVER_WALLET_TOTAL_QUERY, {
    variables: { filter: walletFilter },
    skip: skipWallets,
  });

  const rows = (skipWallets ? [] : (data?.driverWallets.nodes ?? [])) as Row[];
  const totalDrivers: number | undefined = noMatch ? 0 : data?.driverWallets.totalCount;
  const totalBalance: number | undefined = noMatch ? 0 : totalData?.driverWalletAggregate?.[0]?.sum?.balance;
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Total drivers</div>
          <div className="mt-1 text-2xl font-bold">{totalDrivers ?? "…"}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Total balance</div>
          <div className="mt-1 text-2xl font-bold">
            {totalBalance == null ? "…" : formatCurrency(totalBalance, rows[0]?.currency ?? "Rs")}
          </div>
        </div>
      </div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Search by driver name or phone number"
          className="h-11 rounded-xl bg-card pl-10"
        />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={totalDrivers}
        loading={loading || matching}
        pageSizeOptions={[10, 20, 30, 40, 50]}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/drivers/${r.driverId}/financial`)}
      />
    </div>
  );
}
