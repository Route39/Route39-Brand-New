import { graphql } from "@/lib/graphql/__generated__";

export const DRIVERS_LIST_QUERY = graphql(`
  query DriversList(
    $paging: OffsetPaging!
    $filter: DriverFilter!
    $sorting: [DriverSort!]!
  ) {
    drivers(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        driverCode
        firstName
        lastName
        mobileNumber
        status
        carPlate
        rating
        reviewCount
        registrationTimestamp
        lastSeenTimestamp
        fleetId
        media {
          id
          address
        }
      }
    }
  }
`);

export const VEHICLES_LIST_QUERY = graphql(`
  query VehiclesList(
    $paging: OffsetPaging!
    $filter: DriverFilter!
    $sorting: [DriverSort!]!
  ) {
    drivers(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        driverCode
        firstName
        lastName
        mobileNumber
        status
        carPlate
        city
        canDeliver
      }
    }
  }
`);

export const VEHICLES_COUNT_QUERY = graphql(`
  query VehiclesCount($filter: DriverFilter!) {
    drivers(paging: { limit: 1 }, filter: $filter, sorting: []) {
      totalCount
    }
  }
`);
