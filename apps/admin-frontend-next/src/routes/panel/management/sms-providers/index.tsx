import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/panel/PageHeader";
import { SMS_PROVIDERS_LIST_QUERY } from "@/lib/graphql/documents/management";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";

type Row = {
  id: string;
  name: string;
  type: string;
  isDefault: boolean;
  accountId: string;
  fromNumber?: string | null;
};

export default function SmsProvidersListPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();

  const { data, loading, error } = useQuery(SMS_PROVIDERS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.smsProviders.nodes ?? []) as Row[];

  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", sortField: "id", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Name", sortField: "name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "type", header: "Type", cell: (r) => <Badge variant="outline">{r.type}</Badge> },
    { key: "fromNumber", header: "From" },
    { key: "isDefault", header: "Default", cell: (r) => (r.isDefault ? <Badge variant="success">Default</Badge> : null) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="SMS providers" description="SMS gateways configured for transactional messaging." />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.smsProviders.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/management/sms-providers/${r.id}`)}
      />
    </div>
  );
}
