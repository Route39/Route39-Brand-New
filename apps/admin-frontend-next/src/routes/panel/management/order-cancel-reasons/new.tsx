import { PageHeader } from "@/components/panel/PageHeader";
import { OrderCancelReasonForm } from "./form";

export default function NewOrderCancelReasonPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New cancel reason"
        description="Create a new predefined cancel reason."
      />
      <OrderCancelReasonForm mode="create" />
    </div>
  );
}
