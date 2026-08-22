import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { ZONE_PRICES_LIST_QUERY } from "@/lib/graphql/documents/management";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { formatCurrency } from "@/lib/format";

type Row = { id: string; name: string; cost: number };

export default function ZonePricesListPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();

  const { data, loading, error } = useQuery(ZONE_PRICES_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.zonePrices.nodes ?? []) as Row[];

  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", sortField: "id", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Name", sortField: "name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "cost", header: "Cost", align: "right", cell: (r) => formatCurrency(r.cost) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Zone prices" description="Geo-fenced flat-rate routes." />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.zonePrices.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/management/zone-prices/${r.id}`)}
      />
    </div>
  );
}
