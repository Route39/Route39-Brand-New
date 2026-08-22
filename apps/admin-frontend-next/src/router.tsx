import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";

const LoginPage = lazy(() => import("@/routes/auth/login"));
const PanelLayout = lazy(() => import("@/routes/panel/layout"));
const HomePage = lazy(() => import("@/routes/panel/home"));

const DriversListPage = lazy(() => import("@/routes/panel/drivers"));
const NewDriverPage = lazy(() => import("@/routes/panel/drivers/new"));
const EditDriverPage = lazy(() => import("@/routes/panel/drivers/$id/edit"));
const DriverDetailLayout = lazy(() => import("@/routes/panel/drivers/$id/layout"));
const DriverDetailsTab = lazy(() => import("@/routes/panel/drivers/$id/details"));
const DriverOrdersTab = lazy(() => import("@/routes/panel/drivers/$id/orders"));
const DriverFinancialTab = lazy(() => import("@/routes/panel/drivers/$id/financial"));
const DriverReviewsTab = lazy(() => import("@/routes/panel/drivers/$id/reviews"));
const DriverDocumentsTab = lazy(() => import("@/routes/panel/drivers/$id/documents"));
const DriverReviewPage = lazy(() => import("@/routes/panel/drivers/$id/review"));

const RidersListPage = lazy(() => import("@/routes/panel/riders"));
const NewRiderPage = lazy(() => import("@/routes/panel/riders/new"));
const EditRiderPage = lazy(() => import("@/routes/panel/riders/$id/edit"));
const RiderDetailLayout = lazy(() => import("@/routes/panel/riders/$id/layout"));
const RiderInfoTab = lazy(() => import("@/routes/panel/riders/$id/info"));
const RiderAddressesTab = lazy(() => import("@/routes/panel/riders/$id/addresses"));
const RiderFinancialsTab = lazy(() => import("@/routes/panel/riders/$id/financials"));
const RiderOrdersTab = lazy(() => import("@/routes/panel/riders/$id/orders"));

const RequestsListPage = lazy(() => import("@/routes/panel/requests"));
const OrderDetailLayout = lazy(() => import("@/routes/panel/requests/$id/layout"));
const OrderInfoTab = lazy(() => import("@/routes/panel/requests/$id/info"));
const OrderFinancialsTab = lazy(() => import("@/routes/panel/requests/$id/financials"));
const OrderComplaintsTab = lazy(() => import("@/routes/panel/requests/$id/complaints"));
const OrderAssignTab = lazy(() => import("@/routes/panel/requests/$id/assign"));
const OrderChatsTab = lazy(() => import("@/routes/panel/requests/$id/chats"));
const OrderActivitiesTab = lazy(() => import("@/routes/panel/requests/$id/activities"));

const ComplaintsListPage = lazy(() => import("@/routes/panel/complaints"));
const ComplaintDetailLayout = lazy(() => import("@/routes/panel/complaints/$id/layout"));
const ComplaintInfoTab = lazy(() => import("@/routes/panel/complaints/$id/info"));
const ComplaintRecordsTab = lazy(() => import("@/routes/panel/complaints/$id/records"));

const SosListPage = lazy(() => import("@/routes/panel/sos"));
const SosDetailPage = lazy(() => import("@/routes/panel/sos/$id"));

