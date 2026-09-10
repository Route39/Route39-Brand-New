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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
//import { SwitchField } from "@/components/forms/SwitchField";
import { RIDERS_LIST_QUERY } from "@/lib/graphql/documents/riders";
import {
  CREATE_RIDER_MUTATION,
  DELETE_RIDER_MUTATION,
  UPDATE_RIDER_MUTATION,
} from "@/lib/graphql/documents/management-detail-2";
import { RIDER_STATUS_OPTIONS } from "@/lib/panel/enum-options";
import { useConfirm } from "@/providers/ConfirmProvider";

const baseShape = {
  firstName: z.string().optional(),
  mobileNumber: z.string().min(1, "Phone is required"),
  status: z.string().optional(),
};

const createSchema = z.object({
  ...baseShape,
  password: z.string().min(6, "Password must be 6+ characters"),
});

const editSchema = z.object({
  ...baseShape,
  password: z.string().optional(),
});

type Values = z.infer<typeof createSchema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: Partial<Values>;
}

export function RiderForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [
    {
      query: RIDERS_LIST_QUERY,
      variables: { paging: { limit: 10, offset: 0 }, sorting: [], filter: {} } as never,
    },
  ];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(mode === "create" ? createSchema : editSchema) as never,
    defaultValues: {
      firstName: "",
      mobileNumber: "",
      status: "Enabled",
      password: "",
      ...initialValues,
    },
  });

  const [createOne] = useMutation(CREATE_RIDER_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_RIDER_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_RIDER_MUTATION, { refetchQueries });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const input: Record<string, unknown> = {
      firstName: values.firstName || null,
      mobileNumber: values.mobileNumber,
      status: values.status || null,
    };
    if (values.password) input.password = values.password;
    try {
      if (mode === "create") {
        const { data: created } = await createOne({ variables: { input } });
        toast.success("Rider created");
        const newId = created?.createOneRider.id;
        navigate(newId ? `/riders/${newId}` : "/riders");
        return;
      } else if (id) {
        await updateOne({ variables: { id, input } });
        toast.success("Rider updated");
        navigate(`/riders/${id}`);
        return;
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this rider?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Rider deleted");
      navigate("/riders");
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

      <FormSection title="Profile">
        <FormGrid cols={1}>
          <Field label="First name" htmlFor="firstName">
            <Input id="firstName" {...register("firstName")} />
          </Field>
        </FormGrid>
        <FormGrid cols={1}>
          <Field label="Mobile number" htmlFor="mobileNumber" error={errors.mobileNumber?.message} required>
            <Input id="mobileNumber" {...register("mobileNumber")} />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Account">
        <Field label="Status" htmlFor="status">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RIDER_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        {mode === "create" ? (
          <Field
            label="Password"
            htmlFor="password"
            error={(errors as { password?: { message?: string } }).password?.message}
            required
          >
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          </Field>
        ) : null}
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
