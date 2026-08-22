import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { SMS_PROVIDER_QUERY } from "@/lib/graphql/documents/management-detail";
import { SmsProviderForm } from "./form";

export default function EditSmsProviderPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(SMS_PROVIDER_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.smsProvider) return <ErrorBlock message="SMS provider not found." />;

  const p = data.smsProvider;
  return (
    <div className="space-y-6">
      <PageHeader title={p.name} description={`SMS provider #${p.id}`} />
      <SmsProviderForm
        mode="edit"
        id={p.id}
        initialValues={{
          name: p.name,
          type: p.type,
          isDefault: p.isDefault,
          accountId: p.accountId,
          authToken: p.authToken ?? "",
          fromNumber: p.fromNumber ?? "",
          verificationTemplate: p.verificationTemplate ?? "",
          callMaskingEnabled: p.callMaskingEnabled ?? false,
          callMaskingNumber: p.callMaskingNumber ?? "",
        }}
      />
    </div>
  );
}
