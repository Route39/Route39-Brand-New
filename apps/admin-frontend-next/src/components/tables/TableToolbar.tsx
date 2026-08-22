import { Search, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFilterField, usePageState } from "@/lib/panel/page-state";

interface TableToolbarProps {
  children?: ReactNode;
  className?: string;
}

export function TableToolbar({ children, className }: TableToolbarProps) {
  const { filters, removeFilter, clearFilters } = usePageState();
  const hasActive = filters.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {hasActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto h-8"
          >
            Clear all
          </Button>
        ) : null}
      </div>
      {hasActive ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((f) => (
            <Badge
              key={`${f.field}-${f.operator}`}
              variant="muted"
              className="gap-1.5 py-1 pr-1 pl-2"
            >
              <span className="text-[10px] tracking-wide uppercase text-muted-foreground/80">
                {f.field}
              </span>
              <span className="font-medium">{f.value || "—"}</span>
              <button
                type="button"
                onClick={() => removeFilter(f.field)}
                aria-label={`Remove ${f.field} filter`}
                className="ml-0.5 rounded p-0.5 hover:bg-muted-foreground/15"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface FilterTextProps {
  field: string;
  placeholder?: string;
  /** Default `like` — `buildFilterInput` wraps the value in `%` wildcards. */
  operator?: string;
  className?: string;
}

export function FilterText({
  field,
  placeholder,
  operator = "like",
  className,
}: FilterTextProps) {
  const [stored, setStored] = useFilterField(field, operator);
  const [draft, setDraft] = useState(stored);

  // Keep draft in sync if the URL changes externally (e.g. clear-all clicked).
  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  // Debounce so each keystroke doesn't fire a query.
  useEffect(() => {
    if (draft === stored) return;
    const t = window.setTimeout(() => setStored(draft), 250);
    return () => window.clearTimeout(t);
  }, [draft, stored, setStored]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-56 pl-8"
      />
    </div>
  );
}

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  field: string;
  options: FilterSelectOption[];
  placeholder?: string;
  /** Default `eq`. Use `in` for multi-value behaviour (set value as comma-list). */
  operator?: string;
  width?: string;
}

export function FilterSelect({
  field,
  options,
  placeholder = "All",
  operator = "eq",
  width = "10rem",
}: FilterSelectProps) {
  const [value, setValue] = useFilterField(field, operator);

  return (
    <Select
      value={value || "__all__"}
      onValueChange={(v) => setValue(v === "__all__" ? "" : v)}
    >
      <SelectTrigger style={{ width }}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
