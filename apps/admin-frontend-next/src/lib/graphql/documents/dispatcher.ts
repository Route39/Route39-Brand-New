import { graphql } from "@/lib/graphql/__generated__";

export const CALCULATE_FARE_MUTATION = graphql(`
  query CalculateFare($input: CalculateFareInput!) {
    calculateFare(input: $input) {
      currency
      distance
      duration
      error
      services {
        id
        name
        services {
          id
          name
          description
          personCapacity
          cost
          gstPercent
          platformFee
        }
      }
    }
  }
`);

export const CREATE_ORDER_MUTATION = graphql(`
  mutation CreateDispatchOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      status
    }
  }
`);

export const REVERSE_GEOCODE_QUERY = graphql(`
  query ReverseGeocode($location: PointInput!) {
    reverseGeocode(location: $location) {
      address
      title
      point {
        lat
        lng
      }
    }
  }
`);

export const DISPATCHER_RIDERS_QUERY = graphql(`
  query DispatcherRiders($search: String) {
    riders(
      paging: { limit: 20 }
      filter: {
        or: [
          { firstName: { like: $search } }
          { lastName: { like: $search } }
          { mobileNumber: { like: $search } }
        ]
      }
      sorting: [{ field: id, direction: DESC }]
    ) {
      nodes {
        id
        firstName
        lastName
        mobileNumber
      }
    }
  }
`);

// Used by the "New Booking" quick-create flow: looks up an existing rider by
// exact mobile number so repeat customers don't get duplicated.
export const DISPATCHER_RIDER_BY_MOBILE_QUERY = graphql(`
  query DispatcherRiderByMobile($mobileNumber: String!) {
    riders(paging: { limit: 1 }, filter: { mobileNumber: { eq: $mobileNumber } }) {
      nodes {
        id
      }
    }
  }
`);

// Creates a minimal rider record (mobile number + optional name only) when
// no matching rider was found above. This is the same createOneRider
// mutation the Riders tab uses, just called automatically from the popup.
export const CREATE_QUICK_RIDER_MUTATION = graphql(`
  mutation CreateQuickRider($input: RiderInput!) {
    createOneRider(input: { rider: $input }) {
      id
    }
  }
`);
