import { graphql } from "@/lib/graphql/__generated__";

// Review parameters
export const REVIEW_PARAMETER_QUERY = graphql(`
  query ReviewParameter($id: ID!) {
    feedbackParameter(id: $id) {
      id
      title
      isGood
    }
  }
`);

export const CREATE_REVIEW_PARAMETER_MUTATION = graphql(`
  mutation CreateReviewParameter($input: FeedbackParameterInput!) {
    createOneFeedbackParameter(input: { feedbackParameter: $input }) {
      id
    }
  }
`);

export const UPDATE_REVIEW_PARAMETER_MUTATION = graphql(`
  mutation UpdateReviewParameter($id: ID!, $input: FeedbackParameterInput!) {
    updateOneFeedbackParameter(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_REVIEW_PARAMETER_MUTATION = graphql(`
  mutation DeleteReviewParameter($id: ID!) {
    deleteOneFeedbackParameter(input: { id: $id }) {
      id
    }
  }
`);

// Service options
export const SERVICE_OPTION_QUERY = graphql(`
  query ServiceOption($id: ID!) {
    serviceOption(id: $id) {
      id
      name
      type
      additionalFee
      icon
    }
  }
`);

export const CREATE_SERVICE_OPTION_MUTATION = graphql(`
  mutation CreateServiceOption($input: ServiceOptionInput!) {
    createOneServiceOption(input: { serviceOption: $input }) {
      id
    }
  }
`);

export const UPDATE_SERVICE_OPTION_MUTATION = graphql(`
  mutation UpdateServiceOption($id: ID!, $input: ServiceOptionInput!) {
    updateOneServiceOption(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_SERVICE_OPTION_MUTATION = graphql(`
  mutation DeleteServiceOption($id: ID!) {
    deleteOneServiceOption(input: { id: $id }) {
      id
    }
  }
`);

// SMS providers
export const SMS_PROVIDER_QUERY = graphql(`
  query SmsProvider($id: ID!) {
    smsProvider(id: $id) {
      id
      name
      type
      isDefault
      accountId
      authToken
      fromNumber
      verificationTemplate
      smsType
      callMaskingNumber
      callMaskingEnabled
    }
  }
`);

export const CREATE_SMS_PROVIDER_MUTATION = graphql(`
  mutation CreateSmsProvider($input: SMSProviderInput!) {
    createOneSMSProvider(input: { sMSProvider: $input }) {
      id
    }
  }
`);

export const UPDATE_SMS_PROVIDER_MUTATION = graphql(`
  mutation UpdateSmsProvider($id: ID!, $input: SMSProviderInput!) {
    updateOneSMSProvider(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_SMS_PROVIDER_MUTATION = graphql(`
  mutation DeleteSmsProvider($id: ID!) {
    deleteOneSMSProvider(input: { id: $id }) {
      id
    }
  }
`);

export const MARK_SMS_PROVIDER_DEFAULT_MUTATION = graphql(`
  mutation MarkSmsProviderDefault($id: ID!) {
    markSMSProviderAsDefault(id: $id) {
      id
      isDefault
    }
  }
`);

// Payment gateways
export const PAYMENT_GATEWAY_QUERY = graphql(`
  query PaymentGateway($id: ID!) {
    paymentGateway(id: $id) {
      id
      enabled
      title
      type
      publicKey
      privateKey
      merchantId
      saltKey
    }
  }
`);

export const CREATE_PAYMENT_GATEWAY_MUTATION = graphql(`
  mutation CreatePaymentGateway($input: CreatePaymentGatewayInput!) {
    createOnePaymentGateway(input: { paymentGateway: $input }) {
      id
    }
  }
`);

export const UPDATE_PAYMENT_GATEWAY_MUTATION = graphql(`
  mutation UpdatePaymentGateway($id: ID!, $input: UpdatePaymentGatewayInput!) {
    updateOnePaymentGateway(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_PAYMENT_GATEWAY_MUTATION = graphql(`
  mutation DeletePaymentGateway($id: ID!) {
    deleteOnePaymentGateway(input: { id: $id }) {
      id
    }
  }
`);

// Operators (admin users)
export const OPERATOR_QUERY = graphql(`
  query Operator($id: ID!) {
    operator(id: $id) {
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
`);

export const CREATE_OPERATOR_MUTATION = graphql(`
  mutation CreateOperator($input: CreateOperatorInput!) {
    createOneOperator(input: { operator: $input }) {
      id
    }
  }
`);

export const UPDATE_OPERATOR_MUTATION = graphql(`
  mutation UpdateOperator($id: ID!, $input: UpdateOperatorInput!) {
    updateOneOperator(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_OPERATOR_MUTATION = graphql(`
  mutation DeleteOperator($id: ID!) {
    deleteOneOperator(input: { id: $id }) {
      id
    }
  }
`);

// Operator roles
export const OPERATOR_ROLE_QUERY = graphql(`
  query OperatorRole($id: ID!) {
    operatorRole(id: $id) {
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

export const CREATE_OPERATOR_ROLE_MUTATION = graphql(`
  mutation CreateOperatorRole($input: OperatorRoleInput!) {
    createOneOperatorRole(input: { operatorRole: $input }) {
      id
    }
  }
`);

export const UPDATE_OPERATOR_ROLE_MUTATION = graphql(`
  mutation UpdateOperatorRole($id: ID!, $input: OperatorRoleInput!) {
    updateOneOperatorRole(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_OPERATOR_ROLE_MUTATION = graphql(`
  mutation DeleteOperatorRole($id: ID!) {
    deleteOneOperatorRole(input: { id: $id }) {
      id
    }
  }
`);
