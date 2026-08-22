import { useMutation } from "@apollo/client";
import type { ApolloError, DocumentNode } from "@apollo/client";
import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatName } from "@/lib/format";

interface NoteRow {
  id: string;
  createdAt: string;
  note: string;
  staff?: { firstName?: string | null; lastName?: string | null; userName?: string | null } | null;
  createdBy?: { firstName?: string | null; lastName?: string | null; userName?: string | null } | null;
}

interface NotesSectionProps {
  title?: string;
  notes: NoteRow[];
  loading?: boolean;
  error?: ApolloError;
  /** Mutation for creating a note. Variables receive `{ note }` plus whatever
   * `extraVariables` provides (e.g. `{ driverId }`). */
  createMutation: DocumentNode;
  buildVariables: (note: string) => Record<string, unknown>;
  /** GraphQL document(s) to refetch after a successful create. */
  refetchQueries: { query: DocumentNode; variables?: Record<string, unknown> }[];
}

export function NotesSection({
  title = "Notes",
  notes,
  loading,
  error,
  createMutation,
  buildVariables,
  refetchQueries,
}: NotesSectionProps) {
  const [draft, setDraft] = useState("");
  const [createNote, { loading: saving }] = useMutation(createMutation, { refetchQueries });

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    try {
      await createNote({ variables: buildVariables(trimmed) });
      setDraft("");
      toast.success("Note added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a note for the team…"
            rows={2}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving || !draft.trim()}
            >
              {saving ? (
                <Spinner size="sm" className="text-primary-foreground" />
              ) : (
                <>
                  <Send className="size-3.5" />
                  Add note
                </>
              )}
            </Button>
          </div>
        </div>

        {loading && notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading notes…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((n) => {
              const author = n.staff ?? n.createdBy ?? null;
              return (
                <li key={n.id} className="space-y-1 border-l-2 border-border pl-3">
                  <p className="text-sm whitespace-pre-wrap">{n.note}</p>
                  <p className="text-xs text-muted-foreground">
                    {author ? (
                      <>
                        {formatName(author)}
                        {author.userName ? <span> @{author.userName}</span> : null}
                        {" · "}
                      </>
                    ) : null}
                    {formatDateTime(n.createdAt)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
