import { graphql } from "@/lib/graphql/__generated__";

export const RIDERS_LIST_QUERY = graphql(`
  query RidersList(
    $paging: OffsetPaging!
    $filter: RiderFilter!
    $sorting: [RiderSort!]!
  ) {
    riders(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        firstName
        lastName
        mobileNumber
        email
        status
        registrationTimestamp
        lastActivityAt
        ratingAggregate {
          rating
          reviewCount
        }
        media {
          id
          address
        }
      }
    }
  }
`);
