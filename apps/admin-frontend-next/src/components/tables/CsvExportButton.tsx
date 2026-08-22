import { useApolloClient } from "@apollo/client";
import type { DocumentNode } from "@apollo/client";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface ExportField {
  field: string;
  label?: string;
}

interface CsvExportButtonProps {
  /** Top-level export query (e.g. EXPORT_DRIVERS_QUERY). */
  query: DocumentNode;
  /** Field whose return value is the CSV/PDF content from the response. */
  resultField: string;
  /** Fields to include in the export. */
  fields: ExportField[];
  /** Server-side filter applied to the export — usually the same as the visible filter. */
  filter?: Record<string, unknown>;
  /** Server-side sort. */
  sorting?: unknown[];
  /** Used in the toast and as the download filename root. */
  entityLabel: string;
}

/**
 * Triggers a server-side CSV export and downloads the result as a file.
 * Server returns the export contents as a string; we drop it into a Blob and
 * surface a browser download.
 */
export function CsvExportButton({
  query,
  resultField,
  fields,
  filter = {},
  sorting = [],
  entityLabel,
}: CsvExportButtonProps) {
  const apollo = useApolloClient();
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const result = await apollo.query({
        query,
        variables: {
          format: "CSV",
          fields,
          filter,
          sorting,
        },
        fetchPolicy: "network-only",
      });
      const csv = (result.data as Record<string, unknown>)?.[resultField];
      if (typeof csv !== "string") throw new Error("Export returned no data");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entityLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${entityLabel} exported`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={busy}>
      <Download className="size-3.5" />
      {busy ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
