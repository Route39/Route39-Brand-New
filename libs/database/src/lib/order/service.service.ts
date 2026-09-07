import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceEntity } from '../entities/taxi/service.entity';
import { Repository } from 'typeorm';
import { PricingMode } from '../entities/taxi/enums/pricing-mode.enum';
import { CostCalculationResult } from '../interfaces/cost-calculation.dto';

const weekdays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(ServiceEntity)
    private service: Repository<ServiceEntity>,
  ) {}

  calculateCost(
    service: ServiceEntity,
    distance: number,
    duration: number,
    eta: Date,
    fleetMultiplier = 1,
    waitMinutes = 0,
    optionFee = 0,
  ): CostCalculationResult {
    let multiplier = 1;
    console.log(
      `Calculating Trip fee with base fare ${service.baseFare} distance of ${distance} meters and duration of ${duration}`,
    );

    // Distance fare: "Base Fare" covers the first 2 km entirely. Every
    // additional km (or part of a km) beyond that is charged at the
    // "Minimum Fee" rate, rounded UP to the next whole km.
    // e.g. a 5 km trip = Base Fare + 3 × Minimum Fee (km 3, 4, 5).
        const distanceKm = distance / 1000;
    const includedKm = 2;
    const totalKm = Math.round(distanceKm);
    const additionalKm = totalKm > includedKm ? totalKm - includedKm : 0;
    let i = service.baseFare + additionalKm * service.minimumFee;
    console.log(
      `Distance fare: ${distanceKm.toFixed(2)}km rounds to ${totalKm}km => baseFare(${service.baseFare}) + ${additionalKm}km x minimumFee(${service.minimumFee}) = ${i}`,
    );

    i += service.perMinuteDrive * (duration / 60);
    console.log(`Initial calculation without multiplier: ${i}`);
    let ratioCost = 0;
    let newRatioCost = 0;
    let ratioDistance = 0;
    let endDistance = 0;
    for (const _multiplier of service.distanceMultipliers) {
      if (distance > _multiplier.distanceFrom) {
        endDistance =
          distance > _multiplier.distanceTo ? _multiplier.distanceTo : distance;
        ratioDistance = endDistance - _multiplier.distanceFrom;
        ratioCost = (ratioDistance / distance) * i;
        newRatioCost = ratioCost * _multiplier.multiply;
        i = i - ratioCost + newRatioCost;
        console.log(`After distance multiplier: ${i}`);
      }
    }
    for (const _multiplier of service.timeMultipliers) {
      const startMinutes =
        parseInt(_multiplier.startTime.split(':')[0]) * 60 +
        parseInt(_multiplier.startTime.split(':')[1]);
      const nowMinutes = eta.getHours() * 60 + eta.getMinutes();
      const endMinutes =
        parseInt(_multiplier.endTime.split(':')[0]) * 60 +
        parseInt(_multiplier.endTime.split(':')[1]);
      if (nowMinutes >= startMinutes && nowMinutes <= endMinutes) {
        i *= _multiplier.multiply;
        multiplier *= _multiplier.multiply;
        console.log(`After time multiplier: ${i}`);
      }
    }
    for (const _multiplier of service.weekdayMultipliers) {
      if (_multiplier.weekday === weekdays[eta.getDay()]) {
        i *= _multiplier.multiply;
        multiplier *= _multiplier.multiply;
        console.log(`After weekday multiplier: ${i}`);
      }
    }
    for (const _multiplier of service.dateRangeMultipliers) {
      const startDate = new Date(_multiplier.startDate);
      const endDate = new Date(_multiplier.endDate);
      if (eta >= startDate && eta <= endDate) {
        i *= _multiplier.multiply;
        multiplier *= _multiplier.multiply;
        console.log(`After date range multiplier: ${i}`);
      }
    }
    i *= fleetMultiplier;
    multiplier *= fleetMultiplier;
    console.log(`After fleet multiplier: ${i}`);
    // "Minimum Fee" is now the per-additional-km rate used above in the
    // distance tier, not a fare floor — the old floor clamp against
    // service.minimumFee is removed since that field no longer represents
    // a "minimum amount" and would silently reintroduce the old meaning.

    // Add wait time fee and option fees BEFORE rounding
    const waitFee = service.perMinuteWait * waitMinutes;
    i += waitFee + optionFee;
    Logger.log(
      `Final calculation with base fare ${service.baseFare} distance of ${distance} meters and duration of ${duration} is ${i} (includes waitFee: ${waitFee}, optionFee: ${optionFee})`,
      'ServiceService',
    );

    if (
      service.roundingFactor != null &&
      service.roundingFactor > 0 &&
      service.pricingMode != PricingMode.RANGE
    ) {
      Logger.log(`Rounding factor: ${service.roundingFactor}`);
      Logger.log(`Before Rounding factor applied: ${i}`);
      i = Math.round(i / service.roundingFactor) * service.roundingFactor;
      Logger.log(`After Rounding factor applied: ${i}`);
    }

    const cost = i ?? 0;

    // Check if service uses RANGE pricing mode
    if (service.pricingMode === PricingMode.RANGE) {
      // Calculate range using service-specific percentages
      // service.minimumFee is now the per-additional-km rate, not a fare
      // floor, so it's no longer a valid lower bound here.
      let min = cost * service.priceRangeMinPercent;
      let max = cost * service.priceRangeMaxPercent;

      // Apply rounding factor to min and max if configured
      if (service.roundingFactor != null && service.roundingFactor > 0) {
        Logger.log(`Before rounding - Min: ${min}, Max: ${max}`);
        min = Math.round(min / service.roundingFactor) * service.roundingFactor;
        max = Math.round(max / service.roundingFactor) * service.roundingFactor;
        Logger.log(`After rounding - Min: ${min}, Max: ${max}`);
      }

      Logger.log(
        `RANGE pricing mode - Cost: ${cost}, Min: ${min} (${service.priceRangeMinPercent * 100}%), Max: ${max} (${service.priceRangeMaxPercent * 100}%)`,
        'ServiceService',
      );

      return { cost, min, max };
    }

    // For FIXED pricing mode, return just the cost
    return { cost };
  }

  getWithId(id: number): Promise<ServiceEntity | null> {
    return this.service.findOneBy({ id });
  }
}
