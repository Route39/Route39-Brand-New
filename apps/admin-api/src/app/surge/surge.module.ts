import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsQueryGraphQLModule, PagingStrategies } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { RegionEntity, SurgeSettingEntity, SurgeZoneEntity } from '@ridy/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SurgeZoneService } from './surge-zone.service';
import { SurgeAutoService } from './surge-auto.service';
import { SurgeGridService } from './surge-grid.service';
import { SurgeZoneDTO } from './dto/surge-zone.dto';
import { SurgeZoneInput } from './dto/surge-zone.input';
import { SurgeSettingDTO, SurgeSettingInput } from './dto/surge-setting.dto';

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([SurgeZoneEntity, SurgeSettingEntity])],
      services: [SurgeZoneService],
      resolvers: [
        {
          EntityClass: SurgeZoneEntity,
          ServiceClass: SurgeZoneService,
          DTOClass: SurgeZoneDTO,
          CreateDTOClass: SurgeZoneInput,
          UpdateDTOClass: SurgeZoneInput,
          create: { many: { disabled: true } },
          update: { many: { disabled: true } },
          delete: { many: { disabled: true } },
          pagingStrategy: PagingStrategies.OFFSET,
          enableTotalCount: true,
          guards: [JwtAuthGuard],
        },
        {
          EntityClass: SurgeSettingEntity,
          DTOClass: SurgeSettingDTO,
          CreateDTOClass: SurgeSettingInput,
          UpdateDTOClass: SurgeSettingInput,
          create: { many: { disabled: true } },
          delete: { disabled: true },
          update: { many: { disabled: true } },
          pagingStrategy: PagingStrategies.NONE,
          guards: [JwtAuthGuard],
        },
      ],
    }),
    TypeOrmModule.forFeature([SurgeZoneEntity, SurgeSettingEntity, RegionEntity]),
  ],
  providers: [SurgeZoneService, SurgeAutoService, SurgeGridService],
})
export class SurgeModule {}
