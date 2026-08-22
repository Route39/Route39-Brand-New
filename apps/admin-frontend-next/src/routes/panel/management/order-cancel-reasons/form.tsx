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
import {
  FormActions,
  FormGrid,
  FormSection,
  FormShell,
} from "@/components/forms/FormShell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { SwitchField } from "@/components/forms/SwitchField";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_ORDER_CANCEL_REASON_MUTATION,
  DELETE_ORDER_CANCEL_REASON_MUTATION,
  ORDER_CANCEL_REASONS_LIST_QUERY,
  UPDATE_ORDER_CANCEL_REASON_MUTATION,
} from "@/lib/graphql/documents/management";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  isEnabled: z.boolean(),
  userType: z.enum(["Driver", "Rider", "Operator"]),
});

export type OrderCancelReasonFormValues = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: OrderCancelReasonFormValues;
}

export function OrderCancelReasonForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrderCancelReasonFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? {
      title: "",
      isEnabled: true,
      userType: "Rider",
    },
  });

  const [createOne] = useMutation(CREATE_ORDER_CANCEL_REASON_MUTATION, {
    refetchQueries: [{ query: ORDER_CANCEL_REASONS_LIST_QUERY }],
  });
  const [updateOne] = useMutation(UPDATE_ORDER_CANCEL_REASON_MUTATION, {
    refetchQueries: [{ query: ORDER_CANCEL_REASONS_LIST_QUERY }],
  });
  const [deleteOne, { loading: deleting }] = useMutation(
    DELETE_ORDER_CANCEL_REASON_MUTATION,
    { refetchQueries: [{ query: ORDER_CANCEL_REASONS_LIST_QUERY }] },
  );

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      if (mode === "create") {
        await createOne({ variables: { input: values } });
        toast.success("Cancel reason created");
      } else if (id) {
        await updateOne({ variables: { id, input: values } });
        toast.success("Cancel reason updated");
      }
      navigate("/management/order-cancel-reasons");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id) return;
    if (!(await confirm({ title: "Delete this cancel reason?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Cancel reason deleted");
      navigate("/management/order-cancel-reasons");
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

      <FormSection
        title="Reason details"
        description="Shown to riders or drivers when cancelling an order."
      >
        <Field label="Title" htmlFor="title" error={errors.title?.message} required>
          <Input id="title" {...register("title")} placeholder="e.g. Driver took too long" />
        </Field>
        <FormGrid>
          <Field label="Audience" htmlFor="userType" error={errors.userType?.message} required>
            <Controller
              control={control}
              name="userType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="userType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rider">Rider</SelectItem>
                    <SelectItem value="Driver">Driver</SelectItem>
                    <SelectItem value="Operator">Operator</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Controller
            control={control}
            name="isEnabled"
            render={({ field }) => (
              <SwitchField
                label="Enabled"
                description="Show this reason in the cancel flow."
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
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
