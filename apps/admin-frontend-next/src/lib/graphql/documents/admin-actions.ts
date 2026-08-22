import { graphql } from "@/lib/graphql/__generated__";

// Order admin actions
export const CANCEL_ORDER_MUTATION = graphql(`
  mutation CancelOrder($orderId: ID!) {
    cancelOrder(orderId: $orderId) {
      id
      status
    }
  }
`);

export const ASSIGN_DRIVER_TO_ORDER_MUTATION = graphql(`
  mutation AssignDriverToOrder($orderId: ID!, $driverId: ID!) {
    assignDriverToOrder(orderId: $orderId, driverId: $driverId) {
      id
      status
      driver {
        id
      }
    }
  }
`);

// SOS workflow
export const UPDATE_SOS_MUTATION = graphql(`
  mutation UpdateDistressSignal($id: ID!, $status: SOSStatus!) {
    updateOneDistressSignal(input: { id: $id, update: { status: $status } }) {
      id
      status
    }
  }
`);

export const CREATE_SOS_ACTIVITY_MUTATION = graphql(`
  mutation CreateSosActivity($input: CreateSOSAcitivtyInput!) {
    createOneSOSActivity(input: { sOSActivity: $input }) {
      id
    }
  }
`);

// Complaint workflow
export const ADD_COMPLAINT_COMMENT_MUTATION = graphql(`
  mutation AddComplaintComment($input: CreateTaxiSupportRequestCommentInput!) {
    addCommentToTaxiSupportRequest(input: $input) {
      id
    }
  }
`);

export const ASSIGN_COMPLAINT_MUTATION = graphql(`
  mutation AssignComplaint($input: AssignTaxiSupportRequestInput!) {
    assignTaxiSupportRequestToStaff(input: $input) {
      id
    }
  }
`);

export const CHANGE_COMPLAINT_STATUS_MUTATION = graphql(`
  mutation ChangeComplaintStatus($input: ChangeTaxiSupportRequestStatusInput!) {
    changeTaxiSupportRequestStatus(input: $input) {
      id
    }
  }
`);

// Wallet adjustments
export const CREATE_DRIVER_TRANSACTION_MUTATION = graphql(`
  mutation CreateDriverTransaction($input: DriverTransactionInput!) {
    createOneDriverTransaction(input: { driverTransaction: $input }) {
      id
    }
  }
`);

export const CREATE_RIDER_TRANSACTION_MUTATION = graphql(`
  mutation CreateRiderTransaction($input: RiderTransactionInput!) {
    createRiderTransaction(input: $input) {
      id
    }
  }
`);

// Order conversation + driver locations (for assign tab)
export const ORDER_CONVERSATION_QUERY = graphql(`
  query OrderConversation($orderId: ID!) {
    order(id: $orderId) {
      id
      conversation(filter: {}, sorting: [{ field: id, direction: ASC }]) {
        id
        sentAt
        sentByDriver
        status
        content
      }
    }
  }
`);

export const NEARBY_DRIVERS_QUERY = graphql(`
  query NearbyDriversForAssign {
    drivers(
      paging: { limit: 50 }
      filter: { status: { in: [Online, InService] } }
      sorting: [{ field: id, direction: DESC }]
    ) {
      totalCount
      nodes {
        id
        firstName
        lastName
        mobileNumber
        carPlate
        status
        rating
      }
    }
  }
`);

export const DRIVER_LOCATIONS_BY_VIEWPORT_QUERY = graphql(`
  query DriverLocationsByViewport($bounds: BoundsInput!) {
    driverLocationsByViewport(bounds: $bounds) {
      h3Resolution
      h3IndexesInView
      totalCount
      clusters {
        h3Index
        count
        location {
          lat
          lng
        }
      }
      singles {
        driverId
        point {
          lat
          lng
          heading
        }
      }
    }
  }
`);

export const DRIVER_LOCATION_CLUSTER_SUBSCRIPTION = graphql(`
  subscription DriverLocationCluster($h3Resolution: Int!, $h3IndexIds: [String!]!) {
    driverLocationClusterUpdate(h3Resolution: $h3Resolution, h3IndexIds: $h3IndexIds) {
      h3Index
      count
      location {
        lat
        lng
      }
    }
  }
`);

// Service categories
export const SERVICE_CATEGORIES_LIST_QUERY = graphql(`
  query ServiceCategoriesList(
    $filter: ServiceCategoryFilter!
    $sorting: [ServiceCategorySort!]!
  ) {
    serviceCategories(filter: $filter, sorting: $sorting) {
      id
      name
    }
  }
`);

export const SERVICE_CATEGORY_QUERY = graphql(`
  query ServiceCategory($id: ID!) {
    serviceCategory(id: $id) {
      id
      name
    }
  }
`);

export const CREATE_SERVICE_CATEGORY_MUTATION = graphql(`
  mutation CreateServiceCategory($input: ServiceCategoryInput!) {
    createOneServiceCategory(input: { serviceCategory: $input }) {
      id
    }
  }
`);

export const UPDATE_SERVICE_CATEGORY_MUTATION = graphql(`
  mutation UpdateServiceCategory($id: ID!, $input: ServiceCategoryInput!) {
    updateOneServiceCategory(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_SERVICE_CATEGORY_MUTATION = graphql(`
  mutation DeleteServiceCategory($id: ID!) {
    deleteOneServiceCategory(input: { id: $id }) {
      id
    }
  }
`);
