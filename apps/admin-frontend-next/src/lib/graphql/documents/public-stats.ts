import { graphql } from "@/lib/graphql/__generated__";

export const PUBLIC_LIVE_STATS_QUERY = graphql(`
  query PublicLiveStats {
    publicLiveStats {
      driversOnline
      tripsToday
      avgPickupMinutes
    }
  }
`);
