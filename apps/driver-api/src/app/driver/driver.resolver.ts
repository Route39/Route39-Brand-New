import { Args, CONTEXT, Mutation, Resolver, Query, ID } from '@nestjs/graphql';
import {
  CallMaskingConfigDTO,
  CallMaskingService,
  CallerType,
  InitiateCallResultDTO,
  LostPropertyEligibilityDTO,
  Point,
} from '@ridy/database';
import { DriverService } from './driver.service';
import { Inject, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/jwt-gql-auth.guard';
import { UserContext } from '../auth/authenticated-user';
import { DriverPerformanceDTO } from './dto/driver-performance.dto';
import { DriverDTO } from '../core/dtos/driver.dto';
import { UpdateDriverOfferFilterInput } from './inputs/update-driver-offer-filter.input';
import { ServiceDTO } from '../core/dtos/service.dto';

@Resolver()
@UseGuards(GqlAuthGuard)
export class DriverResolver {
  constructor(
    @Inject(CONTEXT) private context: UserContext,
    private driverService: DriverService,
    private callMaskingService: CallMaskingService,
  ) {}

  @Query(() => DriverDTO)
  async me(): Promise<DriverDTO> {
    return this.driverService.getDriver(this.context.req.user.id);
  }

  @Mutation(() => Boolean)
  async goOnline(
    @Args('location', { type: () => Point }) location: Point,
  ): Promise<boolean> {
    return this.driverService.goOnline(this.context.req.user.id, location);
  }

  @Mutation(() => Boolean)
  async goOffline(): Promise<boolean> {
    return this.driverService.goOffline(this.context.req.user.id);
  }

  @Query(() => DriverPerformanceDTO)
  async driverPerformance(): Promise<DriverPerformanceDTO> {
    return this.driverService.getPerformance(this.context.req.user.id);
  }

  @Mutation(() => DriverDTO)
  async updateDriverOfferFilter(
    @Args('input') input: UpdateDriverOfferFilterInput,
  ): Promise<DriverDTO> {
    return this.driverService.updateDriverOfferFilter(
      this.context.req.user.id,
      input,
    );
  }

  @Mutation(() => Boolean)
  async updateDriverLocation(
    @Args('point', { type: () => Point }) point: Point,
  ): Promise<void> {
    this.driverService.updateDriverLocation(this.context.req.user.id, point);
  }

  @Query(() => [ServiceDTO])
  async activeServices(): Promise<ServiceDTO[]> {
    return this.driverService.getActiveServices(this.context.req.user.id);
  }

  @Query(() => CallMaskingConfigDTO, { nullable: true })
  async callMaskingConfig(): Promise<CallMaskingConfigDTO | null> {
    return this.callMaskingService.getMaskingConfig();
  }

  @Mutation(() => InitiateCallResultDTO)
  async initiateCallMasking(
    @Args('orderId', { type: () => ID }) orderId: number,
  ): Promise<InitiateCallResultDTO> {
    const driver = await this.driverService.getDriver(this.context.req.user.id);
    if (!driver?.mobileNumber) {
      return { success: false, error: 'Your phone number is not registered' };
    }

    return this.callMaskingService.initiateCall(
      orderId,
      driver.mobileNumber.toString(),
      CallerType.DRIVER,
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
    const driver = await this.driverService.getDriver(this.context.req.user.id);
    if (!driver?.mobileNumber) {
      return { success: false, error: 'Your phone number is not registered' };
    }

    return this.callMaskingService.initiateLostPropertyCall(
      orderId,
      driver.mobileNumber.toString(),
      CallerType.DRIVER,
    );
  }
}
