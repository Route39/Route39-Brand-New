import { useQuery } from "@apollo/client";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { GIFT_BATCHES_LIST_QUERY } from "@/lib/graphql/documents/marketing";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { formatCurrency, formatDate } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  availableFrom?: string | null;
  expireAt?: string | null;
};

export default function GiftCardsListPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();
  const { data, loading, error } = useQuery(GIFT_BATCHES_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.giftBatches.nodes ?? []) as Row[];
  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "amount", header: "Amount", align: "right", cell: (r) => formatCurrency(r.amount, r.currency) },
    { key: "availableFrom", header: "Available from", cell: (r) => formatDate(r.availableFrom) },
    { key: "expireAt", header: "Expires", cell: (r) => formatDate(r.expireAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gift cards"
        description="Issued gift card batches."
        actions={
          <Button asChild>
            <Link to="/marketing/gift-cards/new">
              <Plus className="size-4" />
              New batch
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.giftBatches.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/marketing/gift-cards/${r.id}`)}
      />
    </div>
  );
}
