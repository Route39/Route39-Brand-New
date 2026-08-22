import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/panel/PageHeader";
import { ANNOUNCEMENTS_LIST_QUERY } from "@/lib/graphql/documents/marketing";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { formatDate } from "@/lib/format";

type Row = {
  id: string;
  title: string;
  description: string;
  userType: string[];
  appType?: string | null;
  startAt: string;
  expireAt: string;
};

export default function AnnouncementsListPage() {
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();
  const { data, loading, error } = useQuery(ANNOUNCEMENTS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.announcements.nodes ?? []) as Row[];
  const columns: DataTableColumn<Row>[] = [
    { key: "title", header: "Title", cell: (r) => <span className="font-medium">{r.title}</span> },
    {
      key: "userType",
      header: "Audience",
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.userType.map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>
      ),
    },
    { key: "appType", header: "App", cell: (r) => (r.appType ? <Badge variant="muted">{r.appType}</Badge> : "—") },
    { key: "startAt", header: "Starts", cell: (r) => formatDate(r.startAt) },
    { key: "expireAt", header: "Expires", cell: (r) => formatDate(r.expireAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="In-app banners and push messages." />
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.announcements.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/marketing/announcements/${r.id}`)}
      />
    </div>
  );
}
