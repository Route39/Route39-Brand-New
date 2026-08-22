import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

export type SortDirection = "ASC" | "DESC";

export interface SortEntry {
  field: string;
  direction: SortDirection;
}

export interface FilterEntry {
  field: string;
  /** nestjs-query operator: eq, like, notLike, in, notIn, gt, gte, lt, lte, isNull, between */
  operator: string;
  value: string;
}

const LIKE_OPERATORS = new Set(["like", "notLike", "iLike", "notILike"]);

function wrapWildcards(value: string): string {
  if (!value) return value;
  return /[%_]/.test(value) ? value : `%${value}%`;
}

const DEFAULT_PAGE_SIZE = 10;

interface PageState {
  page: number;
  pageSize: number;
  sort: SortEntry | null;
  filters: FilterEntry[];
}

function parseSort(raw: string | null): SortEntry | null {
  if (!raw) return null;
  const [field, direction] = raw.split("|");
  if (!field || (direction !== "ASC" && direction !== "DESC")) return null;
  return { field, direction };
}

function parseFilters(rawValues: string[]): FilterEntry[] {
  return rawValues.flatMap((raw) => {
    const [field, operator, value] = raw.split("|");
    if (!field || !operator) return [];
    return [{ field, operator, value: value ?? "" }];
  });
}

export function usePageState() {
  const [params, setParams] = useSearchParams();

  const state = useMemo<PageState>(() => {
    const page = Math.max(1, Number(params.get("page") ?? 1));
    const pageSize = Math.max(1, Number(params.get("pageSize") ?? DEFAULT_PAGE_SIZE));
    const sort = parseSort(params.get("sort"));
    const filters = parseFilters(params.getAll("filter"));
    return { page, pageSize, sort, filters };
  }, [params]);

  const setPage = useCallback(
    (next: number) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next <= 1) p.delete("page");
          else p.set("page", String(next));
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setPageSize = useCallback(
    (next: number) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next === DEFAULT_PAGE_SIZE) p.delete("pageSize");
          else p.set("pageSize", String(next));
          p.delete("page");
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setSort = useCallback(
    (next: SortEntry | null) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (!next) p.delete("sort");
          else p.set("sort", `${next.field}|${next.direction}`);
          p.delete("page");
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setFilters = useCallback(
    (next: FilterEntry[]) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.delete("filter");
          for (const f of next) p.append("filter", `${f.field}|${f.operator}|${f.value}`);
          p.delete("page");
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const removeFilter = useCallback(
    (field: string) => setFilters(state.filters.filter((f) => f.field !== field)),
    [setFilters, state.filters],
  );

  const clearFilters = useCallback(() => setFilters([]), [setFilters]);

  const toggleSort = useCallback(
    (field: string) => {
      const current = state.sort;
      if (!current || current.field !== field) {
        setSort({ field, direction: "ASC" });
      } else if (current.direction === "ASC") {
        setSort({ field, direction: "DESC" });
      } else {
        setSort(null);
      }
    },
    [setSort, state.sort],
  );

  return {
    ...state,
    setPage,
    setPageSize,
    setSort,
    setFilters,
    toggleSort,
    removeFilter,
    clearFilters,
  };
}

/**
 * Hook to read/write a single filter field. Returns `[value, setValue]`.
 * Setting an empty string clears the filter.
 */
export function useFilterField(field: string, operator = "eq") {
  const { filters, setFilters } = usePageState();
  const current = filters.find((f) => f.field === field);
  const setValue = useCallback(
    (next: string) => {
      const without = filters.filter((f) => f.field !== field);
      if (next.trim().length === 0) {
        setFilters(without);
        return;
      }
      setFilters([...without, { field, operator, value: next }]);
    },
    [field, filters, operator, setFilters],
  );
  return [current?.value ?? "", setValue] as const;
}

export function buildOffsetPaging({ page, pageSize }: { page: number; pageSize: number }) {
  return { limit: pageSize, offset: (page - 1) * pageSize };
}

export function buildSortInput(sort: SortEntry | null) {
  return sort ? [{ field: sort.field, direction: sort.direction }] : [];
}

/** Converts FilterEntry[] into the nestjs-query filter shape. */
export function buildFilterInput(filters: FilterEntry[]): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const f of filters) {
    if (!f.value && !["isNull", "isNotNull"].includes(f.operator)) continue;
    out[f.field] ??= {};
    if (f.operator === "in" || f.operator === "notIn") {
      out[f.field][f.operator] = f.value.split(",").map((v) => v.trim()).filter(Boolean);
    } else if (f.operator === "isNull" || f.operator === "isNotNull") {
      out[f.field].is = f.operator === "isNull";
    } else if (f.operator === "is" || f.operator === "isNot") {
      out[f.field][f.operator] = f.value === "true";
    } else if (LIKE_OPERATORS.has(f.operator)) {
      const mysqlOp = f.operator === "iLike" ? "like" : f.operator === "notILike" ? "notLike" : f.operator;
      out[f.field][mysqlOp] = wrapWildcards(f.value);
    } else {
      out[f.field][f.operator] = f.value;
    }
  }
  return out;
}
