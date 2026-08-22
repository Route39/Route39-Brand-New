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
import { SwitchField } from "@/components/forms/SwitchField";
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
  lastName: z.string().optional(),
  mobileNumber: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  status: z.string().optional(),
  countryIso: z.string().optional(),
  gender: z.string().optional(),
  isResident: z.boolean(),
  idNumber: z.string().optional(),
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
      lastName: "",
      mobileNumber: "",
      email: "",
      status: "Enabled",
      countryIso: "",
      gender: "",
      isResident: false,
      idNumber: "",
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
      lastName: values.lastName || null,
      mobileNumber: values.mobileNumber,
      email: values.email || null,
      status: values.status || null,
      countryIso: values.countryIso || null,
      gender: values.gender || null,
      isResident: values.isResident,
      idNumber: values.idNumber || null,
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
        <FormGrid>
          <Field label="First name" htmlFor="firstName">
            <Input id="firstName" {...register("firstName")} />
          </Field>
          <Field label="Last name" htmlFor="lastName">
            <Input id="lastName" {...register("lastName")} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Mobile number" htmlFor="mobileNumber" error={errors.mobileNumber?.message} required>
            <Input id="mobileNumber" {...register("mobileNumber")} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" {...register("email")} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Country (ISO2)" htmlFor="countryIso">
            <Input id="countryIso" {...register("countryIso")} placeholder="US" />
          </Field>
          <Field label="Gender" htmlFor="gender">
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select value={field.value || "__none__"} onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Not specified" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
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
        <Field
          label={mode === "create" ? "Password" : "New password (leave blank to keep current)"}
          htmlFor="password"
          error={(errors as { password?: { message?: string } }).password?.message}
          required={mode === "create"}
        >
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        </Field>
        <Controller
          control={control}
          name="isResident"
          render={({ field }) => (
            <SwitchField
              label="Resident"
              description="Marks the rider as a local resident for tax/regulation purposes."
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Field label="ID number" htmlFor="idNumber">
          <Input id="idNumber" {...register("idNumber")} />
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
