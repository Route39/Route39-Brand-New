import { useQuery } from "@apollo/client";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/panel/PageHeader";
import { TAXI_PAYOUT_SESSIONS_QUERY } from "@/lib/graphql/documents/payouts";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { formatCurrency, formatDateTime } from "@/lib/format";

type Row = {
  id: string;
  createdAt: string;
  processedAt?: string | null;
  description?: string | null;
  status: string;
  totalAmount: number;
  currency: string;
};

export default function PayoutsListPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();
  const { data, loading, error } = useQuery(TAXI_PAYOUT_SESSIONS_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.taxiPayoutSessions.nodes ?? []) as Row[];
  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "description", header: "Description", cell: (r) => <span className="font-medium">{r.description ?? "—"}</span> },
    { key: "status", header: "Status", cell: (r) => <Badge variant="outline">{r.status}</Badge> },
    { key: "totalAmount", header: "Amount", align: "right", cell: (r) => formatCurrency(r.totalAmount, r.currency) },
    { key: "createdAt", header: "Created", cell: (r) => formatDateTime(r.createdAt) },
    { key: "processedAt", header: "Processed", cell: (r) => formatDateTime(r.processedAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts"
        description="Driver payout sessions."
        actions={
          <Button asChild>
            <Link to="/payouts/new">
              <Plus className="size-4" />
              New payout
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.taxiPayoutSessions.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/payouts/${r.id}`)}
      />
    </div>
  );
}
