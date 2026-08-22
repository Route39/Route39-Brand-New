import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { RIDER_DETAIL_QUERY } from "@/lib/graphql/documents/rider-detail";
import { formatName } from "@/lib/format";
import { RiderForm } from "../form";

export default function EditRiderPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(RIDER_DETAIL_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.rider) return <ErrorBlock message="Rider not found." />;

  const r = data.rider;
  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${formatName(r)}`} description={`Rider #${r.id}`} />
      <RiderForm
        mode="edit"
        id={r.id}
        initialValues={{
          firstName: r.firstName ?? "",
          lastName: r.lastName ?? "",
          mobileNumber: r.mobileNumber,
          email: r.email ?? "",
          status: r.status,
          countryIso: r.countryIso ?? "",
          gender: r.gender ?? "",
          isResident: r.isResident ?? false,
          idNumber: r.idNumber ?? "",
        }}
      />
    </div>
  );
}
