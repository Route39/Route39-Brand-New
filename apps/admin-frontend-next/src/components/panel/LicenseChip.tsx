import { useQuery } from "@apollo/client";
import { Link } from "react-router-dom";

import { LICENSE_INFORMATION_QUERY } from "@/lib/graphql/documents/extras-2";
import { cn } from "@/lib/utils";

type SupportStatus = "active" | "soon" | "expired" | "unknown";

function supportStatusFor(date: string | null | undefined): SupportStatus {
  if (!date) return "unknown";
  const expiry = new Date(date).getTime();
  if (Number.isNaN(expiry)) return "unknown";
  const days = Math.round((expiry - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  return "active";
}

const STATUS_DOT_CLASS: Record<SupportStatus, string> = {
  active: "bg-emerald-500",
  soon: "bg-amber-500",
  expired: "bg-red-500",
  unknown: "bg-muted-foreground/50",
};

export function LicenseChip() {
  const { data, error } = useQuery(LICENSE_INFORMATION_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const license = data?.licenseInformation?.license;
  if (error || !license) return null;

  const status = supportStatusFor(license.supportExpireDate);
  const buyer = license.buyerName || "Licensed";

  return (
    <Link
      to="/management/settings#license"
      className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <span
        aria-hidden
        className={cn("size-2 shrink-0 rounded-full", STATUS_DOT_CLASS[status])}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sidebar-foreground/90">{buyer}</span>
        <span className="block truncate text-[11px] text-sidebar-foreground/60">
          {license.licenseType}
        </span>
      </span>
    </Link>
  );
}
