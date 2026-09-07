import { useMutation, useQuery } from "@apollo/client";
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
import { ORDER_TYPE_OPTIONS } from "@/lib/panel/enum-options";
import { SERVICES_LIST_QUERY } from "@/lib/graphql/documents/management";
import { getAccessToken } from "@/lib/auth/storage";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_SERVICE_MUTATION,
  DELETE_SERVICE_MUTATION,
  SERVICE_CATEGORIES_QUERY,
  UPDATE_SERVICE_MUTATION,
} from "@/lib/graphql/documents/management-detail-2";

const UPLOAD_URL = `${new URL((import.meta.env.VITE_API_URL as string) || "http://localhost:3004/graphql").origin}/upload`;
const numericString = (msg: string) =>
  z.string().refine((v) => v.length > 0 && !Number.isNaN(Number(v)), msg);

const optionalNumericString = (msg: string) =>
  z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), msg);

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  baseFare: numericString("Base fare is required"),
  personCapacity: z.string().optional(),
  displayPriority: z.string().optional(),
  perHundredMeters: numericString("Required"),
  perMinuteDrive: numericString("Required"),
  perMinuteWait: numericString("Required"),
  prepayPercent: numericString("Required"),
  minimumFee: numericString("Required"),
  searchRadius: numericString("Required"),
  cancellationTotalFee: numericString("Required"),
  cancellationDriverShare: numericString("Required"),
  providerSharePercent: numericString("Required"),
  providerShareFlat: numericString("Required"),
  gstPercent: optionalNumericString("Must be a number"),
  platformFee: optionalNumericString("Must be a number"),
  paymentGatewayFee: optionalNumericString("Must be a number"),
  paymentMethod: z.enum(["Both", "OnlyCash", "OnlyOnline"]),
  orderTypes: z.array(z.string()).min(1, "Pick at least one order type"),
  mediaId: z.string().min(1, "Image is required"),
});

type Values = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: Values;
  initialImageUrl?: string;
}

