import { graphql } from "@/lib/graphql/__generated__";

export const TAXI_PAYOUT_SESSIONS_QUERY = graphql(`
  query TaxiPayoutSessions(
    $paging: OffsetPaging!
    $filter: TaxiPayoutSessionFilter!
    $sorting: [TaxiPayoutSessionSort!]!
  ) {
    taxiPayoutSessions(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        createdAt
        processedAt
        description
        status
        totalAmount
        currency
      }
    }
  }
`);

export const PAYOUT_METHODS_QUERY = graphql(`
  query PayoutMethodsList(
    $paging: OffsetPaging!
    $filter: PayoutMethodFilter!
    $sorting: [PayoutMethodSort!]!
  ) {
    payoutMethods(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        enabled
        currency
        name
        description
        type
      }
    }
  }
`);

export const PROVIDER_WALLETS_QUERY = graphql(`
  query ProviderWallets {
    providerWallets(filter: {}, sorting: []) {
      id
      balance
      currency
    }
  }
`);

export const PROVIDER_TRANSACTIONS_QUERY = graphql(`
  query ProviderTransactions(
    $paging: OffsetPaging!
    $filter: ProviderTransactionFilter!
    $sorting: [ProviderTransactionSort!]!
  ) {
    providerTransactions(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        createdAt
        action
        amount
        currency
        deductType
        rechargeType
        expenseType
      }
    }
  }
`);

export const FLEET_WALLETS_QUERY = graphql(`
  query FleetWallets($paging: OffsetPaging!, $filter: FleetWalletFilter!, $sorting: [FleetWalletSort!]!) {
    fleetWallets(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        balance
        currency
        fleetId
        fleet {
          id
          name
        }
      }
    }
  }
`);

export const DRIVER_WALLETS_LIST_QUERY = graphql(`
  query DriverWalletsList(
    $paging: OffsetPaging!
    $filter: DriverWalletFilter!
    $sorting: [DriverWalletSort!]!
  ) {
    driverWallets(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        balance
        currency
        driverId
      }
    }
  }
`);

export const RIDER_WALLETS_LIST_QUERY = graphql(`
  query RiderWalletsList(
    $paging: OffsetPaging!
    $filter: RiderWalletFilter!
    $sorting: [RiderWalletSort!]!
  ) {
    riderWallets(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        balance
        currency
        riderId
      }
    }
  }
`);
