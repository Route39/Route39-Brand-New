import { EmptyBlock } from "@/components/panel/StateBlock";

export function OrderAssignTab() {
  return (
    <EmptyBlock
      title="Driver assignment"
      description="Live driver-on-map assignment lands in Phase 5 (subscriptions + maps)."
    />
  );
}

export function OrderChatsTab() {
  return (
    <EmptyBlock
      title="Conversation"
      description="In-app messaging between rider and driver lands in a future phase."
    />
  );
}

export function OrderActivitiesTab() {
  return (
    <EmptyBlock
      title="Activity timeline"
      description="Order activity log will be wired up in a future phase."
    />
  );
}