export function ServiceForm({ mode, id, initialValues, initialImageUrl }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(initialImageUrl);
  const [uploading, setUploading] = useState(false);
  const refetchQueries = [
    { query: SERVICES_LIST_QUERY, variables: { sorting: [], filter: {} } as never },
  ];

  const { data: catData } = useQuery(SERVICE_CATEGORIES_QUERY);
  const categories = catData?.serviceCategories ?? [];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? {
      name: "",
      description: "",
      categoryId: "",
      baseFare: "0",
      personCapacity: "4",
      displayPriority: "0",
      perHundredMeters: "0",
      perMinuteDrive: "0",
      perMinuteWait: "0",
      prepayPercent: "0",
      minimumFee: "0",
      searchRadius: "5000",
      cancellationTotalFee: "0",
      cancellationDriverShare: "0",
      providerSharePercent: "0",
      providerShareFlat: "0",
      gstPercent: "",
      platformFee: "",
      paymentGatewayFee: "",
      paymentMethod: "Both",
      orderTypes: ["Ride"],
      mediaId: "",
    },
  });

  const [createOne] = useMutation(CREATE_SERVICE_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_SERVICE_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_SERVICE_MUTATION, { refetchQueries });

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      toast.error("You can only upload a JPG or PNG file.");
      e.target.value = "";
      return;
    }
    if (file.size / 1024 / 1024 >= 2) {
      toast.error("Image must be smaller than 2MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` },
        body,
      });
      if (!res.ok) throw new Error("Upload failed");
      const media: { id: string; address: string } = await res.json();
      setValue("mediaId", media.id, { shouldValidate: true, shouldDirty: true });
      setImagePreview(media.address);
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const input = {
      name: values.name,
      description: values.description || null,
      categoryId: values.categoryId,
      baseFare: Number(values.baseFare),
      personCapacity: values.personCapacity ? Number(values.personCapacity) : null,
      displayPriority: values.displayPriority ? Number(values.displayPriority) : 0,
      perHundredMeters: Number(values.perHundredMeters),
      perMinuteDrive: Number(values.perMinuteDrive),
      perMinuteWait: Number(values.perMinuteWait),
      prepayPercent: Number(values.prepayPercent),
      minimumFee: Number(values.minimumFee),
      searchRadius: Number(values.searchRadius),
      cancellationTotalFee: Number(values.cancellationTotalFee),
      cancellationDriverShare: Number(values.cancellationDriverShare),
      providerSharePercent: Number(values.providerSharePercent),
      providerShareFlat: Number(values.providerShareFlat),
      gstPercent: values.gstPercent ? Number(values.gstPercent) : null,
      platformFee: values.platformFee ? Number(values.platformFee) : null,
      paymentGatewayFee: values.paymentGatewayFee ? Number(values.paymentGatewayFee) : null,
      paymentMethod: (values.paymentMethod === "Both" ? "CashCredit" : values.paymentMethod === "OnlyOnline" ? "OnlyCredit" : "OnlyCash") as never,
      orderTypes: values.orderTypes as never,
      twoWayAvailable: false,
      maximumDestinationDistance: 0,
      timeMultipliers: [],
      distanceMultipliers: [],
      weekdayMultipliers: [],
      dateRangeMultipliers: [],
      mediaId: Number(values.mediaId),
    };
    try {
      if (mode === "create") {
        await createOne({ variables: { input: input as never } });
        toast.success("Service created");
      } else if (id) {
        await updateOne({ variables: { id, input: input as never } });
        toast.success("Service updated");
      }
      navigate("/management/services");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this service?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Service deleted");
      navigate("/management/services");
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

      <FormSection title="Basics">
        <FormGrid>
          <Field label="Name" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} />
          </Field>
          <Field label="Category" htmlFor="categoryId" error={errors.categoryId?.message} required>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FormGrid>
        <Field label="Description" htmlFor="description">
          <Textarea id="description" rows={2} {...register("description")} />
        </Field>
        <Field label="Image" htmlFor="image" error={errors.mediaId?.message} required>
          <div className="flex items-center gap-3">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt=""
                className="size-14 rounded-md border border-border object-cover"
              />
            ) : null}
            <Input id="image" type="file" accept="image/png,image/jpeg" onChange={handleImageChange} />
            {uploading ? <Spinner size="sm" /> : null}
          </div>
        </Field>
        <Field label="Order types" error={errors.orderTypes?.message as string | undefined}>
          <Controller
            control={control}
            name="orderTypes"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {ORDER_TYPE_OPTIONS.map((o) => {
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
      </FormSection>

      <FormSection title="Pricing">
        <FormGrid>
          <Field label="Base fare" htmlFor="baseFare" error={errors.baseFare?.message} required>
            <Input id="baseFare" type="number" step="0.01" {...register("baseFare")} />
          </Field>
          <Field label="Minimum fee" htmlFor="minimumFee" error={errors.minimumFee?.message} required>
            <Input id="minimumFee" type="number" step="0.01" {...register("minimumFee")} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Per 100m" htmlFor="perHundredMeters" error={errors.perHundredMeters?.message} required>
            <Input id="perHundredMeters" type="number" step="0.01" {...register("perHundredMeters")} />
          </Field>
          <Field label="Per minute drive" htmlFor="perMinuteDrive" error={errors.perMinuteDrive?.message} required>
            <Input id="perMinuteDrive" type="number" step="0.01" {...register("perMinuteDrive")} />
          </Field>
          <Field label="Per minute wait" htmlFor="perMinuteWait" error={errors.perMinuteWait?.message} required>
            <Input id="perMinuteWait" type="number" step="0.01" {...register("perMinuteWait")} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Prepay %" htmlFor="prepayPercent" error={errors.prepayPercent?.message} required>
            <Input id="prepayPercent" type="number" {...register("prepayPercent")} />
          </Field>
          <Field label="Provider share %" htmlFor="providerSharePercent" error={errors.providerSharePercent?.message} required>
            <Input id="providerSharePercent" type="number" {...register("providerSharePercent")} />
          </Field>
          <Field label="Provider share flat" htmlFor="providerShareFlat" error={errors.providerShareFlat?.message} required>
            <Input id="providerShareFlat" type="number" step="0.01" {...register("providerShareFlat")} />
          </Field>
          <Field label="Search radius (m)" htmlFor="searchRadius" error={errors.searchRadius?.message} required>
            <Input id="searchRadius" type="number" {...register("searchRadius")} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Cancellation total fee" htmlFor="cancellationTotalFee" error={errors.cancellationTotalFee?.message} required>
            <Input id="cancellationTotalFee" type="number" step="0.01" {...register("cancellationTotalFee")} />
          </Field>
          <Field label="Cancellation driver share" htmlFor="cancellationDriverShare" error={errors.cancellationDriverShare?.message} required>
            <Input id="cancellationDriverShare" type="number" step="0.01" {...register("cancellationDriverShare")} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Person capacity" htmlFor="personCapacity">
            <Input id="personCapacity" type="number" {...register("personCapacity")} />
          </Field>
          <Field label="Display priority" htmlFor="displayPriority">
            <Input id="displayPriority" type="number" {...register("displayPriority")} />
          </Field>
          <Field label="Payment method" htmlFor="paymentMethod">
            <Controller
              control={control}
              name="paymentMethod"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Both">Both</SelectItem>
                    <SelectItem value="OnlyCash">Cash only</SelectItem>
                    <SelectItem value="OnlyOnline">Online only</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="GST %" htmlFor="gstPercent" error={errors.gstPercent?.message}>
            <Input id="gstPercent" type="number" step="0.01" {...register("gstPercent")} />
          </Field>
          <Field label="Platform fee" htmlFor="platformFee" error={errors.platformFee?.message}>
            <Input id="platformFee" type="number" step="0.01" {...register("platformFee")} />
          </Field>
          <Field label="Payment Gateway Fee %" htmlFor="paymentGatewayFee" error={errors.paymentGatewayFee?.message}>
            <Input id="paymentGatewayFee" type="number" step="0.01" {...register("paymentGatewayFee")} />
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
