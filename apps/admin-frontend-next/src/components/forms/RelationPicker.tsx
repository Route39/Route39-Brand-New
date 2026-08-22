import { useMutation } from "@apollo/client";
import type { DocumentNode } from "@apollo/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

interface RelationPickerProps {
  title: string;
  description?: string;
  /** All available items the user can pick from. */
  available: { id: string; name: string }[];
  /** Items currently selected (from server). */
  selected: { id: string; name: string }[];
  /** Mutation that replaces the relation set: `set*OnRecord(input: { id, relationIds })`. */
  setMutation: DocumentNode;
  /** ID of the record being edited (passed as `$id` to the mutation). */
  recordId: string;
  refetchQueries?: { query: DocumentNode; variables?: Record<string, unknown> }[];
}

/**
 * Multi-select binding editor that uses `set*` mutations to replace the entire
 * relation set. Tracks local dirty state and only writes on Save.
 */
export function RelationPicker({
  title,
  description,
  available,
  selected,
  setMutation,
  recordId,
  refetchQueries,
}: RelationPickerProps) {
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(selected.map((s) => s.id)),
  );

  // Keep local state in sync if the server payload changes (e.g. after refetch).
  useEffect(() => {
    setPicked(new Set(selected.map((s) => s.id)));
  }, [selected]);

  const [save, { loading }] = useMutation(setMutation, { refetchQueries });

  const initial = new Set(selected.map((s) => s.id));
  const isDirty =
    picked.size !== initial.size || [...picked].some((id) => !initial.has(id));

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    try {
      await save({ variables: { id: recordId, relationIds: [...picked] } });
      toast.success(`${title} saved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items available to pick.</p>
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2">
            {available.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40">
                  <Checkbox
                    checked={picked.has(item.id)}
                    onCheckedChange={() => toggle(item.id)}
                  />
                  <Label className="cursor-pointer text-sm font-normal">{item.name}</Label>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || loading}
          >
            {loading ? <Spinner size="sm" className="text-primary-foreground" /> : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
