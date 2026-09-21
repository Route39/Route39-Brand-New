import { graphql } from "@/lib/graphql/__generated__";

export const TOTAL_ONLINE_DRIVERS_QUERY = graphql(`
  query TotalOnlineDrivers($filter: DriverAggregateFilter) {
    driverAggregate(filter: $filter) {
      count {
        id
      }
    }
  }
`);
