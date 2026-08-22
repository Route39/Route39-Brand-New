import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/panel/PageHeader";
import { SERVICE_OPTIONS_LIST_QUERY } from "@/lib/graphql/documents/management";
import { buildFilterInput, buildSortInput, usePageState } from "@/lib/panel/page-state";
import { formatCurrency } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  type: string;
  additionalFee?: number | null;
  icon: string;
};

export default function ServiceOptionsListPage() {
  const navigate = useNavigate();
  const { sort, filters, page, pageSize } = usePageState();

  const { data, loading, error } = useQuery(SERVICE_OPTIONS_LIST_QUERY, {
    variables: {
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const allRows = (data?.serviceOptions ?? []) as Row[];
  const rows = useMemo(
    () => allRows.slice((page - 1) * pageSize, page * pageSize),
    [allRows, page, pageSize],
  );

  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "type", header: "Type", cell: (r) => <Badge variant="outline">{r.type}</Badge> },
    { key: "icon", header: "Icon", cell: (r) => <Badge variant="muted">{r.icon}</Badge> },
    {
      key: "additionalFee",
      header: "Additional fee",
      align: "right",
      cell: (r) => (r.additionalFee != null ? formatCurrency(r.additionalFee) : "—"),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Service options" description="Add-ons that can attach to services." />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={allRows.length}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/management/service-options/${r.id}`)}
      />
    </div>
  );
}
