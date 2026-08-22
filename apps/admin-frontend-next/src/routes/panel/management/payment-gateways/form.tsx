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
import { PAYMENT_GATEWAY_TYPES } from "@/lib/panel/enum-options";
import { PAYMENT_GATEWAYS_LIST_QUERY } from "@/lib/graphql/documents/management";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_PAYMENT_GATEWAY_MUTATION,
  DELETE_PAYMENT_GATEWAY_MUTATION,
  UPDATE_PAYMENT_GATEWAY_MUTATION,
} from "@/lib/graphql/documents/management-detail";

/**
 * Per-processor credential layout — each entry declares which fields apply,
 * what to label them, and which placeholder hints to show. Switching processor
 * automatically clears irrelevant fields and shows the right ones.
 */
type FieldKey = "publicKey" | "privateKey" | "merchantId" | "saltKey";

interface FieldSpec {
  key: FieldKey;
  label: string;
  required?: boolean;
  placeholder?: string;
  /** Render with type=password when true (secrets that should be masked). */
  secret?: boolean;
}

const PROCESSOR_FIELDS: Record<string, FieldSpec[]> = {
  Stripe: [
    { key: "publicKey", label: "Publishable key", required: true, placeholder: "pk_live_..." },
    { key: "privateKey", label: "Secret key", required: true, placeholder: "sk_live_...", secret: true },
  ],
  PayPal: [
    { key: "publicKey", label: "Client ID", required: true },
    { key: "privateKey", label: "Client secret", required: true, secret: true },
  ],
  BrainTree: [
    { key: "merchantId", label: "Merchant ID", required: true },
    { key: "publicKey", label: "Public key", required: true },
    { key: "privateKey", label: "Private key", required: true, secret: true },
  ],
  Razorpay: [
    { key: "publicKey", label: "Key ID", required: true },
    { key: "privateKey", label: "Key secret", required: true, secret: true },
  ],
  Paytm: [
    { key: "merchantId", label: "Merchant ID", required: true },
    { key: "privateKey", label: "Merchant key", required: true, secret: true },
    { key: "saltKey", label: "Salt", required: true, secret: true },
  ],
  Paystack: [
    { key: "publicKey", label: "Public key", required: true },
    { key: "privateKey", label: "Secret key", required: true, secret: true },
  ],
  PayU: [
    { key: "publicKey", label: "Merchant key", required: true },
    { key: "privateKey", label: "Merchant salt", required: true, secret: true },
  ],
  Flutterwave: [
    { key: "publicKey", label: "Public key", required: true },
    { key: "privateKey", label: "Secret key", required: true, secret: true },
  ],
  Instamojo: [
    { key: "publicKey", label: "API key", required: true },
    { key: "privateKey", label: "Auth token", required: true, secret: true },
  ],
  MercadoPago: [
    { key: "publicKey", label: "Public key", required: true },
    { key: "privateKey", label: "Access token", required: true, secret: true },
  ],
  AmazonPaymentServices: [
    { key: "merchantId", label: "Merchant ID", required: true },
    { key: "publicKey", label: "Access code", required: true },
    { key: "privateKey", label: "SHA request phrase", required: true, secret: true },
    { key: "saltKey", label: "SHA response phrase", secret: true },
  ],
  MyTMoney: [
    { key: "merchantId", label: "Merchant ID", required: true },
    { key: "privateKey", label: "API key", required: true, secret: true },
  ],
  WayForPay: [
    { key: "merchantId", label: "Merchant account", required: true },
    { key: "privateKey", label: "Secret key", required: true, secret: true },
  ],
  MyFatoorah: [{ key: "privateKey", label: "API key", required: true, secret: true }],
  SberBank: [
    { key: "publicKey", label: "Username", required: true },
    { key: "privateKey", label: "Password", required: true, secret: true },
  ],
  BinancePay: [
    { key: "publicKey", label: "API key", required: true },
    { key: "privateKey", label: "Secret key", required: true, secret: true },
  ],
  OpenPix: [{ key: "privateKey", label: "API token", required: true, secret: true }],
  PayTR: [
    { key: "merchantId", label: "Merchant ID", required: true },
    { key: "publicKey", label: "Merchant key", required: true },
    { key: "privateKey", label: "Merchant salt", required: true, secret: true },
  ],
  BambooPay: [
    { key: "publicKey", label: "API key", required: true },
    { key: "privateKey", label: "Secret", required: true, secret: true },
  ],
  PayGate: [
    { key: "merchantId", label: "Pay-Gate ID", required: true },
    { key: "privateKey", label: "Encryption key", required: true, secret: true },
  ],
  MIPS: [
    { key: "merchantId", label: "Merchant ID", required: true },
    { key: "privateKey", label: "Password", required: true, secret: true },
  ],
  CustomLink: [{ key: "publicKey", label: "Redirect URL", required: true, placeholder: "https://..." }],
};

