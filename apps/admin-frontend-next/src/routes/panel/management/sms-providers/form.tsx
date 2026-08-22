import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { SMS_PROVIDER_TYPES } from "@/lib/panel/enum-options";
import { SMS_PROVIDERS_LIST_QUERY } from "@/lib/graphql/documents/management";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_SMS_PROVIDER_MUTATION,
  DELETE_SMS_PROVIDER_MUTATION,
  UPDATE_SMS_PROVIDER_MUTATION,
} from "@/lib/graphql/documents/management-detail";

type FieldKey = "accountId" | "authToken" | "fromNumber" | "smsType" | "verificationTemplate";
type ProviderFieldConfig = Partial<Record<FieldKey, string>>;

const PROVIDER_FIELD_CONFIG: Record<string, ProviderFieldConfig> = {
  Twilio: {
    accountId: "Account SID",
    authToken: "Auth Token",
    fromNumber: "From Number",
    verificationTemplate: "Verification Template",
  },
  Plivo: {
    accountId: "Auth ID",
    authToken: "Auth Token",
    fromNumber: "Sender ID",
    verificationTemplate: "Verification Template",
  },
  Vonage: {
    accountId: "API Key",
    authToken: "API Secret",
    fromNumber: "From Number",
    verificationTemplate: "Verification Template",
  },
  Pahappa: {
    accountId: "Username",
    authToken: "Password",
    fromNumber: "Sender",
    verificationTemplate: "Verification Template",
  },
  BroadNet: {
    accountId: "Username",
    authToken: "Password",
    fromNumber: "Sender ID",
    smsType: "SMS Type",
    verificationTemplate: "Verification Template",
  },
  VentisSMS: {
    accountId: "Username",
    smsType: "Password",
    authToken: "Client Secret",
    fromNumber: "Sender",
    verificationTemplate: "Verification Template",
  },
  ClickSMSNet: {
    authToken: "API Key",
    fromNumber: "From Number",
    verificationTemplate: "Verification Template",
  },
};

const FALLBACK_FIELD_CONFIG: ProviderFieldConfig = {
  accountId: "Account ID",
  authToken: "Auth Token",
  fromNumber: "From Number",
  verificationTemplate: "Verification Template",
};

function getProviderFieldConfig(type: string | undefined): ProviderFieldConfig {
  if (!type) return FALLBACK_FIELD_CONFIG;
  return PROVIDER_FIELD_CONFIG[type] ?? FALLBACK_FIELD_CONFIG;
}

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  isDefault: z.boolean(),
  accountId: z.string().optional(),
  authToken: z.string().optional(),
  fromNumber: z.string().optional(),
  smsType: z.string().optional(),
  verificationTemplate: z.string().optional(),
  callMaskingEnabled: z.boolean(),
  callMaskingNumber: z.string().optional(),
});

type Values = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: Values;
}

export function SmsProviderForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [
    {
      query: SMS_PROVIDERS_LIST_QUERY,
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
      name: "",
      type: "Twilio",
      isDefault: false,
      accountId: "",
      authToken: "",
      fromNumber: "",
      smsType: "",
      verificationTemplate: "",
      callMaskingEnabled: false,
      callMaskingNumber: "",
    },
  });

  const selectedType = useWatch({ control, name: "type" });
  const fieldConfig = getProviderFieldConfig(selectedType);
  const supportsCallMasking = selectedType === "Twilio";

  const [createOne] = useMutation(CREATE_SMS_PROVIDER_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_SMS_PROVIDER_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_SMS_PROVIDER_MUTATION, {
    refetchQueries,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const config = getProviderFieldConfig(values.type);
    const isTwilio = values.type === "Twilio";
    const input = {
      ...values,
      type: values.type as never,
      accountId: config.accountId ? values.accountId || null : null,
      authToken: config.authToken ? values.authToken || null : null,
      fromNumber: config.fromNumber ? values.fromNumber || null : null,
      smsType: config.smsType ? values.smsType || null : null,
      verificationTemplate: config.verificationTemplate ? values.verificationTemplate || null : null,
      callMaskingEnabled: isTwilio ? values.callMaskingEnabled : false,
      callMaskingNumber: isTwilio ? values.callMaskingNumber || null : null,
    };
    try {
      if (mode === "create") {
        await createOne({ variables: { input } });
        toast.success("Provider created");
      } else if (id) {
        await updateOne({ variables: { id, input } });
        toast.success("Provider updated");
      }
      navigate("/management/sms-providers");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this SMS provider?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Provider deleted");
      navigate("/management/sms-providers");
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
      <FormSection title="Provider" description="Identifying details for this SMS gateway.">
        <FormGrid>
          <Field label="Name" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} placeholder="e.g. Production Twilio" />
          </Field>
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
                    {SMS_PROVIDER_TYPES.map((o) => (
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
          name="isDefault"
          render={({ field }) => (
            <SwitchField
              label="Default provider"
              description="Use this provider for outgoing messages."
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </FormSection>

      <FormSection title="API Keys" description="Credentials required by the selected provider.">
        <FormGrid>
          {fieldConfig.accountId ? (
            <Field label={fieldConfig.accountId} htmlFor="accountId" error={errors.accountId?.message}>
              <Input id="accountId" {...register("accountId")} />
            </Field>
          ) : null}
          {fieldConfig.authToken ? (
            <Field label={fieldConfig.authToken} htmlFor="authToken">
              <Input id="authToken" type="password" {...register("authToken")} />
            </Field>
          ) : null}
          {fieldConfig.fromNumber ? (
            <Field label={fieldConfig.fromNumber} htmlFor="fromNumber">
              <Input id="fromNumber" {...register("fromNumber")} />
            </Field>
          ) : null}
          {fieldConfig.smsType ? (
            <Field label={fieldConfig.smsType} htmlFor="smsType">
              <Input id="smsType" {...register("smsType")} />
            </Field>
          ) : null}
        </FormGrid>
        {fieldConfig.verificationTemplate ? (
          <Field label={fieldConfig.verificationTemplate} htmlFor="verificationTemplate">
            <Textarea
              id="verificationTemplate"
              rows={3}
              {...register("verificationTemplate")}
              placeholder="Your verification code is {code}"
            />
          </Field>
        ) : null}
      </FormSection>

      {supportsCallMasking ? (
        <FormSection title="Call masking" description="Twilio number used for masking calls between driver and rider.">
          <Controller
            control={control}
            name="callMaskingEnabled"
            render={({ field }) => (
              <SwitchField
                label="Call masking enabled"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Field label="Masking number" htmlFor="callMaskingNumber">
            <Input id="callMaskingNumber" {...register("callMaskingNumber")} />
          </Field>
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
