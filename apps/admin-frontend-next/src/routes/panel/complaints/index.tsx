import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { Badge } from "@/components/ui/badge";
import { FilterSelect, TableToolbar } from "@/components/tables/TableToolbar";
import { COMPLAINTS_LIST_QUERY } from "@/lib/graphql/documents/complaints";
import {
  COMPLAINT_STATUS_OPTIONS,
  SUBMITTED_BY_OPTIONS,
} from "@/lib/panel/enum-options";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { complaintStatusVariant } from "@/lib/panel/status-styles";
import { formatDateTime } from "@/lib/format";

type ComplaintRow = {
  id: string;
  inscriptionTimestamp: string;
  requestedByDriver: boolean;
  subject: string;
  status: string;
  requestId: string;
};

export default function ComplaintsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();

  const { data, loading, error } = useQuery(COMPLAINTS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.taxiSupportRequests.nodes ?? []) as ComplaintRow[];

  const columns: DataTableColumn<ComplaintRow>[] = [
    {
      key: "id",
      header: "ID",
      sortField: "id",
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span>,
    },
    {
      key: "subject",
      header: t("complaint.subject", { defaultValue: "Subject" }),
      cell: (r) => <span className="font-medium">{r.subject}</span>,
    },
    {
      key: "requestedByDriver",
      header: t("complaint.submittedBy", { defaultValue: "Submitted by" }),
      cell: (r) => (
        <Badge variant={r.requestedByDriver ? "default" : "outline"}>
          {r.requestedByDriver
            ? t("driver.singular", { defaultValue: "Driver" })
            : t("rider.singular", { defaultValue: "Rider" })}
        </Badge>
      ),
    },
    {
      key: "status",
      header: t("status", { defaultValue: "Status" }),
      sortField: "status",
      cell: (r) => (
        <Badge variant={complaintStatusVariant(r.status)}>
          {t(`enum.complaintStatus.${r.status[0]?.toLowerCase()}${r.status.slice(1)}`, {
            defaultValue: r.status,
          })}
        </Badge>
      ),
    },
    {
      key: "requestId",
      header: t("complaint.relatedOrder", { defaultValue: "Related order" }),
      cell: (r) => <span className="font-mono text-xs">#{r.requestId}</span>,
    },
    {
      key: "inscriptionTimestamp",
      header: t("complaint.submittedAt", { defaultValue: "Submitted" }),
      sortField: "inscriptionTimestamp",
      cell: (r) => formatDateTime(r.inscriptionTimestamp),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("menu.complaints", { defaultValue: "Complaints" })}
        description={t("complaints.list.description", {
          defaultValue: "Customer support tickets requiring follow-up.",
        })}
      />
      <TableToolbar>
        <FilterSelect field="status" options={COMPLAINT_STATUS_OPTIONS} placeholder="Any status" width="12rem" />
        <FilterSelect
          field="requestedByDriver"
          operator="is"
          options={SUBMITTED_BY_OPTIONS}
          placeholder="Anyone"
        />
      </TableToolbar>
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.taxiSupportRequests.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/complaints/${r.id}`)}
      />
    </div>
  );
}
