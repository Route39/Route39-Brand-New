import { graphql } from "@/lib/graphql/__generated__";

export const DRIVER_DETAIL_QUERY = graphql(`
  query DriverDetail($id: ID!) {
    driver(id: $id) {
      id
      firstName
      lastName
      mobileNumber
      email
      countryIso
      certificateNumber
      address
      gender
      status
      rating
      reviewCount
      registrationTimestamp
      lastSeenTimestamp
      fleetId
      carPlate
      carProductionYear
      carId
      carColorId
      bankName
      accountNumber
      bankRoutingNumber
      bankSwift
      canDeliver
      maxDeliveryPackageSize
      softRejectionNote
      media {
        id
        address
      }
    }
  }
`);

export const DRIVER_FEEDBACKS_QUERY = graphql(`
  query DriverFeedbacks($driverId: ID!, $paging: OffsetPaging!) {
    feedbacks(
      filter: { driverId: { eq: $driverId } }
      paging: $paging
      sorting: [{ field: id, direction: DESC }]
    ) {
      totalCount
      nodes {
        id
        score
        reviewTimestamp
        description
        requestId
      }
    }
  }
`);

export const DRIVER_WALLETS_QUERY = graphql(`
  query DriverWallets($driverId: ID!) {
    driverWallets(filter: { driverId: { eq: $driverId } }, paging: { limit: 20 }) {
      totalCount
      nodes {
        id
        balance
        currency
      }
    }
  }
`);

export const DRIVER_TRANSACTIONS_QUERY = graphql(`
  query DriverTransactions($driverId: ID!, $paging: OffsetPaging!) {
    driverTransactions(
      filter: { driverId: { eq: $driverId } }
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

export const DRIVER_DOCUMENTS_QUERY = graphql(`
  query DriverDocumentsForDriver($driverId: ID!) {
    driverToDriverDocuments(filter: { driverId: { eq: $driverId } }, paging: { first: 50 }) {
      edges {
        node {
          id
          expiresAt
          driverDocument {
            id
            title
          }
          media {
            id
            address
          }
        }
      }
    }
  }
`);
