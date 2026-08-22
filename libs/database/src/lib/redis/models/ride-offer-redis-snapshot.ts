import { Transform, Type } from 'class-transformer';
import { Point, RideOptionDTO, WaypointBase } from '../../interfaces';
import { OrderStatus, TaxiOrderType } from '@ridy/database';
import { PaymentMethodBase } from '@ridy/database';
import { PricingMode } from '../../entities/taxi/enums/pricing-mode.enum';
import { RangePolicy } from '../../entities/taxi/enums/range-policy.enum';

export class RideOfferRedisSnapshot {
  id: string;
  status: OrderStatus;
  type: TaxiOrderType;
  estimatedDistance: number;
  estimatedDuration: number;
  currency: string;
  @Transform(
    ({ value }) => {
      return {
        lat: parseFloat(value.split(',')[1]),
        lng: parseFloat(value.split(',')[0]),
      };
    },
    { toClassOnly: true },
  )
  pickupLocation: Point;
  tripDirections: Point[];
  @Type(() => WaypointBase)
  waypoints: WaypointBase[];
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  createdAt!: Date;
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  scheduledAt?: Date;
  waitMinutes?: number;
  riderId: string;
  serviceId: string;
  serviceName: string;
  couponCode?: string;
  couponDiscount?: number;
  serviceImageAddress: string;
  options: RideOptionDTO[];
  costEstimateForDriver: number;
  costEstimateForRider: number;
  costMin?: number;
  costMax?: number;
  pricingMode: PricingMode;
  rangePolicy?: RangePolicy;
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  dispatchedToUserAt?: Date;
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  expireAt?: Date;
  totalPaid: number;
  @Type(() => PaymentMethodBase)
  paymentMethod: PaymentMethodBase;
  offeredToDriverIds: string[];
  rejectedByDriverIds: string[];
  @Type(() => RideOfferCandidate)
  candidates: RideOfferCandidate[];
  riderFirstName?: string;
  riderLastName?: string;
  riderProfileImageUrl?: string;
}

export class RideOfferCandidate {
  driverId: string;
  distance: number;
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  rejectedAt?: Date;
  score: number;
}
