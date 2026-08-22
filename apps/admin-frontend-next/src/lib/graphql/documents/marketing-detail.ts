import { graphql } from "@/lib/graphql/__generated__";

export const COUPON_QUERY = graphql(`
  query Coupon($id: ID!) {
    coupon(id: $id) {
      id
      code
      title
      description
      manyUsersCanUse
      manyTimesUserCanUse
      minimumCost
      maximumCost
      startAt
      expireAt
      discountPercent
      discountFlat
      creditGift
      isEnabled
      isFirstTravelOnly
    }
  }
`);

export const CREATE_COUPON_MUTATION = graphql(`
  mutation CreateCoupon($input: CouponInput!) {
    createOneCoupon(input: { coupon: $input }) {
      id
    }
  }
`);

export const UPDATE_COUPON_MUTATION = graphql(`
  mutation UpdateCoupon($id: ID!, $input: CouponInput!) {
    updateOneCoupon(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_COUPON_MUTATION = graphql(`
  mutation DeleteCoupon($id: ID!) {
    deleteOneCoupon(input: { id: $id }) {
      id
    }
  }
`);

export const ANNOUNCEMENT_QUERY = graphql(`
  query Announcement($id: ID!) {
    announcement(id: $id) {
      id
      title
      description
      url
      userType
      appType
      startAt
      expireAt
    }
  }
`);

export const CREATE_ANNOUNCEMENT_MUTATION = graphql(`
  mutation CreateAnnouncementMutation($input: CreateAnnouncementInput!) {
    createAnnouncement(input: $input) {
      id
    }
  }
`);

export const UPDATE_ANNOUNCEMENT_MUTATION = graphql(`
  mutation UpdateAnnouncement($id: ID!, $input: UpdateAnnouncementInput!) {
    updateOneAnnouncement(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_ANNOUNCEMENT_MUTATION = graphql(`
  mutation DeleteAnnouncement($id: ID!) {
    deleteOneAnnouncement(input: { id: $id }) {
      id
    }
  }
`);

export const CREATE_GIFT_BATCH_MUTATION = graphql(`
  mutation CreateGiftBatchMutation($input: CreateGiftBatchInput!) {
    createGiftCardBatch(input: $input) {
      id
    }
  }
`);

export const REWARD_QUERY = graphql(`
  query Reward($id: ID!) {
    reward(id: $id) {
      id
      title
      startDate
      endDate
      appType
      beneficiary
      event
      creditGift
      tripFeePercentGift
      creditCurrency
    }
  }
`);

export const CREATE_REWARD_MUTATION = graphql(`
  mutation CreateReward($input: CreateReward!) {
    createOneReward(input: { reward: $input }) {
      id
    }
  }
`);

export const UPDATE_REWARD_MUTATION = graphql(`
  mutation UpdateReward($id: ID!, $input: UpdateReward!) {
    updateOneReward(input: { id: $id, update: $input }) {
      id
    }
  }
`);

export const DELETE_REWARD_MUTATION = graphql(`
  mutation DeleteReward($id: ID!) {
    deleteOneReward(input: { id: $id }) {
      id
    }
  }
`);

export const GIFT_BATCH_QUERY = graphql(`
  query GiftBatchDetail($id: ID!) {
    giftBatch(id: $id) {
      id
      name
      currency
      amount
      availableFrom
      expireAt
      giftCodes(paging: { limit: 200 }, filter: {}, sorting: []) {
        totalCount
        nodes {
          id
        }
      }
    }
  }
`);
