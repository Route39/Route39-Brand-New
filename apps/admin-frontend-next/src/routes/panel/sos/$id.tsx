import { useMutation, useQuery } from "@apollo/client";
import { Send } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailHeader } from "@/components/panel/DetailHeader";
import { Input } from "@/components/ui/input";
import { KeyValueList } from "@/components/panel/KeyValue";
import { Label } from "@/components/ui/label";
import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SinglePointMap } from "@/components/maps/SinglePointMap";
import {
  CREATE_SOS_ACTIVITY_MUTATION,
  UPDATE_SOS_MUTATION,
} from "@/lib/graphql/documents/admin-actions";
import { SOS_DETAIL_QUERY } from "@/lib/graphql/documents/sos-detail";
import { sosStatusVariant } from "@/lib/panel/status-styles";
import { formatDateTime } from "@/lib/format";

const ACTION_OPTIONS = [
  { value: "Seen", label: "Mark as seen" },
  { value: "ContactDriver", label: "Contacted driver" },
  { value: "ContactAuthorities", label: "Contacted authorities" },
  { value: "MarkedAsResolved", label: "Mark as resolved" },
  { value: "MarkedAsFalseAlarm", label: "Mark as false alarm" },
];

export default function SosDetailPage() {
  const { id } = useParams();
  const { data, loading, error, refetch } = useQuery(SOS_DETAIL_QUERY, {
    variables: { id: id! },
    skip: !id,
  });
  const [updateSos] = useMutation(UPDATE_SOS_MUTATION, { onCompleted: () => refetch() });
  const [createActivity] = useMutation(CREATE_SOS_ACTIVITY_MUTATION, {
    onCompleted: () => refetch(),
  });

  const [action, setAction] = useState("Seen");
  const [note, setNote] = useState("");

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.distressSignal) return <ErrorBlock message="SOS signal not found." />;

  const sos = data.distressSignal;

  async function changeStatus(status: string) {
    try {
      await updateSos({ variables: { id: sos.id, status: status as never } });
      toast.success("Status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function logActivity() {
    try {
      await createActivity({
        variables: {
          input: { sosId: sos.id, action: action as never, note: note || null },
        },
      });
      setNote("");
      toast.success("Activity logged");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/sos"
        backLabel="All SOS"
        title={`SOS #${sos.id}`}
        subtitle={
          <div className="flex items-center gap-3">
            <span>{sos.submittedByRider ? "Submitted by rider" : "Submitted by driver"}</span>
            <span>·</span>
            <span>{formatDateTime(sos.createdAt)}</span>
          </div>
        }
        badges={<Badge variant={sosStatusVariant(sos.status)}>{sos.status}</Badge>}
        actions={
          <div className="flex flex-wrap gap-2">
            {sos.status !== "Resolved" ? (
              <Button type="button" variant="outline" size="sm" onClick={() => changeStatus("Resolved")}>
                Mark resolved
              </Button>
            ) : null}
            {sos.status !== "FalseAlarm" ? (
              <Button type="button" variant="outline" size="sm" onClick={() => changeStatus("FalseAlarm")}>
                False alarm
              </Button>
            ) : null}
            {sos.status !== "UnderReview" ? (
              <Button type="button" variant="outline" size="sm" onClick={() => changeStatus("UnderReview")}>
                Under review
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Signal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <KeyValueList
              items={[
                { label: "Reason", value: sos.reason?.name },
                { label: "Status", value: sos.status },
                { label: "Submitted", value: formatDateTime(sos.createdAt) },
                {
                  label: "Related order",
                  value: (
                    <Link to={`/requests/${sos.requestId}`} className="underline-offset-2 hover:underline">
                      #{sos.requestId}
                    </Link>
                  ),
                },
              ]}
            />
            {sos.comment ? (
              <div>
                <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground/80">
                  Comment
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap">{sos.comment}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            {sos.location ? (
              <div className="space-y-2">
                <SinglePointMap
                  point={{ lat: sos.location.lat, lng: sos.location.lng }}
                  label="!"
                />
                <p className="font-mono text-xs text-muted-foreground">
                  {sos.location.lat.toFixed(5)}, {sos.location.lng.toFixed(5)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No location reported.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sos.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ol className="space-y-3">
                {sos.activities.map((activity) => (
                  <li key={activity.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{activity.action}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(activity.createdAt)}
                      </span>
                    </div>
                    {activity.note ? (
                      <p className="text-sm whitespace-pre-wrap">{activity.note}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
            <div className="space-y-2 border-t border-border/60 pt-3">
              <Label className="text-xs">Log activity</Label>
              <div className="flex gap-2">
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note"
                />
                <Button type="button" onClick={logActivity}>
                  <Send className="size-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
