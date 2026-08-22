import type { BadgeProps } from "@/components/ui/badge";

type Variant = NonNullable<BadgeProps["variant"]>;

export function driverStatusVariant(status: string | null | undefined): Variant {
  switch (status) {
    case "Approved":
    case "InService":
    case "Online":
      return "success";
    case "PendingApproval":
    case "WaitingDocuments":
      return "warning";
    case "Blocked":
    case "HardReject":
      return "destructive";
    case "Offline":
    case "SoftReject":
      return "muted";
    default:
      return "outline";
  }
}

export function riderStatusVariant(status: string | null | undefined): Variant {
  switch (status) {
    case "Enabled":
      return "success";
    case "Blocked":
      return "destructive";
    default:
      return "outline";
  }
}

export function orderStatusVariant(status: string | null | undefined): Variant {
  switch (status) {
    case "Finished":
      return "success";
    case "Booked":
    case "DriverAccepted":
    case "Started":
    case "Arrived":
    case "WaitingForPostPay":
    case "WaitingForPrefy":
    case "WaitingForReview":
      return "default";
    case "Requested":
    case "Found":
      return "warning";
    case "DriverCanceled":
    case "RiderCanceled":
    case "NotFound":
    case "NoCloseFound":
    case "Expired":
      return "destructive";
    default:
      return "muted";
  }
}

export function complaintStatusVariant(status: string | null | undefined): Variant {
  switch (status) {
    case "Resolved":
      return "success";
    case "UnderInvestigation":
      return "warning";
    case "Submitted":
      return "default";
    default:
      return "outline";
  }
}

export function sosStatusVariant(status: string | null | undefined): Variant {
  switch (status) {
    case "Resolved":
      return "success";
    case "FalseAlarm":
      return "muted";
    case "UnderReview":
      return "warning";
    case "Submitted":
      return "destructive";
    default:
      return "outline";
  }
}
