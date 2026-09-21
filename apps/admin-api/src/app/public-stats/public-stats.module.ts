import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverEntity, TaxiOrderEntity } from '@ridy/database';
import { PublicStatsService } from './public-stats.service';
import { PublicStatsResolver } from './public-stats.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([DriverEntity, TaxiOrderEntity])],
  providers: [PublicStatsService, PublicStatsResolver],
})
export class PublicStatsModule {}
