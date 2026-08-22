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
