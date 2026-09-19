import { graphql } from "@/lib/graphql/__generated__";

/**
 * One row per driver: total trips + total collected, for whatever
 * OrderAggregateFilter (date range, etc.) is passed in. Grouping happens
 * server-side because `groupBy { driverId }` is selected.
 */
export const DRIVER_COLLECTION_AGGREGATE_QUERY = graphql(`
  query DriverCollectionAggregate($filter: OrderAggregateFilter) {
    orderAggregate(filter: $filter) {
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
  }
`);

/** Driver display info (name, phone, vehicle plate) for a set of driver ids. */
export const DRIVERS_BY_IDS_QUERY = graphql(`
  query DriversByIds($filter: DriverFilter!, $paging: OffsetPaging!, $sorting: [DriverSort!]!) {
    drivers(paging: $paging, filter: $filter, sorting: $sorting) {
      nodes {
        id
        firstName
        lastName
        mobileNumber
        carPlate
      }
    }
  }
`);

/** Trip-level rows for a single driver, for the invoice preview. */
export const DRIVER_TRIP_DETAILS_QUERY = graphql(`
  query DriverTripDetails($paging: OffsetPaging!, $filter: OrderFilter!, $sorting: [OrderSort!]!) {
    orders(paging: $paging, filter: $filter, sorting: $sorting) {
      nodes {
        id
        createdOn
        startTimestamp
        addresses
        costAfterCoupon
        gstAmount
        platformFeeAmount
        paymentGatewayFeeAmount
        currency
      }
    }
  }
`);