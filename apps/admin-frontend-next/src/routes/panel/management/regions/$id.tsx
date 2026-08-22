import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { REGION_QUERY } from "@/lib/graphql/documents/management-detail-2";
import { RegionForm } from "./form";

export default function EditRegionPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(REGION_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.region) return <ErrorBlock message="Region not found." />;

  const r = data.region;
  const boundary = (r.location ?? []).map((poly) =>
    poly.map((p) => ({ lat: p.lat, lng: p.lng })),
  );
  return (
    <div className="space-y-6">
      <PageHeader title={r.name} description={`Region #${r.id}`} />
      <RegionForm
        mode="edit"
        id={r.id}
        initialValues={{
          name: r.name,
          currency: r.currency,
          enabled: r.enabled,
          boundary: boundary.length > 0 ? boundary : [[]],
        }}
      />
    </div>
  );
}
