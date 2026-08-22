import type { FilterSelectOption } from "@/components/tables/TableToolbar";

export const DRIVER_STATUS_OPTIONS: FilterSelectOption[] = [
  { value: "PendingApproval", label: "Pending approval" },
  { value: "WaitingDocuments", label: "Waiting documents" },
  { value: "Online", label: "Online" },
  { value: "Offline", label: "Offline" },
  { value: "InService", label: "In service" },
  { value: "Blocked", label: "Blocked" },
  { value: "SoftReject", label: "Soft reject" },
  { value: "HardReject", label: "Hard reject" },
];

export const RIDER_STATUS_OPTIONS: FilterSelectOption[] = [
  { value: "Enabled", label: "Enabled" },
  { value: "Disabled", label: "Disabled" },
];

export const ORDER_STATUS_OPTIONS: FilterSelectOption[] = [
  { value: "Requested", label: "Requested" },
  { value: "Found", label: "Found" },
  { value: "NotFound", label: "Not found" },
  { value: "DriverAccepted", label: "Driver accepted" },
  { value: "Arrived", label: "Arrived" },
  { value: "Started", label: "Started" },
  { value: "Finished", label: "Finished" },
  { value: "Booked", label: "Booked" },
  { value: "DriverCanceled", label: "Driver canceled" },
  { value: "RiderCanceled", label: "Rider canceled" },
  { value: "Expired", label: "Expired" },
];

export const ORDER_TYPE_OPTIONS: FilterSelectOption[] = [
  { value: "Ride", label: "Ride" },
  { value: "Rideshare", label: "Rideshare" },
  { value: "ParcelDelivery", label: "Parcel delivery" },
  { value: "FoodDelivery", label: "Food delivery" },
  { value: "ShopDelivery", label: "Shop delivery" },
];

export const COMPLAINT_STATUS_OPTIONS: FilterSelectOption[] = [
  { value: "Submitted", label: "Submitted" },
  { value: "UnderInvestigation", label: "Under investigation" },
  { value: "Resolved", label: "Resolved" },
];

export const SOS_STATUS_OPTIONS: FilterSelectOption[] = [
  { value: "Submitted", label: "Submitted" },
  { value: "UnderReview", label: "Under review" },
  { value: "FalseAlarm", label: "False alarm" },
  { value: "Resolved", label: "Resolved" },
];

export const SUBMITTED_BY_OPTIONS: FilterSelectOption[] = [
  { value: "true", label: "Driver" },
  { value: "false", label: "Rider" },
];

export const SERVICE_OPTION_TYPES: FilterSelectOption[] = [
  { value: "Free", label: "Free" },
  { value: "Paid", label: "Paid" },
  { value: "TwoWay", label: "Two-way" },
];

export const SERVICE_OPTION_ICONS: FilterSelectOption[] = [
  { value: "Pet", label: "Pet" },
  { value: "TwoWay", label: "Two-way" },
  { value: "Luggage", label: "Luggage" },
  { value: "PackageDelivery", label: "Package delivery" },
  { value: "Shopping", label: "Shopping" },
  { value: "Custom1", label: "Custom 1" },
  { value: "Custom2", label: "Custom 2" },
  { value: "Custom3", label: "Custom 3" },
  { value: "Custom4", label: "Custom 4" },
  { value: "Custom5", label: "Custom 5" },
];

export const SMS_PROVIDER_TYPES: FilterSelectOption[] = [
  { value: "Twilio", label: "Twilio" },
  { value: "Plivo", label: "Plivo" },
  { value: "Firebase", label: "Firebase" },
  { value: "Vonage", label: "Vonage" },
  { value: "ClickSend", label: "ClickSend" },
  { value: "Infobip", label: "Infobip" },
  { value: "MessageBird", label: "MessageBird" },
  { value: "Pahappa", label: "Pahappa" },
  { value: "BroadNet", label: "BroadNet" },
  { value: "VentisSMS", label: "Ventis SMS" },
  { value: "ClickSMSNet", label: "ClickSMS.net" },
];

export const PAYMENT_GATEWAY_TYPES: FilterSelectOption[] = [
  { value: "Stripe", label: "Stripe" },
  { value: "PayPal", label: "PayPal" },
  { value: "BrainTree", label: "Braintree" },
  { value: "Razorpay", label: "Razorpay" },
  { value: "Paytm", label: "Paytm" },
  { value: "Paystack", label: "Paystack" },
  { value: "PayU", label: "PayU" },
  { value: "Flutterwave", label: "Flutterwave" },
  { value: "Instamojo", label: "Instamojo" },
  { value: "MercadoPago", label: "MercadoPago" },
  { value: "AmazonPaymentServices", label: "Amazon Payment Services" },
  { value: "MyTMoney", label: "MyT Money" },
  { value: "WayForPay", label: "WayForPay" },
  { value: "MyFatoorah", label: "MyFatoorah" },
  { value: "SberBank", label: "SberBank" },
  { value: "BinancePay", label: "Binance Pay" },
  { value: "OpenPix", label: "OpenPix" },
  { value: "PayTR", label: "PayTR" },
  { value: "BambooPay", label: "BambooPay" },
  { value: "PayGate", label: "PayGate" },
  { value: "MIPS", label: "MIPS" },
  { value: "CustomLink", label: "Custom link" },
];

export const APP_TYPES: FilterSelectOption[] = [
  { value: "Taxi", label: "Taxi" },
  { value: "Shop", label: "Shop" },
  { value: "Parking", label: "Parking" },
];

export const OPERATOR_PERMISSIONS = [
  "Critical_View", "Critical_Edit",
  "Drivers_View", "Drivers_Edit",
  "Riders_View", "Riders_Edit",
  "Regions_View", "Regions_Edit",
  "Services_View", "Services_Edit",
  "Complaints_View", "Complaints_Edit",
  "Coupons_View", "Coupons_Edit",
  "Announcements_View", "Announcements_Edit",
  "Requests_View",
  "Fleets_View", "Fleets_Edit",
  "Gateways_View", "Gateways_Edit",
  "Users_View", "Users_Edit",
  "Cars_View", "Cars_Edit",
  "FleetWallet_View", "FleetWallet_Edit",
  "ProviderWallet_View", "ProviderWallet_Edit",
  "DriverWallet_View", "DriverWallet_Edit",
  "RiderWallet_View", "RiderWallet_Edit",
  "ReviewParameter_Edit",
  "Payouts_View", "Payouts_Edit",
  "GiftBatch_View", "GiftBatch_Create", "GiftBatch_ViewCodes",
  "SMSProviders_View", "SMSProviders_Edit",
  "EmailProviders_View", "EmailProviders_Edit",
  "EmailTemplates_View", "EmailTemplates_Edit",
] as const;

export const TAXI_PERMISSIONS = [
  "DRIVER_VIEW", "DRIVER_EDIT",
  "ORDER_VIEW", "ORDER_EDIT",
  "REGION_VIEW", "REGION_EDIT",
  "VEHICLE_VIEW", "VEHICLE_EDIT",
  "FLEET_VIEW", "FLEET_EDIT",
  "PRICING_VIEW", "PRICING_EDIT",
] as const;

export const SHOP_PERMISSIONS = [
  "SHOP_VIEW", "SHOP_EDIT",
  "ORDER_VIEW", "ORDER_EDIT",
] as const;

export const PARKING_PERMISSIONS = [
  "PARKING_VIEW", "PARKING_EDIT",
  "ORDER_VIEW", "ORDER_EDIT",
] as const;
