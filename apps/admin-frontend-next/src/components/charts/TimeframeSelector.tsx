import { cn } from "@/lib/utils";

export type Timeframe = "Daily" | "Weekly" | "Monthly" | "Yearly";

const OPTIONS: Timeframe[] = ["Daily", "Weekly", "Monthly", "Yearly"];

const TICK_FORMATTERS: Record<Timeframe, Intl.DateTimeFormat> = {
  Daily: new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }),
  Weekly: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }),
  Monthly: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }),
  Yearly: new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }),
};

const TOOLTIP_FORMATTERS: Record<Timeframe, Intl.DateTimeFormat> = {
  Daily: new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }),
  Weekly: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }),
  Monthly: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }),
  Yearly: new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }),
};

export function formatChartTime(
  value: string | number | undefined | null,
  timeframe: Timeframe,
  variant: "tick" | "tooltip" = "tick",
): string {
  if (value == null || value === "") return "";
  const ms = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(ms)) return String(value);
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return String(value);
  const formatter = variant === "tick" ? TICK_FORMATTERS[timeframe] : TOOLTIP_FORMATTERS[timeframe];
  return formatter.format(date);
}

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (next: Timeframe) => void;
  className?: string;
}

export function TimeframeSelector({ value, onChange, className }: TimeframeSelectorProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-xs",
        className,
      )}
    >
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded px-2.5 py-1 transition-colors",
            value === option
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
