import { graphql } from "@/lib/graphql/__generated__";

export const ORDER_DETAIL_QUERY = graphql(`
  query OrderDetail($id: ID!) {
    order(id: $id) {
      id
      createdOn
      startTimestamp
      finishTimestamp
      type
      status
      distanceBest
      durationBest
      costBest
      costAfterCoupon
      waitCost
      rideOptionsCost
      taxCost
      serviceCost
      currency
      destinationArrivedTo
      waitMinutes
      addresses
      points {
        lat
        lng
      }
      expectedTimestamp
      paymentMode
      riderId
      driverId
      regionId
      fleetId
      serviceId
    }
  }
`);

export const ORDER_UPDATED_SUBSCRIPTION = graphql(`
  subscription OrderUpdated($orderId: ID!) {
    orderUpdated(orderId: $orderId) {
      id
      status
      startTimestamp
      finishTimestamp
      driverId
    }
  }
`);

export const ORDER_COMPLAINTS_QUERY = graphql(`
  query OrderComplaints($orderId: ID!) {
    taxiSupportRequests(
      filter: { requestId: { eq: $orderId } }
      paging: { limit: 50 }
      sorting: [{ field: id, direction: DESC }]
    ) {
      totalCount
      nodes {
        id
        inscriptionTimestamp
        requestedByDriver
        subject
        status
      }
    }
  }
`);
