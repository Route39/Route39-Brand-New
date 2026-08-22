import { useQuery } from "@apollo/client";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { CsvExportButton } from "@/components/tables/CsvExportButton";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/panel/PageHeader";
import { FLEETS_LIST_QUERY } from "@/lib/graphql/documents/management";
import { EXPORT_FLEETS_QUERY } from "@/lib/graphql/documents/extras-2";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { formatDateTime } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  phoneNumber: string;
  mobileNumber: string;
  userName?: string | null;
  isBlocked: boolean;
  createdAt?: string | null;
};

export default function FleetsListPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();

  const { data, loading, error } = useQuery(FLEETS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.fleets.nodes ?? []) as Row[];

  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", sortField: "id", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Name", sortField: "name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "phoneNumber", header: "Phone" },
    { key: "userName", header: "Username" },
    { key: "isBlocked", header: "Status", cell: (r) => <Badge variant={r.isBlocked ? "destructive" : "success"}>{r.isBlocked ? "Blocked" : "Active"}</Badge> },
    { key: "createdAt", header: "Created", sortField: "createdAt", cell: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleets"
        description="Fleet partners operating on the platform."
        actions={
          <div className="flex gap-2">
            <CsvExportButton
              query={EXPORT_FLEETS_QUERY}
              resultField="exportFleets"
              fields={[
                { field: "id", label: "ID" },
                { field: "name", label: "Name" },
                { field: "phoneNumber", label: "Phone" },
                { field: "mobileNumber", label: "Mobile" },
                { field: "userName", label: "Username" },
                { field: "isBlocked", label: "Blocked" },
              ]}
              filter={filters.length > 0 ? Object.fromEntries(filters.map((f) => [f.field, { [f.operator]: f.value }])) : {}}
              sorting={sort ? [{ field: sort.field, direction: sort.direction }] : []}
              entityLabel="fleets"
            />
            <Button asChild>
              <Link to="/management/fleets/new">
                <Plus className="size-4" />
                New fleet
              </Link>
            </Button>
          </div>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.fleets.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/management/fleets/${r.id}`)}
      />
    </div>
  );
}
