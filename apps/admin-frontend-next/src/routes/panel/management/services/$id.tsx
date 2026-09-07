import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { NewServiceOptionDialog } from "@/components/forms/NewServiceOptionDialog";
import { PageHeader } from "@/components/panel/PageHeader";
import { RelationPicker } from "@/components/forms/RelationPicker";
import { SERVICE_QUERY } from "@/lib/graphql/documents/management-detail-2";
import { REGIONS_LIST_QUERY, SERVICE_OPTIONS_LIST_QUERY } from "@/lib/graphql/documents/management";
import {
  SERVICE_BINDINGS_QUERY,
  SET_OPTIONS_ON_SERVICE_MUTATION,
  SET_REGIONS_ON_SERVICE_MUTATION,
} from "@/lib/graphql/documents/extras-2";
import { ServiceForm } from "./form";

export default function EditServicePage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(SERVICE_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.service) return <ErrorBlock message="Service not found." />;

  const s = data.service;
  return (
    <div className="space-y-6">
      <PageHeader title={s.name} description={`Service #${s.id}`} />
      <ServiceForm
        mode="edit"
        id={s.id}
        initialValues={{
          name: s.name,
          description: s.description ?? "",
          categoryId: s.categoryId,
          baseFare: String(s.baseFare),
          personCapacity: s.personCapacity != null ? String(s.personCapacity) : "",
          displayPriority: String(s.displayPriority),
          perHundredMeters: String(s.perHundredMeters),
          perMinuteDrive: String(s.perMinuteDrive),
          perMinuteWait: String(s.perMinuteWait),
          prepayPercent: String(s.prepayPercent),
          minimumFee: String(s.minimumFee),
          searchRadius: String(s.searchRadius),
          cancellationTotalFee: String(s.cancellationTotalFee),
          cancellationDriverShare: String(s.cancellationDriverShare),
          providerSharePercent: String(s.providerSharePercent),
          providerShareFlat: String(s.providerShareFlat),
          gstPercent: s.gstPercent != null ? String(s.gstPercent) : "",
          platformFee: s.platformFee != null ? String(s.platformFee) : "",
          paymentGatewayFee: s.paymentGatewayFee != null ? String(s.paymentGatewayFee) : "",
          paymentMethod:
            s.paymentMethod === "CashCredit"
              ? "Both"
              : s.paymentMethod === "OnlyCredit"
                ? "OnlyOnline"
                : "OnlyCash",
          orderTypes: s.orderTypes as string[],
          mediaId: s.mediaId != null ? String(s.mediaId) : "",
        }}
        initialImageUrl={s.media?.address ?? undefined}
      />
      <ServiceBindings serviceId={s.id} />
    </div>
  );
}

function ServiceBindings({ serviceId }: { serviceId: string }) {
  const { data: bindings } = useQuery(SERVICE_BINDINGS_QUERY, { variables: { id: serviceId } });
  const { data: regionsData } = useQuery(REGIONS_LIST_QUERY, {
    variables: { paging: { limit: 100, offset: 0 }, sorting: [], filter: {} } as never,
  });
  const { data: optionsData } = useQuery(SERVICE_OPTIONS_LIST_QUERY, {
    variables: { sorting: [], filter: {} } as never,
  });

  if (!bindings?.service) return null;
  const regions = (regionsData?.regions.nodes ?? []) as { id: string; name: string }[];
  const options = (optionsData?.serviceOptions ?? []) as { id: string; name: string }[];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <RelationPicker
        title="Available regions"
        description="Regions where this service is offered."
        available={regions}
        selected={bindings.service.regions}
        setMutation={SET_REGIONS_ON_SERVICE_MUTATION}
        recordId={serviceId}
        refetchQueries={[{ query: SERVICE_BINDINGS_QUERY, variables: { id: serviceId } }]}
      />
      <div className="space-y-2">
        <div className="flex justify-end">
          <NewServiceOptionDialog />
        </div>
        <RelationPicker
          title="Service options"
          description="Add-ons riders can pick when requesting this service."
          available={options}
          selected={bindings.service.options}
          setMutation={SET_OPTIONS_ON_SERVICE_MUTATION}
          recordId={serviceId}
          refetchQueries={[{ query: SERVICE_BINDINGS_QUERY, variables: { id: serviceId } }]}
        />
      </div>
    </div>
  );
}
