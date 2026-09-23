import { graphql } from "@/lib/graphql/__generated__";

export const CITY_ORDERS_TODAY_QUERY = graphql(`
  query CityOrdersToday($filter: OrderAggregateFilter, $cashFilter: OrderAggregateFilter) {
    allOrders: orderAggregate(filter: $filter) {
      groupBy {
        driverId
      }
      count {
        id
      }
      sum {
        costAfterCoupon
        gstAmount
        platformFeeAmount
        paymentGatewayFeeAmount
      }
    }
    cashOrders: orderAggregate(filter: $cashFilter) {
      groupBy {
        driverId
      }
      sum {
        costAfterCoupon
        gstAmount
        platformFeeAmount
        paymentGatewayFeeAmount
      }
    }
  }
`);

export const CITY_ONLINE_DRIVERS_QUERY = graphql(`
  query CityOnlineDrivers($filter: DriverAggregateFilter) {
    driverAggregate(filter: $filter) {
      groupBy {
        city
      }
      count {
        id
      }
    }
  }
`);

export const CITY_DRIVERS_BY_IDS_QUERY = graphql(`
  query CityDriversByIds($filter: DriverFilter!, $paging: OffsetPaging!, $sorting: [DriverSort!]!) {
    drivers(paging: $paging, filter: $filter, sorting: $sorting) {
      nodes {
        id
        city
      }
    }
  }
`);
