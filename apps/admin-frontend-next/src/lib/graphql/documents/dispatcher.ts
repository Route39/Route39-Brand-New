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
