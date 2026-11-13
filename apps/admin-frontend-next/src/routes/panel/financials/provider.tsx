import { gql, useQuery } from "@apollo/client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
// import { DateRangeFilter } from "@/components/tables/DateRangeFilter";
import { CsvExportButton } from "@/components/tables/CsvExportButton";
import { WalletExportButton } from "@/components/tables/WalletExportButton";
import { PageHeader } from "@/components/panel/PageHeader";
import { LoadingBlock } from "@/components/panel/StateBlock";
import { PROVIDER_WALLETS_QUERY } from "@/lib/graphql/documents/payouts";
import { EXPORT_PROVIDER_TRANSACTIONS_QUERY } from "@/lib/graphql/documents/extras-2";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { formatCurrency, formatDateTime } from "@/lib/format";

type TxRow = {
  id: string;
  createdAt: string;
  action: string;
  amount: number;
  currency: string;
  deductType?: string | null;
  rechargeType?: string | null;
  expenseType?: string | null;
  driver?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    mobileNumber?: string | null;
  } | null;
};

const PROVIDER_TRANSACTIONS_WITH_DRIVER_QUERY = gql`
  query ProviderTransactionsWithDriver(
    $paging: OffsetPaging!
    $filter: ProviderTransactionFilter!
    $sorting: [ProviderTransactionSort!]!
  ) {
    providerTransactions(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        createdAt
        action
        amount
        currency
        deductType
        rechargeType
        expenseType
        driver {
          id
          firstName
          lastName
          mobileNumber
        }
      }
    }
  }
`;

export default function ProviderFinancialsPage() {
  const { page, pageSize, sort, filters } = usePageState();
  const { data: walletsData, loading: walletsLoading } = useQuery(PROVIDER_WALLETS_QUERY);
  const { data, loading, error } = useQuery<any>(PROVIDER_TRANSACTIONS_WITH_DRIVER_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  if (walletsLoading && !walletsData) return <LoadingBlock />;

  // "Rs" balance card is hidden. Remove the .filter(...) below to show it again.
  const wallets = (walletsData?.providerWallets ?? []).filter(
    (w) => w.currency.toLowerCase() !== "rs",
  );
  const transactions = (data?.providerTransactions.nodes ?? []) as TxRow[];

  const columns: DataTableColumn<TxRow>[] = [
    { key: "createdAt", header: "Date", cell: (r) => formatDateTime(r.createdAt) },
    {
      key: "driver",
      header: "Driver",
      cell: (r) => {
        if (!r.driver) return <span className="text-muted-foreground">—</span>;
        const name = `${r.driver.firstName ?? ""} ${r.driver.lastName ?? ""}`.trim();
        return (
          <div>
            <div className="font-medium">{name || `Driver #${r.driver.id}`}</div>
            {r.driver.mobileNumber ? (
              <div className="text-xs text-muted-foreground">{r.driver.mobileNumber}</div>
            ) : null}
          </div>
        );
      },
    },
    { key: "action", header: "Action", cell: (r) => <Badge variant="outline">{r.action}</Badge> },
    {
      key: "type",
      header: "Type",
      cell: (r) => r.deductType ?? r.rechargeType ?? r.expenseType ?? "—",
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (r) => formatCurrency(r.amount, r.currency),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provider wallets"
        description="Platform-level admin balances and transactions."
        actions={<WalletExportButton table="ProviderWallet" entityLabel="Provider wallets" />}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wallets.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-muted-foreground">No wallets yet.</CardContent>
          </Card>
        ) : (
          wallets.map((w) => (
            <Card key={w.id}>
              <CardContent>
                <div className="text-xs font-medium tracking-[0.08em] uppercase text-muted-foreground">
                  {w.currency} balance
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">
                  {formatCurrency(w.balance, w.currency)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {/* <DateRangeFilter field="createdAt" /> */}
      <div className="flex justify-end">
        <CsvExportButton
          query={EXPORT_PROVIDER_TRANSACTIONS_QUERY}
          resultField="exportProviderTransactions"
          fields={[
            { field: "createdAt", label: "Date" },
            { field: "action", label: "Action" },
            { field: "amount", label: "Amount" },
            { field: "currency", label: "Currency" },
          ]}
          filter={buildFilterInput(filters)}
          sorting={sort ? [{ field: sort.field, direction: sort.direction }] : []}
          entityLabel="provider-transactions"
        />
      </div>
      <DataTable
        columns={columns}
        rows={transactions}
        totalCount={data?.providerTransactions.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        emptyMessage="No transactions yet."
        pageSizeOptions={[10, 20, 30, 40, 50]}
      />
    </div>
  );
}
