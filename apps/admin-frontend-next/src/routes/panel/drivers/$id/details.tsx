import { useQuery } from "@apollo/client";
import { useOutletContext } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DriverServicesActivation } from "@/components/panel/DriverServicesActivation";
import { KeyValueList } from "@/components/panel/KeyValue";
import { NotesSection } from "@/components/panel/NotesSection";
import { SinglePointMap } from "@/components/maps/SinglePointMap";
import {
  CREATE_DRIVER_NOTE_MUTATION,
  DRIVERS_LOCATION_QUERY,
  DRIVER_NOTES_QUERY,
} from "@/lib/graphql/documents/extras";
import { formatDateTime } from "@/lib/format";
import type { DriverContext } from "./layout";

export default function DriverDetailsTab() {
  const { driver } = useOutletContext<DriverContext>();

  const { data: notesData, loading: notesLoading, error: notesError } = useQuery(
    DRIVER_NOTES_QUERY,
    { variables: { driverId: driver.id } },
  );

  // Probe for the driver's last known location via the platform-wide search.
  // We pass a wide center (the platform default) and a high count; the backend
  // filters to drivers within range, including this one when online.
  const { data: locData } = useQuery(DRIVERS_LOCATION_QUERY, {
    variables: { center: { lat: 0, lng: 0 }, count: 200 },
  });
  const ownLocation = locData?.getDriversLocationWithData.find((d) => d.id === driver.id);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              { label: "First name", value: driver.firstName },
              { label: "Last name", value: driver.lastName },
              { label: "Mobile number", value: driver.mobileNumber },
              { label: "Email", value: driver.email },
              { label: "Country", value: driver.countryIso },
              { label: "Gender", value: driver.gender },
              { label: "Address", value: driver.address },
              { label: "Certificate", value: driver.certificateNumber },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              { label: "Status", value: driver.status },
              { label: "Rating", value: driver.rating != null ? `${driver.rating} (${driver.reviewCount})` : null },
              { label: "Registered", value: formatDateTime(driver.registrationTimestamp) },
              { label: "Last seen", value: formatDateTime(driver.lastSeenTimestamp) },
              { label: "Fleet", value: driver.fleetId },
              { label: "Can deliver", value: driver.canDeliver ? "Yes" : "No" },
              { label: "Max package size", value: driver.maxDeliveryPackageSize },
              { label: "Soft rejection note", value: driver.softRejectionNote },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Last known location</CardTitle>
        </CardHeader>
        <CardContent>
          {ownLocation ? (
            <div className="space-y-2">
              <SinglePointMap
                point={{
                  lat: ownLocation.location.lat,
                  lng: ownLocation.location.lng,
                }}
              />
              <p className="text-xs text-muted-foreground">
                Updated {formatDateTime(ownLocation.lastUpdatedAt)} ·{" "}
                <span className="font-mono">
                  {ownLocation.location.lat.toFixed(5)}, {ownLocation.location.lng.toFixed(5)}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Driver is offline — no recent location reported.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              { label: "Plate", value: driver.carPlate },
              { label: "Production year", value: driver.carProductionYear },
              { label: "Car ID", value: driver.carId },
              { label: "Color ID", value: driver.carColorId },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banking</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              { label: "Bank name", value: driver.bankName },
              { label: "Account number", value: driver.accountNumber },
              { label: "Routing number", value: driver.bankRoutingNumber },
              { label: "SWIFT", value: driver.bankSwift },
            ]}
          />
        </CardContent>
      </Card>

      <DriverServicesActivation driverId={driver.id} />

      <NotesSection
        title="Driver notes"
        notes={notesData?.driverNotes.nodes ?? []}
        loading={notesLoading}
        error={notesError}
        createMutation={CREATE_DRIVER_NOTE_MUTATION}
        buildVariables={(note) => ({ input: { driverId: driver.id, note } })}
        refetchQueries={[
          { query: DRIVER_NOTES_QUERY, variables: { driverId: driver.id } },
        ]}
      />
    </div>
  );
}
