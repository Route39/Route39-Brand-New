import { useQuery } from "@apollo/client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { LoadingBlock } from "@/components/panel/StateBlock";
import {
  PROVIDER_TRANSACTIONS_QUERY,
  PROVIDER_WALLETS_QUERY,
} from "@/lib/graphql/documents/payouts";
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
};

export default function ProviderFinancialsPage() {
  const { page, pageSize, sort, filters } = usePageState();
  const { data: walletsData, loading: walletsLoading } = useQuery(PROVIDER_WALLETS_QUERY);
  const { data, loading, error } = useQuery(PROVIDER_TRANSACTIONS_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  if (walletsLoading && !walletsData) return <LoadingBlock />;

  const wallets = walletsData?.providerWallets ?? [];
  const transactions = (data?.providerTransactions.nodes ?? []) as TxRow[];

  const columns: DataTableColumn<TxRow>[] = [
    { key: "createdAt", header: "Date", cell: (r) => formatDateTime(r.createdAt) },
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
      <PageHeader title="Provider wallets" description="Platform-level admin balances and transactions." />
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
      <DataTable
        columns={columns}
        rows={transactions}
        totalCount={data?.providerTransactions.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        emptyMessage="No transactions yet."
      />
    </div>
  );
}
