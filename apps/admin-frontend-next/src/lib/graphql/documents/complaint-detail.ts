import { graphql } from "@/lib/graphql/__generated__";

export const COMPLAINT_DETAIL_QUERY = graphql(`
  query ComplaintDetail($id: ID!) {
    taxiSupportRequest(id: $id) {
      id
      inscriptionTimestamp
      requestedByDriver
      subject
      content
      status
      requestId
      activities(sorting: [{ field: id, direction: ASC }]) {
        id
        createdAt
        type
        comment
        statusFrom
        statusTo
        actor {
          id
          firstName
          lastName
          userName
        }
      }
      assignedToStaffs {
        id
        firstName
        lastName
        userName
      }
    }
  }
`);
