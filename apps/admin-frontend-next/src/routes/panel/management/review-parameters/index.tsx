import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/panel/PageHeader";
import { REVIEW_PARAMETERS_LIST_QUERY } from "@/lib/graphql/documents/management";
import { buildFilterInput, buildSortInput, usePageState } from "@/lib/panel/page-state";

type Row = { id: string; title: string; isGood: boolean };

export default function ReviewParametersListPage() {
  const navigate = useNavigate();
  const { sort, filters, page, pageSize } = usePageState();

  const { data, loading, error } = useQuery(REVIEW_PARAMETERS_LIST_QUERY, {
    variables: {
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const allRows = (data?.feedbackParameters ?? []) as Row[];
  const rows = useMemo(
    () => allRows.slice((page - 1) * pageSize, page * pageSize),
    [allRows, page, pageSize],
  );

  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "title", header: "Title", cell: (r) => <span className="font-medium">{r.title}</span> },
    {
      key: "isGood",
      header: "Sentiment",
      cell: (r) => <Badge variant={r.isGood ? "success" : "destructive"}>{r.isGood ? "Positive" : "Negative"}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Review parameters" description="Feedback chips offered when rating a ride." />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={allRows.length}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/management/review-parameters/${r.id}`)}
      />
    </div>
  );
}
