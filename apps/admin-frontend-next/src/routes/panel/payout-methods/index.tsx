import { useQuery } from "@apollo/client";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/panel/PageHeader";
import { PAYOUT_METHODS_QUERY } from "@/lib/graphql/documents/payouts";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";

type Row = {
  id: string;
  enabled: boolean;
  currency: string;
  name: string;
  description?: string | null;
  type: string;
};

export default function PayoutMethodsListPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();
  const { data, loading, error } = useQuery(PAYOUT_METHODS_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.payoutMethods.nodes ?? []) as Row[];
  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "type", header: "Type", cell: (r) => <Badge variant="outline">{r.type}</Badge> },
    { key: "currency", header: "Currency" },
    {
      key: "enabled",
      header: "Status",
      cell: (r) => <Badge variant={r.enabled ? "success" : "muted"}>{r.enabled ? "Enabled" : "Disabled"}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout methods"
        description="Configured payout providers."
        actions={
          <Button asChild>
            <Link to="/payout-methods/new">
              <Plus className="size-4" />
              New method
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.payoutMethods.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/payout-methods/${r.id}`)}
      />
    </div>
  );
}
