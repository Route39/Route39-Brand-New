import { graphql } from "@/lib/graphql/__generated__";

export const NOTIFICATION_COUNTS_QUERY = graphql(`
  query NotificationCounts {
    pendingDrivers: driverAggregate(filter: { status: { eq: PendingApproval } }) {
      count {
        id
      }
    }
    openSos: distressSignalAggregate(filter: { status: { eq: Submitted } }) {
      count {
        id
      }
    }
    openComplaints: taxiSupportRequestAggregate(filter: { status: { eq: Submitted } }) {
      count {
        id
      }
    }
  }
`);

export const SOS_CREATED_SUBSCRIPTION = graphql(`
  subscription SosCreated {
    sosCreated {
      id
      status
    }
  }
`);

export const COMPLAINT_CREATED_SUBSCRIPTION = graphql(`
  subscription ComplaintCreated {
    complaintCreated {
      id
      status
    }
  }
`);
