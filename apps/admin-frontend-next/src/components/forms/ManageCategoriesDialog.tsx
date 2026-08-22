import { useMutation, useQuery } from "@apollo/client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  CREATE_SERVICE_CATEGORY_MUTATION,
  DELETE_SERVICE_CATEGORY_MUTATION,
  UPDATE_SERVICE_CATEGORY_MUTATION,
} from "@/lib/graphql/documents/admin-actions";
import { SERVICE_CATEGORIES_QUERY } from "@/lib/graphql/documents/management-detail-2";
import { SERVICES_LIST_QUERY } from "@/lib/graphql/documents/management";
import { useConfirm } from "@/providers/ConfirmProvider";

interface Props {
  trigger?: React.ReactNode;
}

export function ManageCategoriesDialog({ trigger }: Props) {
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);

  const { data, refetch } = useQuery(SERVICE_CATEGORIES_QUERY, { skip: !open });
  const categories = data?.serviceCategories ?? [];

  const refetchQueries = [
    { query: SERVICE_CATEGORIES_QUERY },
    { query: SERVICES_LIST_QUERY, variables: { sorting: [], filter: {} } as never },
  ];

  const [createOne, { loading: creating }] = useMutation(CREATE_SERVICE_CATEGORY_MUTATION, {
    refetchQueries,
  });
  const [updateOne] = useMutation(UPDATE_SERVICE_CATEGORY_MUTATION, { refetchQueries });
  const [deleteOne] = useMutation(DELETE_SERVICE_CATEGORY_MUTATION, { refetchQueries });

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    if (!open) {
      setNewName("");
      setEditingId(null);
      setEditingName("");
    }
  }, [open]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    try {
      await createOne({ variables: { input: { name } } });
      setNewName("");
      void refetch();
      toast.success("Category created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;
    try {
      await updateOne({ variables: { id: editingId, input: { name } } });
      setEditingId(null);
      setEditingName("");
      toast.success("Category updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!(await confirm({
      title: `Delete category "${name}"?`,
      description: "Services in it will be uncategorized.",
      actionLabel: "Delete",
      destructive: true,
    }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="sm">
            Manage categories
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Service categories</DialogTitle>
          <DialogDescription>
            Group services into categories. Tabs on the services list filter by category.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border">
            {categories.length === 0 ? (
              <li className="p-3 text-sm text-muted-foreground">No categories yet.</li>
            ) : (
              categories.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 border-b border-border/60 px-3 py-1.5 last:border-b-0"
                >
                  {editingId === c.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                      <Button type="button" size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate text-sm">{c.name}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditingName(c.name);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(c.id, c.name)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </li>
              ))
            )}
          </ul>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New category name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreate();
                }
              }}
            />
            <Button type="button" onClick={handleCreate} disabled={creating || !newName.trim()}>
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
