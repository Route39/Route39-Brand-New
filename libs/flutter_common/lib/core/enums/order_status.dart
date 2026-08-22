enum OrderStatus {
  requested,
  notFound,
  noCloseFound,
  found,
  driverAccepted,
  arrived,
  waitingForPrePay,
  driverCanceled,
  riderCanceled,
  started,
  waitingForPostPay,
  waitingForReview,
  finished,
  booked,
  expired;

  OrderStatusViewMode get viewMode {
    return switch (this) {
      OrderStatus.requested ||
      OrderStatus.notFound ||
      OrderStatus.noCloseFound ||
      OrderStatus.found => OrderStatusViewMode.looking,
      OrderStatus.waitingForPostPay || OrderStatus.waitingForPrePay => OrderStatusViewMode.waitingForPayment,
      OrderStatus.driverAccepted || OrderStatus.started || OrderStatus.arrived => OrderStatusViewMode.inProgress,
      OrderStatus.waitingForReview ||
      OrderStatus.booked ||
      OrderStatus.driverCanceled ||
      OrderStatus.riderCanceled ||
      OrderStatus.finished ||
      OrderStatus.expired => OrderStatusViewMode.finished,
    };
  }
}

enum OrderStatusViewMode { looking, waitingForPayment, inProgress, finished }
