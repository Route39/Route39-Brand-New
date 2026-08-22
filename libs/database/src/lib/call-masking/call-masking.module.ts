import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallMaskingService } from './call-masking.service';
import { TaxiOrderEntity } from '../entities/taxi/taxi-order.entity';
import { SMSProviderEntity } from '../entities/sms-provider.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([TaxiOrderEntity, SMSProviderEntity])],
  providers: [CallMaskingService],
  exports: [CallMaskingService],
})
export class CallMaskingModule {}
