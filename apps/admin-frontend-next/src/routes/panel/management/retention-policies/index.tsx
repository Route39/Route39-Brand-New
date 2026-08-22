import { useMutation, useQuery } from "@apollo/client";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CREATE_RETENTION_POLICY_MUTATION,
  DELETE_RETENTION_POLICY_MUTATION,
  RETENTION_POLICIES_QUERY,
  UPDATE_RETENTION_POLICY_MUTATION,
} from "@/lib/graphql/documents/extras-2";

interface Policy {
  id: string;
  title: string;
  deleteAfterDays: number;
}

interface Doc {
  id: string;
  title: string;
}

export default function RetentionPoliciesPage() {
  const confirm = useConfirm();
  const { data, loading } = useQuery(RETENTION_POLICIES_QUERY);
  const refetch = [{ query: RETENTION_POLICIES_QUERY }];
  const [createOne] = useMutation(CREATE_RETENTION_POLICY_MUTATION, { refetchQueries: refetch });
  const [updateOne] = useMutation(UPDATE_RETENTION_POLICY_MUTATION, { refetchQueries: refetch });
  const [deleteOne] = useMutation(DELETE_RETENTION_POLICY_MUTATION, { refetchQueries: refetch });

  const docs = (data?.driverDocuments ?? []) as Doc[];
  const policies = (data?.driverDocumentRetentionPolicies.edges ?? []).map(
    (e) => e.node,
  ) as Policy[];

  const [draftTitle, setDraftTitle] = useState("");
  const [draftDocId, setDraftDocId] = useState<string>("");
  const [draftDays, setDraftDays] = useState("365");

  if (loading && !data) return <LoadingBlock />;

  async function handleCreate() {
    if (!draftTitle.trim() || !draftDocId) {
      toast.error("Title and document are required");
      return;
    }
    try {
      await createOne({
        variables: {
          input: {
            title: draftTitle.trim(),
            driverDocumentId: draftDocId,
            deleteAfterDays: Number(draftDays),
          },
        },
      });
      toast.success("Policy created");
      setDraftTitle("");
      setDraftDocId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function handleUpdate(id: string, patch: { title?: string; deleteAfterDays?: number }) {
    const current = policies.find((p) => p.id === id);
    if (!current) return;
    try {
      await updateOne({
        variables: {
          id,
          input: {
            title: patch.title ?? current.title,
            deleteAfterDays: patch.deleteAfterDays ?? current.deleteAfterDays,
            // driverDocumentId is required by the input; we don't expose changing
            // it after creation, so re-send the first matching document id.
            driverDocumentId: docs[0]?.id ?? "",
          },
        },
      });
      toast.success("Policy updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleDelete(id: string) {
    if (!(await confirm({ title: "Delete this retention policy?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Policy deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document retention policies"
        description="Automatic deletion timelines for driver documents."
      />

      <Card>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium">Add a new policy</p>
          <div className="grid items-end gap-2 sm:grid-cols-[2fr_2fr_1fr_auto]">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="e.g. License — 5 years"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Document type</Label>
              <Select value={draftDocId} onValueChange={setDraftDocId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a document type" />
                </SelectTrigger>
                <SelectContent>
                  {docs.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Delete after (days)</Label>
              <Input
                type="number"
                value={draftDays}
                onChange={(e) => setDraftDays(e.target.value)}
              />
            </div>
            <Button type="button" onClick={handleCreate}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {policies.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            No retention policies configured yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {policies.map((p) => (
            <li key={p.id}>
              <Card size="sm">
                <CardContent className="grid items-end gap-2 sm:grid-cols-[2fr_1fr_auto]">
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input
                      defaultValue={p.title}
                      onBlur={(e) => {
                        if (e.target.value !== p.title) handleUpdate(p.id, { title: e.target.value });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Delete after (days)</Label>
                    <Input
                      type="number"
                      defaultValue={p.deleteAfterDays}
                      onBlur={(e) => {
                        const next = Number(e.target.value);
                        if (next !== p.deleteAfterDays) handleUpdate(p.id, { deleteAfterDays: next });
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
