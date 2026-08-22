import { useAuth } from "@/providers/AuthProvider";

export type AdminPerm =
  | "Critical_View"
  | "Critical_Edit"
  | "Drivers_View"
  | "Drivers_Edit"
  | "Riders_View"
  | "Riders_Edit"
  | "Regions_View"
  | "Regions_Edit"
  | "Services_View"
  | "Services_Edit"
  | "Complaints_View"
  | "Complaints_Edit"
  | "Coupons_View"
  | "Coupons_Edit"
  | "Announcements_View"
  | "Announcements_Edit"
  | "Requests_View"
  | "Fleets_View"
  | "Fleets_Edit"
  | "Gateways_View"
  | "Gateways_Edit"
  | "Users_View"
  | "Users_Edit"
  | "Cars_View"
  | "Cars_Edit"
  | "FleetWallet_View"
  | "FleetWallet_Edit"
  | "ProviderWallet_View"
  | "ProviderWallet_Edit"
  | "DriverWallet_View"
  | "DriverWallet_Edit"
  | "RiderWallet_View"
  | "RiderWallet_Edit"
  | "ReviewParameter_Edit"
  | "Payouts_View"
  | "Payouts_Edit"
  | "GiftBatch_View"
  | "GiftBatch_Create"
  | "GiftBatch_ViewCodes"
  | "SMSProviders_View"
  | "SMSProviders_Edit"
  | "EmailProviders_View"
  | "EmailProviders_Edit"
  | "EmailTemplates_View"
  | "EmailTemplates_Edit";

/**
 * Returns true if the current operator's role grants the given admin permission.
 * Operators with no `role` (legacy super-admins) are treated as having all
 * permissions.
 */
export function useHasPermission(perm: AdminPerm): boolean {
  const { user } = useAuth();
  if (!user) return false;
  if (!user.role) return true;
  return (user.role.permissions ?? []).includes(perm as never);
}

/** Same shape, but takes any permission and supports OR-ing several. */
export function useHasAny(...perms: AdminPerm[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  if (!user.role) return true;
  const owned = new Set(user.role.permissions ?? []);
  return perms.some((p) => owned.has(p as never));
}

