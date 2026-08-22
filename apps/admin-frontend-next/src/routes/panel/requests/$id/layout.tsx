import { useMutation, useQuery } from "@apollo/client";
import { Ban } from "lucide-react";
import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/panel/ConfirmAction";
import { DetailHeader } from "@/components/panel/DetailHeader";
import { TabNav } from "@/components/panel/TabNav";
import { Badge } from "@/components/ui/badge";
import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { CANCEL_ORDER_MUTATION } from "@/lib/graphql/documents/admin-actions";
import {
  ORDER_DETAIL_QUERY,
  ORDER_UPDATED_SUBSCRIPTION,
} from "@/lib/graphql/documents/order-detail";
import { orderStatusVariant } from "@/lib/panel/status-styles";
import type { OrderDetailQuery } from "@/lib/graphql/__generated__/graphql";

export type OrderContext = { order: OrderDetailQuery["order"] };

export default function OrderDetailLayout() {
  const { id } = useParams();
  const { data, loading, error, subscribeToMore } = useQuery(ORDER_DETAIL_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  // Subscribe to live status changes for this order.
  useEffect(() => {
    if (!id) return;
    return subscribeToMore({
      document: ORDER_UPDATED_SUBSCRIPTION,
      variables: { orderId: id },
      updateQuery: (prev, { subscriptionData }) => {
        const updated = subscriptionData.data?.orderUpdated;
        if (!updated || !prev?.order) return prev;
        return { ...prev, order: { ...prev.order, ...updated } };
      },
    });
  }, [id, subscribeToMore]);

  const [cancelOrder] = useMutation(CANCEL_ORDER_MUTATION);

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.order) return <ErrorBlock message="Order not found." />;

  const order = data.order;

  const cancellable = !["Finished", "DriverCanceled", "RiderCanceled", "Expired"].includes(order.status);

  async function handleCancel() {
    try {
      await cancelOrder({ variables: { orderId: order.id } });
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    }
  }

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/requests"
        backLabel="All requests"
        title={`Order #${order.id}`}
        subtitle={
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide">{order.type}</span>
            <span>·</span>
            <span>{order.addresses[0] ?? "—"}</span>
          </div>
        }
        badges={<Badge variant={orderStatusVariant(order.status)}>{order.status}</Badge>}
        actions={
          cancellable ? (
            <ConfirmAction
              title="Cancel this order?"
              description="The rider and driver will be notified. This cannot be undone."
              actionLabel="Cancel order"
              destructive
              onConfirm={handleCancel}
              trigger={
                <Button type="button" variant="outline" size="sm" className="text-destructive">
                  <Ban className="size-3.5" />
                  Cancel order
                </Button>
              }
            />
          ) : null
        }
      />
      <TabNav
        tabs={[
          { to: "info", label: "Info" },
          { to: "assign", label: "Assign" },
          { to: "chats", label: "Chats" },
          { to: "activities", label: "Activities" },
          { to: "financials", label: "Financials" },
          { to: "complaints", label: "Complaints" },
        ]}
      />
      <Outlet context={{ order } satisfies OrderContext} />
    </div>
  );
}
