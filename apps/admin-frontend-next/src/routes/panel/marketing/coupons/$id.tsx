import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { COUPON_QUERY } from "@/lib/graphql/documents/marketing-detail";
import { CouponForm } from "./form";

export default function EditCouponPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(COUPON_QUERY, {
    variables: { id: id! },
    skip: !id,
  });
  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.coupon) return <ErrorBlock message="Coupon not found." />;
  const c = data.coupon;
  return (
    <div className="space-y-6">
      <PageHeader title={c.title} description={`Coupon ${c.code}`} />
      <CouponForm
        mode="edit"
        id={c.id}
        initialValues={{
          code: c.code,
          title: c.title,
          description: c.description,
          manyUsersCanUse: String(c.manyUsersCanUse),
          manyTimesUserCanUse: String(c.manyTimesUserCanUse),
          minimumCost: String(c.minimumCost),
          maximumCost: String(c.maximumCost),
          startAt: new Date(c.startAt).toISOString().slice(0, 16),
          expireAt: new Date(c.expireAt).toISOString().slice(0, 16),
          discountPercent: String(c.discountPercent),
          discountFlat: String(c.discountFlat),
          creditGift: String(c.creditGift),
          isEnabled: c.isEnabled,
          isFirstTravelOnly: c.isFirstTravelOnly,
        }}
      />
    </div>
  );
}
