import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { PAYOUT_METHOD_QUERY } from "@/lib/graphql/documents/payouts-detail";
import { PayoutMethodForm } from "./form";

export default function EditPayoutMethodPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(PAYOUT_METHOD_QUERY, {
    variables: { id: id! },
    skip: !id,
  });
  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.payoutMethod) return <ErrorBlock message="Payout method not found." />;
  const m = data.payoutMethod;
  return (
    <div className="space-y-6">
      <PageHeader title={m.name} description={`Payout method #${m.id}`} />
      <PayoutMethodForm
        mode="edit"
        id={m.id}
        initialValues={{
          name: m.name,
          description: m.description ?? "",
          currency: m.currency,
          type: m.type as "Stripe" | "BankTransfer",
          enabled: m.enabled,
          publicKey: m.publicKey ?? "",
          privateKey: m.privateKey ?? "",
          saltKey: m.saltKey ?? "",
          merchantId: m.merchantId ?? "",
        }}
      />
    </div>
  );
}
