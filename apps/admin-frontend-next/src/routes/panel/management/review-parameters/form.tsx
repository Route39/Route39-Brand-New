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
import { FormActions, FormSection, FormShell } from "@/components/forms/FormShell";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { SwitchField } from "@/components/forms/SwitchField";
import { REVIEW_PARAMETERS_LIST_QUERY } from "@/lib/graphql/documents/management";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_REVIEW_PARAMETER_MUTATION,
  DELETE_REVIEW_PARAMETER_MUTATION,
  UPDATE_REVIEW_PARAMETER_MUTATION,
} from "@/lib/graphql/documents/management-detail";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  isGood: z.boolean(),
});

type Values = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: Values;
}

export function ReviewParameterForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [
    {
      query: REVIEW_PARAMETERS_LIST_QUERY,
      variables: { sorting: [], filter: {} } as never,
    },
  ];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? { title: "", isGood: true },
  });

  const [createOne] = useMutation(CREATE_REVIEW_PARAMETER_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_REVIEW_PARAMETER_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_REVIEW_PARAMETER_MUTATION, {
    refetchQueries,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      if (mode === "create") {
        await createOne({ variables: { input: values } });
        toast.success("Parameter created");
      } else if (id) {
        await updateOne({ variables: { id, input: values } });
        toast.success("Parameter updated");
      }
      navigate("/management/review-parameters");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id) return;
    if (!(await confirm({ title: "Delete this parameter?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Parameter deleted");
      navigate("/management/review-parameters");
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
      <FormSection title="Parameter" description="A feedback chip riders can tap when rating their trip.">
        <Field label="Title" htmlFor="title" error={errors.title?.message} required>
          <Input id="title" {...register("title")} placeholder="e.g. Friendly driver" />
        </Field>
        <Controller
          control={control}
          name="isGood"
          render={({ field }) => (
            <SwitchField
              label="Positive sentiment"
              description="Show as a compliment chip when the rider rates 4–5 stars."
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
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
