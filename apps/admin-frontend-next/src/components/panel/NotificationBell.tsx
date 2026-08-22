import { useQuery } from "@apollo/client";
import { Bell, CarTaxiFront, Headphones, ShieldAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  COMPLAINT_CREATED_SUBSCRIPTION,
  NOTIFICATION_COUNTS_QUERY,
  SOS_CREATED_SUBSCRIPTION,
} from "@/lib/graphql/documents/notifications";
import { cn } from "@/lib/utils";

const SOUND_URL = `${import.meta.env.BASE_URL}sounds/notification.mp3`;

export function NotificationBell() {
  const { data, refetch, subscribeToMore } = useQuery(NOTIFICATION_COUNTS_QUERY, {
    pollInterval: 60_000,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(SOUND_URL);
    audioRef.current.preload = "auto";
  }, []);

  useEffect(() => {
    return subscribeToMore({
      document: SOS_CREATED_SUBSCRIPTION,
      updateQuery: (prev) => {
        audioRef.current?.play().catch(() => {});
        void refetch();
        return prev;
      },
    });
  }, [refetch, subscribeToMore]);

  useEffect(() => {
    return subscribeToMore({
      document: COMPLAINT_CREATED_SUBSCRIPTION,
      updateQuery: (prev) => {
        audioRef.current?.play().catch(() => {});
        void refetch();
        return prev;
      },
    });
  }, [refetch, subscribeToMore]);

  const pending = data?.pendingDrivers[0]?.count?.id ?? 0;
  const sos = data?.openSos[0]?.count?.id ?? 0;
  const complaints = data?.openComplaints[0]?.count?.id ?? 0;
  const total = Number(pending) + Number(sos) + Number(complaints);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="size-4" />
          {total > 0 ? (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-medium leading-none text-destructive-foreground",
                "bg-destructive",
              )}
            >
              {total > 99 ? "99+" : total}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-1">
        <NotifRow
          icon={<CarTaxiFront className="size-4" />}
          label="Pending drivers"
          count={Number(pending)}
          to="/drivers?filter=status%7Cin%7CPendingApproval"
        />
        <NotifRow
          icon={<ShieldAlert className="size-4" />}
          label="Open SOS"
          count={Number(sos)}
          to="/sos?filter=status%7Cin%7CSubmitted"
        />
        <NotifRow
          icon={<Headphones className="size-4" />}
          label="Open complaints"
          count={Number(complaints)}
          to="/complaints?filter=status%7Cin%7CSubmitted"
        />
      </PopoverContent>
    </Popover>
  );
}

function NotifRow({
  icon,
  label,
  count,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  to: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/60",
      )}
    >
      <span className="flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </span>
        {label}
      </span>
      <span
        className={cn(
          "rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums",
          count > 0 && "bg-destructive text-destructive-foreground",
        )}
      >
        {count}
      </span>
    </Link>
  );
}
