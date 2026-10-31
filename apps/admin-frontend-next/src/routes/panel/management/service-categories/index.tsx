import { useMutation, useQuery } from "@apollo/client";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/forms/Field";
import { Input } from "@/components/ui/input";
import { LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { useConfirm } from "@/providers/ConfirmProvider";
import { adminUploadMedia, mediaUrl } from "@/lib/admin-upload";
import {
  CREATE_SERVICE_CATEGORY_MUTATION,
  DELETE_SERVICE_CATEGORY_MUTATION,
  SERVICE_CATEGORIES_LIST_QUERY,
  UPDATE_SERVICE_CATEGORY_MUTATION,
} from "@/lib/graphql/documents/admin-actions";
import { SERVICE_CATEGORIES_QUERY } from "@/lib/graphql/documents/management-detail-2";

type Draft = {
  id: string | null;
  name: string;
  description: string;
  displayPriority: string;
  isEnabled: boolean;
  mediaId: string | null;
  imageUrl: string | null;
};

const EMPTY: Draft = {
  id: null,
  name: "",
  description: "",
  displayPriority: "0",
  isEnabled: true,
  mediaId: null,
  imageUrl: null,
};

export default function ServiceCategoriesPage() {
  const confirm = useConfirm();
  const { data, loading } = useQuery(SERVICE_CATEGORIES_LIST_QUERY, {
    variables: { filter: {}, sorting: [] } as never,
  });
  const refetchQueries = [
    { query: SERVICE_CATEGORIES_LIST_QUERY, variables: { filter: {}, sorting: [] } as never },
    { query: SERVICE_CATEGORIES_QUERY },
  ];

  const [createOne] = useMutation(CREATE_SERVICE_CATEGORY_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_SERVICE_CATEGORY_MUTATION, { refetchQueries });
  const [deleteOne] = useMutation(DELETE_SERVICE_CATEGORY_MUTATION, { refetchQueries });

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (loading && !data) return <LoadingBlock />;
  const items = [...(data?.serviceCategories ?? [])].sort(
    (a, b) => (a.displayPriority ?? 0) - (b.displayPriority ?? 0),
  );

  async function handleFile(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const m = await adminUploadMedia(file, {});
      setDraft((d) => ({ ...d, mediaId: m.id, imageUrl: m.address }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    const name = draft.name.trim();
    if (!name) {
      toast.error("Category name is required");
      return;
    }
    const input = {
      name,
      description: draft.description.trim() || null,
      displayPriority: Number(draft.displayPriority) || 0,
      isEnabled: draft.isEnabled,
      mediaId: draft.mediaId,
    };
    setSaving(true);
    try {
      if (draft.id) {
        await updateOne({ variables: { id: draft.id, input } as never });
        toast.success("Category updated");
      } else {
        await createOne({ variables: { input } as never });
        toast.success("Category created");
      }
      setDraft(EMPTY);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c: (typeof items)[number]) {
    setDraft({
      id: c.id,
      name: c.name,
      description: c.description ?? "",
      displayPriority: String(c.displayPriority ?? 0),
      isEnabled: c.isEnabled ?? true,
      mediaId: c.mediaId ?? null,
      imageUrl: c.media?.address ?? null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string, name: string) {
    if (
      !(await confirm({
        title: `Delete category "${name}"?`,
        description: "Services in it will be uncategorized.",
        actionLabel: "Delete",
        destructive: true,
      }))
    )
      return;
    try {
      await deleteOne({ variables: { id } });
      if (draft.id === id) setDraft(EMPTY);
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service categories"
        description="Categories shown on the rider app home screen (e.g. Auto, VinFast Car, Cargo). Lower display order shows first."
      />

      <Card size="sm">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{draft.id ? `Edit category #${draft.id}` : "New category"}</h3>
            {draft.id ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => setDraft(EMPTY)}>
                <X className="size-4" />
                Cancel edit
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex size-28 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 hover:bg-muted/60"
              >
                {draft.imageUrl ? (
                  <img src={mediaUrl(draft.imageUrl)} alt="" className="size-full object-contain" />
                ) : (
                  <ImagePlus className="size-8 text-muted-foreground" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <span className="text-xs text-muted-foreground">
                {uploading ? "Uploading..." : draft.imageUrl ? "Click to change" : "Upload image"}
              </span>
              {draft.imageUrl ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() => setDraft((d) => ({ ...d, mediaId: null, imageUrl: null }))}
                >
                  Remove image
                </Button>
              ) : null}
            </div>

            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <Field label="Name" htmlFor="catName">
                <Input
                  id="catName"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. Auto"
                />
              </Field>
              <Field label="Display order" htmlFor="catOrder">
                <Input
                  id="catOrder"
                  type="number"
                  value={draft.displayPriority}
                  onChange={(e) => setDraft((d) => ({ ...d, displayPriority: e.target.value }))}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description" htmlFor="catDesc">
                  <Input
                    id="catDesc"
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    placeholder="e.g. Affordable everyday rides"
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draft.isEnabled}
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, isEnabled: v === true }))}
                />
                Show in rider app
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={handleSave} disabled={saving || uploading}>
              {draft.id ? <Pencil className="size-4" /> : <Plus className="size-4" />}
              {draft.id ? "Save changes" : "Add category"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {items.length === 0 ? (
          <li className="p-6 text-center text-sm text-muted-foreground">No categories yet.</li>
        ) : (
          items.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30">
                {c.media?.address ? (
                  <img src={mediaUrl(c.media.address)} alt="" className="size-full object-contain" />
                ) : (
                  <ImagePlus className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">#{c.id}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      c.isEnabled ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.isEnabled ? "LIVE" : "HIDDEN"}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  Order {c.displayPriority ?? 0}
                  {c.description ? ` · ${c.description}` : ""}
                  
                </p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => startEdit(c)}>
                Edit
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleDelete(c.id, c.name)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
