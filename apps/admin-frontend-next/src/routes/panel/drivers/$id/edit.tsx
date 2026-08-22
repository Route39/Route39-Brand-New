import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { DRIVER_DETAIL_QUERY } from "@/lib/graphql/documents/driver-detail";
import { formatName } from "@/lib/format";
import { DriverForm } from "../form";

export default function EditDriverPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(DRIVER_DETAIL_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.driver) return <ErrorBlock message="Driver not found." />;

  const d = data.driver;
  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${formatName(d)}`} description={`Driver #${d.id}`} />
      <DriverForm
        mode="edit"
        id={d.id}
        initialValues={{
          firstName: d.firstName ?? "",
          lastName: d.lastName ?? "",
          mobileNumber: d.mobileNumber,
          email: d.email ?? "",
          status: d.status,
          carPlate: d.carPlate ?? "",
          certificateNumber: d.certificateNumber ?? "",
          canDeliver: d.canDeliver,
          address: d.address ?? "",
          accountNumber: d.accountNumber ?? "",
          bankName: d.bankName ?? "",
        }}
      />
    </div>
  );
}
