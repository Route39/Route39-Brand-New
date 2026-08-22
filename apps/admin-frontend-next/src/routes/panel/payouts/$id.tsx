import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { DetailHeader } from "@/components/panel/DetailHeader";
import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { KeyValueList } from "@/components/panel/KeyValue";
import { TAXI_PAYOUT_SESSION_QUERY } from "@/lib/graphql/documents/payouts-detail";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface TxRow {
  id: string;
  createdAt: string;
  action: string;
  status: string;
  amount: number;
  currency: string;
  driverId: string;
}

export default function PayoutSessionDetailPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(TAXI_PAYOUT_SESSION_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.taxiPayoutSession) return <ErrorBlock message="Payout session not found." />;

  const session = data.taxiPayoutSession;
  const transactions = (session.driverTransactions.nodes ?? []) as TxRow[];

  const columns: DataTableColumn<TxRow>[] = [
    {
      key: "id",
      header: "ID",
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span>,
    },
    {
      key: "driverId",
      header: "Driver",
      cell: (r) => <span className="font-mono text-xs">#{r.driverId}</span>,
    },
    { key: "action", header: "Action", cell: (r) => <Badge variant="outline">{r.action}</Badge> },
    { key: "status", header: "Status", cell: (r) => <Badge variant="muted">{r.status}</Badge> },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (r) => formatCurrency(r.amount, r.currency),
    },
    { key: "createdAt", header: "Date", cell: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/payouts"
        backLabel="All payouts"
        title={`Payout #${session.id}`}
        subtitle={session.description ?? "No description"}
        badges={<Badge variant="outline">{session.status}</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              { label: "Total amount", value: formatCurrency(session.totalAmount, session.currency) },
              { label: "Currency", value: session.currency },
              { label: "Created", value: formatDateTime(session.createdAt) },
              { label: "Processed", value: formatDateTime(session.processedAt) },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions ({session.driverTransactions.totalCount})</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <DataTable
            columns={columns}
            rows={transactions}
            totalCount={session.driverTransactions.totalCount}
            loading={false}
            error={null}
            rowKey={(r) => r.id}
            emptyMessage="No transactions in this session."
          />
        </CardContent>
      </Card>
    </div>
  );
}
