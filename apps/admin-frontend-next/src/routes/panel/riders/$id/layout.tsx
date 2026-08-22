import { useQuery } from "@apollo/client";
import { Pencil } from "lucide-react";
import { Link, Outlet, useParams } from "react-router-dom";

import { Avatar, DetailHeader } from "@/components/panel/DetailHeader";
import { SignOutEverywhereButton } from "@/components/panel/SignOutEverywhereButton";
import { TabNav } from "@/components/panel/TabNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { RIDER_DETAIL_QUERY } from "@/lib/graphql/documents/rider-detail";
import {
  RIDER_SESSIONS_QUERY,
  TERMINATE_CUSTOMER_LOGIN_SESSION_MUTATION,
} from "@/lib/graphql/documents/extras-2";
import { riderStatusVariant } from "@/lib/panel/status-styles";
import { formatName } from "@/lib/format";
import type { RiderDetailQuery } from "@/lib/graphql/__generated__/graphql";

export type RiderContext = { rider: RiderDetailQuery["rider"] };

export default function RiderDetailLayout() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(RIDER_DETAIL_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.rider) return <ErrorBlock message="Rider not found." />;

  const rider = data.rider;

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/riders"
        backLabel="All riders"
        avatar={
          <Avatar
            src={rider.media?.address}
            alt={formatName(rider)}
            fallback={`${rider.firstName?.[0] ?? ""}${rider.lastName?.[0] ?? ""}`}
          />
        }
        title={formatName(rider)}
        subtitle={
          <div className="flex items-center gap-3">
            <span>{rider.mobileNumber}</span>
            {rider.email ? <span>· {rider.email}</span> : null}
          </div>
        }
        badges={<Badge variant={riderStatusVariant(rider.status)}>{rider.status}</Badge>}
        actions={
          <div className="flex flex-wrap gap-2">
            <SignOutEverywhereButton
              sessionsQuery={RIDER_SESSIONS_QUERY}
              sessionsVariables={{ riderId: rider.id }}
              sessionsPath="customerSessions"
              terminateMutation={TERMINATE_CUSTOMER_LOGIN_SESSION_MUTATION}
              idVariable="sessionId"
            />
            <Button asChild variant="outline" size="sm">
              <Link to={`/riders/${rider.id}/edit`}>
                <Pencil className="size-3.5" />
                Edit
              </Link>
            </Button>
          </div>
        }
      />
      <TabNav
        tabs={[
          { to: "info", label: "Info" },
          { to: "addresses", label: "Addresses" },
          { to: "financials", label: "Financials" },
          { to: "orders", label: "Orders" },
        ]}
      />
      <Outlet context={{ rider } satisfies RiderContext} />
    </div>
  );
}
