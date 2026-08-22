import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { FLEET_QUERY } from "@/lib/graphql/documents/management-detail-2";
import { FleetForm } from "./form";

export default function EditFleetPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(FLEET_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.fleet) return <ErrorBlock message="Fleet not found." />;

  const f = data.fleet;
  const exclusivityAreas = (f.exclusivityAreas ?? []).map((poly) =>
    poly.map((p) => ({ lat: p.lat, lng: p.lng })),
  );
  return (
    <div className="space-y-6">
      <PageHeader title={f.name} description={`Fleet #${f.id}`} />
      <FleetForm
        mode="edit"
        id={f.id}
        initialValues={{
          name: f.name,
          phoneNumber: f.phoneNumber,
          mobileNumber: f.mobileNumber,
          userName: f.userName ?? "",
          accountNumber: "",
          commissionSharePercent: String(f.commissionSharePercent),
          commissionShareFlat: String(f.commissionShareFlat),
          feeMultiplier: f.feeMultiplier != null ? String(f.feeMultiplier) : "",
          address: f.address ?? "",
          isBlocked: f.isBlocked,
          exclusivityAreas,
        }}
      />
    </div>
  );
}
