import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { SERVICE_OPTION_QUERY } from "@/lib/graphql/documents/management-detail";
import { ServiceOptionForm } from "./form";

export default function EditServiceOptionPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(SERVICE_OPTION_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.serviceOption) return <ErrorBlock message="Service option not found." />;

  const o = data.serviceOption;
  return (
    <div className="space-y-6">
      <PageHeader title={o.name} description={`Service option #${o.id}`} />
      <ServiceOptionForm
        mode="edit"
        id={o.id}
        initialValues={{
          name: o.name,
          type: o.type as "Free" | "Paid" | "TwoWay",
          icon: o.icon,
          additionalFee: o.additionalFee != null ? String(o.additionalFee) : "",
        }}
      />
    </div>
  );
}
