import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SwitchFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function SwitchField({
  label,
  description,
  checked,
  onChange,
  disabled,
  className,
}: SwitchFieldProps) {
  return (
    <label
      className={cn(
        "flex items-start justify-between gap-4 rounded-md border border-border bg-input/30 px-3 py-2",
        className,
      )}
    >
      <div className="space-y-0.5">
        <Label className="cursor-pointer">{label}</Label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </label>
  );
}
