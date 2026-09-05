import { useQuery } from "@apollo/client";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/panel/PageHeader";
import { REWARDS_LIST_QUERY } from "@/lib/graphql/documents/marketing";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { formatCurrency } from "@/lib/format";

type Row = {
  id: string;
  title: string;
  appType: string;
  beneficiary: string;
  event: string;
  creditGift: number;
  creditCurrency?: string | null;
};

export default function RewardsListPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();
  const { data, loading, error } = useQuery(REWARDS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.rewards.nodes ?? []) as Row[];
  const columns: DataTableColumn<Row>[] = [
    { key: "title", header: "Title", cell: (r) => <span className="font-medium">{r.title}</span> },
    { key: "appType", header: "App", cell: (r) => <Badge variant="outline">{r.appType}</Badge> },
    { key: "beneficiary", header: "Beneficiary", cell: (r) => <Badge variant="muted">{r.beneficiary}</Badge> },
    { key: "event", header: "Event", cell: (r) => <Badge variant="muted">{r.event}</Badge> },
    {
      key: "creditGift",
      header: "Reward",
      align: "right",
      cell: (r) => formatCurrency(r.creditGift, r.creditCurrency ?? undefined),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewards"
        description="Loyalty rewards earned by riders or drivers."
        actions={
          <Button asChild>
            <Link to="/marketing/rewards/new">
              <Plus className="size-4" />
              New reward
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.rewards.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/marketing/rewards/${r.id}`)}
      />
    </div>
  );
}
