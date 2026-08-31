import { Transform } from 'class-transformer';

export enum DriverEphemeralMessageType {
  RateRider = 'RateRider',
  RiderCanceled = 'RiderCanceled',
  AddPayoutMethod = 'AddPayoutMethod',
  RideReceived = 'RideReceived',
  RideCompleted = 'RideCompleted',
  RideCancelled = 'RideCancelled',
}

export class DriverEphemeralMessageSnapshot {
  messageId!: string;
  type: DriverEphemeralMessageType;
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  expiresAt: Date;
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  createdAt: Date;
  riderFullName!: string | null;
  orderId!: number;
  riderProfileUrl!: string | null;
  serviceName!: string | null;
  serviceImageUrl!: string | null;
  amount!: number | null;
}
