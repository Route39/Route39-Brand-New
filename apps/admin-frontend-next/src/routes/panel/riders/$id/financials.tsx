import { useQuery } from "@apollo/client";
import { Wallet } from "lucide-react";
import { useOutletContext } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdjustWalletDialog } from "@/components/panel/AdjustWalletDialog";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import {
  RIDER_TRANSACTIONS_QUERY,
  RIDER_WALLETS_QUERY,
} from "@/lib/graphql/documents/rider-detail";
import { buildOffsetPaging, usePageState } from "@/lib/panel/page-state";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { RiderContext } from "./layout";

type TransactionRow = {
  id: string;
  createdAt: string;
  action: string;
  status: string;
  amount: number;
  currency: string;
  deductType?: string | null;
  rechargeType?: string | null;
};

export default function RiderFinancialsTab() {
  const { rider } = useOutletContext<RiderContext>();
  const { page, pageSize } = usePageState();

  const { data: walletsData, refetch: refetchWallets } = useQuery(RIDER_WALLETS_QUERY, {
    variables: { riderId: rider.id },
  });
  const { data, loading, error } = useQuery(RIDER_TRANSACTIONS_QUERY, {
    variables: {
      riderId: rider.id,
      paging: buildOffsetPaging({ page, pageSize }),
    },
  });

  const wallets = walletsData?.riderWallets.nodes ?? [];
  const transactions = (data?.riderTransactions.nodes ?? []) as TransactionRow[];

  const columns: DataTableColumn<TransactionRow>[] = [
    { key: "createdAt", header: "Date", cell: (r) => formatDateTime(r.createdAt) },
    { key: "action", header: "Action", cell: (r) => <Badge variant="outline">{r.action}</Badge> },
    { key: "deductType", header: "Type", cell: (r) => r.deductType ?? r.rechargeType ?? "—" },
    { key: "status", header: "Status", cell: (r) => <Badge variant="muted">{r.status}</Badge> },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (r) => formatCurrency(r.amount, r.currency),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AdjustWalletDialog
          variant="rider"
          userId={rider.id}
          defaultCurrency={wallets[0]?.currency ?? "USD"}
          onSaved={() => refetchWallets()}
          trigger={
            <Button type="button" variant="outline" size="sm">
              <Wallet className="size-3.5" />
              Adjust wallet
            </Button>
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wallets.length > 0 ? (
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
        ) : (
          <Card>
            <CardContent className="text-sm text-muted-foreground">No wallets yet.</CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <DataTable
            columns={columns}
            rows={transactions}
            totalCount={data?.riderTransactions.totalCount}
            loading={loading}
            error={error?.message ?? null}
            rowKey={(r) => r.id}
            emptyMessage="No transactions yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
