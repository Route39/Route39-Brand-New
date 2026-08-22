import { PageHeader } from "@/components/panel/PageHeader";
import { PaymentGatewayForm } from "./form";

export default function NewPaymentGatewayPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New payment gateway" />
      <PaymentGatewayForm mode="create" />
    </div>
  );
}
