import { useQuery } from "@apollo/client";
import { useOutletContext } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { ORDER_CONVERSATION_QUERY } from "@/lib/graphql/documents/admin-actions";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { OrderContext } from "./layout";

interface Message {
  id: string;
  sentAt: string;
  sentByDriver: boolean;
  status: string;
  content: string;
}

export default function OrderChatsTab() {
  const { order } = useOutletContext<OrderContext>();
  const { data, loading } = useQuery(ORDER_CONVERSATION_QUERY, {
    variables: { orderId: order.id },
  });

  if (loading && !data) return <LoadingBlock />;

  const messages = (data?.order.conversation ?? []) as Message[];

  if (messages.length === 0) {
    return (
      <EmptyBlock
        title="No messages"
        description="The rider and driver have not exchanged messages on this order."
      />
    );
  }

  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex flex-col gap-0.5",
              m.sentByDriver ? "items-end" : "items-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                m.sentByDriver
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm bg-muted text-foreground",
              )}
            >
              {m.content}
            </div>
            <div className="px-1 text-[11px] text-muted-foreground">
              {m.sentByDriver ? "Driver" : "Rider"} · {formatDateTime(m.sentAt)} · {m.status}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
