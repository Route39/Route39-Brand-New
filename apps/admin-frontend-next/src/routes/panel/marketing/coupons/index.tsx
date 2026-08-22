import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/panel/PageHeader";
import { COUPONS_LIST_QUERY } from "@/lib/graphql/documents/marketing";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { formatCurrency, formatDate } from "@/lib/format";

type Row = {
  id: string;
  code: string;
  title: string;
  description: string;
  startAt: string;
  expireAt: string;
  discountPercent: number;
  discountFlat: number;
  minimumCost: number;
  maximumCost: number;
};

export default function CouponsListPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();
  const { data, loading, error } = useQuery(COUPONS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.coupons.nodes ?? []) as Row[];
  const columns: DataTableColumn<Row>[] = [
    { key: "code", header: "Code", cell: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "title", header: "Title", cell: (r) => <span className="font-medium">{r.title}</span> },
    {
      key: "discount",
      header: "Discount",
      align: "right",
      cell: (r) =>
        r.discountPercent > 0 ? (
          <Badge variant="success">{r.discountPercent}%</Badge>
        ) : (
          <Badge variant="default">{formatCurrency(r.discountFlat)}</Badge>
        ),
    },
    { key: "minimumCost", header: "Min cost", align: "right", cell: (r) => formatCurrency(r.minimumCost) },
    { key: "startAt", header: "Starts", cell: (r) => formatDate(r.startAt) },
    { key: "expireAt", header: "Expires", cell: (r) => formatDate(r.expireAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" description="Promotional codes riders can apply at checkout." />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.coupons.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/marketing/coupons/${r.id}`)}
      />
    </div>
  );
}
