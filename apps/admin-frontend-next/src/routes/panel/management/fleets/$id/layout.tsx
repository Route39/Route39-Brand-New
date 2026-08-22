import { useQuery } from "@apollo/client";
import { Outlet, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { DetailHeader } from "@/components/panel/DetailHeader";
import { TabNav } from "@/components/panel/TabNav";
import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { FLEET_QUERY } from "@/lib/graphql/documents/management-detail-2";
import type { FleetQuery } from "@/lib/graphql/__generated__/graphql";

export type FleetContext = { fleet: FleetQuery["fleet"] };

export default function FleetDetailLayout() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(FLEET_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.fleet) return <ErrorBlock message="Fleet not found." />;

  const fleet = data.fleet;

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/management/fleets"
        backLabel="All fleets"
        title={fleet.name}
        subtitle={
          <div className="flex items-center gap-3">
            <span>{fleet.phoneNumber}</span>
            {fleet.userName ? <span>· @{fleet.userName}</span> : null}
          </div>
        }
        badges={
          <Badge variant={fleet.isBlocked ? "destructive" : "success"}>
            {fleet.isBlocked ? "Blocked" : "Active"}
          </Badge>
        }
      />
      <TabNav
        tabs={[
          { to: "details", label: "Details" },
          { to: "financials", label: "Financials" },
          { to: "zone-prices", label: "Zone prices" },
        ]}
      />
      <Outlet context={{ fleet } satisfies FleetContext} />
    </div>
  );
}
