import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { SURGE_ZONE_QUERY } from "@/lib/graphql/documents/surge";
import { SurgeZoneForm } from "./form";

const s = (v: unknown) => (v == null ? "" : String(v));

export default function EditSurgeZonePage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(SURGE_ZONE_QUERY, { variables: { id: id! }, skip: !id });
  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  const z = data?.surgeZone;
  if (!z) return <ErrorBlock message="Surge zone not found." />;
  const area = (z.area ?? []).map((poly: { lat: number; lng: number }[]) => poly.map((p) => ({ lat: p.lat, lng: p.lng })));
  return (
    <div className="space-y-6">
      <PageHeader title={z.name} description={`Surge zone #${z.id}`} />
      <SurgeZoneForm mode="edit" id={z.id} initialValues={{
        name: z.name, status: z.status, type: z.type ?? "Peak", surgePercent: s(z.surgePercent), surgeFlat: s(z.surgeFlat),
        commissionPercent: s(z.commissionPercent), startTime: s(z.startTime), endTime: s(z.endTime), startDate: s(z.startDate), endDate: s(z.endDate),
        area: area.length > 0 ? area : [[]],
      }} />
    </div>
  );
}
