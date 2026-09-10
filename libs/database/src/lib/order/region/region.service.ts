import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Point } from '../../interfaces/point';
import { RegionEntity } from '../../entities/taxi/region.entity';
import { ServiceEntity } from '../../entities/taxi/service.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RegionService {
  constructor(
    @InjectRepository(RegionEntity)
    private regionRepository: Repository<RegionEntity>,
  ) {}

  async getRegionWithPoint(point: Point): Promise<RegionEntity[]> {
    const regions: RegionEntity[] = await this.regionRepository.query(
      `SELECT * FROM region WHERE enabled=TRUE AND ST_Within(st_geomfromtext('POINT(? ?)'), region.location)`,
      [point.lng, point.lat],
    );
    return regions;
  }

  async getRegionServices(regionId: number): Promise<ServiceEntity[]> {
    return (
      (
        await this.regionRepository.findOne({
          where: { id: regionId },
          relations: ['services'],
        })
      )?.services ?? []
    );
  }

  /**
   * Fallback check used when no Admin Panel Region covers a point: is the
   * point at least inside India? This is a simple bounding-box test (no
   * external geocoding call), so it can include thin border strips of
   * neighbouring countries (Pakistan, Nepal, Bangladesh, Myanmar, Sri
   * Lanka, China). Swap for a precise polygon or a reverse-geocoding call
   * if stricter accuracy is required later.
   */
  isPointInIndia(point: Point): boolean {
    const INDIA_BOUNDS = {
      minLat: 6.0,
      maxLat: 37.6,
      minLng: 68.0,
      maxLng: 97.5,
    };
    return (
      point.lat >= INDIA_BOUNDS.minLat &&
      point.lat <= INDIA_BOUNDS.maxLat &&
      point.lng >= INDIA_BOUNDS.minLng &&
      point.lng <= INDIA_BOUNDS.maxLng
    );
  }
}
