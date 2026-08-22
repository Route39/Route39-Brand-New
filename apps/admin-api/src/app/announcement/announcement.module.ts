import { Module } from '@nestjs/common';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import {
  AnnouncementEntity,
  SMSModule,
  DriverEntity,
  CustomerEntity,
  FirebaseNotificationModule,
  getRedisConnectionConfig,
} from '@ridy/database';
import { AnnouncementDTO } from './dto/announcement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateAnnouncementInput } from './inputs/update-announcement.input';
import { AnnouncementResolver } from './announcement.resolver';
import { AnnouncementService } from './announcement.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AnnouncementNotificationProcessor } from './announcement.processor';

@Module({
  imports: [
    FirebaseNotificationModule.register(),
    TypeOrmModule.forFeature([DriverEntity, CustomerEntity, AnnouncementEntity]),
    SMSModule,
    BullModule.registerQueue({
      name: 'announcement-notifications',
      connection: getRedisConnectionConfig(),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: { count: 10 },
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([AnnouncementEntity])],
      resolvers: [
        {
          EntityClass: AnnouncementEntity,
          DTOClass: AnnouncementDTO,
          UpdateDTOClass: UpdateAnnouncementInput,
          create: { disabled: true },
          update: { many: { disabled: true } },
          delete: { many: { disabled: true } },
          pagingStrategy: PagingStrategies.OFFSET,
          enableTotalCount: true,
          guards: [JwtAuthGuard],
        },
      ],
    }),
  ],
  providers: [AnnouncementService, AnnouncementResolver, AnnouncementNotificationProcessor],
})
export class AnnouncementModule {}
