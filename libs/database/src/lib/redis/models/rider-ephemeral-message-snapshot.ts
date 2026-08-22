import { Transform } from 'class-transformer';

export enum RiderEphemeralMessageType {
  RateDriver = 'RateDriver',
  /** @deprecated Use DriverCancelled instead. */
  RiderCanceled = 'RiderCanceled',
  DriverCanceled = 'DriverCanceled',
  RideExpired = 'RideExpired',
}

export class RiderEphemeralMessageSnapshot {
  messageId!: string;
  type: RiderEphemeralMessageType;
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  expiresAt: Date;
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  createdAt: Date;
  driverFullName!: string | null;
  orderId!: number;
  driverProfileUrl!: string | null;
  serviceName!: string | null;
  serviceImageUrl!: string | null;
  vehicleName!: string | null;
}
