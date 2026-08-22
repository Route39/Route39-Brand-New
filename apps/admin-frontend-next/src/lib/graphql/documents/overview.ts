import { graphql } from "@/lib/graphql/__generated__";

export const PLATFORM_KPI_QUERY = graphql(`
  query PlatformKPI($input: PlatformKPIInput!) {
    platformKPI(input: $input) {
      totalOrders {
        name
        unit
        total
        change
      }
      totalRevenue {
        name
        unit
        total
        change
      }
      activeCustomers {
        name
        unit
        total
        change
      }
    }
  }
`);

export const INCOME_CHART_QUERY = graphql(`
  query IncomeChart($timeframe: ChartTimeframe!) {
    incomeChart(timeframe: $timeframe) {
      time
      sum
      currency
    }
  }
`);

export const REQUEST_CHART_QUERY = graphql(`
  query RequestChart($timeframe: ChartTimeframe!) {
    requestChart(timeframe: $timeframe) {
      time
      count
      status
    }
  }
`);

export const DRIVER_REGISTRATIONS_QUERY = graphql(`
  query DriverRegistrations($timeframe: ChartTimeframe!) {
    driverRegistrations(timeframe: $timeframe) {
      time
      count
    }
  }
`);

export const RIDER_REGISTRATIONS_QUERY = graphql(`
  query RiderRegistrations($timeframe: ChartTimeframe!) {
    riderRegistrations(timeframe: $timeframe) {
      time
      count
    }
  }
`);
