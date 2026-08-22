import { graphql } from "@/lib/graphql/__generated__";

// Session termination
export const TERMINATE_STAFF_SESSION_MUTATION = graphql(`
  mutation TerminateStaffSession($id: ID!) {
    terminateStaffSession(id: $id)
  }
`);

export const TERMINATE_CUSTOMER_LOGIN_SESSION_MUTATION = graphql(`
  mutation TerminateCustomerLoginSession($sessionId: ID!) {
    terminateCustomerLoginSession(sessionId: $sessionId)
  }
`);

export const TERMINATE_DRIVER_LOGIN_SESSION_MUTATION = graphql(`
  mutation TerminateDriverLoginSession($sessionId: ID!) {
    terminateDriverLoginSession(sessionId: $sessionId)
  }
`);

export const TERMINATE_FLEET_STAFF_SESSION_MUTATION = graphql(`
  mutation TerminateFleetStaffSession($id: ID!) {
    terminateFleetStaffSession(id: $id)
  }
`);

// Active session lookup for driver / rider termination buttons
export const DRIVER_SESSIONS_QUERY = graphql(`
  query DriverSessions($driverId: ID!) {
    driver(id: $driverId) {
      id
      sessions(filter: {}, sorting: []) {
        id
      }
    }
  }
`);

export const RIDER_SESSIONS_QUERY = graphql(`
  query RiderSessions($riderId: ID!) {
    customerSessions(filter: { customerId: { eq: $riderId } }, sorting: []) {
      id
    }
  }
`);

// Exports (CSV / PDF)
export const EXPORT_DRIVERS_QUERY = graphql(`
  query ExportDrivers($format: ExportFormat!, $fields: [ExportFieldInput!]!, $filter: DriverFilter!, $sorting: [DriverSort!]!) {
    exportDrivers(format: $format, fields: $fields, filter: $filter, sorting: $sorting)
  }
`);
export const EXPORT_RIDERS_QUERY = graphql(`
  query ExportRiders($format: ExportFormat!, $fields: [ExportFieldInput!]!, $filter: RiderFilter!, $sorting: [RiderSort!]!) {
    exportRiders(format: $format, fields: $fields, filter: $filter, sorting: $sorting)
  }
`);
export const EXPORT_ORDERS_QUERY = graphql(`
  query ExportOrders($format: ExportFormat!, $fields: [ExportFieldInput!]!, $filter: OrderFilter!, $sorting: [OrderSort!]!) {
    exportOrders(format: $format, fields: $fields, filter: $filter, sorting: $sorting)
  }
`);
export const EXPORT_DRIVER_TRANSACTIONS_QUERY = graphql(`
  query ExportDriverTransactions($format: ExportFormat!, $fields: [ExportFieldInput!]!, $filter: DriverTransactionFilter!, $sorting: [DriverTransactionSort!]!) {
    exportDriverTransactions(format: $format, fields: $fields, filter: $filter, sorting: $sorting)
  }
`);
export const EXPORT_RIDER_TRANSACTIONS_QUERY = graphql(`
  query ExportRiderTransactions($format: ExportFormat!, $fields: [ExportFieldInput!]!, $filter: RiderTransactionFilter!, $sorting: [RiderTransactionSort!]!) {
    exportRiderTransactions(format: $format, fields: $fields, filter: $filter, sorting: $sorting)
  }
`);
export const EXPORT_FLEETS_QUERY = graphql(`
  query ExportFleets($format: ExportFormat!, $fields: [ExportFieldInput!]!, $filter: FleetFilter!, $sorting: [FleetSort!]!) {
    exportFleets(format: $format, fields: $fields, filter: $filter, sorting: $sorting)
  }
`);
export const EXPORT_FLEET_TRANSACTIONS_QUERY = graphql(`
  query ExportFleetTransactions($format: ExportFormat!, $fields: [ExportFieldInput!]!, $filter: FleetTransactionFilter!, $sorting: [FleetTransactionSort!]!) {
    exportFleetTransactions(format: $format, fields: $fields, filter: $filter, sorting: $sorting)
  }
`);
export const EXPORT_PROVIDER_TRANSACTIONS_QUERY = graphql(`
  query ExportProviderTransactions($format: ExportFormat!, $fields: [ExportFieldInput!]!, $filter: ProviderTransactionFilter!, $sorting: [ProviderTransactionSort!]!) {
    exportProviderTransactions(format: $format, fields: $fields, filter: $filter, sorting: $sorting)
  }
`);
export const EXPORT_PAYOUT_SESSION_MUTATION = graphql(`
  mutation ExportPayoutSession($input: ExportSessionToCsvInput!) {
    exportTaxiPayoutSessionToCsv(input: $input)
  }
`);

