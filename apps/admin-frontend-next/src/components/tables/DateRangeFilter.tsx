import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePageState, type FilterEntry } from "@/lib/panel/page-state";

type QuickRange = "today" | "week" | "last30";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeek(d: Date): Date {
  const diffToMonday = (d.getDay() + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - diffToMonday);
  return start;
}

function presetRange(range: QuickRange): { from: string; to: string } {
  const now = new Date();
  const to = toDateInput(now);
  if (range === "today") return { from: to, to };
  if (range === "week") return { from: toDateInput(startOfWeek(now)), to };
  const from = new Date(now);
  from.setDate(now.getDate() - 29);
  return { from: toDateInput(from), to };
}

function activeQuickRange(from: string, to: string): QuickRange | "custom" | null {
  if (!from && !to) return null;
  for (const r of ["today", "week", "last30"] as QuickRange[]) {
    const p = presetRange(r);
    if (from === p.from && to === p.to) return r;
  }
  return "custom";
}

function dayStartISO(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

function dayEndISO(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

function toDatePart(value: string): string {
  if (value.length <= 10) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value.slice(0, 10) : toDateInput(d);
}

const okDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number(d.slice(0, 4)) >= 2000;

/** Quick ranges + from → to date inputs. Writes `gte` / `lte` filters on `field` into the URL. */
export function DateRangeFilter({ field }: { field: string }) {
  const { filters, setFilters } = usePageState();

  const dateFrom = toDatePart(
    filters.find((f) => f.field === field && f.operator === "gte")?.value ?? "",
  );
  const dateTo = toDatePart(
    filters.find((f) => f.field === field && f.operator === "lte")?.value ?? "",
  );
  const activeRange = activeQuickRange(dateFrom, dateTo);
  const [fromD, setFromD] = useState(dateFrom);
  const [toD, setToD] = useState(dateTo);

  useEffect(() => setFromD(dateFrom), [dateFrom]);
  useEffect(() => setToD(dateTo), [dateTo]);

  function applyDateRange(from: string, to: string) {
    const next: FilterEntry[] = filters.filter((f) => f.field !== field);
    if (from) next.push({ field, operator: "gte", value: dayStartISO(from) });
    if (to) next.push({ field, operator: "lte", value: dayEndISO(to) });
    setFilters(next);
  }

  function onFromChange(v: string) {
    setFromD(v);
    if (v === "") applyDateRange("", toD && okDate(toD) ? toD : "");
    else if (okDate(v)) applyDateRange(v, okDate(toD) ? toD : "");
  }

  function onToChange(v: string) {
    setToD(v);
    if (v === "") applyDateRange(fromD && okDate(fromD) ? fromD : "", "");
    else if (okDate(v)) applyDateRange(okDate(fromD) ? fromD : "", v);
  }

  const quick: { key: QuickRange; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This week" },
    { key: "last30", label: "Last 30" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
      {quick.map((q) => (
        <Button
          key={q.key}
          type="button"
          size="sm"
          variant={activeRange === q.key ? "default" : "outline"}
          className="rounded-full"
          onClick={() => {
            const { from, to } = presetRange(q.key);
            applyDateRange(from, to);
          }}
        >
          {q.label}
        </Button>
      ))}
      <div className="flex items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1.5">
        <Calendar className="size-3.5 text-muted-foreground" />
        <input
          type="date"
          value={fromD}
          onChange={(e) => onFromChange(e.target.value)}
          className="bg-transparent text-sm outline-none"
        />
        <span className="text-muted-foreground">→</span>
        <input
          type="date"
          value={toD}
          onChange={(e) => onToChange(e.target.value)}
          className="bg-transparent text-sm outline-none"
        />
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={!dateFrom && !dateTo}
        onClick={() => setFilters(filters.filter((f) => f.field !== field))}
      >
        Clear filter
      </Button>
    </div>
  );
}