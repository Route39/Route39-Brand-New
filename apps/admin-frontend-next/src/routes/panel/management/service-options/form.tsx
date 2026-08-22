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
import { Field } from "@/components/forms/Field";
import { FormActions, FormGrid, FormSection, FormShell } from "@/components/forms/FormShell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { SERVICE_OPTION_ICONS, SERVICE_OPTION_TYPES } from "@/lib/panel/enum-options";
import { SERVICE_OPTIONS_LIST_QUERY } from "@/lib/graphql/documents/management";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_SERVICE_OPTION_MUTATION,
  DELETE_SERVICE_OPTION_MUTATION,
  UPDATE_SERVICE_OPTION_MUTATION,
} from "@/lib/graphql/documents/management-detail";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Free", "Paid", "TwoWay"]),
  icon: z.string().min(1, "Icon is required"),
  additionalFee: z.string().optional(),
});

type Values = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: Values;
}

export function ServiceOptionForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [
    { query: SERVICE_OPTIONS_LIST_QUERY, variables: { sorting: [], filter: {} } as never },
  ];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? { name: "", type: "Free", icon: "Pet", additionalFee: "" },
  });

  const [createOne] = useMutation(CREATE_SERVICE_OPTION_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_SERVICE_OPTION_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_SERVICE_OPTION_MUTATION, {
    refetchQueries,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const fee = values.additionalFee?.trim();
    const input = {
      name: values.name,
      type: values.type,
      icon: values.icon as never,
      additionalFee: fee ? Number(fee) : null,
    };
    try {
      if (mode === "create") {
        await createOne({ variables: { input } });
        toast.success("Option created");
      } else if (id) {
        await updateOne({ variables: { id, input } });
        toast.success("Option updated");
      }
      navigate("/management/service-options");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this service option?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Option deleted");
      navigate("/management/service-options");
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
      <FormSection title="Option" description="An add-on offered alongside ride services.">
        <Field label="Name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" {...register("name")} placeholder="e.g. Pet friendly" />
        </Field>
        <FormGrid>
          <Field label="Type" htmlFor="type" error={errors.type?.message} required>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTION_TYPES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Icon" htmlFor="icon" error={errors.icon?.message} required>
            <Controller
              control={control}
              name="icon"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTION_ICONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FormGrid>
        <Field
          label="Additional fee"
          htmlFor="additionalFee"
          error={errors.additionalFee?.message}
        >
          <Input
            id="additionalFee"
            type="number"
            step="0.01"
            placeholder="Optional"
            {...register("additionalFee")}
          />
        </Field>
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