// Driver shift rules
export const DRIVER_SHIFT_RULES_QUERY = graphql(`
  query DriverShiftRules {
    driverShiftRules(filter: {}, sorting: []) {
      id
      timeFrequency
      maxHoursPerFrequency
      mandatoryBreakMinutes
    }
  }
`);
export const CREATE_DRIVER_SHIFT_RULE_MUTATION = graphql(`
  mutation CreateDriverShiftRule($input: DriverShiftRuleInput!) {
    createOneDriverShiftRule(input: { driverShiftRule: $input }) {
      id
    }
  }
`);
export const UPDATE_DRIVER_SHIFT_RULE_MUTATION = graphql(`
  mutation UpdateDriverShiftRule($id: ID!, $input: DriverShiftRuleInput!) {
    updateOneDriverShiftRule(input: { id: $id, update: $input }) {
      id
    }
  }
`);
export const DELETE_DRIVER_SHIFT_RULE_MUTATION = graphql(`
  mutation DeleteDriverShiftRule($id: ID!) {
    deleteOneDriverShiftRule(input: { id: $id }) {
      id
    }
  }
`);

// Driver document retention policies
export const RETENTION_POLICIES_QUERY = graphql(`
  query DriverDocumentRetentionPolicies {
    driverDocumentRetentionPolicies(filter: {}, sorting: [], paging: { first: 100 }) {
      edges {
        node {
          id
          title
          deleteAfterDays
        }
      }
    }
    driverDocuments(filter: {}, sorting: []) {
      id
      title
    }
  }
`);
export const CREATE_RETENTION_POLICY_MUTATION = graphql(`
  mutation CreateRetentionPolicy($input: DriverDocumentRetentionPolicyInput!) {
    createOneDriverDocumentRetentionPolicy(input: { driverDocumentRetentionPolicy: $input }) {
      id
    }
  }
`);
export const UPDATE_RETENTION_POLICY_MUTATION = graphql(`
  mutation UpdateRetentionPolicy($id: ID!, $input: DriverDocumentRetentionPolicyInput!) {
    updateOneDriverDocumentRetentionPolicy(input: { id: $id, update: $input }) {
      id
    }
  }
`);
export const DELETE_RETENTION_POLICY_MUTATION = graphql(`
  mutation DeleteRetentionPolicy($id: ID!) {
    deleteOneDriverDocumentRetentionPolicy(input: { id: $id }) {
      id
    }
  }
`);

// Service-region / Service-options binding
export const SERVICE_BINDINGS_QUERY = graphql(`
  query ServiceBindings($id: ID!) {
    service(id: $id) {
      id
      regions(filter: {}, sorting: []) {
        id
        name
      }
      options(filter: {}, sorting: []) {
        id
        name
      }
    }
  }
`);
export const SET_REGIONS_ON_SERVICE_MUTATION = graphql(`
  mutation SetRegionsOnService($id: ID!, $relationIds: [ID!]!) {
    setRegionsOnService(input: { id: $id, relationIds: $relationIds }) {
      id
    }
  }
`);
export const SET_OPTIONS_ON_SERVICE_MUTATION = graphql(`
  mutation SetOptionsOnService($id: ID!, $relationIds: [ID!]!) {
    setOptionsOnService(input: { id: $id, relationIds: $relationIds }) {
      id
    }
  }
`);

// Zone price service / fleet bindings
export const ZONE_PRICE_BINDINGS_QUERY = graphql(`
  query ZonePriceBindings($id: ID!) {
    zonePrice(id: $id) {
      id
      services(filter: {}, sorting: []) {
        id
        name
      }
      fleets(filter: {}, sorting: []) {
        id
        name
      }
    }
  }
`);
export const SET_SERVICES_ON_ZONE_PRICE_MUTATION = graphql(`
  mutation SetServicesOnZonePrice($id: ID!, $relationIds: [ID!]!) {
    setServicesOnZonePrice(input: { id: $id, relationIds: $relationIds }) {
      id
    }
  }
`);
export const SET_FLEETS_ON_ZONE_PRICE_MUTATION = graphql(`
  mutation SetFleetsOnZonePrice($id: ID!, $relationIds: [ID!]!) {
    setFleetsOnZonePrice(input: { id: $id, relationIds: $relationIds }) {
      id
    }
  }
`);

// Legacy Twilio config
export const SAVE_CONFIGURATION_MUTATION = graphql(`
  mutation SaveConfiguration($input: UpdateConfigInput!) {
    saveConfiguration(input: $input) {
      backendMapsAPIKey
    }
  }
`);

// License status (read-only, safe field set — no benefits/drawbacks/availableUpgrades)
export const LICENSE_INFORMATION_QUERY = graphql(`
  query LicenseInformation {
    licenseInformation {
      license {
        buyerName
        licenseType
        supportExpireDate
        connectedApps
        platformAddons
      }
    }
  }
`);
