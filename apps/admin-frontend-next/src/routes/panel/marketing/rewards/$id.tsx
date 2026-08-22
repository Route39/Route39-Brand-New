import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { REWARD_QUERY } from "@/lib/graphql/documents/marketing-detail";
import { RewardForm } from "./form";

export default function EditRewardPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(REWARD_QUERY, {
    variables: { id: id! },
    skip: !id,
  });
  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.reward) return <ErrorBlock message="Reward not found." />;
  const r = data.reward;
  return (
    <div className="space-y-6">
      <PageHeader title={r.title} />
      <RewardForm
        mode="edit"
        id={r.id}
        initialValues={{
          title: r.title,
          appType: r.appType,
          beneficiary: r.beneficiary,
          event: r.event,
          creditGift: String(r.creditGift),
          creditCurrency: r.creditCurrency ?? "",
          tripFeePercentGift: r.tripFeePercentGift != null ? String(r.tripFeePercentGift) : "",
          startDate: r.startDate ? new Date(r.startDate).toISOString().slice(0, 16) : "",
          endDate: r.endDate ? new Date(r.endDate).toISOString().slice(0, 16) : "",
        }}
      />
    </div>
  );
}
