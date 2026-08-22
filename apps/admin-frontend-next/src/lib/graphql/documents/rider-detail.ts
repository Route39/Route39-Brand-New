import { graphql } from "@/lib/graphql/__generated__";

export const RIDER_DETAIL_QUERY = graphql(`
  query RiderDetail($id: ID!) {
    rider(id: $id) {
      id
      firstName
      lastName
      mobileNumber
      email
      countryIso
      gender
      status
      isResident
      idNumber
      lastActivityAt
      registrationTimestamp
      ratingAggregate {
        rating
        reviewCount
      }
      media {
        id
        address
      }
    }
  }
`);

export const RIDER_ADDRESSES_QUERY = graphql(`
  query RiderAddresses($riderId: ID!) {
    riderAddresses(filter: { riderId: { eq: $riderId } }, paging: { limit: 50 }) {
      totalCount
      nodes {
        id
        type
        title
        details
        location {
          lat
          lng
        }
      }
    }
  }
`);

export const RIDER_WALLETS_QUERY = graphql(`
  query RiderWallets($riderId: ID!) {
    riderWallets(filter: { riderId: { eq: $riderId } }, paging: { limit: 20 }) {
      totalCount
      nodes {
        id
        balance
        currency
      }
    }
  }
`);

export const RIDER_TRANSACTIONS_QUERY = graphql(`
  query RiderTransactions($riderId: ID!, $paging: OffsetPaging!) {
    riderTransactions(
      filter: { riderId: { eq: $riderId } }
      paging: $paging
      sorting: [{ field: createdAt, direction: DESC }]
    ) {
      totalCount
      nodes {
        id
        createdAt
        action
        status
        amount
        currency
        deductType
        rechargeType
      }
    }
  }
`);
