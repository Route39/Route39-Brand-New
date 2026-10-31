import { Module } from '@nestjs/common';
import { ServiceCategoryEntity, ServiceEntity, ServiceService } from '@ridy/database';
import { UploadModule } from '../upload/upload.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCategoryResolver } from './service-category.resolver';

@Module({
  imports: [UploadModule, TypeOrmModule.forFeature([ServiceEntity, ServiceCategoryEntity])],
  providers: [ServiceService, ServiceCategoryResolver],
  exports: [ServiceService],
})
export class ServiceModule {}
