import { useQuery } from "@apollo/client";

import { DRIVERS_LIST_QUERY } from "@/lib/graphql/documents/drivers";
import { DRIVER_STATUS_OPTIONS } from "@/lib/panel/enum-options";
import {
  buildFilterInput,
  buildOffsetPaging,
  buildSortInput,
  type FilterEntry,
} from "@/lib/panel/page-state";

const APPROVED_VALUE = "Online,Offline,InService";

function StatusCard({
  label,
  value,
  baseFilters,
  active,
  onClick,
}: {
  label: string;
  value: string;
  baseFilters: FilterEntry[];
  active: boolean;
  onClick: () => void;
}) {
  const entries: FilterEntry[] = value
    ? [...baseFilters, { field: "status", operator: value.includes(",") ? "in" : "eq", value }]
    : baseFilters;
  const { data, loading } = useQuery(DRIVERS_LIST_QUERY, {
    variables: {
      paging: buildOffsetPaging({ page: 1, pageSize: 1 }),
      sorting: buildSortInput(null) as never,
      filter: buildFilterInput(entries) as never,
    },
  });
  const count = data?.drivers?.totalCount;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[150px] rounded-xl border px-5 py-4 text-left transition ${
        active ? "border-white/50 bg-white/10" : "border-white/15 hover:border-white/30"
      }`}
    >
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold">{loading && count == null ? "…" : count ?? 0}</div>
    </button>
  );
}

export function DriverStatusCards({
  filters,
  setFilters,
}: {
  filters: FilterEntry[];
  setFilters: (f: FilterEntry[]) => void;
}) {
  const current = filters.find((f) => f.field === "status")?.value ?? "";
  const baseFilters = filters.filter((f) => f.field !== "status");
  const select = (value: string) =>
    setFilters(value && value !== current ? [...baseFilters, { field: "status", operator: value.includes(",") ? "in" : "eq", value }] : baseFilters);
  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <StatusCard label="All" value="" baseFilters={baseFilters} active={!current} onClick={() => select("")} />
      <StatusCard
        label="Approved"
        value={APPROVED_VALUE}
        baseFilters={baseFilters}
        active={current === APPROVED_VALUE}
        onClick={() => select(APPROVED_VALUE)}
      />
      {DRIVER_STATUS_OPTIONS.map((o) => (
        <StatusCard
          key={o.value}
          label={o.label}
          value={o.value}
          baseFilters={baseFilters}
          active={current === o.value}
          onClick={() => select(o.value)}
        />
      ))}
    </div>
  );
}
