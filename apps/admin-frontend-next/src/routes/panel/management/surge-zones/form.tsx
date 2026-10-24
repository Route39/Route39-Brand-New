import { useMutation } from "@apollo/client";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/Field";
import { FormActions, FormGrid, FormSection, FormShell } from "@/components/forms/FormShell";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { MultiPolygonEditor, type LatLng } from "@/components/maps/PolygonEditor";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_SURGE_ZONE_MUTATION,
  DELETE_SURGE_ZONE_MUTATION,
  SURGE_ZONES_LIST_QUERY,
  UPDATE_SURGE_ZONE_MUTATION,
} from "@/lib/graphql/documents/surge";

export type SurgeZoneValues = {
  name: string;
  status: string;
  type: string;
  surgePercent: string;
  surgeFlat: string;
  commissionPercent: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  area: LatLng[][];
};

const num = (v: string) => (v.trim() === "" ? null : Number(v));

export function SurgeZoneForm({ mode, id, initialValues }: { mode: "create" | "edit"; id?: string; initialValues?: SurgeZoneValues }) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [{ query: SURGE_ZONES_LIST_QUERY }];
  const { register, handleSubmit, control, setValue, getValues, formState: { isSubmitting } } = useForm<SurgeZoneValues>({
    defaultValues: initialValues ?? {
      name: "", status: "Off", type: "Peak", surgePercent: "", surgeFlat: "", commissionPercent: "",
      startTime: "", endTime: "", startDate: "", endDate: "", area: [[]],
    },
  });
  const [createOne] = useMutation(CREATE_SURGE_ZONE_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_SURGE_ZONE_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_SURGE_ZONE_MUTATION, { refetchQueries });

  const onSubmit = handleSubmit(async (v) => {
    setSubmitError(null);
    const polys = (v.area ?? [])
      .filter((p) => p.length >= 3)
      .map((p) => {
        const pts = p.map((x) => ({ lat: Number(x.lat.toFixed(6)), lng: Number(x.lng.toFixed(6)) }));
        const a = pts[0];
        const b = pts[pts.length - 1];
        return a.lat === b.lat && a.lng === b.lng ? pts : [...pts, a];
      });
    if (!v.name.trim()) return setSubmitError("Name is required");
    if (polys.length === 0) return setSubmitError("Draw the zone area on the map (at least 3 points)");
    const input = {
      name: v.name.trim(),
      status: v.status,
      type: v.type,
      area: polys,
      surgePercent: num(v.surgePercent),
      surgeFlat: num(v.surgeFlat),
      commissionPercent: num(v.commissionPercent),
      startTime: v.startTime || null,
      endTime: v.endTime || null,
      startDate: v.startDate || null,
      endDate: v.endDate || null,
    };
    try {
      if (mode === "create") {
        await createOne({ variables: { input } });
        toast.success("Surge zone created");
      } else if (id) {
        await updateOne({ variables: { id, input } });
        toast.success("Surge zone updated");
      }
      navigate("/management/surge-zones");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this surge zone?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Surge zone deleted");
      navigate("/management/surge-zones");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <FormShell onSubmit={onSubmit}>
      {submitError ? <Alert variant="destructive"><AlertDescription>{submitError}</AlertDescription></Alert> : null}
      <FormSection title="Zone" description="Name and on/off status.">
        <FormGrid>
          <Field label="Name" htmlFor="name" required>
            <Input id="name" {...register("name")} placeholder="e.g. Tiruppur New Bus Stand" />
          </Field>
          <Field label="Status" htmlFor="status">
            <select id="status" {...register("status")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="Active">Active (surge ON)</option>
              <option value="Off">Off</option>
              <option value="Auto">Auto (system decides)</option>
            </select>
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Surge type" htmlFor="type">
            <select id="type" {...register("type")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="Peak">🔥 Peak (high demand)</option>
              <option value="Rain">🌧️ Rain</option>
              <option value="Festival">🎉 Festival</option>
              <option value="Night">🌙 Night</option>
              <option value="Event">📍 Event</option>
            </select>
          </Field>
          <div />
        </FormGrid>
      </FormSection>
      <FormSection title="Surge amount" description="Fill % OR flat ₹. Leave empty to use the global default %.">
        <FormGrid>
          <Field label="Surge %" htmlFor="surgePercent">
            <Input id="surgePercent" type="number" step="0.01" {...register("surgePercent")} placeholder="e.g. 20" />
          </Field>
          <Field label="Surge flat ₹" htmlFor="surgeFlat">
            <Input id="surgeFlat" type="number" step="0.01" {...register("surgeFlat")} placeholder="e.g. 15" />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Surge commission % (empty = global)" htmlFor="commissionPercent">
            <Input id="commissionPercent" type="number" step="0.01" {...register("commissionPercent")} />
          </Field>
          <div />
        </FormGrid>
      </FormSection>
      <FormSection title="Active time (optional)" description="IST. Leave empty for all day.">
        <FormGrid>
          <Field label="From" htmlFor="startTime"><Input id="startTime" type="time" {...register("startTime")} /></Field>
          <Field label="To" htmlFor="endTime"><Input id="endTime" type="time" {...register("endTime")} /></Field>
          <Field label="From date (Festival)" htmlFor="startDate"><Input id="startDate" type="date" {...register("startDate")} /></Field>
          <Field label="To date (Festival)" htmlFor="endDate"><Input id="endDate" type="date" {...register("endDate")} /></Field>
        </FormGrid>
      </FormSection>
      <FormSection title="Zone area" description="Search a place above the map — the zone is drawn automatically. Pick the size below the map.">
        <Controller control={control} name="area" render={({ field }) => (
          <MultiPolygonEditor
            value={field.value as LatLng[][]}
            onChange={field.onChange as (n: LatLng[][]) => void}
            autoFill
            onPlaceName={(n) => { if (n && !getValues("name")) setValue("name", n); }}
          />
        )} />
      </FormSection>
      <FormActions>
        {mode === "edit" ? (
          <Button type="button" variant="ghost" className="mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="size-4" /> Delete
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Spinner size="sm" className="text-primary-foreground" /> : "Save"}</Button>
      </FormActions>
    </FormShell>
  );
}
