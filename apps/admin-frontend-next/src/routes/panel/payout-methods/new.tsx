import { PageHeader } from "@/components/panel/PageHeader";
import { PayoutMethodForm } from "./form";

export default function NewPayoutMethodPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New payout method" />
      <PayoutMethodForm mode="create" />
    </div>
  );
}
