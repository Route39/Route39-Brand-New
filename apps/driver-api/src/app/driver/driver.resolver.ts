import { Args, CONTEXT, Mutation, Resolver, Query, ID, Int } from '@nestjs/graphql';
import {
  CallMaskingConfigDTO,
  CallMaskingService,
  CallerType,
  InitiateCallResultDTO,
  LostPropertyEligibilityDTO,
  Point,
  SurgeZoneEntity,
} from '@ridy/database';
import { DriverService } from './driver.service';
import { Inject, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/jwt-gql-auth.guard';
import { UserContext } from '../auth/authenticated-user';
import { DriverPerformanceDTO } from './dto/driver-performance.dto';
import { DriverDTO } from '../core/dtos/driver.dto';
import { UpdateDriverOfferFilterInput } from './inputs/update-driver-offer-filter.input';
import { ServiceDTO } from '../core/dtos/service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveSurgeZoneDTO } from './dto/surge-zone-live.dto';

// Rain lookup via Open-Meteo (no API key). Cached 10 min per ~1 km cell.
// Module-level on purpose: the resolver is request-scoped, so an instance cache would never hit.
const rainCache = new Map<string, { at: number; mm: number }>();
async function getRainMm(lat: number, lng: number): Promise<number> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const hit = rainCache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.mm;
  let mm = hit?.mm ?? 0;
  try {
    const res: any = await Promise.race([
      (globalThis as any).fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=precipitation`,
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
    ]);
    const json: any = await res.json();
    mm = Number(json?.current?.precipitation ?? 0) || 0;
  } catch (_) {
    // weather API slow or down: keep the last known value (or 0)
  }
  rainCache.set(key, { at: Date.now(), mm });
  return mm;
}

@Resolver()
@UseGuards(GqlAuthGuard)
export class DriverResolver {
  constructor(
    @Inject(CONTEXT) private context: UserContext,
    private driverService: DriverService,
    private callMaskingService: CallMaskingService,
    @InjectRepository(SurgeZoneEntity)
    private surgeZoneRepo: Repository<SurgeZoneEntity>,
  ) {}

  @Query(() => [LiveSurgeZoneDTO])
  async liveSurgeZones(): Promise<LiveSurgeZoneDTO[]> {
    const zones = await this.surgeZoneRepo.find();
    const out: LiveSurgeZoneDTO[] = [];
    for (const z of zones) {
      const live = z.status === 'Active' || (z.status === 'Auto' && z.autoLive);
      const ring = z.area?.[0];
      if (!live || !ring || ring.length === 0) continue;
      const lats = ring.map((p) => p.lat);
      const lngs = ring.map((p) => p.lng);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const halfLat = ((maxLat - minLat) / 2) * 111320;
      const halfLng = ((maxLng - minLng) / 2) * 111320 * Math.cos((centerLat * Math.PI) / 180);
      out.push({
        id: z.id, name: z.name, percent: Number(z.surgePercent ?? 0),
        centerLat, centerLng, radiusMeters: Math.round(Math.max(halfLat, halfLng)),
        rainMm: await getRainMm(centerLat, centerLng),
        type: z.type ?? 'Peak',
        reason: z.autoReason ?? null,
      });
    }
    return out;
  }

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
  ): Promise<boolean> {
    await this.driverService.updateDriverLocation(this.context.req.user.id, point);
    return true;
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

  @Mutation(() => Boolean)
  async deleteAccount(): Promise<boolean> {
    return this.driverService.deleteAccount(this.context.req.user.id);
  }

  @Mutation(() => Boolean)
  async attachDriverDocument(
    @Args('driverDocumentId', { type: () => Int }) driverDocumentId: number,
    @Args('mediaId', { type: () => Int }) mediaId: number,
  ): Promise<boolean> {
    return this.driverService.attachDriverDocument(
      this.context.req.user.id,
      driverDocumentId,
      mediaId,
    );
  }
}
