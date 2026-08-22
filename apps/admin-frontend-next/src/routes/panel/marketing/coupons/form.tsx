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
import { Spinner } from "@/components/ui/spinner";
import { SwitchField } from "@/components/forms/SwitchField";
import { Textarea } from "@/components/ui/textarea";
import { COUPONS_LIST_QUERY } from "@/lib/graphql/documents/marketing";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_COUPON_MUTATION,
  DELETE_COUPON_MUTATION,
  UPDATE_COUPON_MUTATION,
} from "@/lib/graphql/documents/marketing-detail";

const num = (msg: string) =>
  z.string().refine((v) => v.length > 0 && !Number.isNaN(Number(v)), msg);

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  manyUsersCanUse: num("Required"),
  manyTimesUserCanUse: num("Required"),
  minimumCost: num("Required"),
  maximumCost: num("Required"),
  startAt: z.string().min(1, "Required"),
  expireAt: z.string().min(1, "Required"),
  discountPercent: num("Required"),
  discountFlat: num("Required"),
  creditGift: num("Required"),
  isEnabled: z.boolean(),
  isFirstTravelOnly: z.boolean(),
});

type Values = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: Values;
}

export function CouponForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [
    {
      query: COUPONS_LIST_QUERY,
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
      code: "",
      title: "",
      description: "",
      manyUsersCanUse: "100",
      manyTimesUserCanUse: "1",
      minimumCost: "0",
      maximumCost: "0",
      startAt: new Date().toISOString().slice(0, 16),
      expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      discountPercent: "0",
      discountFlat: "0",
      creditGift: "0",
      isEnabled: true,
      isFirstTravelOnly: false,
    },
  });

  const [createOne] = useMutation(CREATE_COUPON_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_COUPON_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_COUPON_MUTATION, { refetchQueries });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const input = {
      code: values.code,
      title: values.title,
      description: values.description,
      manyUsersCanUse: Number(values.manyUsersCanUse),
      manyTimesUserCanUse: Number(values.manyTimesUserCanUse),
      minimumCost: Number(values.minimumCost),
      maximumCost: Number(values.maximumCost),
      startAt: new Date(values.startAt).toISOString(),
      expireAt: new Date(values.expireAt).toISOString(),
      discountPercent: Number(values.discountPercent),
      discountFlat: Number(values.discountFlat),
      creditGift: Number(values.creditGift),
      isEnabled: values.isEnabled,
      isFirstTravelOnly: values.isFirstTravelOnly,
    };
    try {
      if (mode === "create") {
        await createOne({ variables: { input } });
        toast.success("Coupon created");
      } else if (id) {
        await updateOne({ variables: { id, input } });
        toast.success("Coupon updated");
      }
      navigate("/marketing/coupons");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this coupon?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Coupon deleted");
      navigate("/marketing/coupons");
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
      <FormSection title="Coupon">
        <FormGrid>
          <Field label="Code" htmlFor="code" error={errors.code?.message} required>
            <Input id="code" {...register("code")} placeholder="SUMMER25" />
          </Field>
          <Field label="Title" htmlFor="title" error={errors.title?.message} required>
            <Input id="title" {...register("title")} />
          </Field>
        </FormGrid>
        <Field label="Description" htmlFor="description" error={errors.description?.message} required>
          <Textarea id="description" rows={2} {...register("description")} />
        </Field>
      </FormSection>

      <FormSection title="Discount">
        <FormGrid>
          <Field label="Discount %" htmlFor="discountPercent" error={errors.discountPercent?.message} required>
            <Input id="discountPercent" type="number" {...register("discountPercent")} />
          </Field>
          <Field label="Discount flat" htmlFor="discountFlat" error={errors.discountFlat?.message} required>
            <Input id="discountFlat" type="number" {...register("discountFlat")} />
          </Field>
          <Field label="Credit gift" htmlFor="creditGift" error={errors.creditGift?.message} required>
            <Input id="creditGift" type="number" step="0.01" {...register("creditGift")} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Minimum cost" htmlFor="minimumCost" error={errors.minimumCost?.message} required>
            <Input id="minimumCost" type="number" step="0.01" {...register("minimumCost")} />
          </Field>
          <Field label="Maximum cost" htmlFor="maximumCost" error={errors.maximumCost?.message} required>
            <Input id="maximumCost" type="number" step="0.01" {...register("maximumCost")} />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Limits & schedule">
        <FormGrid>
          <Field label="Total uses" htmlFor="manyUsersCanUse" error={errors.manyUsersCanUse?.message} required>
            <Input id="manyUsersCanUse" type="number" {...register("manyUsersCanUse")} />
          </Field>
          <Field label="Uses per user" htmlFor="manyTimesUserCanUse" error={errors.manyTimesUserCanUse?.message} required>
            <Input id="manyTimesUserCanUse" type="number" {...register("manyTimesUserCanUse")} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Starts" htmlFor="startAt" error={errors.startAt?.message} required>
            <Input id="startAt" type="datetime-local" {...register("startAt")} />
          </Field>
          <Field label="Expires" htmlFor="expireAt" error={errors.expireAt?.message} required>
            <Input id="expireAt" type="datetime-local" {...register("expireAt")} />
          </Field>
        </FormGrid>
        <Controller
          control={control}
          name="isEnabled"
          render={({ field }) => (
            <SwitchField label="Enabled" checked={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="isFirstTravelOnly"
          render={({ field }) => (
            <SwitchField
              label="First-trip-only"
              description="Only riders who have not yet completed a trip can redeem."
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
