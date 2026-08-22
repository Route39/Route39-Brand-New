import { useQuery } from "@apollo/client";
import { ClipboardCheck, Pencil } from "lucide-react";
import { Link, Outlet, useParams } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, DetailHeader } from "@/components/panel/DetailHeader";
import { SignOutEverywhereButton } from "@/components/panel/SignOutEverywhereButton";
import { TabNav } from "@/components/panel/TabNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { DRIVER_DETAIL_QUERY } from "@/lib/graphql/documents/driver-detail";
import {
  DRIVER_SESSIONS_QUERY,
  TERMINATE_DRIVER_LOGIN_SESSION_MUTATION,
} from "@/lib/graphql/documents/extras-2";
import { driverStatusVariant } from "@/lib/panel/status-styles";
import { formatName } from "@/lib/format";
import type { DriverDetailQuery } from "@/lib/graphql/__generated__/graphql";

export type DriverContext = { driver: DriverDetailQuery["driver"] };

export default function DriverDetailLayout() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(DRIVER_DETAIL_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.driver) return <ErrorBlock message="Driver not found." />;

  const driver = data.driver;

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/drivers"
        backLabel="All drivers"
        avatar={
          <Avatar
            src={driver.media?.address}
            alt={formatName(driver)}
            fallback={`${driver.firstName?.[0] ?? ""}${driver.lastName?.[0] ?? ""}`}
          />
        }
        title={formatName(driver)}
        subtitle={
          <div className="flex items-center gap-3">
            <span>{driver.mobileNumber}</span>
            {driver.email ? <span>· {driver.email}</span> : null}
          </div>
        }
        badges={
          <Badge variant={driverStatusVariant(driver.status)}>{driver.status}</Badge>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <SignOutEverywhereButton
              sessionsQuery={DRIVER_SESSIONS_QUERY}
              sessionsVariables={{ driverId: driver.id }}
              sessionsPath="driver.sessions"
              terminateMutation={TERMINATE_DRIVER_LOGIN_SESSION_MUTATION}
              idVariable="sessionId"
            />
            <Button asChild variant="outline" size="sm">
              <Link to={`/drivers/${driver.id}/edit`}>
                <Pencil className="size-3.5" />
                Edit
              </Link>
            </Button>
          </div>
        }
      />
      {driver.status === "PendingApproval" ||
      driver.status === "SoftReject" ||
      driver.status === "HardReject" ? (
        <Alert>
          <AlertDescription>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                This driver's application is{" "}
                <strong>
                  {driver.status === "PendingApproval"
                    ? "awaiting review"
                    : driver.status === "SoftReject"
                      ? "soft-rejected"
                      : "hard-rejected"}
                </strong>
                . Decisions are made on the dedicated review page.
              </span>
              <Button asChild size="sm">
                <Link to={`/drivers/${driver.id}/review`}>
                  <ClipboardCheck className="size-4" />
                  Open review
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}
      <TabNav
        tabs={[
          { to: "details", label: "Details" },
          { to: "orders", label: "Orders" },
          { to: "financial", label: "Financial" },
          { to: "reviews", label: "Reviews" },
          { to: "documents", label: "Documents" },
        ]}
      />
      <Outlet context={{ driver } satisfies DriverContext} />
    </div>
  );
}
