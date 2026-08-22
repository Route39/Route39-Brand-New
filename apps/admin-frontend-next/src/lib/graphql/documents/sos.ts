import { graphql } from "@/lib/graphql/__generated__";

export const SOS_LIST_QUERY = graphql(`
  query SosList(
    $paging: OffsetPaging!
    $filter: DistressSignalFilter!
    $sorting: [DistressSignalSort!]!
  ) {
    distressSignals(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        createdAt
        status
        comment
        submittedByRider
        requestId
        reason {
          id
          name
        }
      }
    }
  }
`);
