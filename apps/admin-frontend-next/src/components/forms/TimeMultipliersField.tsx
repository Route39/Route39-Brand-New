import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface TimeMultiplier {
  startTime: string;
  endTime: string;
  multiply: number;
}

interface Props {
  value: TimeMultiplier[];
  onChange: (next: TimeMultiplier[]) => void;
}

export function TimeMultipliersField({ value, onChange }: Props) {
  function update(idx: number, patch: Partial<TimeMultiplier>) {
    onChange(value.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  }
  function add() {
    onChange([...value, { startTime: "00:00", endTime: "23:59", multiply: 1 }]);
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {value.map((m, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 rounded-md border border-border bg-input/20 p-2"
          >
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">Start</span>
              <Input
                type="time"
                value={m.startTime}
                onChange={(e) => update(i, { startTime: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">End</span>
              <Input
                type="time"
                value={m.endTime}
                onChange={(e) => update(i, { endTime: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">Multiplier</span>
              <Input
                type="number"
                step="0.01"
                value={m.multiply}
                onChange={(e) => update(i, { multiply: Number(e.target.value) })}
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-3.5" />
        Add multiplier
      </Button>
    </div>
  );
}
