import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { ORDER_CANCEL_REASON_QUERY } from "@/lib/graphql/documents/management";
import { OrderCancelReasonForm } from "./form";

export default function EditOrderCancelReasonPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(ORDER_CANCEL_REASON_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.orderCancelReason) return <ErrorBlock message="Cancel reason not found." />;

  const reason = data.orderCancelReason;

  return (
    <div className="space-y-6">
      <PageHeader
        title={reason.title}
        description={`Cancel reason #${reason.id}`}
      />
      <OrderCancelReasonForm
        mode="edit"
        id={reason.id}
        initialValues={{
          title: reason.title,
          isEnabled: reason.isEnabled,
          userType: reason.userType as "Driver" | "Rider" | "Operator",
        }}
      />
    </div>
  );
}
