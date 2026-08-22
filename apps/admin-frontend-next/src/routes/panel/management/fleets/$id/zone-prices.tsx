import { useQuery } from "@apollo/client";
import { useNavigate, useOutletContext } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { ZONE_PRICES_LIST_QUERY } from "@/lib/graphql/documents/management";
import { formatCurrency } from "@/lib/format";
import type { FleetContext } from "./layout";

type Row = { id: string; name: string; cost: number };

export default function FleetZonePricesTab() {
  const { fleet } = useOutletContext<FleetContext>();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(ZONE_PRICES_LIST_QUERY, {
    variables: {
      paging: { limit: 50, offset: 0 },
      sorting: [],
      filter: { fleets: { id: { eq: fleet.id } } },
    } as never,
  });

  const rows = (data?.zonePrices.nodes ?? []) as Row[];
  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "cost", header: "Cost", align: "right", cell: (r) => formatCurrency(r.cost) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      totalCount={data?.zonePrices.totalCount}
      loading={loading}
      error={error?.message ?? null}
      rowKey={(r) => r.id}
      onRowClick={(r) => navigate(`/management/zone-prices/${r.id}`)}
      emptyMessage="No zone-price overrides for this fleet."
    />
  );
}
