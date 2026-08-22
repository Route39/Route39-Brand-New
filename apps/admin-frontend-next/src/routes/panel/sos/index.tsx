import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { Badge } from "@/components/ui/badge";
import { FilterSelect, TableToolbar } from "@/components/tables/TableToolbar";
import { SOS_LIST_QUERY } from "@/lib/graphql/documents/sos";
import { SOS_STATUS_OPTIONS } from "@/lib/panel/enum-options";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { sosStatusVariant } from "@/lib/panel/status-styles";
import { formatDateTime } from "@/lib/format";

type SosRow = {
  id: string;
  createdAt: string;
  status: string;
  comment?: string | null;
  submittedByRider: boolean;
  requestId: string;
  reason?: { id: string; name: string } | null;
};

export default function SosListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();

  const { data, loading, error } = useQuery(SOS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.distressSignals.nodes ?? []) as SosRow[];

  const columns: DataTableColumn<SosRow>[] = [
    {
      key: "id",
      header: "ID",
      sortField: "id",
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span>,
    },
    {
      key: "status",
      header: t("status", { defaultValue: "Status" }),
      sortField: "status",
      cell: (r) => (
        <Badge variant={sosStatusVariant(r.status)}>
          {t(`enum.sosStatus.${r.status[0]?.toLowerCase()}${r.status.slice(1)}`, {
            defaultValue: r.status,
          })}
        </Badge>
      ),
    },
    {
      key: "submittedByRider",
      header: t("complaint.submittedBy", { defaultValue: "Submitted by" }),
      cell: (r) => (
        <Badge variant={r.submittedByRider ? "outline" : "default"}>
          {r.submittedByRider
            ? t("rider.singular", { defaultValue: "Rider" })
            : t("driver.singular", { defaultValue: "Driver" })}
        </Badge>
      ),
    },
    {
      key: "reason",
      header: t("sos.reason", { defaultValue: "Reason" }),
      cell: (r) => r.reason?.name ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "comment",
      header: t("sos.comment", { defaultValue: "Comment" }),
      cell: (r) => (
        <span className="line-clamp-1 max-w-xs">{r.comment ?? "—"}</span>
      ),
    },
    {
      key: "requestId",
      header: t("sos.relatedOrder", { defaultValue: "Related order" }),
      cell: (r) => <span className="font-mono text-xs">#{r.requestId}</span>,
    },
    {
      key: "createdAt",
      header: t("sos.createdAt", { defaultValue: "Submitted" }),
      sortField: "createdAt",
      cell: (r) => formatDateTime(r.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("menu.sos", { defaultValue: "SOS" })}
        description={t("sos.list.description", {
          defaultValue: "Distress signals raised by riders or drivers.",
        })}
      />
      <TableToolbar>
        <FilterSelect field="status" options={SOS_STATUS_OPTIONS} placeholder="Any status" />
        <FilterSelect
          field="submittedByRider"
          operator="is"
          options={[
            { value: "true", label: "Rider" },
            { value: "false", label: "Driver" },
          ]}
          placeholder="Anyone"
        />
      </TableToolbar>
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.distressSignals.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/sos/${r.id}`)}
      />
    </div>
  );
}
