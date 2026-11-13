import { gql, useQuery } from "@apollo/client";
import { CheckCircle2, Inbox, Layers, Search } from "lucide-react";

import {
  buildFilterInput,
  usePageState,
  type FilterEntry,
} from "@/lib/panel/page-state";
import { cn } from "@/lib/utils";

const COMPLAINT_STATUS_COUNTS_QUERY = gql`
  query ComplaintStatusCounts(
    $all: TaxiSupportRequestFilter!
    $submitted: TaxiSupportRequestFilter!
    $underInvestigation: TaxiSupportRequestFilter!
    $resolved: TaxiSupportRequestFilter!
  ) {
    all: taxiSupportRequests(paging: { limit: 1, offset: 0 }, filter: $all, sorting: []) {
      totalCount
    }
    submitted: taxiSupportRequests(paging: { limit: 1, offset: 0 }, filter: $submitted, sorting: []) {
      totalCount
    }
    underInvestigation: taxiSupportRequests(paging: { limit: 1, offset: 0 }, filter: $underInvestigation, sorting: []) {
      totalCount
    }
    resolved: taxiSupportRequests(paging: { limit: 1, offset: 0 }, filter: $resolved, sorting: []) {
      totalCount
    }
  }
`;

const CARDS = [
  { key: "all", label: "All", status: "", icon: Layers, tone: "text-slate-500" },
  { key: "submitted", label: "Submitted", status: "Submitted", icon: Inbox, tone: "text-sky-500" },
  { key: "underInvestigation", label: "Under investigation", status: "UnderInvestigation", icon: Search, tone: "text-amber-500" },
  { key: "resolved", label: "Resolved", status: "Resolved", icon: CheckCircle2, tone: "text-emerald-500" },
] as const;

export function ComplaintStatusCards() {
  const { filters, setFilters } = usePageState();
  // Counts respect every other active filter (e.g. Driver / Rider), but not the status filter itself.
  const base: FilterEntry[] = filters.filter((f) => f.field !== "status");
  const current = filters.find((f) => f.field === "status")?.value ?? "";
  const baseFilter = buildFilterInput(base);

  const { data } = useQuery<any>(COMPLAINT_STATUS_COUNTS_QUERY, {
    variables: {
      all: baseFilter,
      submitted: { ...baseFilter, status: { eq: "Submitted" } },
      underInvestigation: { ...baseFilter, status: { eq: "UnderInvestigation" } },
      resolved: { ...baseFilter, status: { eq: "Resolved" } },
    },
    fetchPolicy: "cache-and-network",
  });

  function select(status: string) {
    // "All" or clicking the active card again clears the status filter.
    if (status === "" || current === status) {
      setFilters(base);
      return;
    }
    setFilters([...base, { field: "status", operator: "eq", value: status }]);
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const active = current === card.status;
        const count = data?.[card.key]?.totalCount;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => select(card.status)}
            className={cn(
              "flex items-center justify-between rounded-xl border bg-card p-4 text-left transition hover:border-primary",
              active ? "border-primary ring-2 ring-primary/30" : "border-border",
            )}
          >
            <div>
              <div className="text-sm text-muted-foreground">{card.label}</div>
              <div className="mt-1 text-2xl font-bold tabular-nums">{count ?? "…"}</div>
            </div>
            <Icon className={cn("h-8 w-8", card.tone)} />
          </button>
        );
      })}
    </div>
  );
}