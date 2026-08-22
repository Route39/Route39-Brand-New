import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { PAYMENT_GATEWAY_QUERY } from "@/lib/graphql/documents/management-detail";
import { PaymentGatewayForm } from "./form";

export default function EditPaymentGatewayPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(PAYMENT_GATEWAY_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.paymentGateway) return <ErrorBlock message="Gateway not found." />;

  const g = data.paymentGateway;
  return (
    <div className="space-y-6">
      <PageHeader title={g.title} description={`Payment gateway #${g.id}`} />
      <PaymentGatewayForm
        mode="edit"
        id={g.id}
        initialValues={{
          title: g.title,
          type: g.type,
          enabled: g.enabled,
          publicKey: g.publicKey ?? "",
          privateKey: g.privateKey,
          merchantId: g.merchantId ?? "",
          saltKey: g.saltKey ?? "",
        }}
      />
    </div>
  );
}
