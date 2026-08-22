import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CustomerEntity,
  OrderStatus,
  RiderRedisService,
  RiderStatus,
  TaxiOrderEntity,
  SharedAuthMethodService,
  UserType,
} from '@ridy/database';
import { Repository } from 'typeorm';
import { RiderStatisticsDTO } from './dto/rider-statistics.dto';
import { RiderDTO } from './dto/rider.dto';
import { UpdateRiderInput } from './dto/update-rider.input';
import { UpdateProfileResponseDTO } from './dto/update-profile-response.dto';
import { ForbiddenError } from '@nestjs/apollo';
import { RiderRedisSnapshot } from '@ridy/database';

@Injectable()
export class RiderService {
  private readonly logger = new Logger(RiderService.name);

  constructor(
    @InjectRepository(TaxiOrderEntity)
    private readonly taxiOrderRepository: Repository<TaxiOrderEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly riderRedisService: RiderRedisService,
    private readonly sharedAuthMethodService: SharedAuthMethodService,
  ) {}

  async getRiderStatistics(id: number): Promise<RiderStatisticsDTO> {
    const totalRides = await this.taxiOrderRepository.count({
      where: { riderId: id },
    });
    const completedRides = await this.taxiOrderRepository.count({
      where: { riderId: id, status: OrderStatus.Finished },
    });
    const canceledRides = await this.taxiOrderRepository.count({
      where: { riderId: id, status: OrderStatus.RiderCanceled },
    });
    const customer = await this.customerRepository.findOneOrFail({
      where: { id: id },
      relations: { favoriteDrivers: true },
    });
    const distanceTraveled = await this.taxiOrderRepository.sum(
      'distanceBest',
      {
        riderId: id,
        status: OrderStatus.Finished,
      },
    );
    return {
      totalRides: totalRides,
      completedRides: completedRides,
      canceledRides: canceledRides,
      favoriteDriversCount: customer.favoriteDrivers?.length ?? 0,
      distanceTraveled: distanceTraveled || 0,
    };
  }

  async getRiderProfile(riderId: number): Promise<RiderDTO> {
    const redisSnapshot = await this.riderRedisService.getOnlineRider(riderId);
    if (redisSnapshot != null) {
      return this.snapshotToDTO(redisSnapshot);
    }
    const riderEntity = await this.customerRepository.findOne({
      where: { id: riderId },
      relations: {
        media: true,
        wallets: true,
      },
    });
    if (riderEntity == null) {
      throw new ForbiddenError(
        `The profile was not found. Try logging in again.`,
      );
    }
    if (riderEntity.status == RiderStatus.Disabled) {
      throw new ForbiddenError(
        `Rider account is disabled. Please contact support.`,
      );
    }
    return this.entityToDTO(riderEntity!);
  }

  async updateRiderProfile(
    id: number,
    input: UpdateRiderInput,
  ): Promise<RiderDTO> {
    const response = await this.updateRiderProfileWithEmailVerification(id, input);
    return response.rider;
  }

  async updateRiderProfileWithEmailVerification(
    id: number,
    input: UpdateRiderInput,
  ): Promise<UpdateProfileResponseDTO> {
    // Trim string fields from input
    const trimmedInput = this.trimRiderInput(input);

    // Get current rider to check if email is being changed
    const currentRider = await this.customerRepository.findOne({
      where: { id },
    });

    const isNewEmail =
      trimmedInput.email &&
      trimmedInput.email.trim() !== '' &&
      (!currentRider?.email || currentRider.email !== trimmedInput.email);

    const redisSnapshot = await this.riderRedisService.getOnlineRider(id);
    let riderDTO: RiderDTO;

    if (redisSnapshot != null) {
      const updatedRider = { ...redisSnapshot, ...trimmedInput };
      // If email is being set, mark it as unverified
      if (isNewEmail) {
        updatedRider.emailVerified = false;
      }
      await this.riderRedisService.updateOnlineRider(id, updatedRider);
      riderDTO = this.snapshotToDTO(updatedRider);
    } else {
      const riderEntity = await this.customerRepository.findOneOrFail({
        where: { id: id },
        relations: {
          media: true,
          wallets: true,
        },
      });
      const updatedRider = { ...riderEntity, ...trimmedInput };
      // If email is being set, mark it as unverified
      if (isNewEmail) {
        updatedRider.emailVerified = false;
      }
      const rider = await this.customerRepository.save(updatedRider);
      riderDTO = this.entityToDTO(rider);
    }

    // If email is being set/changed, send verification email
    let emailVerificationHash: string | undefined;
    if (isNewEmail && trimmedInput.email) {
      try {
        // Link email to auth method and send verification
        await this.sharedAuthMethodService.linkEmail(
          UserType.CUSTOMER,
          id,
          trimmedInput.email,
        );

        const { hash } = await this.sharedAuthMethodService.sendEmailVerification(
          trimmedInput.email,
          UserType.CUSTOMER,
          trimmedInput.firstName ?? currentRider?.firstName ?? undefined,
          id,
        );
        emailVerificationHash = hash;
        this.logger.log(`Sent email verification to ${trimmedInput.email} for rider ${id}`);
      } catch (error) {
        this.logger.error(`Failed to send email verification: ${error}`);
        // Don't fail the profile update, just skip email verification
      }
    }

    return {
      rider: riderDTO,
      requiresEmailVerification: !!emailVerificationHash,
      emailVerificationHash,
    };
  }

  private trimRiderInput(input: UpdateRiderInput): Partial<UpdateRiderInput> {
    const result: Partial<UpdateRiderInput> = {};
    if (input.firstName !== undefined) {
      result.firstName = input.firstName.trim();
    }
    if (input.lastName !== undefined) {
      result.lastName = input.lastName.trim();
    }
    if (input.email !== undefined) {
      result.email = input.email.trim();
    }
    if (input.gender !== undefined) {
      result.gender = input.gender;
    }
    return result;
  }

  private snapshotToDTO(redisSnapshot: RiderRedisSnapshot): RiderDTO {
    return {
      id: parseInt(redisSnapshot.id, 10),
      firstName: redisSnapshot.firstName ?? null,
      lastName: redisSnapshot.lastName ?? null,
      mobileNumber: redisSnapshot.mobileNumber,
      email: redisSnapshot.email,
      emailVerified: redisSnapshot.emailVerified ?? null,
      gender: redisSnapshot.gender,
      profileImageUrl: redisSnapshot.profileImageUrl,
      walletCredit: redisSnapshot.walletCredit,
      currency: redisSnapshot.currency,
    };
  }

  private entityToDTO(riderEntity: CustomerEntity): RiderDTO {
    return {
      id: riderEntity.id,
      firstName: riderEntity.firstName ?? null,
      lastName: riderEntity.lastName ?? null,
      mobileNumber: riderEntity.mobileNumber,
      email: riderEntity.email ?? null,
      emailVerified: riderEntity.emailVerified ?? null,
      gender: riderEntity.gender ?? null,
      profileImageUrl: riderEntity.media?.address ?? null,
      walletCredit: riderEntity.wallets?.[0]?.balance ?? 0,
      currency:
        riderEntity.wallets?.[0]?.currency ??
        process.env.DEFAULT_CURRENCY ??
        'USD',
    };
  }
}
