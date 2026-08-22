import { useQuery } from "@apollo/client";
import { useNavigate, useOutletContext } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { ORDER_COMPLAINTS_QUERY } from "@/lib/graphql/documents/order-detail";
import { complaintStatusVariant } from "@/lib/panel/status-styles";
import { formatDateTime } from "@/lib/format";
import type { OrderContext } from "./layout";

type Row = {
  id: string;
  inscriptionTimestamp: string;
  requestedByDriver: boolean;
  subject: string;
  status: string;
};

export default function OrderComplaintsTab() {
  const { order } = useOutletContext<OrderContext>();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(ORDER_COMPLAINTS_QUERY, {
    variables: { orderId: order.id },
  });

  const rows = (data?.taxiSupportRequests.nodes ?? []) as Row[];

  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "subject", header: "Subject", cell: (r) => <span className="font-medium">{r.subject}</span> },
    {
      key: "requestedByDriver",
      header: "Submitted by",
      cell: (r) => (
        <Badge variant={r.requestedByDriver ? "default" : "outline"}>
          {r.requestedByDriver ? "Driver" : "Rider"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge variant={complaintStatusVariant(r.status)}>{r.status}</Badge>,
    },
    {
      key: "inscriptionTimestamp",
      header: "Submitted",
      cell: (r) => formatDateTime(r.inscriptionTimestamp),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      totalCount={data?.taxiSupportRequests.totalCount}
      loading={loading}
      error={error?.message ?? null}
      rowKey={(r) => r.id}
      onRowClick={(r) => navigate(`/complaints/${r.id}`)}
      emptyMessage="No complaints filed for this order."
    />
  );
}
