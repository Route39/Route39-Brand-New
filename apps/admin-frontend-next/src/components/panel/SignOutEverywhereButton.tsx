import { useMutation, useQuery } from "@apollo/client";
import type { DocumentNode } from "@apollo/client";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/panel/ConfirmAction";

interface Props {
  /** Query that resolves to `{ sessions: { id }[] }`. */
  sessionsQuery: DocumentNode;
  sessionsVariables: Record<string, unknown>;
  /** Path inside the response to the session array. e.g. "driver.sessions" or "customerSessions". */
  sessionsPath: string;
  /** Mutation that terminates a single session by id. */
  terminateMutation: DocumentNode;
  /** GraphQL variable name on the mutation — `id` for staff, `sessionId` for driver/customer. */
  idVariable: "id" | "sessionId";
  label?: string;
}

function walk(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function SignOutEverywhereButton({
  sessionsQuery,
  sessionsVariables,
  sessionsPath,
  terminateMutation,
  idVariable,
  label = "Sign out everywhere",
}: Props) {
  const { data, refetch } = useQuery(sessionsQuery, { variables: sessionsVariables });
  const [terminate] = useMutation(terminateMutation);
  const [running, setRunning] = useState(false);

  const sessions = (walk(data, sessionsPath) ?? []) as { id: string }[];
  const count = sessions.length;

  async function handleConfirm() {
    if (count === 0) {
      toast.success("No active sessions");
      return;
    }
    setRunning(true);
    try {
      let failed = 0;
      for (const s of sessions) {
        try {
          await terminate({ variables: { [idVariable]: s.id } });
        } catch {
          failed++;
        }
      }
      await refetch();
      if (failed === count) {
        toast.error("All session terminations failed");
      } else if (failed > 0) {
        toast.success(`Terminated ${count - failed} of ${count} sessions`);
      } else {
        toast.success(`Terminated ${count} session${count === 1 ? "" : "s"}`);
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <ConfirmAction
      title={label}
      description={
        count === 0
          ? "There are no active sessions for this account."
          : `${count} active session${count === 1 ? "" : "s"} will be signed out and require re-login.`
      }
      actionLabel="Sign out everywhere"
      destructive
      onConfirm={handleConfirm}
      trigger={
        <Button type="button" variant="outline" size="sm" disabled={running}>
          <LogOut className="size-3.5" />
          {label}
          {count > 0 ? <span className="ml-1 text-xs opacity-70">({count})</span> : null}
        </Button>
      }
    />
  );
}
