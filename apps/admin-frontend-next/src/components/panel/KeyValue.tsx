import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface KeyValueListProps {
  items: { label: string; value: ReactNode }[];
  className?: string;
  cols?: 1 | 2;
}

export function KeyValueList({ items, className, cols = 2 }: KeyValueListProps) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-3 text-sm",
        cols === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground/80">
            {item.label}
          </dt>
          <dd className="text-foreground">
            {item.value ?? <span className="text-muted-foreground">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
