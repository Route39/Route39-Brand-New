import { graphql } from "@/lib/graphql/__generated__";

export const ORDERS_AGGREGATE_QUERY = graphql(`
  query OrdersAggregate($filter: OrderAggregateFilter) {
    orderAggregate(filter: $filter) {
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
  }
`);

export const ORDERS_LIST_QUERY = graphql(`
  query OrdersList(
    $paging: OffsetPaging!
    $filter: OrderFilter!
    $sorting: [OrderSort!]!
  ) {
    orders(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        createdOn
        startTimestamp
        finishTimestamp
        type
        status
        costBest
        costAfterCoupon
        gstAmount
        platformFeeAmount
        paymentGatewayFeeAmount
        waitingChargeAmount
        currency
        addresses
        riderId
        driverId
        fleetId
      }
    }
  }
`);
