import { useMutation, useQuery } from "@apollo/client";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CREATE_DRIVER_SHIFT_RULE_MUTATION,
  DELETE_DRIVER_SHIFT_RULE_MUTATION,
  DRIVER_SHIFT_RULES_QUERY,
  UPDATE_DRIVER_SHIFT_RULE_MUTATION,
} from "@/lib/graphql/documents/extras-2";

const TIME_FREQUENCIES = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

interface ShiftRule {
  id: string;
  timeFrequency: string;
  maxHoursPerFrequency: number;
  mandatoryBreakMinutes: number;
}

export default function DriverShiftRulesPage() {
  const confirm = useConfirm();
  const { data, loading } = useQuery(DRIVER_SHIFT_RULES_QUERY);
  const refetch = [{ query: DRIVER_SHIFT_RULES_QUERY }];

  const [createOne] = useMutation(CREATE_DRIVER_SHIFT_RULE_MUTATION, { refetchQueries: refetch });
  const [updateOne] = useMutation(UPDATE_DRIVER_SHIFT_RULE_MUTATION, { refetchQueries: refetch });
  const [deleteOne] = useMutation(DELETE_DRIVER_SHIFT_RULE_MUTATION, { refetchQueries: refetch });

  const [draftFrequency, setDraftFrequency] = useState("Daily");
  const [draftHours, setDraftHours] = useState("8");
  const [draftBreak, setDraftBreak] = useState("30");

  if (loading && !data) return <LoadingBlock />;
  const rules = (data?.driverShiftRules ?? []) as ShiftRule[];

  async function handleCreate() {
    const hours = Number(draftHours);
    const brk = Number(draftBreak);
    if (Number.isNaN(hours) || Number.isNaN(brk)) {
      toast.error("Hours and break must be numeric");
      return;
    }
    try {
      await createOne({
        variables: {
          input: {
            timeFrequency: draftFrequency as never,
            maxHoursPerFrequency: hours,
            mandatoryBreakMinutes: brk,
          },
        },
      });
      toast.success("Rule created");
      setDraftHours("8");
      setDraftBreak("30");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function handleUpdate(id: string, patch: Partial<ShiftRule>) {
    const current = rules.find((r) => r.id === id);
    if (!current) return;
    try {
      await updateOne({
        variables: {
          id,
          input: {
            timeFrequency: (patch.timeFrequency ?? current.timeFrequency) as never,
            maxHoursPerFrequency: patch.maxHoursPerFrequency ?? current.maxHoursPerFrequency,
            mandatoryBreakMinutes: patch.mandatoryBreakMinutes ?? current.mandatoryBreakMinutes,
          },
        },
      });
      toast.success("Rule updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleDelete(id: string) {
    if (!(await confirm({ title: "Delete this rule?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Rule deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver shift rules"
        description="Maximum on-duty hours and mandatory break minutes per period."
      />

      <Card>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium">Add a new rule</p>
          <div className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="space-y-1">
              <Label className="text-xs">Frequency</Label>
              <Select value={draftFrequency} onValueChange={setDraftFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max hours per period</Label>
              <Input
                type="number"
                value={draftHours}
                onChange={(e) => setDraftHours(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mandatory break (min)</Label>
              <Input
                type="number"
                value={draftBreak}
                onChange={(e) => setDraftBreak(e.target.value)}
              />
            </div>
            <Button type="button" onClick={handleCreate}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            No shift rules configured yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rules.map((r) => (
            <li key={r.id}>
              <Card size="sm">
                <CardContent className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <div className="space-y-1">
                    <Label className="text-xs">Frequency</Label>
                    <Select
                      value={r.timeFrequency}
                      onValueChange={(v) => handleUpdate(r.id, { timeFrequency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_FREQUENCIES.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max hours</Label>
                    <Input
                      type="number"
                      defaultValue={r.maxHoursPerFrequency}
                      onBlur={(e) => {
                        const next = Number(e.target.value);
                        if (next !== r.maxHoursPerFrequency) handleUpdate(r.id, { maxHoursPerFrequency: next });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Break (min)</Label>
                    <Input
                      type="number"
                      defaultValue={r.mandatoryBreakMinutes}
                      onBlur={(e) => {
                        const next = Number(e.target.value);
                        if (next !== r.mandatoryBreakMinutes)
                          handleUpdate(r.id, { mandatoryBreakMinutes: next });
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
