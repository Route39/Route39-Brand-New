import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/panel/PageHeader";
import { PAYMENT_GATEWAYS_LIST_QUERY } from "@/lib/graphql/documents/management";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";

type Row = {
  id: string;
  title: string;
  type: string;
  enabled: boolean;
  merchantId?: string | null;
};

export default function PaymentGatewaysListPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();

  const { data, loading, error } = useQuery(PAYMENT_GATEWAYS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.paymentGateways.nodes ?? []) as Row[];

  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", sortField: "id", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "title", header: "Title", sortField: "title", cell: (r) => <span className="font-medium">{r.title}</span> },
    { key: "type", header: "Type", cell: (r) => <Badge variant="outline">{r.type}</Badge> },
    { key: "merchantId", header: "Merchant ID" },
    {
      key: "enabled",
      header: "Status",
      cell: (r) => <Badge variant={r.enabled ? "success" : "muted"}>{r.enabled ? "Enabled" : "Disabled"}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Payment gateways" description="Configured payment processors for the platform." />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.paymentGateways.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/management/payment-gateways/${r.id}`)}
      />
    </div>
  );
}
