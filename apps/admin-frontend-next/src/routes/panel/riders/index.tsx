import { useQuery } from "@apollo/client";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { CsvExportButton } from "@/components/tables/CsvExportButton";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FilterSelect,
  FilterText,
  TableToolbar,
} from "@/components/tables/TableToolbar";
import { RIDERS_LIST_QUERY } from "@/lib/graphql/documents/riders";
import { EXPORT_RIDERS_QUERY } from "@/lib/graphql/documents/extras-2";
import { RIDER_STATUS_OPTIONS } from "@/lib/panel/enum-options";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { riderStatusVariant } from "@/lib/panel/status-styles";
import { formatDateTime, formatName } from "@/lib/format";

type RiderRow = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  mobileNumber: string;
  email?: string | null;
  status: string;
  registrationTimestamp: string;
  lastActivityAt?: string | null;
  ratingAggregate?: { rating?: number | null; reviewCount: number } | null;
};

export default function RidersListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();

  const { data, loading, error } = useQuery(RIDERS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.riders.nodes ?? []) as RiderRow[];

  const columns: DataTableColumn<RiderRow>[] = [
    {
      key: "id",
      header: "ID",
      sortField: "id",
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span>,
    },
    {
      key: "name",
      header: t("rider.name", { defaultValue: "Name" }),
      sortField: "lastName",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{formatName(r)}</span>
          <span className="text-xs text-muted-foreground">{r.mobileNumber}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (r) => r.email ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "status",
      header: t("status", { defaultValue: "Status" }),
      sortField: "status",
      cell: (r) => (
        <Badge variant={riderStatusVariant(r.status)}>
          {t(`enum.rider.status.${r.status[0]?.toLowerCase()}${r.status.slice(1)}`, {
            defaultValue: r.status,
          })}
        </Badge>
      ),
    },
    {
      key: "rating",
      header: t("rider.rating", { defaultValue: "Rating" }),
      align: "right",
      cell: (r) =>
        r.ratingAggregate?.rating != null ? (
          <span>
            {r.ratingAggregate.rating.toFixed(1)}{" "}
            <span className="text-xs text-muted-foreground">({r.ratingAggregate.reviewCount})</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "registrationTimestamp",
      header: t("rider.registered", { defaultValue: "Registered" }),
      sortField: "registrationTimestamp",
      cell: (r) => formatDateTime(r.registrationTimestamp),
    },
    {
      key: "lastActivityAt",
      header: t("rider.lastActivity", { defaultValue: "Last activity" }),
      sortField: "lastActivityAt",
      cell: (r) => formatDateTime(r.lastActivityAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("menu.riders", { defaultValue: "Riders" })}
        description={t("rider.list.description", {
          defaultValue: "All riders registered on the platform.",
        })}
        actions={
          <div className="flex gap-2">
            <CsvExportButton
              query={EXPORT_RIDERS_QUERY}
              resultField="exportRiders"
              fields={[
                { field: "id", label: "ID" },
                { field: "firstName", label: "First name" },
                { field: "lastName", label: "Last name" },
                { field: "mobileNumber", label: "Phone" },
                { field: "email", label: "Email" },
                { field: "status", label: "Status" },
                { field: "registrationTimestamp", label: "Registered" },
              ]}
              filter={buildFilterInput(filters)}
              sorting={buildSortInput(sort)}
              entityLabel="riders"
            />
            <Button asChild>
              <Link to="/riders/new">
                <Plus className="size-4" />
                New rider
              </Link>
            </Button>
          </div>
        }
      />
      <TableToolbar>
        <FilterText field="lastName" placeholder="Search by last name" />
        <FilterText field="mobileNumber" placeholder="Phone number" />
        <FilterSelect field="status" options={RIDER_STATUS_OPTIONS} placeholder="Any status" />
      </TableToolbar>
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.riders.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/riders/${r.id}`)}
      />
    </div>
  );
}
