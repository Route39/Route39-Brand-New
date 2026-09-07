import { useApolloClient } from "@apollo/client";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { WALLET_EXPORT_QUERY } from "@/lib/graphql/documents/payouts";

type WalletTable = "ProviderWallet" | "DriverWallet" | "RiderWallet" | "FleetWallet";

interface WalletExportButtonProps {
  table: WalletTable;
  relations?: string[];
  entityLabel: string;
}

export function WalletExportButton({ table, relations = [], entityLabel }: WalletExportButtonProps) {
  const apollo = useApolloClient();
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const result = await apollo.query({
        query: WALLET_EXPORT_QUERY,
        variables: { input: { table, type: "CSV", relations } },
        fetchPolicy: "network-only",
      });
      const url = result.data?.export?.url;
      if (!url) throw new Error("Export returned no file");

      const a = document.createElement("a");
      a.href = `/${url}`;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
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