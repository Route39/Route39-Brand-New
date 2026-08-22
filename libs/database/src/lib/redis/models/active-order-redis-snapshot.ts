import { Transform } from 'class-transformer';
import { Point, RideOptionDTO, WaypointBase } from '../../interfaces';
import { OrderStatus, TaxiOrderType } from '@ridy/database';
import { PaymentMethodBase } from '../../interfaces/payment-method.dto';
import { PricingMode } from '../../entities/taxi/enums/pricing-mode.enum';
import { RangePolicy } from '../../entities/taxi/enums/range-policy.enum';

export class ActiveOrderRedisSnapshot {
  id: string;
  status: OrderStatus;
  type: TaxiOrderType;
  currency: string;
  waypoints: WaypointBase[];
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  createdAt: Date;
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  pickupEta: Date;
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  dropoffEta: Date;
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  scheduledAt?: Date;
  driverId: string;
  driverFirstName?: string | null;
  driverAvatarUrl?: string | null;
  riderId: string;
  riderFirstName?: string | null;
  riderAvatarUrl?: string | null;
  waitMinutes?: number;
  couponCode?: string;
  couponDiscount?: number;
  serviceId: string;
  fleetId?: string;
  serviceName: string;
  serviceImageAddress: string;
  driverDirections: Point[];
  tripDirections: Point[];
  paymentMethod: PaymentMethodBase;
  costEstimateForDriver: number;
  costEstimateForRider: number;
  costMin?: number;
  costMax?: number;
  pricingMode: PricingMode;
  rangePolicy?: RangePolicy;
  estimatedDistance: number;
  estimatedDuration: number;
  distance?: string;
  duration?: string;
  currentLegIndex: number;
  totalPaid: number;
  options: RideOptionDTO[];
  chatMessages: ChatMessageRedisSnapshot[];

  // Commission tracking
  commissionDeducted?: boolean;

  // Actual distance/duration tracking
  actualDistance?: number; // Accumulated distance in meters
  actualDuration?: number; // Actual duration in seconds
  rideStartTime?: number; // Timestamp when ride started (ms)
  lastTrackingPoint?: Point; // Last GPS point for distance calculation
}

export class ChatMessageRedisSnapshot {
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  createdAt: Date;
  isFromDriver: boolean;
  seenByRiderAt?: Date;
  seenByDriverAt?: Date;
  content: string;
}
