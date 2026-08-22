import { graphql } from "@/lib/graphql/__generated__";

export const COMPLAINTS_LIST_QUERY = graphql(`
  query ComplaintsList(
    $paging: OffsetPaging!
    $filter: TaxiSupportRequestFilter!
    $sorting: [TaxiSupportRequestSort!]!
  ) {
    taxiSupportRequests(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        inscriptionTimestamp
        requestedByDriver
        subject
        status
        requestId
      }
    }
  }
`);
