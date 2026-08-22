import { graphql } from "@/lib/graphql/__generated__";

export const SOS_DETAIL_QUERY = graphql(`
  query SosDetail($id: ID!) {
    distressSignal(id: $id) {
      id
      createdAt
      status
      comment
      submittedByRider
      requestId
      location {
        lat
        lng
      }
      reason {
        id
        name
      }
      activities(sorting: [{ field: id, direction: ASC }]) {
        id
        createdAt
        action
        note
        operatorId
      }
    }
  }
`);
