import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverEntity, DriverStatus, TaxiOrderEntity } from '@ridy/database';
import { PublicLiveStatsDTO } from './dtos/public-live-stats.dto';

@Injectable()
export class PublicStatsService {
  constructor(
    @InjectRepository(DriverEntity)
    private driverRepository: Repository<DriverEntity>,
    @InjectRepository(TaxiOrderEntity)
    private taxiOrderRepository: Repository<TaxiOrderEntity>,
  ) {}

  async getLiveStats(): Promise<PublicLiveStatsDTO> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const driversOnline = await this.driverRepository.count({
      where: [
        { status: DriverStatus.Online },
        { status: DriverStatus.InService },
      ],
    });

    const tripsToday = await this.taxiOrderRepository
      .createQueryBuilder('order')
      .where('order.requestTimestamp >= :todayStart', { todayStart })
      .getCount();

    const avgResult = await this.taxiOrderRepository
      .createQueryBuilder('order')
      .select(
        'AVG(TIMESTAMPDIFF(SECOND, order.requestTimestamp, order.arrivedAt))',
        'avgSeconds',
      )
      .where('order.requestTimestamp >= :todayStart', { todayStart })
      .andWhere('order.arrivedAt IS NOT NULL')
      .getRawOne<{ avgSeconds: string | null }>();

    const avgSeconds = avgResult?.avgSeconds ? parseFloat(avgResult.avgSeconds) : null;

    return {
      driversOnline,
      tripsToday,
      avgPickupMinutes: avgSeconds !== null ? avgSeconds / 60 : undefined,
    };
  }
}
