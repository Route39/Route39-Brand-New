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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { REWARDS_LIST_QUERY } from "@/lib/graphql/documents/marketing";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_REWARD_MUTATION,
  DELETE_REWARD_MUTATION,
  UPDATE_REWARD_MUTATION,
} from "@/lib/graphql/documents/marketing-detail";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  appType: z.string().min(1),
  beneficiary: z.string().min(1),
  event: z.string().min(1),
  creditGift: z.string().min(1),
  creditCurrency: z.string().optional(),
  tripFeePercentGift: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
type Values = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: Values;
}

export function RewardForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [
    {
      query: REWARDS_LIST_QUERY,
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
      title: "",
      appType: "Taxi",
      beneficiary: "Rider",
      event: "Registration",
      creditGift: "0",
      creditCurrency: "USD",
      tripFeePercentGift: "",
      startDate: "",
      endDate: "",
    },
  });

  const [createOne] = useMutation(CREATE_REWARD_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_REWARD_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_REWARD_MUTATION, { refetchQueries });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const base = {
      title: values.title,
      appType: values.appType as never,
      beneficiary: values.beneficiary as never,
      event: values.event as never,
      creditGift: Number(values.creditGift),
      creditCurrency: values.creditCurrency || null,
      tripFeePercentGift: values.tripFeePercentGift ? Number(values.tripFeePercentGift) : null,
      startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
      endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
    };
    try {
      if (mode === "create") {
        await createOne({ variables: { input: { id: crypto.randomUUID(), ...base } as never } });
        toast.success("Reward created");
      } else if (id) {
        await updateOne({ variables: { id, input: base as never } });
        toast.success("Reward updated");
      }
      navigate("/marketing/rewards");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this reward?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Reward deleted");
      navigate("/marketing/rewards");
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
      <FormSection title="Reward">
        <Field label="Title" htmlFor="title" error={errors.title?.message} required>
          <Input id="title" {...register("title")} />
        </Field>
        <FormGrid>
          <Field label="App" htmlFor="appType">
            <Controller
              control={control}
              name="appType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="appType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Taxi">Taxi</SelectItem>
                    <SelectItem value="Shop">Shop</SelectItem>
                    <SelectItem value="Parking">Parking</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Beneficiary" htmlFor="beneficiary">
            <Controller
              control={control}
              name="beneficiary"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="beneficiary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rider">Rider</SelectItem>
                    <SelectItem value="Driver">Driver</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Event" htmlFor="event">
            <Controller
              control={control}
              name="event"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="event">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Registration">Registration</SelectItem>
                    <SelectItem value="TripCompletion">Trip completion</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Reward amount">
        <FormGrid>
          <Field label="Credit gift" htmlFor="creditGift" error={errors.creditGift?.message} required>
            <Input id="creditGift" type="number" step="0.01" {...register("creditGift")} />
          </Field>
          <Field label="Currency" htmlFor="creditCurrency">
            <Input id="creditCurrency" {...register("creditCurrency")} />
          </Field>
          <Field label="Trip fee % gift" htmlFor="tripFeePercentGift">
            <Input id="tripFeePercentGift" type="number" step="0.01" {...register("tripFeePercentGift")} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Starts" htmlFor="startDate">
            <Input id="startDate" type="datetime-local" {...register("startDate")} />
          </Field>
          <Field label="Ends" htmlFor="endDate">
            <Input id="endDate" type="datetime-local" {...register("endDate")} />
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
