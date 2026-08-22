import { useApolloClient, useMutation } from "@apollo/client";
import { ArrowRight, Send } from "lucide-react";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyBlock } from "@/components/panel/StateBlock";
import {
  ADD_COMPLAINT_COMMENT_MUTATION,
  CHANGE_COMPLAINT_STATUS_MUTATION,
} from "@/lib/graphql/documents/admin-actions";
import { COMPLAINT_DETAIL_QUERY } from "@/lib/graphql/documents/complaint-detail";
import { complaintStatusVariant } from "@/lib/panel/status-styles";
import { formatDateTime, formatName } from "@/lib/format";
import type { ComplaintContext } from "./layout";

const STATUS_OPTIONS = [
  { value: "Submitted", label: "Submitted" },
  { value: "UnderInvestigation", label: "Under investigation" },
  { value: "Resolved", label: "Resolved" },
];

export default function ComplaintRecordsTab() {
  const { complaint } = useOutletContext<ComplaintContext>();
  const apollo = useApolloClient();
  const refetchQueries = [
    { query: COMPLAINT_DETAIL_QUERY, variables: { id: complaint.id } },
  ];
  const [addComment] = useMutation(ADD_COMPLAINT_COMMENT_MUTATION, { refetchQueries });
  const [changeStatus] = useMutation(CHANGE_COMPLAINT_STATUS_MUTATION, { refetchQueries });

  const [comment, setComment] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string>(complaint.status);
  const activities = complaint.activities;

  async function handleComment() {
    if (!comment.trim()) return;
    try {
      await addComment({
        variables: { input: { supportRequestId: complaint.id, comment: comment.trim() } },
      });
      setComment("");
      toast.success("Comment added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function handleStatus() {
    if (pendingStatus === complaint.status) return;
    try {
      await changeStatus({
        variables: { input: { supportRequestId: complaint.id, status: pendingStatus as never } },
      });
      toast.success("Status updated");
      await apollo.refetchQueries({ include: [COMPLAINT_DETAIL_QUERY] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div>
              <Label className="text-xs">Change status</Label>
              <Select value={pendingStatus} onValueChange={setPendingStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              onClick={handleStatus}
              disabled={pendingStatus === complaint.status}
              className="self-end"
            >
              Update
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div>
              <Label className="text-xs">Add comment</Label>
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Investigation note…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleComment();
                  }
                }}
              />
            </div>
            <Button type="button" onClick={handleComment} disabled={!comment.trim()} className="self-end">
              <Send className="size-3.5" />
              Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      {activities.length === 0 ? (
        <EmptyBlock
          title="No activity yet"
          description="Investigation activity will appear here as it happens."
        />
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity.id} size="sm">
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Badge variant="outline">{activity.type}</Badge>
                      {activity.statusFrom && activity.statusTo ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Badge variant={complaintStatusVariant(activity.statusFrom)}>
                            {activity.statusFrom}
                          </Badge>
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <Badge variant={complaintStatusVariant(activity.statusTo)}>
                            {activity.statusTo}
                          </Badge>
                        </div>
                      ) : null}
                    </div>
                    {activity.comment ? (
                      <p className="text-sm whitespace-pre-wrap">{activity.comment}</p>
                    ) : null}
                    {activity.actor ? (
                      <p className="text-xs text-muted-foreground">
                        by {formatName(activity.actor)} <span>@{activity.actor.userName}</span>
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(activity.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
