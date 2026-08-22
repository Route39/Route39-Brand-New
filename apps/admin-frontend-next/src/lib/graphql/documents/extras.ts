import { graphql } from "@/lib/graphql/__generated__";

// Driver location (last known) — used by the Order assign tab and the
// driver detail header for live position display.
export const DRIVERS_LOCATION_QUERY = graphql(`
  query DriversLocationWithData($center: PointInput!, $count: Int!) {
    getDriversLocationWithData(center: $center, count: $count) {
      id
      location {
        lat
        lng
      }
      lastUpdatedAt
      firstName
      lastName
      mobileNumber
      avatarUrl
      status
    }
  }
`);

// Driver notes
export const DRIVER_NOTES_QUERY = graphql(`
  query DriverNotes($driverId: ID!) {
    driverNotes(
      filter: { driverId: { eq: $driverId } }
      paging: { limit: 50 }
      sorting: [{ field: id, direction: DESC }]
    ) {
      nodes {
        id
        createdAt
        note
        staff {
          id
          firstName
          lastName
          userName
        }
      }
    }
  }
`);

export const CREATE_DRIVER_NOTE_MUTATION = graphql(`
  mutation CreateDriverNote($input: CreateDriverNoteInput!) {
    createOneDriverNote(input: { driverNote: $input }) {
      id
    }
  }
`);

// Customer (rider) notes — flat array, no paging on this query.
export const CUSTOMER_NOTES_QUERY = graphql(`
  query CustomerNotes($customerId: ID!) {
    customerNotes(
      filter: { customerId: { eq: $customerId } }
      sorting: [{ field: id, direction: DESC }]
    ) {
      id
      createdAt
      note
      createdBy {
        id
        firstName
        lastName
        userName
      }
    }
  }
`);

export const CREATE_CUSTOMER_NOTE_MUTATION = graphql(`
  mutation CreateCustomerNote($input: CreateCustomerNoteInput!) {
    createOneCustomerNote(input: { customerNote: $input }) {
      id
    }
  }
`);

// Order (taxi) notes — separate top-level paginated query.
export const ORDER_NOTES_QUERY = graphql(`
  query OrderNotes($orderId: ID!) {
    taxiOrderNotes(
      filter: { orderId: { eq: $orderId } }
      paging: { limit: 50 }
      sorting: [{ field: id, direction: DESC }]
    ) {
      nodes {
        id
        createdAt
        note
        staff {
          id
          firstName
          lastName
          userName
        }
      }
    }
  }
`);

export const CREATE_ORDER_NOTE_MUTATION = graphql(`
  mutation CreateOrderNote($input: CreateTaxiOrderNoteInput!) {
    createTaxiOrderNote(input: $input) {
      id
    }
  }
`);

// Driver service activation — `enabledServices` returns join rows, not Service.
export const DRIVER_SERVICE_ACTIVATION_QUERY = graphql(`
  query DriverServiceActivation($driverId: ID!) {
    driver(id: $driverId) {
      id
      enabledServices(filter: {}, sorting: []) {
        serviceId
        driverEnabled
        service {
          id
          name
        }
      }
    }
    services(filter: {}, sorting: []) {
      id
      name
    }
  }
`);

export const SET_ACTIVATED_SERVICES_MUTATION = graphql(`
  mutation SetActivatedServices($input: SetActiveServicesOnDriverInput!) {
    setActivatedServicesOnDriver(input: $input)
  }
`);

// Operator profile (own)
export const UPDATE_PROFILE_MUTATION = graphql(`
  mutation UpdateMyProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      firstName
      lastName
      email
      mobileNumber
      userName
    }
  }
`);
