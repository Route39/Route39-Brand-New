import { Args, CONTEXT, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RiderService } from './rider.service';
import { RiderStatisticsDTO } from './dto/rider-statistics.dto';
import { UserContext } from '../auth/authenticated-user';
import { Inject, UseGuards } from '@nestjs/common';
import { RiderDTO } from './dto/rider.dto';
import { UpdateRiderInput } from './dto/update-rider.input';
import { UpdateProfileResponseDTO } from './dto/update-profile-response.dto';
import { GqlAuthGuard } from '../auth/access-token.guard';
import {
  CallMaskingConfigDTO,
  CallMaskingService,
  CallerType,
  InitiateCallResultDTO,
  LostPropertyEligibilityDTO,
} from '@ridy/database';

@Resolver()
@UseGuards(GqlAuthGuard)
export class RiderResolver {
  constructor(
    private readonly riderService: RiderService,
    @Inject(CONTEXT) private readonly context: UserContext,
    private callMaskingService: CallMaskingService,
  ) {}

  @Query(() => RiderDTO)
  async me(): Promise<RiderDTO> {
    return this.riderService.getRiderProfile(this.context.req.user.id);
  }

  @Query(() => RiderStatisticsDTO)
  async myStatistics(): Promise<RiderStatisticsDTO> {
    return this.riderService.getRiderStatistics(this.context.req.user.id);
  }

  @Mutation(() => RiderDTO)
  async updateProfile(
    @Args('input') input: UpdateRiderInput,
  ): Promise<RiderDTO> {
    return this.riderService.updateRiderProfile(
      this.context.req.user.id,
      input,
    );
  }

  @Mutation(() => UpdateProfileResponseDTO, {
    description: 'Update profile and trigger email verification if email is set/changed',
  })
  async updateProfileWithEmailVerification(
    @Args('input') input: UpdateRiderInput,
  ): Promise<UpdateProfileResponseDTO> {
    return this.riderService.updateRiderProfileWithEmailVerification(
      this.context.req.user.id,
      input,
    );
  }

  @Query(() => CallMaskingConfigDTO, { nullable: true })
  async callMaskingConfig(): Promise<CallMaskingConfigDTO | null> {
    return this.callMaskingService.getMaskingConfig();
  }

  @Mutation(() => InitiateCallResultDTO)
  async initiateCallMasking(
    @Args('orderId', { type: () => ID }) orderId: number,
  ): Promise<InitiateCallResultDTO> {
    const rider = await this.riderService.getRiderProfile(
      this.context.req.user.id,
    );
    if (!rider?.mobileNumber) {
      return { success: false, error: 'Your phone number is not registered' };
    }

    return this.callMaskingService.initiateCall(
      orderId,
      rider.mobileNumber.toString(),
      CallerType.RIDER,
    );
  }

  @Query(() => LostPropertyEligibilityDTO)
  async lostPropertyEligibility(
    @Args('orderId', { type: () => ID }) orderId: number,
  ): Promise<LostPropertyEligibilityDTO> {
    return this.callMaskingService.checkLostPropertyEligibility(orderId);
  }

  @Mutation(() => InitiateCallResultDTO)
  async initiateLostPropertyCall(
    @Args('orderId', { type: () => ID }) orderId: number,
  ): Promise<InitiateCallResultDTO> {
    const rider = await this.riderService.getRiderProfile(
      this.context.req.user.id,
    );
    if (!rider?.mobileNumber) {
      return { success: false, error: 'Your phone number is not registered' };
    }

    return this.callMaskingService.initiateLostPropertyCall(
      orderId,
      rider.mobileNumber.toString(),
      CallerType.RIDER,
    );
  }
}
