import { Module } from '@nestjs/common';
import { WalletResolver } from './wallet-resolver';
import {
  CryptoService,
  CustomerEntity,
  PaymentGatewayEntity,
  RedisHelpersModule,
  RiderTransactionEntity,
  RiderWalletEntity,
  SavedPaymentMethodEntity,
} from '@ridy/database';
import { HttpModule } from '@nestjs/axios';
import { WalletService } from './wallet.service';
import { CommonCouponModule } from '@ridy/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RazorpayService } from '@ridy/database';
import { SharedOrderModule } from '@ridy/database';
import { RazorpayService } from '@ridy/database';

@Module({
  imports: [
    SharedOrderModule,
    RedisHelpersModule,
    TypeOrmModule.forFeature([
      CustomerEntity,
      RiderWalletEntity,
      RiderTransactionEntity,
      PaymentGatewayEntity,
      SavedPaymentMethodEntity,
    ]),
    HttpModule,
    CommonCouponModule,
  ],
  providers: [WalletResolver, WalletService, CryptoService, RazorpayService],
  exports: [WalletService, RazorpayService],
})
export class WalletModule {}
