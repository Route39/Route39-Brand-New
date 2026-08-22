import { useQuery } from "@apollo/client";
import { useOutletContext } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyValueList } from "@/components/panel/KeyValue";
import { NotesSection } from "@/components/panel/NotesSection";
import {
  CREATE_CUSTOMER_NOTE_MUTATION,
  CUSTOMER_NOTES_QUERY,
} from "@/lib/graphql/documents/extras";
import { formatDateTime } from "@/lib/format";
import type { RiderContext } from "./layout";

export default function RiderInfoTab() {
  const { rider } = useOutletContext<RiderContext>();

  const { data: notesData, loading: notesLoading, error: notesError } = useQuery(
    CUSTOMER_NOTES_QUERY,
    { variables: { customerId: rider.id } },
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              { label: "First name", value: rider.firstName },
              { label: "Last name", value: rider.lastName },
              { label: "Mobile number", value: rider.mobileNumber },
              { label: "Email", value: rider.email },
              { label: "Country", value: rider.countryIso },
              { label: "Gender", value: rider.gender },
              { label: "Resident", value: rider.isResident ? "Yes" : "No" },
              { label: "ID number", value: rider.idNumber },
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
              { label: "Status", value: rider.status },
              {
                label: "Rating",
                value:
                  rider.ratingAggregate?.rating != null
                    ? `${rider.ratingAggregate.rating} (${rider.ratingAggregate.reviewCount})`
                    : null,
              },
              { label: "Registered", value: formatDateTime(rider.registrationTimestamp) },
              { label: "Last activity", value: formatDateTime(rider.lastActivityAt) },
            ]}
          />
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <NotesSection
          title="Rider notes"
          notes={notesData?.customerNotes ?? []}
          loading={notesLoading}
          error={notesError}
          createMutation={CREATE_CUSTOMER_NOTE_MUTATION}
          buildVariables={(note) => ({ input: { customerId: rider.id, note } })}
          refetchQueries={[
            { query: CUSTOMER_NOTES_QUERY, variables: { customerId: rider.id } },
          ]}
        />
      </div>
    </div>
  );
}
