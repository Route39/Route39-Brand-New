import { PageHeader } from "@/components/panel/PageHeader";
import { CouponForm } from "./form";

export default function NewCouponPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New coupon" description="Promotional code for riders." />
      <CouponForm mode="create" />
    </div>
  );
}
