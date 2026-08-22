import { useQuery } from "@apollo/client";
import { useOutletContext } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { LoadingBlock } from "@/components/panel/StateBlock";
import { FLEET_WALLETS_QUERY } from "@/lib/graphql/documents/payouts";
import { formatCurrency } from "@/lib/format";
import type { FleetContext } from "./layout";

export default function FleetFinancialsTab() {
  const { fleet } = useOutletContext<FleetContext>();
  const { data, loading } = useQuery(FLEET_WALLETS_QUERY, {
    variables: {
      paging: { limit: 50, offset: 0 },
      sorting: [],
      filter: { fleetId: { eq: fleet.id } },
    } as never,
  });

  if (loading && !data) return <LoadingBlock />;

  const wallets = data?.fleetWallets.nodes ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {wallets.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">No wallets yet.</CardContent>
        </Card>
      ) : (
        wallets.map((w) => (
          <Card key={w.id}>
            <CardContent>
              <div className="text-xs font-medium tracking-[0.08em] uppercase text-muted-foreground">
                {w.currency} balance
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">
                {formatCurrency(w.balance, w.currency)}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
