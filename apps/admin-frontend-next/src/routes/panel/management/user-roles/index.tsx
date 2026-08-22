import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/panel/PageHeader";
import { OPERATOR_ROLES_LIST_QUERY } from "@/lib/graphql/documents/management";
import { buildFilterInput, buildSortInput, usePageState } from "@/lib/panel/page-state";

type Row = {
  id: string;
  title: string;
  permissions: string[];
  taxiPermissions: string[];
  shopPermissions: string[];
  parkingPermissions: string[];
  allowedApps: string[];
};

export default function UserRolesListPage() {
  const navigate = useNavigate();
  const { sort, filters, page, pageSize } = usePageState();

  const { data, loading, error } = useQuery(OPERATOR_ROLES_LIST_QUERY, {
    variables: {
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const allRows = (data?.operatorRoles ?? []) as Row[];
  const rows = useMemo(
    () => allRows.slice((page - 1) * pageSize, page * pageSize),
    [allRows, page, pageSize],
  );

  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "title", header: "Title", cell: (r) => <span className="font-medium">{r.title}</span> },
    {
      key: "permissions",
      header: "Permissions",
      cell: (r) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {r.permissions.length} admin · {r.taxiPermissions.length} taxi · {r.shopPermissions.length} shop · {r.parkingPermissions.length} parking
        </span>
      ),
    },
    {
      key: "allowedApps",
      header: "Apps",
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.allowedApps.map((a) => (
            <Badge key={a} variant="outline">
              {a}
            </Badge>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="User roles" description="Permission profiles assigned to admin operators." />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={allRows.length}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/management/user-roles/${r.id}`)}
      />
    </div>
  );
}
