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
import { MultiPolygonEditor, type LatLng } from "@/components/maps/PolygonEditor";
import { Spinner } from "@/components/ui/spinner";
import { SwitchField } from "@/components/forms/SwitchField";
import { FLEETS_LIST_QUERY } from "@/lib/graphql/documents/management";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_FLEET_MUTATION,
  DELETE_FLEET_MUTATION,
  UPDATE_FLEET_MUTATION,
} from "@/lib/graphql/documents/management-detail-2";

const baseShape = {
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(1, "Phone is required"),
  mobileNumber: z.string().min(1, "Mobile is required"),
  userName: z.string().min(1, "Username is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  commissionSharePercent: z.string(),
  commissionShareFlat: z.string(),
  feeMultiplier: z.string().optional(),
  address: z.string().optional(),
  isBlocked: z.boolean(),
  exclusivityAreas: z.array(
    z.array(z.object({ lat: z.number(), lng: z.number() })),
  ),
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

export function FleetForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [
    {
      query: FLEETS_LIST_QUERY,
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
      name: "",
      phoneNumber: "",
      mobileNumber: "",
      userName: "",
      accountNumber: "",
      commissionSharePercent: "10",
      commissionShareFlat: "0",
      feeMultiplier: "",
      address: "",
      isBlocked: false,
      password: "",
      exclusivityAreas: [],
      ...initialValues,
    },
  });

  const [createOne] = useMutation(CREATE_FLEET_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_FLEET_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_FLEET_MUTATION, { refetchQueries });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const exclusivityAreas = values.exclusivityAreas.filter((p) => p.length >= 3);
    const input: Record<string, unknown> = {
      name: values.name,
      phoneNumber: values.phoneNumber,
      mobileNumber: values.mobileNumber,
      userName: values.userName,
      accountNumber: values.accountNumber,
      commissionSharePercent: Number(values.commissionSharePercent),
      commissionShareFlat: Number(values.commissionShareFlat),
      feeMultiplier: values.feeMultiplier ? Number(values.feeMultiplier) : null,
      address: values.address || null,
      isBlocked: values.isBlocked,
      exclusivityAreas: exclusivityAreas.length > 0 ? exclusivityAreas : null,
    };
    if (values.password) input.password = values.password;
    try {
      if (mode === "create") {
        await createOne({ variables: { input: input as never } });
        toast.success("Fleet created");
      } else if (id) {
        await updateOne({ variables: { id, input: input as never } });
        toast.success("Fleet updated");
      }
      navigate("/management/fleets");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this fleet?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Fleet deleted");
      navigate("/management/fleets");
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

      <FormSection title="Fleet" description="Display name and contact details.">
        <FormGrid>
          <Field label="Name" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} />
          </Field>
          <Field label="Address" htmlFor="address">
            <Input id="address" {...register("address")} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Phone" htmlFor="phoneNumber" error={errors.phoneNumber?.message} required>
            <Input id="phoneNumber" {...register("phoneNumber")} />
          </Field>
          <Field label="Mobile" htmlFor="mobileNumber" error={errors.mobileNumber?.message} required>
            <Input id="mobileNumber" {...register("mobileNumber")} />
          </Field>
        </FormGrid>
        <Controller
          control={control}
          name="isBlocked"
          render={({ field }) => (
            <SwitchField
              label="Blocked"
              description="Prevents this fleet from operating."
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </FormSection>

      <FormSection title="Login" description="Credentials the fleet uses to sign in.">
        <FormGrid>
          <Field label="Username" htmlFor="userName" error={errors.userName?.message} required>
            <Input id="userName" {...register("userName")} />
          </Field>
          <Field
            label={mode === "create" ? "Password" : "New password (leave blank to keep current)"}
            htmlFor="password"
            error={(errors as { password?: { message?: string } }).password?.message}
            required={mode === "create"}
          >
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Commercials">
        <FormGrid>
          <Field
            label="Commission share %"
            htmlFor="commissionSharePercent"
            error={errors.commissionSharePercent?.message}
            required
          >
            <Input
              id="commissionSharePercent"
              type="number"
              step="0.01"
              {...register("commissionSharePercent")}
            />
          </Field>
          <Field
            label="Commission share (flat)"
            htmlFor="commissionShareFlat"
            error={errors.commissionShareFlat?.message}
            required
          >
            <Input id="commissionShareFlat" type="number" step="0.01" {...register("commissionShareFlat")} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Fee multiplier" htmlFor="feeMultiplier">
            <Input id="feeMultiplier" type="number" step="0.01" {...register("feeMultiplier")} />
          </Field>
          <Field label="Account number" htmlFor="accountNumber" error={errors.accountNumber?.message} required>
            <Input id="accountNumber" {...register("accountNumber")} />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Exclusivity areas"
        description="Optional geofences this fleet is the exclusive operator within. Leave empty to operate everywhere."
      >
        <Controller
          control={control}
          name="exclusivityAreas"
          render={({ field }) => (
            <MultiPolygonEditor
              value={field.value as LatLng[][]}
              onChange={field.onChange as (next: LatLng[][]) => void}
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
