import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { SwitchField } from "@/components/forms/SwitchField";
import { Textarea } from "@/components/ui/textarea";
import { PAYOUT_METHODS_QUERY } from "@/lib/graphql/documents/payouts";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_PAYOUT_METHOD_MUTATION,
  DELETE_PAYOUT_METHOD_MUTATION,
  UPDATE_PAYOUT_METHOD_MUTATION,
} from "@/lib/graphql/documents/payouts-detail";

type FieldKey = "publicKey" | "privateKey" | "merchantId" | "saltKey";

interface FieldSpec {
  key: FieldKey;
  label: string;
  required?: boolean;
  placeholder?: string;
  secret?: boolean;
}

const METHOD_FIELDS: Record<string, FieldSpec[]> = {
  Stripe: [
    { key: "privateKey", label: "API key", required: true, placeholder: "sk_live_...", secret: true },
  ],
  BankTransfer: [],
};

function fieldsFor(type: string): FieldSpec[] {
  return METHOD_FIELDS[type] ?? [];
}

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  currency: z.string().min(1, "Currency is required"),
  type: z.enum(["Stripe", "BankTransfer"]),
  enabled: z.boolean(),
  publicKey: z.string().optional(),
  privateKey: z.string().optional(),
  saltKey: z.string().optional(),
  merchantId: z.string().optional(),
});
type Values = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: Values;
}

export function PayoutMethodForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [
    {
      query: PAYOUT_METHODS_QUERY,
      variables: { paging: { limit: 10, offset: 0 }, sorting: [], filter: {} } as never,
    },
  ];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? {
      name: "",
      description: "",
      currency: "USD",
      type: "Stripe",
      enabled: true,
      publicKey: "",
      privateKey: "",
      saltKey: "",
      merchantId: "",
    },
  });

  const selectedType = watch("type");
  const activeFields = useMemo(() => fieldsFor(selectedType), [selectedType]);
  const initialTypeRef = useRef(initialValues?.type);

  useEffect(() => {
    if (initialTypeRef.current === selectedType) {
      initialTypeRef.current = undefined;
      return;
    }
    const keep = new Set(activeFields.map((f) => f.key));
    (["publicKey", "privateKey", "merchantId", "saltKey"] as const).forEach((k) => {
      if (!keep.has(k)) setValue(k, "", { shouldDirty: true });
    });
  }, [selectedType, activeFields, setValue]);

  const [createOne] = useMutation(CREATE_PAYOUT_METHOD_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_PAYOUT_METHOD_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_PAYOUT_METHOD_MUTATION, {
    refetchQueries,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const missing = activeFields
      .filter((f) => f.required && !(values[f.key] ?? "").trim())
      .map((f) => f.label);
    if (missing.length) {
      setSubmitError(
        `Missing required ${selectedType} field${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`,
      );
      return;
    }
    const keep = new Set(activeFields.map((f) => f.key));
    const input = {
      name: values.name,
      description: values.description,
      currency: values.currency,
      type: values.type,
      enabled: values.enabled,
      publicKey: keep.has("publicKey") ? values.publicKey || null : null,
      privateKey: keep.has("privateKey") ? values.privateKey || null : null,
      saltKey: keep.has("saltKey") ? values.saltKey || null : null,
      merchantId: keep.has("merchantId") ? values.merchantId || null : null,
    };
    try {
      if (mode === "create") {
        await createOne({ variables: { input: input as never } });
        toast.success("Payout method created");
      } else if (id) {
        await updateOne({ variables: { id, input: input as never } });
        toast.success("Payout method updated");
      }
      navigate("/payout-methods");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this payout method?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Method deleted");
      navigate("/payout-methods");
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
      <FormSection title="Method">
        <FormGrid>
          <Field label="Name" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} />
          </Field>
          <Field label="Type" htmlFor="type" required>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stripe">Stripe</SelectItem>
                    <SelectItem value="BankTransfer">Bank transfer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Currency" htmlFor="currency" error={errors.currency?.message} required>
            <Input id="currency" {...register("currency")} />
          </Field>
          <Controller
            control={control}
            name="enabled"
            render={({ field }) => (
              <SwitchField label="Enabled" checked={field.value} onChange={field.onChange} />
            )}
          />
        </FormGrid>
        <Field label="Description" htmlFor="description" error={errors.description?.message} required>
          <Textarea id="description" rows={2} {...register("description")} />
        </Field>
      </FormSection>

      {activeFields.length > 0 ? (
        <FormSection
          title={`${selectedType} credentials`}
          description="Only the fields this method needs are shown. Switching method clears the others."
        >
          <FormGrid>
            {activeFields.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                htmlFor={f.key}
                error={errors[f.key]?.message}
                required={f.required}
              >
                <Input
                  id={f.key}
                  type={f.secret ? "password" : "text"}
                  placeholder={f.placeholder}
                  autoComplete="off"
                  {...register(f.key)}
                />
              </Field>
            ))}
          </FormGrid>
        </FormSection>
      ) : null}

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
