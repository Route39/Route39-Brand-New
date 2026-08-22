import { graphql } from "@/lib/graphql/__generated__";

export const TAXI_PAYOUT_SESSION_QUERY = graphql(`
  query TaxiPayoutSession($id: ID!) {
    taxiPayoutSession(id: $id) {
      id
      createdAt
      processedAt
      description
      status
      totalAmount
      currency
      driverTransactions(paging: { limit: 200 }, filter: {}, sorting: []) {
        totalCount
        nodes {
          id
          createdAt
          action
          status
          amount
          currency
          driverId
        }
      }
    }
  }
`);

export const CREATE_TAXI_PAYOUT_SESSION_MUTATION = graphql(`
  mutation CreateTaxiPayoutSession($input: CreatePayoutSessionInput!) {
    createTaxiPayoutSession(input: $input) {
      id
    }
  }
`);

export const PAYOUT_METHOD_QUERY = graphql(`
  query PayoutMethod($id: ID!) {
    payoutMethod(id: $id) {
      id
      enabled
      name
      description
      currency
      type
      publicKey
      privateKey
      saltKey
      merchantId
    }
  }
`);

export const CREATE_PAYOUT_METHOD_MUTATION = graphql(`
  mutation CreatePayoutMethod($input: CreatePayoutMethodInput!) {
    createOnePayoutMethod(input: { payoutMethod: $input }) {
      id
    }
  }
`);

export const UPDATE_PAYOUT_METHOD_MUTATION = graphql(`
  mutation UpdatePayoutMethod($id: ID!, $input: CreatePayoutMethodInput!) {
    updateOnePayoutMethod(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_PAYOUT_METHOD_MUTATION = graphql(`
  mutation DeletePayoutMethod($id: ID!) {
    deleteOnePayoutMethod(input: { id: $id }) {
      id
    }
  }
`);
