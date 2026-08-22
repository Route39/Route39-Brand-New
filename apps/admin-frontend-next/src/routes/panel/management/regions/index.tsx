import { useQuery } from "@apollo/client";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/panel/PageHeader";
import { REGIONS_LIST_QUERY } from "@/lib/graphql/documents/management";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";

type Row = { id: string; name: string; currency: string; enabled: boolean };

export default function RegionsListPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();

  const { data, loading, error } = useQuery(REGIONS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.regions.nodes ?? []) as Row[];

  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", sortField: "id", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Name", sortField: "name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "currency", header: "Currency" },
    { key: "enabled", header: "Status", cell: (r) => <Badge variant={r.enabled ? "success" : "muted"}>{r.enabled ? "Enabled" : "Disabled"}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regions"
        description="Geographic operating zones."
        actions={
          <Button asChild>
            <Link to="/management/regions/new">
              <Plus className="size-4" />
              New region
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.regions.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/management/regions/${r.id}`)}
      />
    </div>
  );
}
