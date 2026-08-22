import { useMutation, useQuery } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { PageHeader } from "@/components/panel/PageHeader";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { PAYOUT_METHODS_QUERY, TAXI_PAYOUT_SESSIONS_QUERY } from "@/lib/graphql/documents/payouts";
import { CREATE_TAXI_PAYOUT_SESSION_MUTATION } from "@/lib/graphql/documents/payouts-detail";

const schema = z.object({
  payoutMethodIds: z.array(z.string()).min(1, "Select at least one payout method"),
  minimumAmount: z.string().min(1, "Required"),
  currency: z.string().min(1, "Required"),
  description: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function NewPayoutSessionPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: methodsData, loading: methodsLoading } = useQuery(PAYOUT_METHODS_QUERY, {
    variables: {
      paging: { limit: 100, offset: 0 },
      filter: { enabled: { is: true } },
      sorting: [],
    } as never,
  });
  const methods = methodsData?.payoutMethods.nodes ?? [];

  const [createSession] = useMutation(CREATE_TAXI_PAYOUT_SESSION_MUTATION, {
    refetchQueries: [
      {
        query: TAXI_PAYOUT_SESSIONS_QUERY,
        variables: { paging: { limit: 10, offset: 0 }, sorting: [], filter: {} } as never,
      },
    ],
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      payoutMethodIds: [],
      minimumAmount: "10",
      currency: "USD",
      description: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const { data: result } = await createSession({
        variables: {
          input: {
            payoutMethodIds: values.payoutMethodIds,
            minimumAmount: Number(values.minimumAmount),
            currency: values.currency,
            description: values.description || null,
            appType: "Taxi" as never,
          },
        },
      });
      toast.success("Payout session created");
      const newId = result?.createTaxiPayoutSession.id;
      navigate(newId ? `/payouts/${newId}` : "/payouts");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader title="New payout session" description="Pay out drivers via the selected methods." />
      <FormShell onSubmit={onSubmit}>
        {submitError ? (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}
        <FormSection title="Payout">
          <FormGrid>
            <Field label="Currency" htmlFor="currency" error={errors.currency?.message} required>
              <Input id="currency" {...register("currency")} />
            </Field>
            <Field label="Minimum amount" htmlFor="minimumAmount" error={errors.minimumAmount?.message} required>
              <Input id="minimumAmount" type="number" step="0.01" {...register("minimumAmount")} />
            </Field>
          </FormGrid>
          <Field label="Description" htmlFor="description">
            <Textarea id="description" rows={2} {...register("description")} />
          </Field>
        </FormSection>

        <FormSection title="Payout methods" description="Drivers paying via at least one selected method are included.">
          {methodsLoading && methods.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading methods…</p>
          ) : methods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enabled payout methods.</p>
          ) : (
            <Controller
              control={control}
              name="payoutMethodIds"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {methods.map((m) => {
                    const checked = field.value.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-input/30 px-3 py-1.5"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            field.onChange(
                              v
                                ? [...field.value, m.id]
                                : field.value.filter((x: string) => x !== m.id),
                            )
                          }
                        />
                        <Label className="cursor-pointer text-sm font-normal">
                          {m.name} <span className="text-muted-foreground">({m.type})</span>
                        </Label>
                      </label>
                    );
                  })}
                </div>
              )}
            />
          )}
          {errors.payoutMethodIds ? (
            <p className="text-xs text-destructive">{errors.payoutMethodIds.message as string}</p>
          ) : null}
        </FormSection>

        <FormActions>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-primary-foreground" /> : "Create payout"}
          </Button>
        </FormActions>
      </FormShell>
    </div>
  );
}
