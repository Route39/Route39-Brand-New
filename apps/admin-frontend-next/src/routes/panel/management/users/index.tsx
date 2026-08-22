import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/panel/PageHeader";
import { OPERATORS_LIST_QUERY } from "@/lib/graphql/documents/management";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { formatName } from "@/lib/format";

type Row = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  userName: string;
  email?: string | null;
  mobileNumber?: string | null;
  isBlocked: boolean;
  role?: { id: string; title: string } | null;
};

export default function OperatorsListPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();

  const { data, loading, error } = useQuery(OPERATORS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.operators.nodes ?? []) as Row[];

  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", sortField: "id", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    {
      key: "name",
      header: "Name",
      sortField: "lastName",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{formatName(r)}</span>
          <span className="text-xs text-muted-foreground">@{r.userName}</span>
        </div>
      ),
    },
    { key: "email", header: "Email" },
    { key: "role", header: "Role", cell: (r) => (r.role ? <Badge variant="outline">{r.role.title}</Badge> : "—") },
    {
      key: "isBlocked",
      header: "Status",
      cell: (r) => <Badge variant={r.isBlocked ? "destructive" : "success"}>{r.isBlocked ? "Blocked" : "Active"}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Admin operators with access to this dashboard." />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.operators.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/management/users/${r.id}`)}
      />
    </div>
  );
}
