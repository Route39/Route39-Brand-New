import { useOutletContext } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyValueList } from "@/components/panel/KeyValue";
import { formatCurrency } from "@/lib/format";
import type { OrderContext } from "./layout";

export default function OrderFinancialsTab() {
  const { order } = useOutletContext<OrderContext>();
  const fmt = (v: number) => formatCurrency(v, order.currency);

  const isOnlinePayment =
    order.paymentMode === "PaymentGateway" ||
    order.paymentMode === "SavedPaymentMethod";

  const gstAmount = order.gstAmount ?? 0;
  const platformFeeAmount = order.platformFeeAmount ?? 0;
  const paymentGatewayFeeAmount = isOnlinePayment
    ? order.paymentGatewayFeeAmount ?? 0
    : 0;
  const waitingChargeAmount = order.waitingChargeAmount ?? 0;

  const totalCharged =
    (order.costAfterCoupon ?? 0) +
    gstAmount +
    platformFeeAmount +
    paymentGatewayFeeAmount +
    waitingChargeAmount;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Fare breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              { label: "Base cost", value: fmt(order.costBest) },
              { label: "After coupon", value: fmt(order.costAfterCoupon) },
              { label: "Service cost", value: fmt(order.serviceCost) },
              { label: "Wait cost", value: fmt(order.waitCost) },
              { label: "Ride options", value: fmt(order.rideOptionsCost) },
              { label: "Tax", value: fmt(order.taxCost) },
              { label: "GST", value: fmt(gstAmount) },
              { label: "Platform Fee", value: fmt(platformFeeAmount) },
              { label: "Payment Gateway Fee", value: fmt(paymentGatewayFeeAmount) },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              { label: "Currency", value: order.currency },
              { label: "Mode", value: order.paymentMode },
              { label: "Total charged", value: fmt(totalCharged) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
