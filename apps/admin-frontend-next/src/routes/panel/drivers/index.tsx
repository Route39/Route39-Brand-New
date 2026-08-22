import { useQuery } from "@apollo/client";
import { Plus, Star } from "lucide-react";
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
import { DRIVERS_LIST_QUERY } from "@/lib/graphql/documents/drivers";
import { EXPORT_DRIVERS_QUERY } from "@/lib/graphql/documents/extras-2";
import { buildSortInput as buildSortInputForExport } from "@/lib/panel/page-state";
import { DRIVER_STATUS_OPTIONS } from "@/lib/panel/enum-options";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  usePageState,
} from "@/lib/panel/page-state";
import { driverStatusVariant } from "@/lib/panel/status-styles";
import { formatDateTime, formatName } from "@/lib/format";

type DriverRow = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  mobileNumber: string;
  status: string;
  carPlate?: string | null;
  rating?: number | null;
  reviewCount: number;
  registrationTimestamp: string;
  lastSeenTimestamp?: string | null;
  fleetId?: string | null;
};

export default function DriversListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page, pageSize, sort, filters } = usePageState();

  const { data, loading, error } = useQuery(DRIVERS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page, pageSize }),
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });

  const rows = (data?.drivers.nodes ?? []) as DriverRow[];

  const columns: DataTableColumn<DriverRow>[] = [
    {
      key: "id",
      header: "ID",
      sortField: "id",
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span>,
    },
    {
      key: "name",
      header: t("driver.name", { defaultValue: "Name" }),
      sortField: "lastName",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{formatName(r)}</span>
          <span className="text-xs text-muted-foreground">{r.mobileNumber}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: t("status", { defaultValue: "Status" }),
      sortField: "status",
      cell: (r) => (
        <Badge variant={driverStatusVariant(r.status)}>
          {t(`enum.driver.status.${r.status[0]?.toLowerCase()}${r.status.slice(1)}`, {
            defaultValue: r.status,
          })}
        </Badge>
      ),
    },
    {
      key: "carPlate",
      header: t("driver.carPlate", { defaultValue: "Car Plate" }),
      cell: (r) => r.carPlate ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "rating",
      header: t("driver.rating", { defaultValue: "Rating" }),
      align: "right",
      cell: (r) =>
        r.rating != null ? (
          <span className="inline-flex items-center justify-end gap-1">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {(r.rating / 20).toFixed(1)}
            <span className="text-xs text-muted-foreground">({r.reviewCount})</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "registrationTimestamp",
      header: t("driver.registered", { defaultValue: "Registered" }),
      sortField: "registrationTimestamp",
      cell: (r) => formatDateTime(r.registrationTimestamp),
    },
    {
      key: "lastSeenTimestamp",
      header: t("driver.lastSeen", { defaultValue: "Last seen" }),
      sortField: "lastSeenTimestamp",
      cell: (r) => formatDateTime(r.lastSeenTimestamp),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("menu.driver.all", { defaultValue: "Drivers" })}
        description={t("driver.list.description", {
          defaultValue: "All drivers registered on the platform.",
        })}
        actions={
          <div className="flex gap-2">
            <CsvExportButton
              query={EXPORT_DRIVERS_QUERY}
              resultField="exportDrivers"
              fields={[
                { field: "id", label: "ID" },
                { field: "firstName", label: "First name" },
                { field: "lastName", label: "Last name" },
                { field: "mobileNumber", label: "Phone" },
                { field: "email", label: "Email" },
                { field: "status", label: "Status" },
                { field: "carPlate", label: "Plate" },
                { field: "registrationTimestamp", label: "Registered" },
              ]}
              filter={buildFilterInput(filters)}
              sorting={buildSortInputForExport(sort)}
              entityLabel="drivers"
            />
            <Button asChild>
              <Link to="/drivers/new">
                <Plus className="size-4" />
                New driver
              </Link>
            </Button>
          </div>
        }
      />
      <TableToolbar>
        <FilterText field="lastName" placeholder="Search by last name" />
        <FilterText field="mobileNumber" placeholder="Phone number" />
        <FilterSelect field="status" options={DRIVER_STATUS_OPTIONS} placeholder="Any status" width="11rem" />
      </TableToolbar>
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={data?.drivers.totalCount}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => {
          const dest =
            r.status === "PendingApproval" ||
            r.status === "SoftReject" ||
            r.status === "HardReject"
              ? `/drivers/${r.id}/review`
              : `/drivers/${r.id}`;
          navigate(dest);
        }}
      />
    </div>
  );
}