const ServiceCategoriesPage = lazy(() => import("@/routes/panel/management/service-categories"));
const RegionsListPage = lazy(() => import("@/routes/panel/management/regions"));
const NewRegionPage = lazy(() => import("@/routes/panel/management/regions/new"));
const EditRegionPage = lazy(() => import("@/routes/panel/management/regions/$id"));
const ServicesListPage = lazy(() => import("@/routes/panel/management/services"));
const NewServicePage = lazy(() => import("@/routes/panel/management/services/new"));
const EditServicePage = lazy(() => import("@/routes/panel/management/services/$id"));
const ServiceOptionsListPage = lazy(() => import("@/routes/panel/management/service-options"));
const NewServiceOptionPage = lazy(() => import("@/routes/panel/management/service-options/new"));
const EditServiceOptionPage = lazy(() => import("@/routes/panel/management/service-options/$id"));
const FleetsListPage = lazy(() => import("@/routes/panel/management/fleets"));
const NewFleetPage = lazy(() => import("@/routes/panel/management/fleets/new"));
const EditFleetPage = lazy(() => import("@/routes/panel/management/fleets/$id"));
const FleetDetailLayout = lazy(() => import("@/routes/panel/management/fleets/$id/layout"));
const FleetDetailsTab = lazy(() => import("@/routes/panel/management/fleets/$id/details"));
const FleetFinancialsTab = lazy(() => import("@/routes/panel/management/fleets/$id/financials"));
const FleetZonePricesTab = lazy(() => import("@/routes/panel/management/fleets/$id/zone-prices"));
const ZonePricesListPage = lazy(() => import("@/routes/panel/management/zone-prices"));
const NewZonePricePage = lazy(() => import("@/routes/panel/management/zone-prices/new"));
const EditZonePricePage = lazy(() => import("@/routes/panel/management/zone-prices/$id"));
const OrderCancelReasonsListPage = lazy(() => import("@/routes/panel/management/order-cancel-reasons"));
const NewOrderCancelReasonPage = lazy(() => import("@/routes/panel/management/order-cancel-reasons/new"));
const EditOrderCancelReasonPage = lazy(() => import("@/routes/panel/management/order-cancel-reasons/$id"));
const ReviewParametersListPage = lazy(() => import("@/routes/panel/management/review-parameters"));
const NewReviewParameterPage = lazy(() => import("@/routes/panel/management/review-parameters/new"));
const EditReviewParameterPage = lazy(() => import("@/routes/panel/management/review-parameters/$id"));
const CarsListPage = lazy(() => import("@/routes/panel/management/cars"));
const NewCarPage = lazy(() => import("@/routes/panel/management/cars/new"));
const EditCarPage = lazy(() => import("@/routes/panel/management/cars/$id"));
const UserRolesListPage = lazy(() => import("@/routes/panel/management/user-roles"));
const NewUserRolePage = lazy(() => import("@/routes/panel/management/user-roles/new"));
const EditUserRolePage = lazy(() => import("@/routes/panel/management/user-roles/$id"));
const OperatorsListPage = lazy(() => import("@/routes/panel/management/users"));
const NewOperatorPage = lazy(() => import("@/routes/panel/management/users/new"));
const EditOperatorPage = lazy(() => import("@/routes/panel/management/users/$id"));
const SmsProvidersListPage = lazy(() => import("@/routes/panel/management/sms-providers"));
const NewSmsProviderPage = lazy(() => import("@/routes/panel/management/sms-providers/new"));
const EditSmsProviderPage = lazy(() => import("@/routes/panel/management/sms-providers/$id"));
const PaymentGatewaysListPage = lazy(() => import("@/routes/panel/management/payment-gateways"));
const NewPaymentGatewayPage = lazy(() => import("@/routes/panel/management/payment-gateways/new"));
const EditPaymentGatewayPage = lazy(() => import("@/routes/panel/management/payment-gateways/$id"));
const SettingsPage = lazy(() => import("@/routes/panel/management/settings"));
const DriverShiftRulesPage = lazy(() => import("@/routes/panel/management/driver-shift-rules"));
const RetentionPoliciesPage = lazy(() => import("@/routes/panel/management/retention-policies"));

const DispatcherPage = lazy(() => import("@/routes/panel/dispatcher"));

const CouponsListPage = lazy(() => import("@/routes/panel/marketing/coupons"));
const NewCouponPage = lazy(() => import("@/routes/panel/marketing/coupons/new"));
const EditCouponPage = lazy(() => import("@/routes/panel/marketing/coupons/$id"));
const AnnouncementsListPage = lazy(() => import("@/routes/panel/marketing/announcements"));
const NewAnnouncementPage = lazy(() => import("@/routes/panel/marketing/announcements/new"));
const EditAnnouncementPage = lazy(() => import("@/routes/panel/marketing/announcements/$id"));
const GiftCardsListPage = lazy(() => import("@/routes/panel/marketing/gift-cards"));
const NewGiftBatchPage = lazy(() => import("@/routes/panel/marketing/gift-cards/new"));
const GiftBatchDetailPage = lazy(() => import("@/routes/panel/marketing/gift-cards/$id"));
const RewardsListPage = lazy(() => import("@/routes/panel/marketing/rewards"));
const NewRewardPage = lazy(() => import("@/routes/panel/marketing/rewards/new"));
const EditRewardPage = lazy(() => import("@/routes/panel/marketing/rewards/$id"));

