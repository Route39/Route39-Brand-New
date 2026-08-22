import { useMutation, useQuery } from "@apollo/client";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/forms/Field";
import { Input } from "@/components/ui/input";
import { LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { useConfirm } from "@/providers/ConfirmProvider";
import { toast } from "sonner";
import {
  CREATE_SERVICE_CATEGORY_MUTATION,
  DELETE_SERVICE_CATEGORY_MUTATION,
  SERVICE_CATEGORIES_LIST_QUERY,
  UPDATE_SERVICE_CATEGORY_MUTATION,
} from "@/lib/graphql/documents/admin-actions";

export default function ServiceCategoriesPage() {
  const confirm = useConfirm();
  const { data, loading } = useQuery(SERVICE_CATEGORIES_LIST_QUERY, {
    variables: { filter: {}, sorting: [] } as never,
  });
  const refetchQueries = [
    { query: SERVICE_CATEGORIES_LIST_QUERY, variables: { filter: {}, sorting: [] } as never },
  ];

  const [createOne] = useMutation(CREATE_SERVICE_CATEGORY_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_SERVICE_CATEGORY_MUTATION, { refetchQueries });
  const [deleteOne] = useMutation(DELETE_SERVICE_CATEGORY_MUTATION, { refetchQueries });

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (loading && !data) return <LoadingBlock />;
  const items = data?.serviceCategories ?? [];

  async function handleCreate() {
    if (!draft.trim()) return;
    try {
      await createOne({ variables: { input: { name: draft.trim() } } });
      setDraft("");
      toast.success("Category created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function handleSave(id: string) {
    if (!editingName.trim()) return;
    try {
      await updateOne({ variables: { id, input: { name: editingName.trim() } } });
      setEditingId(null);
      toast.success("Category updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function handleDelete(id: string) {
    if (!(await confirm({ title: "Delete this category?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Service categories" description="Group services by category for the rider app." />

      <Card size="sm">
        <CardContent>
          <Field label="New category" htmlFor="newCategory">
            <div className="flex gap-2">
              <Input
                id="newCategory"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. Premium"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
              <Button type="button" onClick={handleCreate}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </Field>
        </CardContent>
      </Card>

      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {items.length === 0 ? (
          <li className="p-6 text-center text-sm text-muted-foreground">No categories yet.</li>
        ) : (
          items.map((c) => {
            const isEditing = editingId === c.id;
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                {isEditing ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave(c.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <Button type="button" size="sm" onClick={() => handleSave(c.id)}>
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-xs text-muted-foreground">#{c.id}</span>
                    <span className="flex-1 font-medium">{c.name}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditingName(c.name);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
