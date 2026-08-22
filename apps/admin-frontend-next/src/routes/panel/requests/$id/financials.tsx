import { useOutletContext } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyValueList } from "@/components/panel/KeyValue";
import { formatCurrency } from "@/lib/format";
import type { OrderContext } from "./layout";

export default function OrderFinancialsTab() {
  const { order } = useOutletContext<OrderContext>();
  const fmt = (v: number) => formatCurrency(v, order.currency);

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
              { label: "Total charged", value: fmt(order.costAfterCoupon) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
