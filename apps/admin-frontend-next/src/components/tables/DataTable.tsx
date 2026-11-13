import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePageState } from "@/lib/panel/page-state";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  /** Pass the GraphQL sort field name to enable column sort. */
  sortField?: string;
  /** Override how a cell renders. Defaults to dot-walking the row by `key`. */
  cell?: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  totalCount?: number | null;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Optional "rows per page" dropdown options (e.g. [10, 20, 30]). Hidden when not passed. */
  pageSizeOptions?: number[];
}

function defaultCell<T>(row: T, key: string): ReactNode {
  const parts = key.split(".");
  let v: unknown = row;
  for (const p of parts) {
    if (v == null || typeof v !== "object") return null;
    v = (v as Record<string, unknown>)[p];
  }
  if (v == null) return <span className="text-muted-foreground">—</span>;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}

export function DataTable<T>({
  columns,
  rows,
  totalCount,
  loading,
  error,
  emptyMessage = "No records found.",
  rowKey,
  onRowClick,
  pageSizeOptions,
}: DataTableProps<T>) {
  const { page, pageSize, sort, setPage, setPageSize, toggleSort } = usePageState();
  const totalPages = Math.max(1, Math.ceil((totalCount ?? rows.length) / pageSize));
  const showingFrom = (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, totalCount ?? rows.length);

  const alignClass = {
    left: "text-left",
    right: "text-right",
    center: "text-center",
  } as const;

  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => {
              const isSorted = sort?.field === col.sortField;
              const Icon = !isSorted
                ? ArrowUpDown
                : sort?.direction === "ASC"
                  ? ArrowUp
                  : ArrowDown;
              return (
                <TableHead
                  key={col.key}
                  className={cn(col.align && alignClass[col.align], col.className)}
                >
                  {col.sortField ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.sortField!)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {col.header}
                      <Icon className="size-3" />
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && rows.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  data-state={onRowClick ? "interactive" : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(col.align && alignClass[col.align], col.className)}
                    >
                      {col.cell ? col.cell(row) : defaultCell(row, col.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>
      {!loading && rows.length === 0 ? (
        <TableEmpty>{error ? <span className="text-destructive">{error}</span> : emptyMessage}</TableEmpty>
      ) : null}
      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div>
            {totalCount != null && rows.length > 0
              ? `Showing ${showingFrom}–${showingTo} of ${totalCount}`
              : null}
          </div>
          {pageSizeOptions ? (
            <label className="flex items-center gap-2">
              Rows per page
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
