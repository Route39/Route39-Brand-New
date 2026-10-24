import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/Field";
import { FormActions, FormGrid, FormSection, FormShell } from "@/components/forms/FormShell";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/panel/PageHeader";
import { LoadingBlock, ErrorBlock } from "@/components/panel/StateBlock";
import { SwitchField } from "@/components/forms/SwitchField";
import { CREATE_SURGE_SETTING_MUTATION, SURGE_SETTINGS_QUERY, UPDATE_SURGE_SETTING_MUTATION } from "@/lib/graphql/documents/surge";

type S = {
  id: string; isEnabled: boolean; autoSurgeEnabled: boolean; defaultSurgePercent: number; maxSurgePercent: number;
  commissionPercent: number; autoDemandRatio: number; autoWindowMinutes: number; notifyDrivers: boolean; notifyRadiusMeters: number; stackingMode: string; gridEnabled: boolean; gridSizeMeters: number; tierLowRatio: number; tierMidRatio: number; tierHighRatio: number; tierLowPercent: number; tierMidPercent: number; tierHighPercent: number; rainExtraPercent: number;
};
const NUM_KEYS = ["defaultSurgePercent", "maxSurgePercent", "commissionPercent", "autoDemandRatio", "autoWindowMinutes", "notifyRadiusMeters", "gridSizeMeters", "tierLowRatio", "tierMidRatio", "tierHighRatio", "tierLowPercent", "tierMidPercent", "tierHighPercent", "rainExtraPercent"] as const;

export default function SurgeSettingsPage() {
  const { data, loading, error, refetch } = useQuery(SURGE_SETTINGS_QUERY);
  const [createOne] = useMutation(CREATE_SURGE_SETTING_MUTATION);
  const [updateOne, { loading: saving }] = useMutation(UPDATE_SURGE_SETTING_MUTATION);
  const [form, setForm] = useState<S | null>(null);
  const creating = useRef(false);
  const row: S | undefined = data?.surgeSettings?.[0];

  useEffect(() => {
    if (!loading && data && !row && !creating.current) {
      creating.current = true;
      createOne({ variables: { input: {} } }).then(() => refetch());
    }
    if (row) setForm(row);
  }, [loading, data, row, createOne, refetch]);

  if (error) return <ErrorBlock message={error.message} />;
  if (!form) return <LoadingBlock />;
  const set = (k: keyof S, v: unknown) => setForm({ ...form, [k]: v });

  const onSave = async () => {
    const input: Record<string, unknown> = { isEnabled: form.isEnabled, autoSurgeEnabled: form.autoSurgeEnabled, notifyDrivers: form.notifyDrivers, stackingMode: form.stackingMode, gridEnabled: form.gridEnabled };
    NUM_KEYS.forEach((k) => (input[k] = Number(form[k])));
    input.autoWindowMinutes = Math.round(Number(form.autoWindowMinutes));
    input.notifyRadiusMeters = Math.round(Number(form.notifyRadiusMeters));
    input.gridSizeMeters = Math.round(Number(form.gridSizeMeters));
    try {
      await updateOne({ variables: { id: form.id, input } });
      toast.success("Surge settings saved");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };
  const numInput = (k: (typeof NUM_KEYS)[number], label: string, hint?: string) => (
    <Field label={label} htmlFor={k}>
      <Input id={k} type="number" step="0.01" value={String(form[k])} onChange={(e) => set(k, e.target.value)} placeholder={hint} />
    </Field>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Surge settings" description="Global peak-pricing rules. Zones can override %, ₹ and commission." />
      <FormShell onSubmit={(e) => { e.preventDefault(); onSave(); }}>
        <FormSection title="Master switch" description="When OFF, no surge is applied anywhere.">
          <SwitchField label="Surge pricing enabled" checked={form.isEnabled} onChange={(v: boolean) => set("isEnabled", v)} />
        </FormSection>
        <FormSection title="Amounts" description="Used when a zone leaves the field empty.">
          <FormGrid>
            {numInput("defaultSurgePercent", "Default surge %")}
            {numInput("maxSurgePercent", "Max surge % (cap)")}
          </FormGrid>
          <FormGrid>
            {numInput("commissionPercent", "Surge commission % (Route39 share of surge)")}
            <Field label="If 2 surges overlap (e.g. Peak + Rain)" htmlFor="stackingMode">
              <select id="stackingMode" value={form.stackingMode} onChange={(e) => set("stackingMode", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="highest">Use the highest one</option>
                <option value="add">Add them together (up to max cap)</option>
              </select>
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection title="Auto surge" description="System turns 'Auto' zones ON when demand is high.">
          <SwitchField label="Auto surge enabled" checked={form.autoSurgeEnabled} onChange={(v: boolean) => set("autoSurgeEnabled", v)} />
          <FormGrid>
            {numInput("autoDemandRatio", "Trigger: requests ÷ online drivers ≥")}
            {numInput("autoWindowMinutes", "Look-back window (minutes)")}
          </FormGrid>
        </FormSection>
        <FormSection title="Auto Grid (Rapido-style)" description="System watches every region in grid cells and creates surge zones automatically. Admin decides the amounts.">
          <SwitchField label="Auto grid enabled" checked={form.gridEnabled} onChange={(v: boolean) => set("gridEnabled", v)} />
          <FormGrid>
            {numInput("gridSizeMeters", "Grid cell size (meters)")}
            {numInput("rainExtraPercent", "Rain extra %")}
            {numInput("tierLowRatio", "Low demand: requests ÷ drivers ≥")}
            {numInput("tierLowPercent", "Low demand surge %")}
            {numInput("tierMidRatio", "Medium demand: requests ÷ drivers ≥")}
            {numInput("tierMidPercent", "Medium demand surge %")}
            {numInput("tierHighRatio", "High demand: requests ÷ drivers ≥")}
            {numInput("tierHighPercent", "High demand surge %")}
          </FormGrid>
        </FormSection>
        <FormSection title="Driver notifications">
          <SwitchField label="Notify nearby drivers" checked={form.notifyDrivers} onChange={(v: boolean) => set("notifyDrivers", v)} />
          <FormGrid>
            {numInput("notifyRadiusMeters", "Notify radius (meters)")}
            <div />
          </FormGrid>
        </FormSection>
        <FormActions>
          <Button type="submit" disabled={saving}>Save</Button>
        </FormActions>
      </FormShell>
    </div>
  );
}