function fieldsFor(processor: string): FieldSpec[] {
  return PROCESSOR_FIELDS[processor] ?? PROCESSOR_FIELDS.Stripe;
}

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  enabled: z.boolean(),
  publicKey: z.string().optional(),
  privateKey: z.string().optional(),
  merchantId: z.string().optional(),
  saltKey: z.string().optional(),
});
type Values = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: Values;
}

export function PaymentGatewayForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [
    {
      query: PAYMENT_GATEWAYS_LIST_QUERY,
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
      title: "",
      type: "Stripe",
      enabled: true,
      publicKey: "",
      privateKey: "",
      merchantId: "",
      saltKey: "",
    },
  });

  const processor = watch("type");
  const activeFields = useMemo(() => fieldsFor(processor), [processor]);
  const initialTypeRef = useRef(initialValues?.type);

  // When the user changes processor (not on first load for an edit form),
  // clear credential fields that don't apply to the new processor so stale
  // secrets don't accidentally save.
  useEffect(() => {
    // Skip the first render where processor matches the initial loaded value.
    if (initialTypeRef.current === processor) {
      initialTypeRef.current = undefined;
      return;
    }
    const keep = new Set(activeFields.map((f) => f.key));
    (["publicKey", "privateKey", "merchantId", "saltKey"] as const).forEach((k) => {
      if (!keep.has(k)) setValue(k, "", { shouldDirty: true });
    });
  }, [processor, activeFields, setValue]);

  const [createOne] = useMutation(CREATE_PAYMENT_GATEWAY_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_PAYMENT_GATEWAY_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_PAYMENT_GATEWAY_MUTATION, {
    refetchQueries,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    // Validate that all required fields for this processor are present.
    const missing = activeFields
      .filter((f) => f.required && !(values[f.key] ?? "").trim())
      .map((f) => f.label);
    if (missing.length) {
      setSubmitError(`Missing required ${processor} field${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`);
      return;
    }
    const keep = new Set(activeFields.map((f) => f.key));
    const input = {
      ...values,
      type: values.type as never,
      publicKey: keep.has("publicKey") ? values.publicKey || null : null,
      privateKey: keep.has("privateKey") ? values.privateKey || "" : "",
      merchantId: keep.has("merchantId") ? values.merchantId || null : null,
      saltKey: keep.has("saltKey") ? values.saltKey || null : null,
    };
    try {
      if (mode === "create") {
        await createOne({ variables: { input } });
        toast.success("Gateway created");
      } else if (id) {
        await updateOne({ variables: { id, input } });
        toast.success("Gateway updated");
      }
      navigate("/management/payment-gateways");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this payment gateway?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Gateway deleted");
      navigate("/management/payment-gateways");
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

      <FormSection title="Gateway" description="Display name and processor type.">
        <FormGrid>
          <Field label="Title" htmlFor="title" error={errors.title?.message} required>
            <Input id="title" {...register("title")} placeholder="e.g. Stripe (production)" />
          </Field>
          <Field label="Processor" htmlFor="type" error={errors.type?.message} required>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_GATEWAY_TYPES.map((o) => (
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
        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            <SwitchField
              label="Enabled"
              description="Riders can use this method to pay."
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </FormSection>

      <FormSection
        title={`${processor} credentials`}
        description="Only the fields this processor needs are shown. Switching processor clears the others."
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
