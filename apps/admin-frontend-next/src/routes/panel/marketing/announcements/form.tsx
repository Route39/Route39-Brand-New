import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/forms/Field";
import { FormActions, FormGrid, FormSection, FormShell } from "@/components/forms/FormShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ANNOUNCEMENTS_LIST_QUERY } from "@/lib/graphql/documents/marketing";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_ANNOUNCEMENT_MUTATION,
  DELETE_ANNOUNCEMENT_MUTATION,
  UPDATE_ANNOUNCEMENT_MUTATION,
} from "@/lib/graphql/documents/marketing-detail";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().optional(),
  userType: z.array(z.string()).min(1, "Pick at least one audience"),
  appType: z.string().optional(),
  startAt: z.string().optional(),
  expireAt: z.string().optional(),
});

type Values = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: Values;
}

const AUDIENCES = [
  { value: "Driver", label: "Driver" },
  { value: "Rider", label: "Rider" },
  { value: "Operator", label: "Operator" },
];

export function AnnouncementForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [
    {
      query: ANNOUNCEMENTS_LIST_QUERY,
      variables: { paging: { limit: 10, offset: 0 }, sorting: [], filter: {} } as never,
    },
  ];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? {
      title: "",
      description: "",
      url: "",
      userType: ["Rider"],
      appType: "Taxi",
      startAt: "",
      expireAt: "",
    },
  });

  const [createOne] = useMutation(CREATE_ANNOUNCEMENT_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_ANNOUNCEMENT_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_ANNOUNCEMENT_MUTATION, { refetchQueries });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const base = {
      title: values.title,
      description: values.description || null,
      url: values.url || null,
      userType: values.userType as never,
      appType: values.appType ? (values.appType as never) : null,
      startAt: values.startAt ? new Date(values.startAt).toISOString() : null,
      expireAt: values.expireAt ? new Date(values.expireAt).toISOString() : null,
    };
    try {
      if (mode === "create") {
        await createOne({ variables: { input: base as never } });
        toast.success("Announcement created");
      } else if (id) {
        await updateOne({
          variables: {
            id,
            input: { ...base, title: values.title } as never,
          },
        });
        toast.success("Announcement updated");
      }
      navigate("/marketing/announcements");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this announcement?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Announcement deleted");
      navigate("/marketing/announcements");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <FormShell onSubmit={onSubmit}>
      {submitError ? (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}
      <FormSection title="Message">
        <Field label="Title" htmlFor="title" error={errors.title?.message} required>
          <Input id="title" {...register("title")} />
        </Field>
        <Field label="Description" htmlFor="description">
          <Textarea id="description" rows={3} {...register("description")} />
        </Field>
        <Field label="URL" htmlFor="url" error={errors.url?.message}>
          <Input id="url" type="url" {...register("url")} />
        </Field>
      </FormSection>

      <FormSection title="Audience & schedule">
        <Field label="Audience" error={errors.userType?.message as string | undefined}>
          <Controller
            control={control}
            name="userType"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {AUDIENCES.map((o) => {
                  const checked = field.value.includes(o.value);
                  return (
                    <label
                      key={o.value}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-input/30 px-3 py-1.5"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          field.onChange(
                            v
                              ? [...field.value, o.value]
                              : field.value.filter((x: string) => x !== o.value),
                          )
                        }
                      />
                      <Label className="cursor-pointer text-sm font-normal">{o.label}</Label>
                    </label>
                  );
                })}
              </div>
            )}
          />
        </Field>
        <Field label="App" htmlFor="appType">
          <Controller
            control={control}
            name="appType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="appType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Taxi">Taxi</SelectItem>
                  <SelectItem value="Shop">Shop</SelectItem>
                  <SelectItem value="Parking">Parking</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <FormGrid>
          <Field label="Starts" htmlFor="startAt">
            <Input id="startAt" type="datetime-local" {...register("startAt")} />
          </Field>
          <Field label="Expires" htmlFor="expireAt">
            <Input id="expireAt" type="datetime-local" {...register("expireAt")} />
          </Field>
        </FormGrid>
      </FormSection>

      <FormActions>
        {mode === "edit" ? (
          <Button
            type="button"
            variant="ghost"
            className="mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size="sm" className="text-primary-foreground" /> : "Save"}
        </Button>
      </FormActions>
    </FormShell>
  );
}
