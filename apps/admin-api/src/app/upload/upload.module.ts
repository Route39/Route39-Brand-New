import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { Module } from '@nestjs/common';
import { DriverEntity, DriverToDriverDocumentEntity, MediaEntity, StorageModule } from '@ridy/database';
import { MediaDTO } from './media.dto';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUploadController } from './admin-upload.controller';

@Module({
  imports: [
    StorageModule,
    TypeOrmModule.forFeature([MediaEntity, DriverEntity, DriverToDriverDocumentEntity]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([MediaEntity])],
      resolvers: [
        {
          DTOClass: MediaDTO,
          EntityClass: MediaEntity,
          create: { disabled: true },
          read: { disabled: true },
          delete: { disabled: true },
          update: { disabled: true },
        },
      ],
    }),
  ],
  controllers: [AdminUploadController],
  providers: [],
  exports: [],
})
export class UploadModule {}
