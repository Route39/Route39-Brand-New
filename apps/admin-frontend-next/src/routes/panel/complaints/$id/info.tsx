import { Link, useOutletContext } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyValueList } from "@/components/panel/KeyValue";
import { formatDateTime, formatName } from "@/lib/format";
import type { ComplaintContext } from "./layout";

export default function ComplaintInfoTab() {
  const { complaint } = useOutletContext<ComplaintContext>();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Complaint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <KeyValueList
            items={[
              { label: "Subject", value: complaint.subject },
              { label: "Submitted", value: formatDateTime(complaint.inscriptionTimestamp) },
              { label: "Submitted by", value: complaint.requestedByDriver ? "Driver" : "Rider" },
              { label: "Status", value: complaint.status },
              {
                label: "Related order",
                value: (
                  <Link
                    to={`/requests/${complaint.requestId}`}
                    className="underline-offset-2 hover:underline"
                  >
                    #{complaint.requestId}
                  </Link>
                ),
              },
            ]}
          />
          {complaint.content ? (
            <div>
              <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground/80">
                Message
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap">{complaint.content}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned to</CardTitle>
        </CardHeader>
        <CardContent>
          {complaint.assignedToStaffs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Unassigned.</p>
          ) : (
            <ul className="space-y-1.5">
              {complaint.assignedToStaffs.map((s) => (
                <li key={s.id} className="text-sm">
                  {formatName(s)}{" "}
                  <span className="text-xs text-muted-foreground">@{s.userName}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
