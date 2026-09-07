import {
  AlertTriangle,
  BadgeDollarSign,
  Building2,
  Car,
  Compass,
  Container,
  Gauge,
  Headphones,
  LifeBuoy,
  MapPin,
  Megaphone,
  Settings,
  ShieldAlert,
  Tag,
  Ticket,
  User,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavLeaf {
  label: string;
  to: string;
  icon?: LucideIcon;
  search?: string;
  /** Hide entry if the operator does not have at least one of these admin permissions. */
  perm?: string[];
}

export interface NavGroup {
  label: string;
  icon?: LucideIcon;
  items: NavLeaf[];
  perm?: string[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

// Translation keys mirror apps/admin-panel/src/assets/i18n/en.json `menu.*`.
export const NAV: NavEntry[] = [
  {
    label: "menu.home.header",
    icon: Gauge,
    items: [
      { label: "menu.home.overview", to: "/home" },
      { label: "menu.home.dispatcher", to: "/dispatcher" },
    ],
  },
  {
    label: "menu.driver.header",
    icon: Car,
    perm: ["Drivers_View"],
    items: [
      {
        label: "menu.driver.pendingVerification",
        to: "/drivers",
        search: "?filter=status%7Cin%7CPendingApproval",
      },
      { label: "menu.driver.all", to: "/drivers", search: "?sort=id%7CDESC" },
    ],
  },
  {
    label: "menu.riders",
    icon: User,
    to: "/riders",
    search: "?sort=id%7CDESC",
    perm: ["Riders_View"],
  },
  {
    label: "menu.requests",
    icon: Container,
    to: "/requests",
    search: "?sort=id%7CDESC",
    perm: ["Requests_View"],
  },
  {
    label: "menu.sos",
    icon: ShieldAlert,
    to: "/sos",
    search: "?sort=id%7CDESC",
    perm: ["Complaints_View"],
  },
  {
    label: "menu.complaints",
    icon: Headphones,
    to: "/complaints",
    search: "?sort=id%7CDESC",
    perm: ["Complaints_View"],
  },
  {
    label: "menu.payouts",
    icon: BadgeDollarSign,
    perm: ["Payouts_View"],
    items: [
      { label: "menu.payouts", to: "/payouts" },
      { label: "menu.payoutMethods", to: "/payout-methods" },
    ],
  },
  {
    label: "menu.marketing.header",
    icon: Megaphone,
    perm: ["Coupons_View", "Announcements_View", "GiftBatch_View"],
    items: [
      { label: "menu.marketing.coupons", to: "/marketing/coupons", perm: ["Coupons_View"] },
      { label: "menu.marketing.announcements", to: "/marketing/announcements", perm: ["Announcements_View"] },
      { label: "menu.marketing.giftCards", to: "/marketing/gift-cards", perm: ["GiftBatch_View"] },
      { label: "menu.marketing.rewards", to: "/marketing/rewards" },
    ],
  },
  {
    label: "menu.accounting.header",
    icon: Wallet,
    perm: ["ProviderWallet_View", "FleetWallet_View", "DriverWallet_View", "RiderWallet_View"],
    items: [
      { label: "menu.accounting.admin", to: "/financials/provider", perm: ["ProviderWallet_View"] },
      { label: "menu.accounting.fleets", to: "/financials/fleet", perm: ["FleetWallet_View"] },
      { label: "menu.accounting.drivers", to: "/financials/driver", perm: ["DriverWallet_View"] },
      { label: "menu.accounting.riders", to: "/financials/rider", perm: ["RiderWallet_View"] },
    ],
  },
  {
    label: "menu.management.header",
    icon: Settings,
    items: [
      { label: "menu.management.regions", to: "/management/regions", icon: MapPin, perm: ["Regions_View"] },
      { label: "menu.management.services", to: "/management/services", icon: Compass, perm: ["Services_View"] },
      { label: "menu.management.serviceOptions", to: "/management/service-options", icon: Ticket, perm: ["Services_View"] },
      { label: "menu.management.fleets", to: "/management/fleets", icon: Building2, perm: ["Fleets_View"] },
      { label: "menu.management.zonePrices", to: "/management/zone-prices", icon: Tag, perm: ["Services_View"] },
      { label: "menu.management.orderCancelReasons", to: "/management/order-cancel-reasons", icon: AlertTriangle, perm: ["Services_View"] },
      { label: "menu.management.reviewParameters", to: "/management/review-parameters", icon: Ticket, perm: ["ReviewParameter_Edit"] },
      { label: "menu.management.driverShiftRules", to: "/management/driver-shift-rules", icon: AlertTriangle, perm: ["Drivers_Edit"] },
      { label: "menu.management.retentionPolicies", to: "/management/retention-policies", icon: Ticket, perm: ["Drivers_Edit"] },
      { label: "menu.management.cars", to: "/management/cars", icon: Car, perm: ["Cars_View"] },
      { label: "menu.management.userRoles", to: "/management/user-roles", icon: UserCog, perm: ["Users_View"] },
      { label: "menu.management.users", to: "/management/users", icon: Users, perm: ["Users_View"] },
      { label: "menu.management.smsProviders", to: "/management/sms-providers", icon: LifeBuoy, perm: ["SMSProviders_View"] },
      { label: "menu.management.paymentGateways", to: "/management/payment-gateways", icon: Wallet, perm: ["Gateways_View"] },
      { label: "menu.management.settings", to: "/management/settings", icon: Settings, perm: ["Critical_Edit"] },
    ],
  },
];
