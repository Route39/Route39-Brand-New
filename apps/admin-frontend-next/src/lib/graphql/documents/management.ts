import { graphql } from "@/lib/graphql/__generated__";

export const ORDER_CANCEL_REASONS_LIST_QUERY = graphql(`
  query OrderCancelReasonsList(
    $paging: OffsetPaging!
    $filter: OrderCancelReasonFilter!
    $sorting: [OrderCancelReasonSort!]!
  ) {
    orderCancelReasons(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        title
        isEnabled
        userType
      }
    }
  }
`);

export const ORDER_CANCEL_REASON_QUERY = graphql(`
  query OrderCancelReason($id: ID!) {
    orderCancelReason(id: $id) {
      id
      title
      isEnabled
      userType
    }
  }
`);

export const CREATE_ORDER_CANCEL_REASON_MUTATION = graphql(`
  mutation CreateOrderCancelReason($input: OrderCancelReasonInput!) {
    createOneOrderCancelReason(input: { orderCancelReason: $input }) {
      id
    }
  }
`);

export const UPDATE_ORDER_CANCEL_REASON_MUTATION = graphql(`
  mutation UpdateOrderCancelReason($id: ID!, $input: OrderCancelReasonInput!) {
    updateOneOrderCancelReason(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_ORDER_CANCEL_REASON_MUTATION = graphql(`
  mutation DeleteOrderCancelReason($id: ID!) {
    deleteOneOrderCancelReason(input: { id: $id }) {
      id
    }
  }
`);

export const REVIEW_PARAMETERS_LIST_QUERY = graphql(`
  query ReviewParametersList($filter: FeedbackParameterFilter!, $sorting: [FeedbackParameterSort!]!) {
    feedbackParameters(filter: $filter, sorting: $sorting) {
      id
      title
      isGood
    }
  }
`);

export const CARS_LIST_QUERIES = graphql(`
  query CarsList {
    carColors(paging: { limit: 100 }) {
      totalCount
      nodes {
        id
        name
      }
    }
    carModels(paging: { limit: 100 }) {
      totalCount
      nodes {
        id
        name
      }
    }
  }
`);

export const REGIONS_LIST_QUERY = graphql(`
  query RegionsList(
    $paging: OffsetPaging!
    $filter: RegionFilter!
    $sorting: [RegionSort!]!
  ) {
    regions(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        name
        currency
        enabled
      }
    }
  }
`);

export const SERVICES_LIST_QUERY = graphql(`
  query ServicesList($filter: ServiceFilter!, $sorting: [ServiceSort!]!) {
    services(filter: $filter, sorting: $sorting) {
      id
      name
      description
      baseFare
      personCapacity
      displayPriority
      orderTypes
      categoryId
    }
  }
`);

export const SERVICE_OPTIONS_LIST_QUERY = graphql(`
  query ServiceOptionsList($filter: ServiceOptionFilter!, $sorting: [ServiceOptionSort!]!) {
    serviceOptions(filter: $filter, sorting: $sorting) {
      id
      name
      type
      additionalFee
      icon
    }
  }
`);

export const FLEETS_LIST_QUERY = graphql(`
  query FleetsList(
    $paging: OffsetPaging!
    $filter: FleetFilter!
    $sorting: [FleetSort!]!
  ) {
    fleets(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        name
        phoneNumber
        mobileNumber
        userName
        isBlocked
        createdAt
      }
    }
  }
`);

export const ZONE_PRICES_LIST_QUERY = graphql(`
  query ZonePricesList(
    $paging: OffsetPaging!
    $filter: ZonePriceFilter!
    $sorting: [ZonePriceSort!]!
  ) {
    zonePrices(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        name
        cost
      }
    }
  }
`);

export const OPERATOR_ROLES_LIST_QUERY = graphql(`
  query OperatorRolesList($filter: OperatorRoleFilter!, $sorting: [OperatorRoleSort!]!) {
    operatorRoles(filter: $filter, sorting: $sorting) {
      id
      title
      permissions
      taxiPermissions
      shopPermissions
      parkingPermissions
      allowedApps
    }
  }
`);

export const OPERATORS_LIST_QUERY = graphql(`
  query OperatorsList(
    $paging: OffsetPaging!
    $filter: OperatorFilter!
    $sorting: [OperatorSort!]!
  ) {
    operators(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        firstName
        lastName
        userName
        email
        mobileNumber
        isBlocked
        roleId
        role {
          id
          title
        }
      }
    }
  }
`);

export const SMS_PROVIDERS_LIST_QUERY = graphql(`
  query SmsProvidersList(
    $paging: OffsetPaging!
    $filter: SMSProviderFilter!
    $sorting: [SMSProviderSort!]!
  ) {
    smsProviders(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        name
        type
        isDefault
        accountId
        fromNumber
      }
    }
  }
`);

export const PAYMENT_GATEWAYS_LIST_QUERY = graphql(`
  query PaymentGatewaysList(
    $paging: OffsetPaging!
    $filter: PaymentGatewayFilter!
    $sorting: [PaymentGatewaySort!]!
  ) {
    paymentGateways(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        title
        type
        enabled
        merchantId
      }
    }
  }
`);
