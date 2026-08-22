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
import { MultiPolygonEditor, type LatLng } from "@/components/maps/PolygonEditor";
import { REGIONS_LIST_QUERY } from "@/lib/graphql/documents/management";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_REGION_MUTATION,
  DELETE_REGION_MUTATION,
  UPDATE_REGION_MUTATION,
} from "@/lib/graphql/documents/management-detail-2";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  currency: z.string().min(1, "Currency is required"),
  enabled: z.boolean(),
  boundary: z
    .array(
      z
        .array(z.object({ lat: z.number(), lng: z.number() }))
        .min(3, "Each polygon needs at least 3 vertices"),
    )
    .min(1, "At least one polygon is required"),
});

type Values = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: Values;
}

export function RegionForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [
    {
      query: REGIONS_LIST_QUERY,
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
      currency: "USD",
      enabled: true,
      boundary: [[]],
    },
  });

  const [createOne] = useMutation(CREATE_REGION_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_REGION_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_REGION_MUTATION, { refetchQueries });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const input = {
      name: values.name,
      currency: values.currency,
      enabled: values.enabled,
      location: values.boundary as never[],
    };
    try {
      if (mode === "create") {
        await createOne({ variables: { input } });
        toast.success("Region created");
      } else if (id) {
        await updateOne({ variables: { id, input } });
        toast.success("Region updated");
      }
      navigate("/management/regions");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this region?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Region deleted");
      navigate("/management/regions");
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
      <FormSection title="Region" description="Display name, currency, and active state.">
        <FormGrid>
          <Field label="Name" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} placeholder="e.g. Manhattan" />
          </Field>
          <Field label="Currency" htmlFor="currency" error={errors.currency?.message} required>
            <Input id="currency" {...register("currency")} placeholder="USD" />
          </Field>
        </FormGrid>
        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            <SwitchField label="Enabled" checked={field.value} onChange={field.onChange} />
          )}
        />
      </FormSection>
      <FormSection
        title="Boundary"
        description="Click the map to add vertices. Drag to refine, right-click a vertex to delete. Multi-region support via the polygon picker above the map."
      >
        <Controller
          control={control}
          name="boundary"
          render={({ field }) => (
            <div className="space-y-1.5">
              <MultiPolygonEditor
                value={field.value as LatLng[][]}
                onChange={field.onChange as (next: LatLng[][]) => void}
              />
              {errors.boundary ? (
                <p className="text-xs text-destructive">{errors.boundary.message as string}</p>
              ) : null}
            </div>
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
