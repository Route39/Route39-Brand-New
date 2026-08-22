import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { RelationPicker } from "@/components/forms/RelationPicker";
import { ZONE_PRICE_QUERY } from "@/lib/graphql/documents/management-detail-2";
import { FLEETS_LIST_QUERY, SERVICES_LIST_QUERY } from "@/lib/graphql/documents/management";
import {
  SET_FLEETS_ON_ZONE_PRICE_MUTATION,
  SET_SERVICES_ON_ZONE_PRICE_MUTATION,
  ZONE_PRICE_BINDINGS_QUERY,
} from "@/lib/graphql/documents/extras-2";
import { ZonePriceForm } from "./form";

export default function EditZonePricePage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(ZONE_PRICE_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.zonePrice) return <ErrorBlock message="Zone price not found." />;

  const z = data.zonePrice;
  const from = (z.from ?? []).map((poly) =>
    poly.map((p) => ({ lat: p.lat, lng: p.lng })),
  );
  const to = (z.to ?? []).map((poly) =>
    poly.map((p) => ({ lat: p.lat, lng: p.lng })),
  );
  return (
    <div className="space-y-6">
      <PageHeader title={z.name} description={`Zone price #${z.id}`} />
      <ZonePriceForm
        mode="edit"
        id={z.id}
        initialValues={{
          name: z.name,
          cost: String(z.cost),
          from: from.length > 0 ? from : [[]],
          to: to.length > 0 ? to : [[]],
          timeMultipliers: (z.timeMultipliers ?? []).map((m) => ({
            startTime: m.startTime,
            endTime: m.endTime,
            multiply: m.multiply,
          })),
        }}
      />
      <ZonePriceBindings zoneId={z.id} />
    </div>
  );
}

function ZonePriceBindings({ zoneId }: { zoneId: string }) {
  const { data: bindings } = useQuery(ZONE_PRICE_BINDINGS_QUERY, { variables: { id: zoneId } });
  const { data: servicesData } = useQuery(SERVICES_LIST_QUERY, {
    variables: { sorting: [], filter: {} } as never,
  });
  const { data: fleetsData } = useQuery(FLEETS_LIST_QUERY, {
    variables: { paging: { limit: 100, offset: 0 }, sorting: [], filter: {} } as never,
  });

  if (!bindings?.zonePrice) return null;
  const services = (servicesData?.services ?? []) as { id: string; name: string }[];
  const fleets = (fleetsData?.fleets.nodes ?? []) as { id: string; name: string }[];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <RelationPicker
        title="Applies to services"
        description="Leave empty to apply to all services in the region."
        available={services}
        selected={bindings.zonePrice.services}
        setMutation={SET_SERVICES_ON_ZONE_PRICE_MUTATION}
        recordId={zoneId}
        refetchQueries={[{ query: ZONE_PRICE_BINDINGS_QUERY, variables: { id: zoneId } }]}
      />
      <RelationPicker
        title="Applies to fleets"
        description="Leave empty to apply to all fleets."
        available={fleets}
        selected={bindings.zonePrice.fleets}
        setMutation={SET_FLEETS_ON_ZONE_PRICE_MUTATION}
        recordId={zoneId}
        refetchQueries={[{ query: ZONE_PRICE_BINDINGS_QUERY, variables: { id: zoneId } }]}
      />
    </div>
  );
}
