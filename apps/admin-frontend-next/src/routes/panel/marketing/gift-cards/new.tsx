import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/Field";
import { FormActions, FormGrid, FormSection, FormShell } from "@/components/forms/FormShell";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/panel/PageHeader";
import { Spinner } from "@/components/ui/spinner";
import { GIFT_BATCHES_LIST_QUERY } from "@/lib/graphql/documents/marketing";
import { CREATE_GIFT_BATCH_MUTATION } from "@/lib/graphql/documents/marketing-detail";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  currency: z.string().min(1, "Currency is required"),
  amount: z.string().min(1, "Required"),
  quantity: z.string().min(1, "Required"),
  availableFrom: z.string().optional(),
  expireAt: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function NewGiftBatchPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      currency: "USD",
      amount: "10",
      quantity: "100",
      availableFrom: "",
      expireAt: "",
    },
  });

  const [createBatch] = useMutation(CREATE_GIFT_BATCH_MUTATION, {
    refetchQueries: [
      {
        query: GIFT_BATCHES_LIST_QUERY,
        variables: { paging: { limit: 10, offset: 0 }, sorting: [], filter: {} } as never,
      },
    ],
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await createBatch({
        variables: {
          input: {
            name: values.name,
            currency: values.currency,
            amount: Number(values.amount),
            quantity: Number(values.quantity),
            availableFrom: values.availableFrom
              ? new Date(values.availableFrom).toISOString()
              : null,
            expireAt: values.expireAt ? new Date(values.expireAt).toISOString() : null,
          },
        },
      });
      toast.success("Gift batch created");
      navigate("/marketing/gift-cards");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader title="New gift batch" description="Generate a batch of gift codes." />
      <FormShell onSubmit={onSubmit}>
        {submitError ? (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}
        <FormSection title="Batch">
          <Field label="Name" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} />
          </Field>
          <FormGrid>
            <Field label="Amount per code" htmlFor="amount" error={errors.amount?.message} required>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
            </Field>
            <Field label="Currency" htmlFor="currency" error={errors.currency?.message} required>
              <Input id="currency" {...register("currency")} />
            </Field>
            <Field label="Quantity" htmlFor="quantity" error={errors.quantity?.message} required>
              <Input id="quantity" type="number" {...register("quantity")} />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Available from" htmlFor="availableFrom">
              <Input id="availableFrom" type="datetime-local" {...register("availableFrom")} />
            </Field>
            <Field label="Expires" htmlFor="expireAt">
              <Input id="expireAt" type="datetime-local" {...register("expireAt")} />
            </Field>
          </FormGrid>
        </FormSection>
        <FormActions>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-primary-foreground" /> : "Create"}
          </Button>
        </FormActions>
      </FormShell>
    </div>
  );
}
