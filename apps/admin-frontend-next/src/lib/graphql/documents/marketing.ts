import { graphql } from "@/lib/graphql/__generated__";

export const COUPONS_LIST_QUERY = graphql(`
  query CouponsList(
    $paging: OffsetPaging!
    $filter: CouponFilter!
    $sorting: [CouponSort!]!
  ) {
    coupons(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        code
        title
        description
        startAt
        expireAt
        discountPercent
        discountFlat
        minimumCost
        maximumCost
      }
    }
  }
`);

export const ANNOUNCEMENTS_LIST_QUERY = graphql(`
  query AnnouncementsList(
    $paging: OffsetPaging!
    $filter: AnnouncementFilter!
    $sorting: [AnnouncementSort!]!
  ) {
    announcements(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        title
        description
        userType
        appType
        startAt
        expireAt
      }
    }
  }
`);

export const GIFT_BATCHES_LIST_QUERY = graphql(`
  query GiftBatchesList(
    $paging: OffsetPaging!
    $filter: GiftBatchFilter!
    $sorting: [GiftBatchSort!]!
  ) {
    giftBatches(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        name
        amount
        currency
        availableFrom
        expireAt
      }
    }
  }
`);

export const REWARDS_LIST_QUERY = graphql(`
  query RewardsList(
    $paging: OffsetPaging!
    $filter: RewardFilter!
    $sorting: [RewardSort!]!
  ) {
    rewards(paging: $paging, filter: $filter, sorting: $sorting) {
      totalCount
      nodes {
        id
        title
        appType
        beneficiary
        event
        creditGift
        creditCurrency
      }
    }
  }
`);
