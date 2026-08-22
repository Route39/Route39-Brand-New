import { useQuery } from "@apollo/client";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/panel/PageHeader";
import { ORDER_CANCEL_REASONS_LIST_QUERY } from "@/lib/graphql/documents/management";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";

type Row = {
  id: string;
  title: string;
  isEnabled: boolean;
  userType: string;
};

export default function OrderCancelReasonsListPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();

  const { data, loading, error } = useQuery(ORDER_CANCEL_REASONS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.orderCancelReasons.nodes ?? []) as Row[];

  const columns: DataTableColumn<Row>[] = [
    {
      key: "id",
      header: "ID",
      sortField: "id",
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span>,
    },
    { key: "title", header: "Title", cell: (r) => <span className="font-medium">{r.title}</span> },
    {
      key: "userType",
      header: "Audience",
      cell: (r) => <Badge variant="outline">{r.userType}</Badge>,
    },
    {
      key: "isEnabled",
      header: "Enabled",
      cell: (r) => (
        <Badge variant={r.isEnabled ? "success" : "muted"}>
          {r.isEnabled ? "Enabled" : "Disabled"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order cancel reasons"
        description="Predefined reasons offered when a ride is cancelled."
        actions={
          <Button type="button" onClick={() => navigate("/management/order-cancel-reasons/new")}>
            <Plus className="size-4" />
            New reason
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.orderCancelReasons.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/management/order-cancel-reasons/${r.id}`)}
      />
    </div>
  );
}
