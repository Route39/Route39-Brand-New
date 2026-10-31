import { useQuery } from "@apollo/client";
import { CheckCircle2, Clock, Navigation, XCircle } from "lucide-react";
import { ORDERS_AGGREGATE_QUERY } from "@/lib/graphql/documents/orders";
import { buildFilterInput, usePageState, type FilterEntry } from "@/lib/panel/page-state";
import { cn } from "@/lib/utils";

const GROUPS = [
  { key: "booked", label: "Booked", statuses: ["Requested", "Found", "Booked", "WaitingForPrePay"], icon: Clock, tone: "text-amber-500" },
  { key: "ongoing", label: "Ongoing", statuses: ["DriverAccepted", "Arrived", "Started", "WaitingForPostPay", "WaitingForDriverFee"], icon: Navigation, tone: "text-sky-500" },
  { key: "completed", label: "Completed", statuses: ["Finished", "WaitingForReview"], icon: CheckCircle2, tone: "text-emerald-500" },
  { key: "cancelled", label: "Cancelled", statuses: ["RiderCanceled", "DriverCanceled", "Expired", "NotFound", "NoCloseFound"], icon: XCircle, tone: "text-red-500" },
];

type Group = (typeof GROUPS)[number];

function GroupCard({ group, base, active, onClick }: { group: Group; base: FilterEntry[]; active: boolean; onClick: () => void }) {
  const filter = { ...buildFilterInput(base), status: { in: group.statuses } };
  const { data, loading } = useQuery(ORDERS_AGGREGATE_QUERY, {
    variables: { filter: filter as never },
    fetchPolicy: "cache-and-network",
    pollInterval: 15000,
  });
  const raw = (data as any)?.orderAggregate;
  const agg = Array.isArray(raw) ? raw[0] : raw;
  const count = agg?.count?.id ?? 0;
  const Icon = group.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-xl border bg-card p-4 text-left transition hover:border-primary",
        active ? "border-primary ring-2 ring-primary/30" : "border-border",
      )}
    >
      <div>
        <div className="text-sm text-muted-foreground">{group.label}</div>
        <div className="mt-1 text-2xl font-bold">{loading && data == null ? "…" : count}</div>
      </div>
      <Icon className={cn("h-8 w-8", group.tone)} />
    </button>
  );
}

export function OrderStatusCards() {
  const { filters, setFilters } = usePageState();
  const base = filters.filter((f) => (f.field === "status" ? false : true));
  const current = filters.find((f) => f.field === "status" && f.operator === "in")?.value ?? "";
  function toggle(statuses: string[]) {
    const value = statuses.join(",");
    const next: FilterEntry[] = current === value ? base : [...base, { field: "status", operator: "in", value }];
    setFilters(next);
  }
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
      {GROUPS.map((g) => (
        <GroupCard key={g.key} group={g} base={base} active={current === g.statuses.join(",")} onClick={() => toggle(g.statuses)} />
      ))}
    </div>
  );
}