const PayoutsListPage = lazy(() => import("@/routes/panel/payouts"));
const NewPayoutSessionPage = lazy(() => import("@/routes/panel/payouts/new"));
const PayoutSessionDetailPage = lazy(() => import("@/routes/panel/payouts/$id"));
const PayoutMethodsListPage = lazy(() => import("@/routes/panel/payout-methods"));
const NewPayoutMethodPage = lazy(() => import("@/routes/panel/payout-methods/new"));
const EditPayoutMethodPage = lazy(() => import("@/routes/panel/payout-methods/$id"));

const ProviderFinancialsPage = lazy(() => import("@/routes/panel/financials/provider"));
const FleetFinancialsPage = lazy(() => import("@/routes/panel/financials/fleet"));
const DriverFinancialsPage = lazy(() => import("@/routes/panel/financials/driver"));
const RiderFinancialsPage = lazy(() => import("@/routes/panel/financials/rider"));

// Vite injects BASE_URL from `base` in vite.config.ts. Strip trailing slash for
// react-router's basename convention.
const basename = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "/";

export const router = createBrowserRouter(
  [
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: PanelLayout,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: "home", Component: HomePage },
      { path: "dispatcher", Component: DispatcherPage },

      { path: "drivers", Component: DriversListPage },
      { path: "drivers/new", Component: NewDriverPage },
      { path: "drivers/:id/edit", Component: EditDriverPage },
      { path: "drivers/:id/review", Component: DriverReviewPage },
      {
        path: "drivers/:id",
        Component: DriverDetailLayout,
        children: [
          { index: true, element: <Navigate to="details" replace /> },
          { path: "details", Component: DriverDetailsTab },
          { path: "orders", Component: DriverOrdersTab },
          { path: "financial", Component: DriverFinancialTab },
          { path: "reviews", Component: DriverReviewsTab },
          { path: "documents", Component: DriverDocumentsTab },
        ],
      },

      { path: "riders", Component: RidersListPage },
      { path: "riders/new", Component: NewRiderPage },
      { path: "riders/:id/edit", Component: EditRiderPage },
      {
        path: "riders/:id",
        Component: RiderDetailLayout,
        children: [
          { index: true, element: <Navigate to="info" replace /> },
          { path: "info", Component: RiderInfoTab },
          { path: "addresses", Component: RiderAddressesTab },
          { path: "financials", Component: RiderFinancialsTab },
          { path: "orders", Component: RiderOrdersTab },
        ],
      },

      { path: "requests", Component: RequestsListPage },
      {
        path: "requests/:id",
        Component: OrderDetailLayout,
        children: [
          { index: true, element: <Navigate to="info" replace /> },
          { path: "info", Component: OrderInfoTab },
          { path: "assign", Component: OrderAssignTab },
          { path: "chats", Component: OrderChatsTab },
          { path: "activities", Component: OrderActivitiesTab },
          { path: "financials", Component: OrderFinancialsTab },
          { path: "complaints", Component: OrderComplaintsTab },
        ],
      },

      { path: "complaints", Component: ComplaintsListPage },
      {
        path: "complaints/:id",
        Component: ComplaintDetailLayout,
        children: [
          { index: true, element: <Navigate to="info" replace /> },
          { path: "info", Component: ComplaintInfoTab },
          { path: "records", Component: ComplaintRecordsTab },
        ],
      },

      { path: "sos", Component: SosListPage },
      { path: "sos/:id", Component: SosDetailPage },

      { path: "marketing", element: <Navigate to="/marketing/coupons" replace /> },
      { path: "marketing/coupons", Component: CouponsListPage },
      { path: "marketing/coupons/new", Component: NewCouponPage },
      { path: "marketing/coupons/:id", Component: EditCouponPage },
      { path: "marketing/announcements", Component: AnnouncementsListPage },
      { path: "marketing/announcements/new", Component: NewAnnouncementPage },
      { path: "marketing/announcements/:id", Component: EditAnnouncementPage },
      { path: "marketing/gift-cards", Component: GiftCardsListPage },
      { path: "marketing/gift-cards/new", Component: NewGiftBatchPage },
      { path: "marketing/gift-cards/:id", Component: GiftBatchDetailPage },
      { path: "marketing/rewards", Component: RewardsListPage },
      { path: "marketing/rewards/new", Component: NewRewardPage },
      { path: "marketing/rewards/:id", Component: EditRewardPage },

      { path: "payouts", Component: PayoutsListPage },
      { path: "payouts/new", Component: NewPayoutSessionPage },
      { path: "payouts/:id", Component: PayoutSessionDetailPage },
      { path: "payout-methods", Component: PayoutMethodsListPage },
      { path: "payout-methods/new", Component: NewPayoutMethodPage },
      { path: "payout-methods/:id", Component: EditPayoutMethodPage },

      { path: "financials", element: <Navigate to="/financials/provider" replace /> },
      { path: "financials/provider", Component: ProviderFinancialsPage },
      { path: "financials/fleet", Component: FleetFinancialsPage },
      { path: "financials/driver", Component: DriverFinancialsPage },
      { path: "financials/rider", Component: RiderFinancialsPage },

      { path: "management", element: <Navigate to="/management/settings" replace /> },
      { path: "management/regions", Component: RegionsListPage },
      { path: "management/regions/new", Component: NewRegionPage },
      { path: "management/regions/:id", Component: EditRegionPage },
      { path: "management/services", Component: ServicesListPage },
      { path: "management/services/new", Component: NewServicePage },
      { path: "management/services/categories", Component: ServiceCategoriesPage },
      { path: "management/services/:id", Component: EditServicePage },
      { path: "management/service-options", Component: ServiceOptionsListPage },
      { path: "management/service-options/new", Component: NewServiceOptionPage },
      { path: "management/service-options/:id", Component: EditServiceOptionPage },
      { path: "management/fleets", Component: FleetsListPage },
      { path: "management/fleets/new", Component: NewFleetPage },
      {
        path: "management/fleets/:id/edit",
        Component: FleetDetailLayout,
        children: [
          { index: true, element: <Navigate to="details" replace /> },
          { path: "details", Component: FleetDetailsTab },
          { path: "financials", Component: FleetFinancialsTab },
          { path: "zone-prices", Component: FleetZonePricesTab },
        ],
      },
      { path: "management/fleets/:id", Component: EditFleetPage },
      { path: "management/zone-prices", Component: ZonePricesListPage },
      { path: "management/zone-prices/new", Component: NewZonePricePage },
      { path: "management/zone-prices/:id", Component: EditZonePricePage },
      { path: "management/order-cancel-reasons", Component: OrderCancelReasonsListPage },
      { path: "management/order-cancel-reasons/new", Component: NewOrderCancelReasonPage },
      { path: "management/order-cancel-reasons/:id", Component: EditOrderCancelReasonPage },
      { path: "management/review-parameters", Component: ReviewParametersListPage },
      { path: "management/review-parameters/new", Component: NewReviewParameterPage },
      { path: "management/review-parameters/:id", Component: EditReviewParameterPage },
      { path: "management/cars", Component: CarsListPage },
      { path: "management/cars/new", Component: NewCarPage },
      { path: "management/cars/:id", Component: EditCarPage },
      { path: "management/user-roles", Component: UserRolesListPage },
      { path: "management/user-roles/new", Component: NewUserRolePage },
      { path: "management/user-roles/:id", Component: EditUserRolePage },
      { path: "management/users", Component: OperatorsListPage },
      { path: "management/users/new", Component: NewOperatorPage },
      { path: "management/users/:id", Component: EditOperatorPage },
      { path: "management/sms-providers", Component: SmsProvidersListPage },
      { path: "management/sms-providers/new", Component: NewSmsProviderPage },
      { path: "management/sms-providers/:id", Component: EditSmsProviderPage },
      { path: "management/payment-gateways", Component: PaymentGatewaysListPage },
      { path: "management/payment-gateways/new", Component: NewPaymentGatewayPage },
      { path: "management/payment-gateways/:id", Component: EditPaymentGatewayPage },
      { path: "management/settings", Component: SettingsPage },
      { path: "management/driver-shift-rules", Component: DriverShiftRulesPage },
      { path: "management/retention-policies", Component: RetentionPoliciesPage },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/home" replace />,
  },
  ],
  { basename },
);
