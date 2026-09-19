import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

function formatCountdown(ms: number) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function PickupTimer({
  arrivedAt,
  freeWaitMinutes,
  isCargo,
}: {
  arrivedAt?: string | null;
  freeWaitMinutes?: number | null;
  isCargo?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!arrivedAt || !isCargo) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, [arrivedAt, isCargo]);

  // Waiting time applies only to cargo orders.
  if (!isCargo || !arrivedAt || freeWaitMinutes == null) {
    return null;
  }

  const deadline =
    new Date(arrivedAt).getTime() + freeWaitMinutes * 60_000;

  const remainingMs = deadline - now;
  const overtime = remainingMs <= 0;

  return (
    <Badge variant={overtime ? "destructive" : "warning"}>
      {overtime
        ? `Free wait over · +${formatCountdown(-remainingMs)}`
        : `Free pickup wait · ${formatCountdown(remainingMs)}`}
    </Badge>
  );
}