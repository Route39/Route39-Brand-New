import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

interface Tab {
  to: string;
  label: string;
  end?: boolean;
}

interface TabNavProps {
  tabs: Tab[];
  className?: string;
}

export function TabNav({ tabs, className }: TabNavProps) {
  return (
    <nav
      className={cn(
        "flex flex-wrap items-center gap-1 border-b border-border/60",
        className,
      )}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              "relative rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              isActive && "text-foreground",
              isActive &&
                "after:absolute after:right-0 after:-bottom-px after:left-0 after:h-0.5 after:bg-primary after:content-['']",
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
