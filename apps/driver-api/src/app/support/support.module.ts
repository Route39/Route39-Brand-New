import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportResolver } from './support.resolver';

@Module({
  providers: [SupportService, SupportResolver],
  exports: [SupportService],
})
export class SupportModule {}
