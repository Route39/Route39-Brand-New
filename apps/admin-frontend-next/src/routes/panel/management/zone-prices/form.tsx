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
import { MultiPolygonEditor, type LatLng } from "@/components/maps/PolygonEditor";
import {
  TimeMultipliersField,
  type TimeMultiplier,
} from "@/components/forms/TimeMultipliersField";
import { ZONE_PRICES_LIST_QUERY } from "@/lib/graphql/documents/management";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_ZONE_PRICE_MUTATION,
  DELETE_ZONE_PRICE_MUTATION,
  UPDATE_ZONE_PRICE_MUTATION,
} from "@/lib/graphql/documents/management-detail-2";

const point = z.object({ lat: z.number(), lng: z.number() });
const multiPolygon = z
  .array(z.array(point).min(3, "Each polygon needs at least 3 vertices"))
  .min(1, "At least one polygon is required");

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  cost: z.string().min(1, "Cost is required"),
  from: multiPolygon,
  to: multiPolygon,
  timeMultipliers: z.array(
    z.object({
      startTime: z.string(),
      endTime: z.string(),
      multiply: z.number(),
    }),
  ),
});

type Values = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: Values;
}

export function ZonePriceForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [
    {
      query: ZONE_PRICES_LIST_QUERY,
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
      cost: "",
      from: [[]],
      to: [[]],
      timeMultipliers: [],
    },
  });

  const [createOne] = useMutation(CREATE_ZONE_PRICE_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_ZONE_PRICE_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_ZONE_PRICE_MUTATION, {
    refetchQueries,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const input = {
      name: values.name,
      cost: Number(values.cost),
      from: values.from as never[],
      to: values.to as never[],
      timeMultipliers: values.timeMultipliers as never,
    };
    try {
      if (mode === "create") {
        await createOne({ variables: { input } });
        toast.success("Zone price created");
      } else if (id) {
        await updateOne({ variables: { id, input } });
        toast.success("Zone price updated");
      }
      navigate("/management/zone-prices");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this zone price?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Zone price deleted");
      navigate("/management/zone-prices");
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
      <FormSection title="Zone price" description="Flat fare from one geo-fence to another.">
        <FormGrid>
          <Field label="Name" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} placeholder="e.g. Airport ↔ downtown" />
          </Field>
          <Field label="Cost" htmlFor="cost" error={errors.cost?.message} required>
            <Input id="cost" type="number" step="0.01" {...register("cost")} />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Origin geo-fence"
        description="Pickup region. Add as many polygons as needed."
      >
        <Controller
          control={control}
          name="from"
          render={({ field }) => (
            <div className="space-y-1.5">
              <MultiPolygonEditor
                value={field.value as LatLng[][]}
                onChange={field.onChange as (next: LatLng[][]) => void}
              />
              {errors.from ? (
                <p className="text-xs text-destructive">{errors.from.message as string}</p>
              ) : null}
            </div>
          )}
        />
      </FormSection>

      <FormSection
        title="Destination geo-fence"
        description="Drop-off region. Add as many polygons as needed."
      >
        <Controller
          control={control}
          name="to"
          render={({ field }) => (
            <div className="space-y-1.5">
              <MultiPolygonEditor
                value={field.value as LatLng[][]}
                onChange={field.onChange as (next: LatLng[][]) => void}
              />
              {errors.to ? (
                <p className="text-xs text-destructive">{errors.to.message as string}</p>
              ) : null}
            </div>
          )}
        />
      </FormSection>

      <FormSection
        title="Time multipliers"
        description="Optional surge windows that scale the fare during specific hours."
      >
        <Controller
          control={control}
          name="timeMultipliers"
          render={({ field }) => (
            <TimeMultipliersField
              value={field.value as TimeMultiplier[]}
              onChange={field.onChange as (next: TimeMultiplier[]) => void}
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
