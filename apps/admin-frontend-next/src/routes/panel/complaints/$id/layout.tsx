import { useQuery } from "@apollo/client";
import { Outlet, useParams } from "react-router-dom";

import { DetailHeader } from "@/components/panel/DetailHeader";
import { TabNav } from "@/components/panel/TabNav";
import { Badge } from "@/components/ui/badge";
import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { COMPLAINT_DETAIL_QUERY } from "@/lib/graphql/documents/complaint-detail";
import { complaintStatusVariant } from "@/lib/panel/status-styles";
import type { ComplaintDetailQuery } from "@/lib/graphql/__generated__/graphql";

export type ComplaintContext = {
  complaint: ComplaintDetailQuery["taxiSupportRequest"];
};

export default function ComplaintDetailLayout() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(COMPLAINT_DETAIL_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.taxiSupportRequest) return <ErrorBlock message="Complaint not found." />;

  const complaint = data.taxiSupportRequest;

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/complaints"
        backLabel="All complaints"
        title={complaint.subject}
        subtitle={
          <div className="flex items-center gap-3">
            <span>Order #{complaint.requestId}</span>
            <span>·</span>
            <span>{complaint.requestedByDriver ? "Submitted by driver" : "Submitted by rider"}</span>
          </div>
        }
        badges={
          <Badge variant={complaintStatusVariant(complaint.status)}>{complaint.status}</Badge>
        }
      />
      <TabNav
        tabs={[
          { to: "info", label: "Info" },
          { to: "records", label: "Activity" },
        ]}
      />
      <Outlet context={{ complaint } satisfies ComplaintContext} />
    </div>
  );
}
